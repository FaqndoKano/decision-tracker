'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV = [
  { href: '/',         label: 'Feed' },
  { href: '/stats',    label: 'Stats' },
  { href: '/reviews',  label: 'Reviews' },
  { href: '/learning', label: 'Learnings' },
  { href: '/playbook', label: 'Playbook' },
  { href: '/import',   label: 'Import' },
  { href: '/new',      label: '+ New Decision' },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-2 rounded-md"
        style={{ color: '#A080A0' }}
        aria-label="Menu"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="4" x2="18" y2="18"/><line x1="18" y1="4" x2="4" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/>
          </svg>
        )}
      </button>

      {open && (
        <div
          className="absolute top-14 left-0 right-0 z-50 shadow-lg"
          style={{ background: '#E0C0E0', borderBottom: '1px solid #D0B0D0' }}
        >
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-6 py-3 text-sm font-medium border-b"
              style={{ color: '#A080A0', borderColor: '#D0B0D0' }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
