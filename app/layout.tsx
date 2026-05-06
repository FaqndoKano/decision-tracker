import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
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
        <header style={{ background: '#202020' }} className="sticky top-0 z-10 shadow-md">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/logo.png"
                alt="Edusogno"
                height={32}
                width={130}
                style={{ objectFit: 'contain', filter: 'invert(1)' }}
                priority
              />
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium transition"
                  style={{ color: '#B0B0B0' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#E080C0'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = '#2E2E2E'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#B0B0B0'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }}
                >
                  {label}
                </Link>
              ))}

              <Link
                href="/new"
                className="ml-2 px-3 py-1.5 rounded-md text-sm font-semibold transition"
                style={{ background: '#E080C0', color: '#202020' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#C060A0'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#E080C0'; (e.currentTarget as HTMLAnchorElement).style.color = '#202020' }}
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
