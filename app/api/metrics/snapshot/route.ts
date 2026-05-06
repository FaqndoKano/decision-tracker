import { NextRequest, NextResponse } from 'next/server'
import { getCampaignSnapshot } from '@/lib/edusogno-db'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date     = searchParams.get('date')       // decision date
  const platform = searchParams.get('platform') as 'Meta' | 'Google' | null
  const country  = searchParams.get('country') ?? 'Global'
  const window   = parseInt(searchParams.get('window') || '7')

  if (!date || !platform) {
    return NextResponse.json({ error: 'date and platform are required' }, { status: 400 })
  }
  if (!['Meta', 'Google'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be Meta or Google' }, { status: 400 })
  }

  const dateFrom = addDays(date, -window)
  const dateTo   = date // exclusive

  try {
    const result = await getCampaignSnapshot(dateFrom, dateTo, platform, country)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[metrics/snapshot] DB error:', err)
    return NextResponse.json({ error: 'Failed to fetch snapshot from Edusogno DB' }, { status: 500 })
  }
}
