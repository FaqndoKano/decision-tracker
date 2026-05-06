import { NextRequest, NextResponse } from 'next/server'
import { getCampaignSnapshot } from '@/lib/edusogno-db'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date          = searchParams.get('date')
  const platform      = searchParams.get('platform') as 'Meta' | 'Google' | null
  const country       = searchParams.get('country') ?? 'Global'
  const windowDays    = parseInt(searchParams.get('window') || '7')
  const dateFromParam = searchParams.get('date_from')
  const dateToParam   = searchParams.get('date_to')

  if (!platform || !['Meta', 'Google'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be Meta or Google' }, { status: 400 })
  }

  let dateFrom: string, dateTo: string
  if (dateFromParam && dateToParam) {
    dateFrom = dateFromParam
    dateTo   = dateToParam
  } else if (date) {
    dateFrom = addDays(date, -windowDays)
    dateTo   = date
  } else {
    return NextResponse.json({ error: 'Provide date or date_from + date_to' }, { status: 400 })
  }

  try {
    const result = await getCampaignSnapshot(dateFrom, dateTo, platform, country)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[metrics/snapshot] DB error:', err)
    return NextResponse.json({ error: 'Failed to fetch snapshot from Edusogno DB' }, { status: 500 })
  }
}
