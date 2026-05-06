import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.EDUSOGNO_DB_HOST,
      port: parseInt(process.env.EDUSOGNO_DB_PORT || '3308'),
      user: process.env.EDUSOGNO_DB_USER,
      password: process.env.EDUSOGNO_DB_PASSWORD,
      database: process.env.EDUSOGNO_DB_NAME,
      waitForConnections: true,
      connectionLimit: 3,
      connectTimeout: 10000,
    })
  }
  return pool
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodMetrics {
  spend: number
  leads: number
  cpl: number | null
  date_from: string
  date_to: string
}

export interface CPLResult {
  before: PeriodMetrics
  after: PeriodMetrics
  data_mature: boolean
}

export interface CampaignRow {
  name: string
  spend: number
  leads: number
  cpl: number | null
}

export interface SnapshotResult {
  campaigns: CampaignRow[]
  totals: { spend: number; leads: number; cpl: number | null }
  date_from: string
  date_to: string
  data_mature: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Map decision-tracker country code → advertising_cost.language value
function toAdCostLang(country: string): string | null {
  const map: Record<string, string> = { IT: 'IT', ES: 'ES', DE: 'DE', FR: 'FR' }
  return map[country] ?? null
}

// Map decision-tracker country code → detected_language value used in crm
function toCrmLang(country: string): string | null {
  const map: Record<string, string> = { IT: 'it', ES: 'es', DE: 'de', FR: 'fr' }
  return map[country] ?? null
}

// Full detected_language CASE — mirrors Power BI logic exactly (from crm.md §4.1)
const DETECTED_LANG_CASE = `
  CASE WHEN lang = 'en' THEN
    CASE
      WHEN country IN ('Spain','Spagna','España','México','Mexico','Messico','Argentina','Colombia','Chile','Cile','Peru','Venezuela','Ecuador','Guatemala','Paraguay','El Salvador','Costa Rica','Panama','Uruguay','Dominican Republic','Puerto Rico','es') THEN 'es'
      WHEN country IN ('Italy','Italia','it') THEN 'it'
      WHEN country IN ('Alemania','Germany','Austria','Liechtenstein','Osterreich','österreich','de') THEN 'de'
      WHEN country IN ('France','Francia','Belgium','Monaco','Luxembourg','fr') THEN 'fr'
      WHEN country IN ('Portugal','Brazil','Brasil','Brasile','pt') THEN 'pt'
      ELSE
        CASE
          WHEN phone LIKE '+34%' THEN 'es'
          WHEN phone LIKE '+54%' THEN 'es'
          WHEN phone LIKE '+39%' THEN 'it'
          WHEN phone LIKE '+33%' THEN 'fr'
          WHEN phone LIKE '+49%' THEN 'de'
          ELSE 'it'
        END
    END
  ELSE lang END
`

// utm_source values in CRM for each platform
function crmSources(platform: 'Meta' | 'Google'): string[] {
  return platform === 'Google' ? ['Google'] : ['Meta', 'Facebook', 'facebook', 'meta']
}

// ─── Aggregate CPL (before + after) ──────────────────────────────────────────

async function getPeriodMetrics(
  dateFrom: string,
  dateTo: string,
  platform: 'Meta' | 'Google',
  country: string,
): Promise<PeriodMetrics> {
  const db = getPool()
  const adLang = toAdCostLang(country)
  const crmLang = toCrmLang(country)
  const utmSources = crmSources(platform)
  const utmPlaceholders = utmSources.map(() => '?').join(', ')

  // Spend
  const spendParams: (string | number | null)[] = [dateFrom, dateTo, platform]
  let spendSql = `
    SELECT COALESCE(SUM(CAST(REPLACE(daily_budget, ',', '.') AS DECIMAL(12,2))), 0) AS total_spend
    FROM advertising_cost
    WHERE \`date\` >= ? AND \`date\` < ?
      AND source = ?`
  if (adLang) { spendSql += ' AND language = ?'; spendParams.push(adLang) }

  const [spendRows] = await db.execute<mysql.RowDataPacket[]>(spendSql, spendParams)

  // Leads — filtered by utm_source + lang
  const leadParams: (string | number | null)[] = [dateFrom, dateTo, ...utmSources]
  let leadSql = `
    SELECT COUNT(*) AS total_leads
    FROM crm
    WHERE deleted_at IS NULL
      AND tutoring = 0
      AND otp_verification_code_verified = 1
      AND created_at >= ? AND created_at < ?
      AND utm_source IN (${utmPlaceholders})`
  if (crmLang) { leadSql += ` AND (${DETECTED_LANG_CASE}) = ?`; leadParams.push(crmLang) }

  const [leadRows] = await db.execute<mysql.RowDataPacket[]>(leadSql, leadParams)

  const spend = Number(spendRows[0]?.total_spend ?? 0)
  const leads = Number(leadRows[0]?.total_leads ?? 0)
  const cpl = leads > 0 ? Math.round((spend / leads) * 100) / 100 : null

  return { spend, leads, cpl, date_from: dateFrom, date_to: dateTo }
}

export async function getCPLAroundDecision(
  decisionDate: string,
  platform: 'Meta' | 'Google',
  country: string,
  windowDays = 7,
): Promise<CPLResult> {
  const beforeFrom = addDays(decisionDate, -windowDays)
  const beforeTo   = decisionDate
  const afterFrom  = decisionDate
  const afterTo    = addDays(decisionDate, windowDays)

  const today = new Date().toISOString().split('T')[0]
  const daysSinceAfterEnd = Math.floor(
    (new Date(today).getTime() - new Date(afterTo).getTime()) / (1000 * 60 * 60 * 24)
  )
  const data_mature = daysSinceAfterEnd >= 14

  const [before, after] = await Promise.all([
    getPeriodMetrics(beforeFrom, beforeTo, platform, country),
    getPeriodMetrics(afterFrom, afterTo, platform, country),
  ])

  return { before, after, data_mature }
}

// ─── Campaign-level snapshot ──────────────────────────────────────────────────

export async function getCampaignSnapshot(
  dateFrom: string,
  dateTo: string,
  platform: 'Meta' | 'Google',
  country: string,
): Promise<SnapshotResult> {
  const db = getPool()
  const adLang = toAdCostLang(country)
  const crmLang = toCrmLang(country)
  const utmSources = crmSources(platform)
  const utmPlaceholders = utmSources.map(() => '?').join(', ')

  // Spend by campaign
  const spendParams: (string | number | null)[] = [dateFrom, dateTo, platform]
  let spendSql = `
    SELECT
      TRIM(SUBSTRING_INDEX(campaign, ' || Paid', 1)) AS campaign_name,
      SUM(CAST(REPLACE(daily_budget, ',', '.') AS DECIMAL(12,2))) AS spend
    FROM advertising_cost
    WHERE \`date\` >= ? AND \`date\` < ?
      AND source = ?`
  if (adLang) { spendSql += ' AND language = ?'; spendParams.push(adLang) }
  spendSql += ' GROUP BY campaign_name ORDER BY spend DESC'

  const [spendRows] = await db.execute<mysql.RowDataPacket[]>(spendSql, spendParams)

  // Leads by utm_campaign
  const leadParams: (string | number | null)[] = [dateFrom, dateTo, ...utmSources]
  let leadSql = `
    SELECT
      TRIM(SUBSTRING_INDEX(utm_campaign, ' || Paid', 1)) AS campaign_name,
      COUNT(*) AS leads
    FROM crm
    WHERE deleted_at IS NULL
      AND tutoring = 0
      AND otp_verification_code_verified = 1
      AND created_at >= ? AND created_at < ?
      AND utm_source IN (${utmPlaceholders})
      AND utm_campaign IS NOT NULL`
  if (crmLang) { leadSql += ` AND (${DETECTED_LANG_CASE}) = ?`; leadParams.push(crmLang) }
  leadSql += ' GROUP BY campaign_name'

  const [leadRows] = await db.execute<mysql.RowDataPacket[]>(leadSql, leadParams)

  // Merge: spend rows are the "master" list (every active campaign has spend)
  const leadMap = new Map<string, number>()
  for (const row of leadRows) {
    leadMap.set(row.campaign_name as string, Number(row.leads))
  }

  const campaigns: CampaignRow[] = spendRows.map((row) => {
    const name   = row.campaign_name as string
    const spend  = Number(row.spend ?? 0)
    const leads  = leadMap.get(name) ?? 0
    const cpl    = leads > 0 ? Math.round((spend / leads) * 100) / 100 : null
    return { name, spend, leads, cpl }
  })

  const totalSpend  = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalLeads  = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalCpl    = totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : null

  const today = new Date().toISOString().split('T')[0]
  const data_mature = Math.floor(
    (new Date(today).getTime() - new Date(dateTo).getTime()) / (1000 * 60 * 60 * 24)
  ) >= 14

  return {
    campaigns,
    totals: { spend: totalSpend, leads: totalLeads, cpl: totalCpl },
    date_from: dateFrom,
    date_to: dateTo,
    data_mature,
  }
}
