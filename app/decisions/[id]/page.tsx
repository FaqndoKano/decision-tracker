'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Decision, Verdict, Status } from '@/types/decision'

const VERDICTS: Verdict[] = ['Worked', 'Did Not Work', 'Neutral', 'No Data']

interface ReviewForm {
  verdict: Verdict | ''
  result: string
  learning: string
  playbook_worthy: boolean
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
  const id = params.id as string

  const [decision, setDecision] = useState<Decision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    verdict: '',
    result: '',
    learning: '',
    playbook_worthy: false,
  })

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
        setReviewForm({
          verdict: data.verdict ?? '',
          result: data.result ?? '',
          learning: data.learning ?? '',
          playbook_worthy: data.playbook_worthy ?? false,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load decision')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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
      {/* Back + Status */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Feed
        </Link>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(decision.status)}`}>
          {decision.status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{decision.summary}</h1>
        {decision.why && (
          <p className="mt-2 text-gray-600 text-sm leading-relaxed">{decision.why}</p>
        )}
      </div>

      {/* Decision Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Decision Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <Field label="Date" value={formatDate(decision.date)} />
          <Field label="Platform" value={decision.platform} />
          <Field label="Country" value={decision.country} />
          <Field label="Category" value={decision.category} />
          {decision.campaign && <Field label="Campaign" value={decision.campaign} />}
          <Field label="Review Date" value={formatDate(decision.review_date)} />
          {decision.metric_before && (
            <div className="sm:col-span-2">
              <Field label="Metric Before" value={decision.metric_before} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Field label="Action Taken" value={decision.action_taken} />
          </div>
          {decision.expected_outcome && (
            <div className="sm:col-span-2">
              <Field label="Expected Outcome" value={decision.expected_outcome} />
            </div>
          )}
        </div>
      </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1">
        <span>Created: {formatDate(decision.created_at)}</span>
        <span>Updated: {formatDate(decision.updated_at)}</span>
        {decision.created_by && <span>By: {decision.created_by}</span>}
      </div>
    </div>
  )
}
