import { NextResponse } from 'next/server'
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

export async function GET() {
  const db = getPool()

  // Find status-like columns in crm
  const [cols] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = 'edus_academy' AND TABLE_NAME = 'crm'
     AND (COLUMN_NAME LIKE '%status%' OR COLUMN_NAME LIKE '%state%'
          OR COLUMN_NAME LIKE '%stage%' OR COLUMN_NAME LIKE '%interest%'
          OR COLUMN_NAME LIKE '%offer%' OR COLUMN_NAME LIKE '%reject%'
          OR COLUMN_NAME LIKE '%sold%' OR COLUMN_NAME LIKE '%deal%')`
  )

  // Also get distinct values of any "status" column if found
  const results: Record<string, unknown> = { columns: cols.map(c => c.COLUMN_NAME) }

  for (const col of cols) {
    const [vals] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT \`${col.COLUMN_NAME}\` AS val, COUNT(*) AS n
       FROM crm
       WHERE created_at >= '2025-01-01' AND created_at < '2025-08-01'
       GROUP BY val ORDER BY n DESC LIMIT 20`
    )
    results[col.COLUMN_NAME] = vals
  }

  return NextResponse.json(results)
}
