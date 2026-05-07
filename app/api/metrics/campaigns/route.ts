import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null
function getPool() {
  if (!pool) pool = mysql.createPool({
    host: process.env.EDUSOGNO_DB_HOST,
    port: parseInt(process.env.EDUSOGNO_DB_PORT || '3308'),
    user: process.env.EDUSOGNO_DB_USER,
    password: process.env.EDUSOGNO_DB_PASSWORD,
    database: process.env.EDUSOGNO_DB_NAME,
    waitForConnections: true, connectionLimit: 2,
  })
  return pool
}

// Returns raw utm_campaign values from CRM for a date range + platform
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('date_from')
  const dateTo   = searchParams.get('date_to')
  const platform = searchParams.get('platform') // Meta | Google

  if (!dateFrom || !dateTo) return NextResponse.json({ error: 'date_from and date_to required' }, { status: 400 })

  const sources = platform === 'Google' ? ['Google'] : ['Meta', 'Facebook', 'facebook', 'meta']
  const placeholders = sources.map(() => '?').join(', ')

  const db = getPool()
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT
       TRIM(SUBSTRING_INDEX(utm_campaign, ' || Paid', 1)) AS campaign_name,
       COUNT(*) AS leads
     FROM crm
     WHERE deleted_at IS NULL AND tutoring = 0 AND otp_verification_code_verified = 1
       AND created_at >= ? AND created_at < ?
       AND utm_source IN (${placeholders})
       AND utm_campaign IS NOT NULL
     GROUP BY campaign_name
     ORDER BY leads DESC`,
    [dateFrom, dateTo, ...sources]
  )

  return NextResponse.json(rows)
}
