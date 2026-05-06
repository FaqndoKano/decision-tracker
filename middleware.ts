import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const auth = request.cookies.get('dt_auth')?.value

  // Protect write API routes
  if (pathname.startsWith('/api/decisions') && PROTECTED_METHODS.includes(method)) {
    if (auth !== '1') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Protect /new page
  if (pathname === '/new' && auth !== '1') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/new', '/api/decisions/:path*'],
}
