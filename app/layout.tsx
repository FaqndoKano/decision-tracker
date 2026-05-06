import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import AuthButton from './components/AuthButton'
import ReminderBanner from '@/app/components/ReminderBanner'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Decision Tracker',
  description: 'Track and review marketing decisions',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        {/* Top Nav */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            <Link href="/" className="text-base font-bold text-gray-900 tracking-tight">
              Decision Tracker
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Feed
              </Link>
              <Link
                href="/stats"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Stats
              </Link>
              <Link
                href="/reviews"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Reviews
              </Link>
              <Link
                href="/learning"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Learnings
              </Link>
              <Link
                href="/playbook"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Playbook
              </Link>
              <Link
                href="/import"
                className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
              >
                Import
              </Link>
              <Link
                href="/new"
                className="ml-2 px-3 py-1.5 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                + New
              </Link>
              <AuthButton />
            </nav>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          <ReminderBanner />
          {children}
        </main>
      </body>
    </html>
  )
}
