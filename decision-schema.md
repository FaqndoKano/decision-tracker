# Decision Tracker — Database Schema

## Core Principle: Log in Under 3 Minutes

The schema is split into two tiers:

- **Required at logging time** → absolute minimum to save a decision fast
- **Optional at review time** → filled later when checking if it worked

---

## Supabase Migration SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Main decisions table
CREATE TABLE decisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  platform         TEXT NOT NULL CHECK (platform IN ('Meta', 'Google', 'Both')),
  country          TEXT NOT NULL CHECK (country IN ('IT', 'ES', 'DE', 'FR', 'Global')),
  campaign         TEXT,
  category         TEXT NOT NULL CHECK (category IN (
                     'Budget', 'Campaign', 'Creative',
                     'Audience', 'Experiment', 'Tracking', 'Strategy'
                   )),
  summary          TEXT NOT NULL,
  why              TEXT NOT NULL,
  metric_before    TEXT,
  action_taken     TEXT NOT NULL,
  expected_outcome TEXT,
  review_date      DATE,

  -- Filled at review time
  result           TEXT,
  verdict          TEXT CHECK (verdict IN ('Worked', 'Did Not Work', 'Neutral', 'No Data')),
  learning         TEXT,
  playbook_worthy  BOOLEAN DEFAULT FALSE,

  -- Auto-managed
  status           TEXT NOT NULL DEFAULT 'Pending Review'
                     CHECK (status IN ('Pending Review', 'Reviewed', 'Archived')),
  created_by       TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decisions_updated_at
  BEFORE UPDATE ON decisions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for common filters
CREATE INDEX idx_decisions_date     ON decisions (date DESC);
CREATE INDEX idx_decisions_platform ON decisions (platform);
CREATE INDEX idx_decisions_country  ON decisions (country);
CREATE INDEX idx_decisions_category ON decisions (category);
CREATE INDEX idx_decisions_status   ON decisions (status);
CREATE INDEX idx_decisions_review   ON decisions (review_date) WHERE verdict IS NULL;
```

---

## Field Reference

### Required at log time (fast form)

| Field | Type | Notes |
|-------|------|-------|
| `date` | DATE | Auto: today |
| `platform` | ENUM | Meta / Google / Both |
| `country` | ENUM | IT / ES / DE / FR / Global |
| `category` | ENUM | Budget / Campaign / Creative / Audience / Experiment / Tracking / Strategy |
| `summary` | TEXT | 1–2 sentences max |
| `why` | TEXT | What triggered the decision |
| `action_taken` | TEXT | What was actually done |
| `created_by` | TEXT | Auto from auth session |

### Optional at log time

| Field | Type | Notes |
|-------|------|-------|
| `campaign` | TEXT | Campaign name |
| `metric_before` | TEXT | CPL, CAC, ROAS snapshot |
| `expected_outcome` | TEXT | What you expect to happen |
| `review_date` | DATE | Default: +7 days from today |

### Filled at review time

| Field | Type | Notes |
|-------|------|-------|
| `result` | TEXT | What actually happened |
| `verdict` | ENUM | Worked / Did Not Work / Neutral / No Data |
| `learning` | TEXT | What this teaches us |
| `playbook_worthy` | BOOLEAN | Should this become a rule? |

---

## Quick-Log Form Design (< 3 minutes target)

The UI should present only 6 fields by default:

```
[Platform]  [Country]  [Category]    ← 3 dropdowns, one click each
[Summary]                             ← single line, plain text
[Why]                                 ← single line, plain text
[Action taken]                        ← single line, plain text

[Save]  [+ Add more details ↓]        ← collapsed optional section
```

Smart defaults:
- `date` = today (auto)
- `created_by` = logged-in user (auto)
- `review_date` = today + 7 days (auto, editable)
- `status` = "Pending Review" (auto)

---

## Category → Quick Templates

When a category is selected, pre-fill placeholder text:

| Category | Summary placeholder | Why placeholder | Action placeholder |
|----------|--------------------|-----------------|--------------------|
| Budget | "Scaled BAU Italy from €X to €Y" | "CPL was below target for 3 days" | "Changed daily budget in Meta Ads Manager" |
| Campaign | "Paused Demand Gen Shorts" | "CPB exceeded €100, low quality leads" | "Set campaign status to Paused" |
| Creative | "Retired static creative #12" | "CTR dropped below 1% for 7 days" | "Turned off ad set, uploaded 3 new UGC videos" |
| Audience | "Reduced retargeting window from 30 to 14 days" | "Audience overlap with BAU was too high" | "Edited audience in Ad Set settings" |
| Experiment | "Testing ASC+ vs manual ad sets" | "Want to understand if ASC+ improves efficiency" | "Created duplicate campaign with ASC+ enabled" |
| Tracking | "Fixed purchase event firing twice" | "Duplicate conversions inflating ROAS" | "Removed duplicate pixel via GTM" |
| Strategy | "Prioritizing Germany budget for Q2" | "DE has lowest CAC across all markets" | "Reallocated 20% of IT budget to DE" |

---

## TypeScript Types

```typescript
export type Platform = 'Meta' | 'Google' | 'Both'
export type Country  = 'IT' | 'ES' | 'DE' | 'FR' | 'Global'
export type Category = 'Budget' | 'Campaign' | 'Creative' | 'Audience' | 'Experiment' | 'Tracking' | 'Strategy'
export type Verdict  = 'Worked' | 'Did Not Work' | 'Neutral' | 'No Data'
export type Status   = 'Pending Review' | 'Reviewed' | 'Archived'

export interface Decision {
  id:               string
  date:             string        // ISO date
  platform:         Platform
  country:          Country
  campaign?:        string
  category:         Category
  summary:          string
  why:              string
  metric_before?:   string
  action_taken:     string
  expected_outcome?: string
  review_date?:     string

  // Review fields
  result?:          string
  verdict?:         Verdict
  learning?:        string
  playbook_worthy:  boolean

  // Auto
  status:           Status
  created_by:       string
  created_at:       string
  updated_at:       string
}

export type DecisionInsert = Omit<Decision, 'id' | 'status' | 'created_by' | 'created_at' | 'updated_at'>
export type DecisionReview = Pick<Decision, 'id' | 'result' | 'verdict' | 'learning' | 'playbook_worthy'>
```
