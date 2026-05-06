import { NextRequest, NextResponse } from 'next/server'
import { getCPLAroundDecision } from '@/lib/edusogno-db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const platform = searchParams.get('platform') as 'Meta' | 'Google' | 'Both' | null
  const window = parseInt(searchParams.get('window') || '7')

  if (!date || !platform) {
    return NextResponse.json(
      { error: 'date and platform are required' },
      { status: 400 }
    )
  }

  if (!['Meta', 'Google', 'Both'].includes(platform)) {
    return NextResponse.json(
      { error: 'platform must be Meta, Google, or Both' },
      { status: 400 }
    )
  }

  try {
    const result = await getCPLAroundDecision(date, platform, window)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[metrics] DB error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch metrics from Edusogno DB' },
      { status: 500 }
    )
  }
}
