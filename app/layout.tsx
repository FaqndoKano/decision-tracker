import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import AuthButton from './components/AuthButton'
import ReminderBanner from '@/app/components/ReminderBanner'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Edusogno · Decision Tracker',
  description: 'Track and review marketing decisions',
}

const NAV = [
  { href: '/',         label: 'Feed' },
  { href: '/stats',    label: 'Stats' },
  { href: '/reviews',  label: 'Reviews' },
  { href: '/learning', label: 'Learnings' },
  { href: '/playbook', label: 'Playbook' },
  { href: '/import',   label: 'Import' },
]

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-gray-900" style={{ background: 'var(--surface)' }}>

        {/* ── Top Nav ── */}
        <header style={{ background: '#E0C0E0', borderBottom: '1px solid #D0B0D0' }} className="sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Edusogno" style={{ height: 36, width: 'auto' }} />
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium transition"
                  style={{ color: '#A080A0' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#E080C0'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = '#D8B0D8'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#A080A0'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }}
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/new"
                className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold transition"
                style={{ background: '#E080C0', color: '#F8F0F8' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#D070B0' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E080C0' }}
              >
                + New
              </Link>

              <AuthButton />
            </nav>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          <ReminderBanner />
          {children}
        </main>
      </body>
    </html>
  )
}
