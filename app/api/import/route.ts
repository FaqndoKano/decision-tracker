import { NextRequest, NextResponse } from 'next/server'
import { createDecision } from '@/lib/db'
import { Decision } from '@/types/decision'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rows } = body // array of raw CSV row objects

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const results = { imported: 0, skipped: 0, errors: [] as string[] }

    for (const row of rows) {
      try {
        // Map CSV columns to Decision fields - be flexible with column names
        const summary = row['summary'] || row['Summary'] || row['SUMMARY'] || ''
        const why = row['why'] || row['Why'] || row['WHY'] || row['justification'] || row['Justification'] || ''
        const action_taken = row['action_taken'] || row['Action'] || row['action'] || row['budget_change'] || row['Budget change'] || ''
        const platform = row['platform'] || row['Platform'] || 'Meta'
        const country = row['country'] || row['Country'] || 'IT'
        const category = row['category'] || row['Category'] || 'Budget'
        const date = row['date'] || row['Date'] || row['DATE'] || new Date().toISOString().split('T')[0]
        const campaign = row['campaign'] || row['Campaign'] || row['CAMPAIGN'] || ''
        const metric_before = row['metric_before'] || row['CPL'] || row['cpl'] || row['CAC'] || ''

        if (!summary && !why) {
          results.skipped++
          continue
        }

        const reviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const decision: Decision = {
          id: crypto.randomUUID(),
          date: date.toString(),
          platform: (['Meta', 'Google', 'Both'].includes(platform) ? platform : 'Meta') as Decision['platform'],
          country: (['IT', 'ES', 'DE', 'FR', 'Global'].includes(country) ? country : 'IT') as Decision['country'],
          campaign: campaign.toString() || undefined,
          category: (['Budget', 'Campaign', 'Creative', 'Audience', 'Experiment', 'Tracking', 'Strategy'].includes(category) ? category : 'Budget') as Decision['category'],
          summary: summary.toString() || `Imported decision ${results.imported + 1}`,
          why: why.toString() || 'Imported from CSV',
          metric_before: metric_before.toString() || undefined,
          action_taken: action_taken.toString() || 'See original CSV',
          expected_outcome: undefined,
          review_date: reviewDate,
          result: undefined,
          verdict: undefined,
          learning: undefined,
          playbook_worthy: false,
          status: 'Pending Review',
          created_by: 'facundo@easypeasyfluent.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        await createDecision(decision)
        results.imported++
      } catch (err) {
        results.errors.push(String(err))
        results.skipped++
      }
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    console.error('POST /api/import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
