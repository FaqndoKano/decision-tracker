import { NextRequest, NextResponse } from 'next/server'
import { getAllDecisions, createDecision } from '@/lib/db'
import { Decision } from '@/types/decision'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const platform = searchParams.get('platform')
    const country = searchParams.get('country')
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let decisions = await getAllDecisions()

    if (platform) decisions = decisions.filter((d) => d.platform === platform)
    if (country) decisions = decisions.filter((d) => d.country === country)
    if (category) decisions = decisions.filter((d) => d.category === category)
    if (status) decisions = decisions.filter((d) => d.status === status)

    return NextResponse.json(decisions, { status: 200 })
  } catch (error) {
    console.error('GET /api/decisions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const body = await request.json()

    const { platform, country, category, summary, why, action_taken } = body

    // Validate required fields
    if (!platform || !country || !category || !summary || !why || !action_taken) {
      return NextResponse.json(
        {
          error: 'Missing required fields: platform, country, category, summary, why, action_taken',
        },
        { status: 400 }
      )
    }

    // Check for duplicates: same summary within last 14 days
    if (!force) {
      const allDecisions = await getAllDecisions()
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const recentSimilar = allDecisions.filter(d => {
        if (d.date < twoWeeksAgo) return false
        const existingSummary = d.summary.toLowerCase().replace(/\s+/g, ' ').trim()
        const newSummary = summary.toLowerCase().replace(/\s+/g, ' ').trim()
        // Check if summaries share more than 60% of words
        const existingWords = new Set(existingSummary.split(' ').filter((w: string) => w.length > 3))
        const newWords = newSummary.split(' ').filter((w: string) => w.length > 3)
        if (newWords.length === 0) return false
        const matches = newWords.filter((w: string) => existingWords.has(w)).length
        return matches / newWords.length > 0.6
      })

      if (recentSimilar.length > 0) {
        return NextResponse.json({
          error: 'Possible duplicate',
          duplicate: true,
          existing: recentSimilar[0],
          message: `Similar decision found: "${recentSimilar[0].summary}" (${recentSimilar[0].date})`,
        }, { status: 409 })
      }
    }

    const id = crypto.randomUUID()
    const today = new Date().toISOString().split('T')[0]
    const reviewDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const now = new Date().toISOString()

    const newDecision: Decision = {
      id,
      date: body.date || today,
      platform,
      country,
      campaign: body.campaign ?? undefined,
      category,
      summary,
      why,
      metric_before: body.metric_before ?? undefined,
      action_taken,
      expected_outcome: body.expected_outcome ?? undefined,
      review_date: body.review_date || reviewDate,
      result: undefined,
      verdict: undefined,
      learning: undefined,
      playbook_worthy: body.playbook_worthy ? true : false,
      status: 'Pending Review',
      created_by: 'facundo@easypeasyfluent.com',
      created_at: now,
      updated_at: now,
    }

    const created = await createDecision(newDecision)

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/decisions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
