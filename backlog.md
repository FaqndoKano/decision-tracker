# Decision Tracker — Backlog

## MVP (Build First)

- [ ] Project init: Next.js 14 + Tailwind + Supabase client
- [ ] Supabase: create `decisions` table using `decision-schema.md`
- [ ] Supabase: enable email auth
- [ ] Page: Feed (`/`) — chronological list with filter bar
- [ ] Page: New Decision (`/new`) — 6-field quick form (< 3 min target)
- [ ] Page: Decision Detail (`/decisions/[id]`) — full view + inline edit
- [ ] Page: Pending Reviews (`/reviews`) — decisions past review_date with no verdict
- [ ] Component: ReviewForm — fills result, verdict, learning, playbook toggle
- [ ] API: `GET /api/export?format=csv` — download all decisions
- [ ] Seed: load 5 example decisions from `example-decisions.md`
- [ ] Deploy to Vercel

## UX Improvements (Next Sprint)

- [ ] Category templates: auto-fill placeholder text when category is selected
- [ ] Smart review_date default: auto-set to today + 7 days
- [ ] Badge on nav: "3 pending reviews" counter
- [ ] Quick duplicate: copy an old decision as starting point for a new one
- [ ] Keyboard shortcut: `N` opens new decision form from anywhere
- [ ] Mobile-friendly form (log a decision from phone)

## P1 Features

- [ ] File/screenshot upload (Supabase Storage) — attach a metrics screenshot to any decision
- [ ] Page: Playbook (`/playbook`) — all `playbook_worthy = true` decisions formatted as rules
- [ ] API: `GET /api/export?format=markdown&playbook=true` — export playbook rules as Markdown
- [ ] Filter by verdict: Worked / Did Not Work / Pending Review
- [ ] Import from Google Sheets: parse the existing budget tracker spreadsheet

## P2 Features

- [ ] Dashboard: % decisions that Worked vs. Did Not Work vs. Neutral
- [ ] Dashboard: decisions by category over time (bar chart)
- [ ] Dashboard: average days to review
- [ ] Playbook auto-push to EduSolium Knowledge Base (Rufflo integration)
- [ ] AI semantic search: "What did we do last time CPL spiked in Italy?"
- [ ] Slack / WhatsApp notification when review_date arrives
- [ ] Multi-user: roles (Media Buyer / Manager), decision approval flow

## Constraints to Never Forget

- Log form must stay at 6 visible fields maximum — any more needs a "show more" toggle
- Review date must be auto-set — never ask the user to pick it manually
- No decision should require more than 3 minutes to log
- The feed must show the most recent decisions first, always
