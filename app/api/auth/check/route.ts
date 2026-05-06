import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = request.cookies.get('dt_auth')?.value
  return NextResponse.json({ authenticated: auth === '1' })
}
