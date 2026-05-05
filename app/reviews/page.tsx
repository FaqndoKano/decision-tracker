'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Decision } from '@/types/decision'

function formatDate(dateString?: string) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getDaysDiff(dateString?: string): number {
  if (!dateString) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const reviewDate = new Date(dateString)
  reviewDate.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
}

function isOverdue(dateString?: string): boolean {
  return getDaysDiff(dateString) > 0
}

function isToday(dateString?: string): boolean {
  return getDaysDiff(dateString) === 0
}

function DaysLabel({ reviewDate }: { reviewDate?: string }) {
  const diff = getDaysDiff(reviewDate)
  if (diff > 0) {
    return (
      <span className="text-red-700 font-semibold text-xs">
        {diff} day{diff !== 1 ? 's' : ''} overdue
      </span>
    )
  }
  if (diff === 0) {
    return <span className="text-blue-700 font-semibold text-xs">Due today</span>
  }
  return (
    <span className="text-gray-500 text-xs">
      Due in {Math.abs(diff)} day{Math.abs(diff) !== 1 ? 's' : ''} &mdash; {formatDate(reviewDate)}
    </span>
  )
}

interface DecisionRowProps {
  decision: Decision
  highlight: 'overdue' | 'today' | 'upcoming'
}

function DecisionRow({ decision, highlight }: DecisionRowProps) {
  const borderClass =
    highlight === 'overdue'
      ? 'border-red-200 bg-red-50 hover:border-red-300'
      : highlight === 'today'
      ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
      : 'border-gray-200 bg-white hover:border-gray-300'

  return (
    <Link
      href={`/decisions/${decision.id}`}
      className={`block rounded-lg border p-4 hover:shadow-sm transition ${borderClass}`}
    >
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug flex-1">
          {decision.summary}
        </h3>
        <DaysLabel reviewDate={decision.review_date} />
      </div>

      {decision.why && (
        <p className="text-xs text-gray-500 mb-2 leading-relaxed line-clamp-2">{decision.why}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
          {decision.platform}
        </span>
        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
          {decision.country}
        </span>
        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
          {decision.category}
        </span>
      </div>
    </Link>
  )
}

export default function Reviews() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/decisions?status=Pending%20Review')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed: ${res.status}`)
        }
        const data: Decision[] = await res.json()
        // Sort ascending by review_date (most urgent / oldest first)
        const sorted = [...data].sort((a, b) => {
          if (!a.review_date) return 1
          if (!b.review_date) return -1
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime()
        })
        setDecisions(sorted)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setDecisions([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const overdue = decisions.filter((d) => isOverdue(d.review_date))
  const dueToday = decisions.filter((d) => isToday(d.review_date))
  const upcoming = decisions.filter((d) => !isOverdue(d.review_date) && !isToday(d.review_date))

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="mt-3 text-sm text-gray-500">Loading reviews…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            {decisions.length === 0
              ? 'All caught up!'
              : `${decisions.length} decision${decisions.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <Link
          href="/new"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm"
        >
          + New Decision
        </Link>
      </div>

      {/* Empty state */}
      {decisions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">All caught up! No pending reviews.</p>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Feed
          </Link>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((d) => (
              <DecisionRow key={d.id} decision={d} highlight="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {dueToday.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Due Today ({dueToday.length})
          </h2>
          <div className="space-y-2">
            {dueToday.map((d) => (
              <DecisionRow key={d.id} decision={d} highlight="today" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Upcoming ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((d) => (
              <DecisionRow key={d.id} decision={d} highlight="upcoming" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
