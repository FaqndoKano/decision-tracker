'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      setAuthenticated(false)
      router.refresh()
    } catch {
      // silently fail
    } finally {
      setLoggingOut(false)
    }
  }

  // Still checking — render nothing to avoid layout shift
  if (authenticated === null) return null

  if (authenticated) {
    return (
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs font-medium text-gray-500 select-none">
          Editor
        </span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition disabled:opacity-50"
        >
          {loggingOut ? 'Logging out…' : 'Logout'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 ml-2">
      <span className="text-xs font-medium text-gray-400 select-none">
        View only
      </span>
      <Link
        href="/login"
        className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
      >
        Login
      </Link>
    </div>
  )
}
