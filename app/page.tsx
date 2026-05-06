'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Decision, Platform, Country, Category, Status } from '@/types/decision'

const platforms: (Platform | 'All')[] = ['All', 'Meta', 'Google', 'Both']
const countries: (Country | 'All')[] = ['All', 'IT', 'ES', 'DE', 'FR', 'Global']
const categories: (Category | 'All')[] = [
  'All',
  'Budget',
  'Campaign',
  'Creative',
  'Audience',
  'Experiment',
  'Tracking',
  'Strategy',
]
const statuses: (Status | 'All')[] = ['All', 'Pending Review', 'Reviewed']

function getVerdictBadgeClass(verdict?: string) {
  switch (verdict) {
    case 'Worked':
      return 'bg-green-100 text-green-800'
    case 'Did Not Work':
      return 'bg-red-100 text-red-800'
    case 'Neutral':
      return 'bg-gray-100 text-gray-700'
    case 'No Data':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

function getStatusBadgeClass(status: Status) {
  switch (status) {
    case 'Pending Review':
      return 'bg-yellow-100 text-yellow-800'
    case 'Reviewed':
      return 'bg-green-100 text-green-800'
    case 'Archived':
      return 'bg-gray-100 text-gray-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncate(text: string, maxLen = 120) {
  if (!text) return ''
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text
}

export default function Home() {
  const [allDecisions, setAllDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All')
  const [filterCountry, setFilterCountry] = useState<Country | 'All'>('All')
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All')
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  // Load all decisions once on mount
  useEffect(() => {
    const fetchDecisions = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/decisions')
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed: ${res.status}`)
        }
        const data: Decision[] = await res.json()
        setAllDecisions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    fetchDecisions()
  }, [])

  // Filter client-side — instant, no loading flash
  const decisions = allDecisions.filter((d) => {
    if (filterPlatform !== 'All' && d.platform !== filterPlatform) return false
    if (filterCountry !== 'All' && d.country !== filterCountry) return false
    if (filterCategory !== 'All' && d.category !== filterCategory) return false
    if (filterStatus !== 'All' && d.status !== filterStatus) return false
    return true
  })

  const searched = decisions.filter(d => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      d.summary?.toLowerCase().includes(q) ||
      d.why?.toLowerCase().includes(q) ||
      d.action_taken?.toLowerCase().includes(q) ||
      d.campaign?.toLowerCase().includes(q) ||
      d.learning?.toLowerCase().includes(q) ||
      d.result?.toLowerCase().includes(q)
    )
  })

  const sorted = [...searched].sort((a, b) => {
    return sortOrder === 'desc'
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date)
  })

  const isFiltered = filterPlatform !== 'All' || filterCountry !== 'All' || filterCategory !== 'All' || filterStatus !== 'All' || searchQuery.trim() !== ''

  const handleExport = async () => {
    try {
      setExporting(true)
      const res = await fetch('/api/export')
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'decisions-export.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-3xl font-bold text-gray-900">Decisions</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <Link
            href="/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm"
          >
            + New Decision
          </Link>
        </div>
      </div>

      {/* Search */}
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-3.5 text-gray-400 text-sm">🔍</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-lg">×</button>
          )}
        </div>
        {isFiltered && !loading && (
          <p className="mt-2 text-xs text-gray-400">{sorted.length} decision{sorted.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</p>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
          >
            {sortOrder === 'desc' ? '↓ Newest first' : '↑ Oldest first'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as Platform | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value as Country | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as Category | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-500 text-sm">Loading decisions…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Error: {error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && sorted.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">No decisions match your filters.</p>
          <Link
            href="/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition text-sm"
          >
            + New Decision
          </Link>
        </div>
      )}

      {/* Decision Cards */}
      {!loading && !error && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((decision) => (
            <Link
              key={decision.id}
              href={`/decisions/${decision.id}`}
              className="block bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition p-5"
            >
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-base font-semibold text-gray-900 leading-snug">
                  {decision.summary}
                </h3>
                <span
                  className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(decision.status)}`}
                >
                  {decision.status}
                </span>
              </div>

              {decision.why && (
                <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                  {truncate(decision.why)}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {decision.platform}
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                  {decision.country}
                </span>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                  {decision.category}
                </span>
                {decision.verdict && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getVerdictBadgeClass(decision.verdict)}`}>
                    {decision.verdict}
                  </span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {formatDate(decision.date)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
