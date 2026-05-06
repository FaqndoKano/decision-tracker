import { NextRequest, NextResponse } from 'next/server'
import { getAllDecisions } from '@/lib/db'
import { Decision } from '@/types/decision'

export async function GET(_request: NextRequest) {
  try {
    const decisions = await getAllDecisions()
    const csv = convertToCSV(decisions)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="decisions-export.csv"',
      },
    })
  } catch (error) {
    console.error('GET /api/export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertToCSV(decisions: Decision[]): string {
  const headers = [
    'ID',
    'Date',
    'Platform',
    'Country',
    'Campaign',
    'Category',
    'Summary',
    'Why',
    'Metric Before',
    'Action Taken',
    'Expected Outcome',
    'Review Date',
    'Result',
    'Verdict',
    'Learning',
    'Playbook Worthy',
    'Status',
    'Created By',
    'Created At',
    'Updated At',
  ]

  const headerRow = headers.map(escapeCSVField).join(',')

  const dataRows = decisions.map((decision) =>
    [
      decision.id,
      decision.date || '',
      decision.platform || '',
      decision.country || '',
      decision.campaign || '',
      decision.category || '',
      decision.summary || '',
      decision.why || '',
      decision.metric_before || '',
      decision.action_taken || '',
      decision.expected_outcome || '',
      decision.review_date || '',
      decision.result || '',
      decision.verdict || '',
      decision.learning || '',
      decision.playbook_worthy ? 'Yes' : 'No',
      decision.status || '',
      decision.created_by || '',
      decision.created_at || '',
      decision.updated_at || '',
    ]
      .map(escapeCSVField)
      .join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

function escapeCSVField(field: unknown): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}
