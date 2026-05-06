import { NextRequest, NextResponse } from 'next/server'
import { getDecisionById, updateDecision, pool } from '@/lib/db'
import { Decision } from '@/types/decision'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const decision = await getDecisionById(id)

    if (!decision) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    return NextResponse.json(decision, { status: 200 })
  } catch (error) {
    console.error('GET /api/decisions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const existing = await getDecisionById(id)

    if (!existing) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    const body = await request.json()

    // Only allow updating known fields
    const allowedFields: (keyof Decision)[] = [
      'date',
      'platform',
      'country',
      'campaign',
      'category',
      'summary',
      'why',
      'metric_before',
      'metric_after',
      'action_taken',
      'expected_outcome',
      'review_date',
      'result',
      'verdict',
      'learning',
      'playbook_worthy',
      'status',
    ]

    const updates: Partial<Decision> = {}
    for (const field of allowedFields) {
      if (field in body) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(updates as any)[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 })
    }

    // Append to edit history before updating
    const historyEntry = {
      timestamp: new Date().toISOString(),
      previous: existing,
    }
    const currentHistory = JSON.parse((existing as any).edit_history || '[]')
    currentHistory.push(historyEntry)
    // Keep only last 10 edits
    const trimmedHistory = currentHistory.slice(-10)
    ;(updates as any).edit_history = JSON.stringify(trimmedHistory)

    const updated = await updateDecision(id, updates)

    if (!updated) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error('PUT /api/decisions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const existing = await getDecisionById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 })
    }
    await pool.query('DELETE FROM decisions WHERE id = $1', [id])
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('DELETE /api/decisions/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
