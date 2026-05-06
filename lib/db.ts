import { Pool } from 'pg'
import { Decision } from '@/types/decision'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function initSchema() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS decisions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        platform TEXT NOT NULL,
        country TEXT NOT NULL,
        campaign TEXT,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        why TEXT NOT NULL,
        metric_before TEXT,
        action_taken TEXT NOT NULL,
        expected_outcome TEXT,
        review_date TEXT,
        result TEXT,
        verdict TEXT,
        learning TEXT,
        playbook_worthy BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'Pending Review',
        created_by TEXT NOT NULL DEFAULT 'facundo@easypeasyfluent.com',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)
  } finally {
    client.release()
  }
}

// Initialize schema on first load
initSchema().catch(console.error)

export async function getAllDecisions(): Promise<Decision[]> {
  const result = await pool.query(
    'SELECT * FROM decisions ORDER BY date DESC'
  )
  return result.rows as Decision[]
}

export async function getDecisionById(id: string): Promise<Decision | undefined> {
  const result = await pool.query(
    'SELECT * FROM decisions WHERE id = $1',
    [id]
  )
  return result.rows[0] as Decision | undefined
}

export async function createDecision(decision: Decision): Promise<Decision> {
  const {
    id, date, platform, country, campaign, category, summary, why,
    metric_before, action_taken, expected_outcome, review_date, playbook_worthy,
    status, created_by, created_at, updated_at
  } = decision

  await pool.query(
    `INSERT INTO decisions (id, date, platform, country, campaign, category, summary, why, metric_before, action_taken, expected_outcome, review_date, playbook_worthy, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [id, date, platform, country, campaign, category, summary, why, metric_before, action_taken, expected_outcome, review_date, playbook_worthy, status, created_by, created_at, updated_at]
  )
  return decision
}

export async function updateDecision(
  id: string,
  updates: Partial<Decision>
): Promise<Decision | null> {
  const fields = Object.keys(updates).filter(k => k !== 'id')
  if (fields.length === 0) return null

  const values = fields.map((_, i) => `$${i + 1}`)
  const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
  const queryValues = fields.map(f => (updates as any)[f])

  const result = await pool.query(
    `UPDATE decisions SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...queryValues, id]
  )
  return result.rows[0] as Decision | null
}
