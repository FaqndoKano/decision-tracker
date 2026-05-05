import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'decisions.db');

function getDb(): Database.Database {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      date TEXT NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('Meta', 'Google', 'Both')),
      country TEXT NOT NULL CHECK(country IN ('IT', 'ES', 'DE', 'FR', 'Global')),
      campaign TEXT,
      category TEXT NOT NULL CHECK(category IN ('Budget', 'Campaign', 'Creative', 'Audience', 'Experiment', 'Tracking', 'Strategy')),
      summary TEXT NOT NULL,
      why TEXT NOT NULL,
      metric_before TEXT,
      action_taken TEXT NOT NULL,
      expected_outcome TEXT,
      review_date TEXT,
      result TEXT,
      verdict TEXT CHECK(verdict IN ('Worked', 'Did Not Work', 'Neutral', 'No Data')),
      learning TEXT,
      playbook_worthy INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Pending Review' CHECK(status IN ('Pending Review', 'Reviewed', 'Archived')),
      created_by TEXT NOT NULL DEFAULT 'facundo@easypeasyfluent.com',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS update_decisions_timestamp
    AFTER UPDATE ON decisions
    BEGIN
      UPDATE decisions SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

const decisions = [
  {
    date: '2024-03-26',
    platform: 'Meta',
    country: 'IT',
    campaign: 'BAU',
    category: 'Budget',
    summary: 'Scaled BAU budget 2450→2600',
    why: 'Testing budget elasticity after stable week',
    action_taken: 'Increased daily budget by 150',
    metric_before: 'CPL 30-32, CAC 300-400',
    expected_outcome: 'Maintain CPL while increasing volume',
    review_date: '2024-04-07',
  },
  {
    date: '2024-03-27',
    platform: 'Meta',
    country: 'IT',
    campaign: 'Remarketing Static',
    category: 'Budget',
    summary: 'Scaled Remarketing Static 120→150',
    why: 'CPL performing well at 27, 100% BR',
    action_taken: 'Increased budget by 30',
    metric_before: 'CPL 27',
    expected_outcome: 'Maintain CPL, increase conversions',
    review_date: '2024-04-07',
  },
  {
    date: '2024-04-06',
    platform: 'Meta',
    country: 'IT',
    campaign: 'Demand Gen Shorts',
    category: 'Budget',
    summary: 'Cut Demand Gen Shorts 200→100',
    why: 'Spent 2k in a week with CPB over 100',
    action_taken: 'Halved budget immediately',
    metric_before: 'CPB >100',
    expected_outcome: 'Stop inefficient spend',
    review_date: '2024-04-12',
  },
  {
    date: '2024-04-14',
    platform: 'Meta',
    country: 'IT',
    campaign: 'BAU',
    category: 'Budget',
    summary: 'Cut BAU 2550→2160',
    why: 'CPL was too high. Need to understand if we were overinvesting.',
    action_taken: 'Reduced budget to cut volume and test if CPL drops',
    metric_before: 'CPL 40',
    expected_outcome: 'CPL should drop below 35',
    review_date: '2024-04-21',
  },
  {
    date: '2024-04-17',
    platform: 'Google',
    country: 'IT',
    campaign: 'PMAX ITA',
    category: 'Budget',
    summary: 'Cut PMAX ITA 500→400',
    why: 'Low ROAS observed',
    action_taken: 'Reduced budget to minimize inefficient spend',
    metric_before: 'Low ROAS',
    expected_outcome: 'Improve ROAS efficiency',
    review_date: '2024-04-24',
  },
];

function seed() {
  try {
    console.log('Connecting to SQLite database...');
    const db = getDb();
    initSchema(db);

    const insert = db.prepare(`
      INSERT INTO decisions (
        id, date, platform, country, campaign, category,
        summary, why, metric_before, action_taken, expected_outcome,
        review_date, playbook_worthy, status, created_by
      ) VALUES (
        lower(hex(randomblob(16))),
        @date, @platform, @country, @campaign, @category,
        @summary, @why, @metric_before, @action_taken, @expected_outcome,
        @review_date, 0, 'Pending Review', 'facundo@easypeasyfluent.com'
      )
    `);

    const insertMany = db.transaction((rows: typeof decisions) => {
      for (const row of rows) {
        insert.run(row);
      }
    });

    console.log(`Inserting ${decisions.length} decisions...`);
    insertMany(decisions);

    const count = (db.prepare('SELECT COUNT(*) as count FROM decisions').get() as { count: number }).count;
    console.log(`\n✓ Successfully seeded ${count} decisions into data/decisions.db`);

    const rows = db.prepare('SELECT id, date, summary FROM decisions ORDER BY date').all();
    console.log('\nSeeded decisions:');
    rows.forEach((r: any) => console.log(`  [${r.date}] ${r.summary}`));

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

seed();
