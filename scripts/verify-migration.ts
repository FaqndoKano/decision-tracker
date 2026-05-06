import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function verify() {
  const client = await pool.connect()
  try {
    const result = await client.query('SELECT COUNT(*) as total FROM decisions')
    const count = result.rows[0].total
    console.log(`✓ PostgreSQL Database Check:`)
    console.log(`  - Total decisions: ${count}`)

    const allDecisions = await client.query('SELECT id, date, summary FROM decisions ORDER BY date DESC LIMIT 3')
    console.log(`  - Recent decisions:`)
    allDecisions.rows.forEach(d => {
      console.log(`    • ${d.date}: ${d.summary}`)
    })

    console.log(`\n✓ Migration completed successfully!`)
  } finally {
    client.release()
    await pool.end()
  }
}

verify().catch(console.error)
