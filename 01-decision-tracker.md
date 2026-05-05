# Decision Tracker — EduSolium Paid Media
**Version:** 1.0  
**Date:** 2026-05-05  
**Owner:** Paid Media Team — EduSolium  

---

## Why This Exists

The Paid Media team makes dozens of decisions every week across Meta and Google — budgets, creatives, audiences, campaigns, experiments — but there is no standardized place to record them.

The only existing record is a budget spreadsheet with free-text comments. The result:
- No one knows which decisions were good or bad
- No one can search past decisions by platform, country, or campaign
- No knowledge accumulates — every new employee starts from zero
- Mistakes get repeated because there is no institutional memory

**This system fixes that.**

---

## What This System Does

1. **Categorizes** every paid media decision in a structured way
2. **Tracks** whether each decision worked or not (via a review date)
3. **Accumulates** learnings that become playbook rules over time
4. **Enables** filtering and searching decisions chronologically, by platform, country, or category

---

## Who Uses It

| Role | What they do |
|------|-------------|
| Media Buyer | Logs decisions as they happen |
| Media Manager | Reviews outcomes, approves playbook rules |
| New Employee | Reads past decisions to understand how we operate |
| AI Agent | Retrieves relevant decisions to guide recommendations |

---

## Decision Categories

| Category | Description | Examples |
|----------|-------------|---------|
| **BUDGET** | Any spend change | Scale up, scale down, redistribute |
| **CAMPAIGN** | Campaign-level structural changes | Create, pause, reactivate, restructure |
| **CREATIVE** | Creative decisions | New piece, retire piece, format change |
| **AUDIENCE** | Targeting changes | New segment, exclusion, lookalike, retargeting window |
| **EXPERIMENT** | Structured tests | A/B test, new hypothesis, holdout |
| **TRACKING** | Pixel/attribution changes | New event, conversion fix, attribution window |
| **STRATEGY** | Country or channel direction | Prioritize market, shift channel mix, seasonal pivot |

---

## Database Schema

```sql
decisions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date              DATE NOT NULL,
  platform          TEXT CHECK (platform IN ('Meta', 'Google', 'Both')),
  country           TEXT CHECK (country IN ('IT', 'ES', 'DE', 'FR', 'Global')),
  campaign          TEXT,
  category          TEXT CHECK (category IN (
                      'Budget', 'Campaign', 'Creative',
                      'Audience', 'Experiment', 'Tracking', 'Strategy'
                    )),
  summary           TEXT NOT NULL,
  why               TEXT,
  metric_before     TEXT,
  action_taken      TEXT,
  expected_outcome  TEXT,
  review_date       DATE,
  result            TEXT,
  verdict           TEXT CHECK (verdict IN (
                      'Worked', 'Did Not Work', 'Neutral', 'No Data'
                    )),
  learning          TEXT,
  playbook_worthy   BOOLEAN DEFAULT FALSE,
  status            TEXT CHECK (status IN (
                      'Pending Review', 'Reviewed', 'Archived'
                    )) DEFAULT 'Pending Review',
  created_by        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Field Definitions

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | Date the decision was made |
| `platform` | Yes | Meta / Google / Both |
| `country` | Yes | IT / ES / DE / FR / Global |
| `campaign` | No | Campaign name (e.g. BAU, RMKT, PMAX ITA) |
| `category` | Yes | Type of decision (see categories above) |
| `summary` | Yes | 1–2 sentence description of what was decided |
| `why` | Yes | Justification — what triggered this decision |
| `metric_before` | No | Relevant metrics at time of decision (CPL, CAC, ROAS) |
| `action_taken` | Yes | Exactly what was executed in the platform |
| `expected_outcome` | No | What you expected to happen |
| `review_date` | Yes | When you will check if it worked |
| `result` | No | What actually happened (filled after review) |
| `verdict` | No | Worked / Did Not Work / Neutral / No Data |
| `learning` | No | What this decision taught us |
| `playbook_worthy` | No | Should this become a standing rule? |
| `status` | Auto | Pending Review → Reviewed → Archived |
| `created_by` | Yes | Who logged the decision |

---

## User Flow — Logging a Decision

```
1. Open Decision Tracker → click "+ New Decision"

2. Fill the form:
   ├── Date (auto: today)
   ├── Platform → [Meta] [Google] [Both]
   ├── Country → [IT] [ES] [DE] [FR] [Global]
   ├── Campaign (free text)
   ├── Category → dropdown
   ├── Summary → what you decided
   ├── Why → what triggered this
   ├── Metric Before → CPL / CAC / ROAS (optional)
   ├── Action Taken → exactly what you did
   ├── Expected Outcome → what you expect
   └── Review Date → when to check back

3. Save → decision appears in the feed

4. Status: "Pending Review"
```

---

## Review Flow — Did It Work?

```
View: "Pending Reviews"
→ All decisions where review_date ≤ today and verdict = null

Click any decision:
→ Opens original decision
→ Fill: Result + Verdict + Learning
→ Toggle: "Playbook worthy?"
→ Save → status becomes "Reviewed"
```

**Review Verdicts:**
- **Worked** — outcome matched or exceeded expectation
- **Did Not Work** — outcome was worse than expectation
- **Neutral** — no meaningful change observed
- **No Data** — could not measure the result

---

## Playbook Flow — Turning Decisions into Rules

When a decision is marked `playbook_worthy = true`, it is exported as a rule:

```markdown
## Rule: [summary]
- Platform: Meta
- Country: IT
- Category: Budget
- Trigger: CPL > €45 for 3 consecutive days
- Action: Reduce budget by 15–20%
- Expected result: CPL returns to target within 5–7 days
- Evidence: Decision #047 — 2026-04-14
- Confidence: High (confirmed 3 times)
```

These rules feed directly into the EduSolium Knowledge Base.

---

## Filtering & Search

The main feed must support filtering by:

| Filter | Options |
|--------|---------|
| Date range | Any date range |
| Platform | Meta / Google / Both |
| Country | IT / ES / DE / FR / Global |
| Category | All 7 categories |
| Verdict | Worked / Did Not Work / Neutral / No Data / Pending |
| Playbook worthy | Yes / No |
| Campaign | Free text search |

---

## MVP Scope

| Feature | Priority |
|---------|----------|
| New decision form | P0 |
| Chronological feed with filters | P0 |
| Pending Reviews view | P0 |
| Complete result + verdict | P0 |
| Export to CSV | P0 |
| Login (email auth) | P0 |
| File/screenshot upload | P1 |
| Playbook export to Markdown | P1 |
| Dashboard (% good/bad decisions) | P2 |
| AI semantic search | P2 |
| Import from Google Sheets | P2 |

---

## Technical Architecture

```
┌─────────────────────────────────────────┐
│          FRONTEND (Next.js 14)          │
│  App Router + Tailwind CSS              │
│  Deployed on Vercel                     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          BACKEND (Next.js API)          │
│  API Routes (serverless)                │
│  Supabase JS Client                     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          SUPABASE                       │
│  PostgreSQL → decisions table           │
│  Auth → email login                     │
│  Storage → screenshots / files          │
└─────────────────────────────────────────┘
```

**Stack rationale:**
- Supabase = free tier, handles DB + auth + storage + realtime
- Next.js on Vercel = zero-config deploy, free for internal tools
- Tailwind = fast UI without a design system
- No backend server to maintain

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Feed | `/` | All decisions, chronological, with filters |
| New Decision | `/new` | Form to log a decision |
| Decision Detail | `/decisions/[id]` | Full view + edit + review |
| Pending Reviews | `/reviews` | Decisions awaiting verdict |
| Playbook | `/playbook` | All playbook-worthy decisions as rules |
| Export | `/export` | Download CSV or Markdown |

---

## AI Agent Interface

Every reviewed decision with `playbook_worthy = true` is available at:

```
GET /api/playbook?format=markdown&country=IT&platform=Meta
```

Response is a structured Markdown document that an AI agent can consume to understand EduSolium's decision-making history.

For semantic search (future):
- Embed decision summaries using `text-embedding-3-small`
- Store in Supabase `pgvector`
- Query: "What did we do last time CPL spiked in Italy?"

---

## Rufflo Execution Prompt

```
You are building the Decision Tracker MVP for EduSolium Paid Media.

Context:
- The team makes paid media decisions on Meta and Google across 4 countries: IT, ES, DE, FR
- Today there is no standardized system — decisions are tracked in a free-text Google Sheet
- The goal is a simple internal web app to log, categorize, review, and learn from decisions

Files to read first:
- 01-decision-tracker.md (this file) — full spec
- decision-schema.md — database schema
- example-decisions.md — 5 realistic example decisions

Steps to execute:

1. Initialize Next.js 14 project with App Router and Tailwind CSS
2. Set up Supabase project and run the schema migration
3. Configure Supabase Auth (email login)
4. Build the `decisions` table using the schema in decision-schema.md
5. Build page: Feed (/) — list all decisions with filters
6. Build page: New Decision (/new) — form with all required fields
7. Build page: Decision Detail (/decisions/[id]) — full view + review form
8. Build page: Pending Reviews (/reviews) — decisions with review_date <= today and no verdict
9. Build API route: GET /api/export — returns CSV of all decisions
10. Seed the database with the 5 example decisions from example-decisions.md
11. Deploy to Vercel

Constraints:
- No mock data after seeding — connect to real Supabase from day 1
- All forms must validate required fields before saving
- The verdict field must be locked until review_date has passed
- Keep the UI minimal — this is an internal tool, not a product
- Use TypeScript throughout

Output:
- Working web app deployed on Vercel
- README.md with setup instructions
- Supabase migration file (SQL)
- Seed file with example decisions
```

---

## What a New Employee Learns From This System

Reading the decision feed, a new media buyer understands:
- Which campaigns are currently active and why
- What CPL / CAC thresholds trigger budget changes
- Which creative formats have been tested and what happened
- How decisions are reviewed and what counts as success
- Which rules are standing (playbook) vs. experimental

**This system is the institutional memory of the Paid Media team.**
