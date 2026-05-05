# Decision Tracker — EduSolium Paid Media

Internal tool for logging, reviewing, and learning from every paid media decision.

**Goal: log any decision in under 3 minutes.**

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo>
cd decision-tracker
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → run the contents of `decision-schema.md` (the SQL block)
3. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Seed example data

```bash
npx ts-node scripts/seed.ts
```

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Deploy to Vercel

```bash
npx vercel --prod
```

Add the same 3 environment variables in the Vercel dashboard.

---

## Project Structure

```
decision-tracker/
├── app/
│   ├── page.tsx              # Feed — all decisions
│   ├── new/page.tsx          # New decision form
│   ├── decisions/[id]/       # Decision detail + review
│   ├── reviews/page.tsx      # Pending reviews
│   └── playbook/page.tsx     # Playbook rules
├── api/
│   └── export/route.ts       # CSV export
├── components/
│   ├── DecisionForm.tsx      # Quick-log form (< 3 min)
│   ├── DecisionCard.tsx      # Card in feed
│   ├── ReviewForm.tsx        # Fill result + verdict
│   └── FilterBar.tsx         # Platform / country / category filters
├── lib/
│   └── supabase.ts           # Supabase client
├── types/
│   └── decision.ts           # TypeScript types
├── scripts/
│   └── seed.ts               # Load example decisions
├── decision-schema.md        # Full DB schema + SQL
├── example-decisions.md      # 5 real EduSolium examples
└── 01-decision-tracker.md    # Full product spec
```

---

## How to Log a Decision (3 minutes or less)

1. Click **+ New Decision** (top right, always visible)
2. Select platform, country, and category — 3 clicks
3. Type: what you decided, why, what you did — 3 short lines
4. Hit **Save**

The review date is set automatically to 7 days from now.

---

## How to Review a Decision

1. Open **Pending Reviews** — shows decisions where review date has passed
2. Click any decision
3. Fill: what happened, verdict, what you learned
4. Toggle "Playbook worthy" if this should become a rule
5. Save

---

## Filtering the Feed

Use the filter bar to narrow by:
- Platform (Meta / Google / Both)
- Country (IT / ES / DE / FR / Global)
- Category (Budget / Campaign / Creative / etc.)
- Verdict (Worked / Did Not Work / Pending)
- Date range

---

## Exporting Data

```
GET /api/export?format=csv
GET /api/export?format=markdown&playbook=true
```

Or use the Export button in the UI.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email) |
| File storage | Supabase Storage |
| Deploy | Vercel |

All free tier for internal team use.
