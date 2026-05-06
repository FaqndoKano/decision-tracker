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
  data_mature: boolean // false = after period is < 14 days old, data may be incomplete
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

async function getPeriodMetrics(
  dateFrom: string,
  dateTo: string,        // exclusive upper bound
  sources: string[]
): Promise<PeriodMetrics> {
  const db = getPool()
  const placeholders = sources.map(() => '?').join(', ')

  // Spend: SUM daily_budget (comma-decimal format) for the platform sources
  const [spendRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COALESCE(
       SUM(CAST(REPLACE(REPLACE(daily_budget, '.', ''), ',', '.') AS DECIMAL(12,2))),
       0
     ) AS total_spend
     FROM advertising_cost
     WHERE \`date\` >= ? AND \`date\` < ?
       AND source IN (${placeholders})`,
    [dateFrom, dateTo, ...sources]
  )

  // Leads: verified CRM leads created in the window (all sources — attribution in CRM is unreliable per schema)
  const [leadRows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total_leads
     FROM crm
     WHERE deleted_at IS NULL
       AND tutoring = 0
       AND otp_verification_code_verified = 1
       AND created_at >= ? AND created_at < ?`,
    [dateFrom, dateTo]
  )

  const spend = Number(spendRows[0]?.total_spend ?? 0)
  const leads = Number(leadRows[0]?.total_leads ?? 0)
  const cpl = leads > 0 ? Math.round((spend / leads) * 100) / 100 : null

  return { spend, leads, cpl, date_from: dateFrom, date_to: dateTo }
}

export async function getCPLAroundDecision(
  decisionDate: string, // YYYY-MM-DD
  platform: 'Meta' | 'Google' | 'Both',
  windowDays = 7
): Promise<CPLResult> {
  const sources =
    platform === 'Meta' ? ['Meta'] :
    platform === 'Google' ? ['Google'] :
    ['Meta', 'Google']

  const beforeFrom = addDays(decisionDate, -windowDays)
  const beforeTo = decisionDate                     // exclusive → up to (not including) decision day
  const afterFrom = decisionDate
  const afterTo = addDays(decisionDate, windowDays) // exclusive → up to (not including) end day

  const today = new Date().toISOString().split('T')[0]
  const daysSinceAfterEnd = Math.floor(
    (new Date(today).getTime() - new Date(afterTo).getTime()) / (1000 * 60 * 60 * 24)
  )
  const data_mature = daysSinceAfterEnd >= 14

  const [before, after] = await Promise.all([
    getPeriodMetrics(beforeFrom, beforeTo, sources),
    getPeriodMetrics(afterFrom, afterTo, sources),
  ])

  return { before, after, data_mature }
}
