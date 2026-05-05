# Example Decisions — EduSolium Paid Media

These 5 decisions are based on the real data visible in the budget tracker spreadsheet.
Use them to seed the database and test the UI.

---

## Decision #001

```json
{
  "date": "2026-04-14",
  "platform": "Google",
  "country": "IT",
  "campaign": "BAU",
  "category": "Budget",
  "summary": "Reduced BAU Italy budget from €2,550 to €2,160",
  "why": "CPL reached €40 — too high. Needed to understand if we were overinvesting.",
  "metric_before": "CPL: €40",
  "action_taken": "Changed daily budget in Google Ads from €2,550 to €2,160",
  "expected_outcome": "CPL should drop back to target range (€30–35) within 5–7 days",
  "review_date": "2026-04-21",
  "result": "CPL dropped to €34 after 6 days. Stayed stable.",
  "verdict": "Worked",
  "learning": "BAU Italy has a CPL elasticity to budget — reducing ~15% is enough to stabilize CPL without losing volume significantly.",
  "playbook_worthy": true,
  "status": "Reviewed",
  "created_by": "facundo@easypeasyfluent.com"
}
```

---

## Decision #002

```json
{
  "date": "2026-04-06",
  "platform": "Google",
  "country": "IT",
  "campaign": "Demand Gen Shorts",
  "category": "Campaign",
  "summary": "Reduced Demand Gen Shorts budget from €200 to €100",
  "why": "Spent €2k in one week with CPB above €100 — cost per booking far too high to justify.",
  "metric_before": "CPB: >€100, spend: €2,000 in 7 days",
  "action_taken": "Halved daily budget. Added YouTube Shorts + Feed channel segmentation.",
  "expected_outcome": "Lower CPB, better quality placements",
  "review_date": "2026-04-12",
  "result": "CPB still high on non-Shorts placements. Segmented to Shorts only — will monitor.",
  "verdict": "Neutral",
  "learning": "Demand Gen needs placement segmentation from day 1. Broad placements burn budget fast with low quality.",
  "playbook_worthy": true,
  "status": "Reviewed",
  "created_by": "facundo@easypeasyfluent.com"
}
```

---

## Decision #003

```json
{
  "date": "2026-04-10",
  "platform": "Meta",
  "country": "IT",
  "campaign": "RMKT",
  "category": "Audience",
  "summary": "Rebuilt remarketing audience: reduced engagement window, cleaned creatives, added ASC+ settings",
  "why": "Remarketing was stealing impressions from BAU. Audience window was too broad (old data). Creatives were stale.",
  "metric_before": "Audience overlap with BAU: high. Creative CTR: <1%",
  "action_taken": "Reduced engagement window from 30 to 14 days. Paused all existing creatives. Uploaded new creatives. Enabled ASC+ at ad set level.",
  "expected_outcome": "RMKT stops cannibalizing BAU impressions. CPL improves from lower funnel intent.",
  "review_date": "2026-04-20",
  "result": null,
  "verdict": null,
  "learning": null,
  "playbook_worthy": false,
  "status": "Pending Review",
  "created_by": "facundo@easypeasyfluent.com"
}
```

---

## Decision #004

```json
{
  "date": "2026-04-16",
  "platform": "Meta",
  "country": "IT",
  "campaign": "STATIC REMARKETING",
  "category": "Budget",
  "summary": "Scaled Static Remarketing from €75 to €125",
  "why": "CPL at €27 with 100% booking rate — best performing campaign in the account.",
  "metric_before": "CPL: €27, Booking Rate: 100%",
  "action_taken": "Increased daily budget from €75 to €125 in Meta Ads Manager",
  "expected_outcome": "Maintain CPL <€35 while gaining more volume from high-intent audience",
  "review_date": "2026-04-23",
  "result": null,
  "verdict": null,
  "learning": null,
  "playbook_worthy": false,
  "status": "Pending Review",
  "created_by": "facundo@easypeasyfluent.com"
}
```

---

## Decision #005

```json
{
  "date": "2026-05-04",
  "platform": "Google",
  "country": "IT",
  "campaign": "BAU",
  "category": "Budget",
  "summary": "Scaled BAU Italy from €1,730 to €2,000",
  "why": "CPL was still high but market is getting more expensive. Testing if we can get volume at this price.",
  "metric_before": "CPL: high (above target). Market CPCs trending up.",
  "action_taken": "Increased daily budget from €1,730 to €2,000 in Google Ads",
  "expected_outcome": "More volume. CPL may stay high — acceptable if CAC stays below €400.",
  "review_date": "2026-05-11",
  "result": null,
  "verdict": null,
  "learning": null,
  "playbook_worthy": false,
  "status": "Pending Review",
  "created_by": "facundo@easypeasyfluent.com"
}
```

---

## Seed Script (TypeScript)

```typescript
// scripts/seed.ts
import { createClient } from '@supabase/supabase-js'
import { decisions } from './example-decisions-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  const { error } = await supabase.from('decisions').insert(decisions)
  if (error) throw error
  console.log('Seeded', decisions.length, 'decisions')
}

seed()
```
