'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Decision, Verdict, Status, Platform, Country, Category } from '@/types/decision'
import type { CPLResult, SnapshotResult } from '@/lib/edusogno-db'

const VERDICTS: Verdict[] = ['Worked', 'Did Not Work', 'Neutral', 'No Data']
const PLATFORMS: Platform[] = ['Meta', 'Google', 'Both']
const COUNTRIES: Country[] = ['IT', 'ES', 'DE', 'FR', 'Global']
const CATEGORIES: Category[] = ['Budget', 'Campaign', 'Creative', 'Audience', 'Experiment', 'Tracking', 'Strategy']

interface ReviewForm {
  verdict: Verdict | ''
  result: string
  learning: string
  playbook_worthy: boolean
  metric_after: string
}

interface EditForm {
  summary: string
  why: string
  action_taken: string
  platform: Platform | ''
  country: Country | ''
  category: Category | ''
  campaign: string
  metric_before: string
  expected_outcome: string
  review_date: string
  date: string
}

function getStatusClass(status: Status) {
  switch (status) {
    case 'Pending Review': return 'bg-yellow-100 text-yellow-800'
    case 'Reviewed': return 'bg-green-100 text-green-800'
    case 'Archived': return 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function getVerdictClass(verdict?: string) {
  switch (verdict) {
    case 'Worked': return 'bg-green-100 text-green-800'
    case 'Did Not Work': return 'bg-red-100 text-red-800'
    case 'Neutral': return 'bg-gray-100 text-gray-700'
    case 'No Data': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-500'
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-900 whitespace-pre-wrap">{value}</p>
    </div>
  )
}

export default function DecisionDetail() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [decision, setDecision] = useState<Decision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    summary: '', why: '', action_taken: '', platform: '', country: '',
    category: '', campaign: '', metric_before: '', expected_outcome: '',
    review_date: '', date: '',
  })
  const [cpl, setCpl] = useState<CPLResult | null>(null)
  const [cplLoading, setCplLoading] = useState(false)
  const [cplError, setCplError] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<SnapshotResult | null>(null)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [showFunnel, setShowFunnel] = useState(false)

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    verdict: '',
    result: '',
    learning: '',
    playbook_worthy: false,
    metric_after: '',
  })

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => setAuthenticated(data.authenticated))
      .catch(() => setAuthenticated(false))
  }, [])

  async function handleDelete() {
    if (!window.confirm('Are you sure? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/decisions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to delete (${res.status})`)
      }
      router.push('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/decisions/${id}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Not found (${res.status})`)
        }
        const data: Decision = await res.json()
        setDecision(data)
        fetchCPL(data)
        setEditForm({
          summary: data.summary ?? '',
          why: data.why ?? '',
          action_taken: data.action_taken ?? '',
          platform: data.platform ?? '',
          country: data.country ?? '',
          category: data.category ?? '',
          campaign: data.campaign ?? '',
          metric_before: data.metric_before ?? '',
          expected_outcome: data.expected_outcome ?? '',
          review_date: data.review_date ?? '',
          date: data.date ?? '',
        })
        setReviewForm({
          verdict: data.verdict ?? '',
          result: data.result ?? '',
          learning: data.learning ?? '',
          playbook_worthy: data.playbook_worthy ?? false,
          metric_after: data.metric_after ?? '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decision')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function fetchCPL(d: Decision) {
    if (d.platform !== 'Meta' && d.platform !== 'Google') return
    const base = `date=${d.date}&platform=${d.platform}&country=${d.country}&window=7`
    // Aggregate before/after
    setCplLoading(true); setCplError(null)
    fetch(`/api/metrics?${base}`)
      .then(r => r.ok ? r.json() : Promise.reject('CPL fetch failed'))
      .then((data: CPLResult) => setCpl(data))
      .catch(err => setCplError(err instanceof Error ? err.message : 'Failed to load CPL'))
      .finally(() => setCplLoading(false))
    // Campaign snapshot (7 days before)
    setSnapshotLoading(true); setSnapshotError(null)
    fetch(`/api/metrics/snapshot?${base}`)
      .then(r => r.ok ? r.json() : Promise.reject('Snapshot fetch failed'))
      .then((data: SnapshotResult) => setSnapshot(data))
      .catch(err => setSnapshotError(err instanceof Error ? err.message : 'Failed to load snapshot'))
      .finally(() => setSnapshotLoading(false))
  }

  async function handleSaveEdit() {
    if (!editForm.platform || !editForm.country || !editForm.category) {
      setEditError('Platform, Country and Category are required.'); return
    }
    if (!editForm.summary.trim() || !editForm.why.trim() || !editForm.action_taken.trim()) {
      setEditError('Summary, Why and Action Taken are required.'); return
    }
    setEditError(null)
    setEditSaving(true)
    try {
      const res = await fetch(`/api/decisions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: editForm.summary.trim(),
          why: editForm.why.trim(),
          action_taken: editForm.action_taken.trim(),
          platform: editForm.platform,
          country: editForm.country,
          category: editForm.category,
          campaign: editForm.campaign.trim() || null,
          metric_before: editForm.metric_before.trim() || null,
          expected_outcome: editForm.expected_outcome.trim() || null,
          review_date: editForm.review_date || null,
          date: editForm.date || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to save (${res.status})`)
      }
      const updated: Decision = await res.json()
      setDecision(updated)
      setEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Save failed.')
    } finally {
      setEditSaving(false)
    }
  }

  function handleReviewChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setReviewForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setReviewForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function handleSaveReview() {
    if (!decision) return
    setReviewError(null)

    try {
      setSubmitting(true)
      const res = await fetch(`/api/decisions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: reviewForm.verdict || null,
          result: reviewForm.result.trim() || null,
          learning: reviewForm.learning.trim() || null,
          playbook_worthy: reviewForm.playbook_worthy,
          metric_after: reviewForm.metric_after.trim() || null,
          status: 'Reviewed',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Failed to save (${res.status})`)
      }

      const updated: Decision = await res.json()
      setDecision(updated)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Save failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      </div>
    )
  }

  if (error || !decision) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Feed
        </Link>
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error ?? 'Decision not found.'}</p>
        </div>
      </div>
    )
  }

  const isPendingReview = decision.status === 'Pending Review'
  const isReviewed = decision.status === 'Reviewed'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + Status + Edit */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Feed
        </Link>
        <div className="flex items-center gap-2">
          {authenticated && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
            >
              ✏️ Edit
            </button>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(decision.status)}`}>
            {decision.status}
          </span>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{decision.summary}</h1>
        {decision.why && (
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">{decision.why}</p>
        )}
      </div>

      {/* Decision Details — read or edit */}
      {!editing ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Decision Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <Field label="Date" value={formatDate(decision.date)} />
            <Field label="Platform" value={decision.platform} />
            <Field label="Country" value={decision.country} />
            <Field label="Category" value={decision.category} />
            {decision.campaign && <Field label="Campaign" value={decision.campaign} />}
            <Field label="Review Date" value={formatDate(decision.review_date)} />
            {decision.metric_before && (
              <div className="sm:col-span-2"><Field label="Metric Before" value={decision.metric_before} /></div>
            )}
            <div className="sm:col-span-2"><Field label="Action Taken" value={decision.action_taken} /></div>
            {decision.expected_outcome && (
              <div className="sm:col-span-2"><Field label="Expected Outcome" value={decision.expected_outcome} /></div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-blue-300 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Edit Decision</h2>

          {/* Row 1: Platform / Country / Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([['platform', 'Platform', PLATFORMS], ['country', 'Country', COUNTRIES], ['category', 'Category', CATEGORIES]] as const).map(([field, label, opts]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label} *</label>
                <select
                  value={editForm[field]}
                  onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select…</option>
                  {(opts as readonly string[]).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Decision Date</label>
            <input type="date" value={editForm.date}
              onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Summary *</label>
            <input type="text" value={editForm.summary}
              onChange={e => setEditForm(prev => ({ ...prev, summary: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Why */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Why *</label>
            <textarea value={editForm.why} rows={3}
              onChange={e => setEditForm(prev => ({ ...prev, why: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Action Taken *</label>
            <textarea value={editForm.action_taken} rows={3}
              onChange={e => setEditForm(prev => ({ ...prev, action_taken: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
            />
          </div>

          {/* Optional: Campaign / Metric Before / Expected Outcome / Review Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['campaign', 'Campaign', 'text', 'e.g. PMAX ITA'],
              ['metric_before', 'Metric Before', 'text', 'e.g. CPL €33'],
              ['expected_outcome', 'Expected Outcome', 'text', 'What did you expect?'],
              ['review_date', 'Review Date', 'date', ''],
            ].map(([field, label, type, placeholder]) => (
              <div key={field}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type={type} value={(editForm as any)[field]} placeholder={placeholder}
                  onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          {editError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{editError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={handleSaveEdit} disabled={editSaving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {editSaving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => { setEditing(false); setEditError(null) }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Campaign Snapshot — 7 days before decision */}
      {(decision.platform === 'Meta' || decision.platform === 'Google') && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Campaign Snapshot
            </h2>
            <div className="flex items-center gap-3">
              {snapshot && (
                <button
                  onClick={() => setShowFunnel(v => !v)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition ${showFunnel ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {showFunnel ? '▾ Hide funnel' : '▸ BR / Meeting Done'}
                </button>
              )}
              <span className="text-xs text-gray-400">
                7 days before · {decision.platform} · {decision.country}
              </span>
            </div>
          </div>

          {snapshotLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              Fetching from Edusogno DB…
            </div>
          )}
          {snapshotError && <p className="text-sm text-red-600">{snapshotError}</p>}

          {snapshot && !snapshotLoading && (
            <div className="space-y-3">
              {!snapshot.data_mature && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <p className="text-xs text-amber-700">⚠️ Data from less than 14 days ago — may not be fully mature.</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-400 uppercase py-2 pr-4">Campaign</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase py-2 px-3">Spend</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase py-2 px-3">Leads</th>
                      <th className="text-right text-xs font-semibold text-gray-400 uppercase py-2 px-3">CPL</th>
                      {showFunnel && <>
                        <th className="text-right text-xs font-semibold text-indigo-400 uppercase py-2 px-3">BR%</th>
                        <th className="text-right text-xs font-semibold text-indigo-400 uppercase py-2 pl-3">Mtg Done%</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.campaigns.map((c, i) => (
                      <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 pr-4 text-gray-800 font-medium max-w-[200px] truncate" title={c.name}>
                          {c.name}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700">
                          €{c.spend.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700">{c.leads}</td>
                        <td className="py-2 px-3 text-right font-semibold text-blue-700">
                          {c.cpl !== null ? `€${c.cpl.toFixed(2)}` : '—'}
                        </td>
                        {showFunnel && <>
                          <td className="py-2 px-3 text-right text-indigo-600 font-medium">
                            {c.booking_rate !== null ? `${c.booking_rate}%` : '—'}
                          </td>
                          <td className="py-2 pl-3 text-right text-indigo-600 font-medium">
                            {c.meeting_done_pct !== null ? `${c.meeting_done_pct}%` : '—'}
                          </td>
                        </>}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
                      <td className="py-2 pr-4 text-gray-700">Total</td>
                      <td className="py-2 px-3 text-right text-gray-900">
                        €{snapshot.totals.spend.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-900">{snapshot.totals.leads}</td>
                      <td className="py-2 px-3 text-right text-blue-800">
                        {snapshot.totals.cpl !== null ? `€${snapshot.totals.cpl.toFixed(2)}` : '—'}
                      </td>
                      {showFunnel && <>
                        <td className="py-2 px-3 text-right text-indigo-700">
                          {snapshot.totals.booking_rate !== null ? `${snapshot.totals.booking_rate}%` : '—'}
                        </td>
                        <td className="py-2 pl-3 text-right text-indigo-700">
                          {snapshot.totals.meeting_done_pct !== null ? `${snapshot.totals.meeting_done_pct}%` : '—'}
                        </td>
                      </>}
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-gray-400">
                {snapshot.date_from} → {snapshot.date_to} · {decision.platform} · {decision.country}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Review Section — editable if Pending Review */}
      {isPendingReview && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Review
          </h2>

          <div className="space-y-4">
            {/* Verdict */}
            <div>
              <label htmlFor="verdict" className="block text-sm font-medium text-gray-700 mb-1">
                Verdict
              </label>
              <select
                id="verdict"
                name="verdict"
                value={reviewForm.verdict}
                onChange={handleReviewChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select verdict…</option>
                {VERDICTS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Result */}
            <div>
              <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-1">
                Result
              </label>
              <textarea
                id="result"
                name="result"
                value={reviewForm.result}
                onChange={handleReviewChange}
                placeholder="What actually happened?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            {/* Learning */}
            <div>
              <label htmlFor="learning" className="block text-sm font-medium text-gray-700 mb-1">
                Learning
              </label>
              <textarea
                id="learning"
                name="learning"
                value={reviewForm.learning}
                onChange={handleReviewChange}
                placeholder="What did this teach us?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>

            {/* Metric After */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Metric After
              </label>
              <input
                type="text"
                placeholder="e.g. CPL €28, CAC €320"
                value={reviewForm.metric_after || ''}
                onChange={(e) => setReviewForm({ ...reviewForm, metric_after: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Playbook Worthy */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="playbook_worthy"
                name="playbook_worthy"
                checked={reviewForm.playbook_worthy}
                onChange={handleReviewChange}
                className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="playbook_worthy" className="text-sm text-gray-700 font-medium">
                Playbook worthy — add to our rules
              </label>
            </div>

            {/* Review error */}
            {reviewError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{reviewError}</p>
              </div>
            )}

            {/* Save Review Button */}
            <div className="pt-1">
              <button
                onClick={handleSaveReview}
                disabled={submitting}
                className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {submitting ? 'Saving…' : 'Save Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Section — read-only if already reviewed */}
      {isReviewed && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Review
          </h2>
          <div className="space-y-4">
            {decision.verdict && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Verdict
                </p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getVerdictClass(decision.verdict)}`}
                >
                  {decision.verdict}
                </span>
              </div>
            )}
            <Field label="Result" value={decision.result} />
            <Field label="Learning" value={decision.learning} />
            {decision.playbook_worthy && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800 font-medium">
                  Marked as playbook worthy
                </p>
              </div>
            )}
            {decision.metric_before && decision.metric_after && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Metrics Comparison</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Before</p>
                    <p className="font-semibold text-gray-800">{decision.metric_before}</p>
                  </div>
                  <div className="text-gray-300 self-center">→</div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">After</p>
                    <p className="font-semibold text-gray-800">{decision.metric_after}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1">
        <span>Created: {formatDate(decision.created_at)}</span>
        <span>Updated: {formatDate(decision.updated_at)}</span>
        {decision.created_by && <span>By: {decision.created_by}</span>}
      </div>

      {/* Edit History */}
      {decision.edit_history && JSON.parse(decision.edit_history).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Edit History ({JSON.parse(decision.edit_history).length} edits)</p>
          <div className="space-y-1">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {JSON.parse(decision.edit_history).map((entry: any, i: number) => (
              <p key={i} className="text-xs text-gray-400">• Edited on {new Date(entry.timestamp).toLocaleString()}</p>
            ))}
          </div>
        </div>
      )}

      {/* Delete — only visible when authenticated */}
      {authenticated && (
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete Decision'}
          </button>
        </div>
      )}
    </div>
  )
}
