import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import AuthButton from './components/AuthButton'
import MobileNav from './components/MobileNav'
import ReminderBanner from '@/app/components/ReminderBanner'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Edusogno · Decision Tracker',
  description: 'Track and review marketing decisions',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Decisions',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
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
        <header className="nav-header sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Edusogno" className="nav-logo" />
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-0.5">
              {NAV.map(({ href, label }) => (
                <Link key={href} href={href} className="nav-link hidden md:block px-3 py-1.5 rounded-md text-sm font-medium">
                  {label}
                </Link>
              ))}
              <Link href="/new" className="nav-cta ml-2 px-3 py-1.5 rounded-md text-sm font-semibold">
                + New
              </Link>
              <AuthButton />
              <MobileNav />
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
