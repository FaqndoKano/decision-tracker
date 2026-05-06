import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function migrate() {
  const jsonPath = path.join(process.cwd(), 'data', 'decisions.json')

  const client = await pool.connect()
  try {
    // Create schema first
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
    console.log('✓ Database schema created')

    if (!fs.existsSync(jsonPath)) {
      console.log('✓ No JSON file found, starting with empty database')
      return
    }

    const raw = fs.readFileSync(jsonPath, 'utf-8')
    const decisions = JSON.parse(raw)

    for (const d of decisions) {
      await client.query(
        `INSERT INTO decisions (id, date, platform, country, campaign, category, summary, why, metric_before, action_taken, expected_outcome, review_date, playbook_worthy, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.date, d.platform, d.country, d.campaign, d.category, d.summary, d.why, d.metric_before, d.action_taken, d.expected_outcome, d.review_date, d.playbook_worthy || false, d.status, d.created_by, d.created_at, d.updated_at]
      )
    }
    console.log(`✓ Migrated ${decisions.length} decisions to PostgreSQL`)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(console.error)
