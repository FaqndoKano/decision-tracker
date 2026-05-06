'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Platform, Country, Category } from '@/types/decision'

interface FormData {
  platform: Platform | ''
  country: Country | ''
  category: Category | ''
  summary: string
  why: string
  action_taken: string
  campaign: string
  metric_before: string
  expected_outcome: string
  review_date: string
}

const PLATFORMS: Platform[] = ['Meta', 'Google', 'Both']
const COUNTRIES: Country[] = ['IT', 'ES', 'DE', 'FR', 'Global']
const CATEGORIES: Category[] = [
  'Budget',
  'Campaign',
  'Creative',
  'Audience',
  'Experiment',
  'Tracking',
  'Strategy',
]

const CATEGORY_TEMPLATES: Record<Category, { summary: string; why: string; action_taken: string }> = {
  Budget: {
    summary: 'Scaled BAU Italy from €X to €Y',
    why: 'CPL was below target for 3 days',
    action_taken: 'Changed daily budget in Meta Ads Manager',
  },
  Campaign: {
    summary: 'Paused Demand Gen Shorts',
    why: 'CPB exceeded €100, low quality leads',
    action_taken: 'Set campaign status to Paused',
  },
  Creative: {
    summary: 'Retired static creative #12',
    why: 'CTR dropped below 1% for 7 days',
    action_taken: 'Turned off ad set, uploaded 3 new UGC videos',
  },
  Audience: {
    summary: 'Reduced retargeting window from 30 to 14 days',
    why: 'Audience overlap with BAU was too high',
    action_taken: 'Edited audience in Ad Set settings',
  },
  Experiment: {
    summary: 'Testing ASC+ vs manual ad sets',
    why: 'Want to understand if ASC+ improves efficiency',
    action_taken: 'Created duplicate campaign with ASC+ enabled',
  },
  Tracking: {
    summary: 'Fixed purchase event firing twice',
    why: 'Duplicate conversions inflating ROAS',
    action_taken: 'Removed duplicate pixel via GTM',
  },
  Strategy: {
    summary: 'Prioritizing Germany budget for Q2',
    why: 'DE has lowest CAC across all markets',
    action_taken: 'Reallocated 20% of IT budget to DE',
  },
}

function getDefaultReviewDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

function buildGCalUrl(summary: string, reviewDate: string): string {
  if (!reviewDate) return ''
  // Format: YYYYMMDDTHHMMSS (no dashes/colons)
  const dateStr = reviewDate.replace(/-/g, '')
  const start = `${dateStr}T090000` // 9:00am
  const end = `${dateStr}T091000`   // 9:10am (10 min block)

  const title = encodeURIComponent(`Review decision: ${summary || 'Paid media decision'}`)
  const details = encodeURIComponent('Review whether this paid media decision worked or not. Log the result in Decision Tracker.')

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
}

const EMPTY_FORM: FormData = {
  platform: '',
  country: '',
  category: '',
  summary: '',
  why: '',
  action_taken: '',
  campaign: '',
  metric_before: '',
  expected_outcome: '',
  review_date: getDefaultReviewDate(),
}

export default function NewDecision() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOptional, setShowOptional] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const category = e.target.value as Category
    const template = CATEGORY_TEMPLATES[category]
    setForm((prev) => ({
      ...prev,
      category,
      summary: template?.summary ?? prev.summary,
      why: template?.why ?? prev.why,
      action_taken: template?.action_taken ?? prev.action_taken,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.platform || !form.country || !form.category) {
      setError('Please select Platform, Country, and Category.')
      return
    }
    if (!form.summary.trim() || !form.why.trim() || !form.action_taken.trim()) {
      setError('Summary, Why, and Action Taken are required.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        date: new Date().toISOString().split('T')[0],
        platform: form.platform,
        country: form.country,
        category: form.category,
        summary: form.summary.trim(),
        why: form.why.trim(),
        action_taken: form.action_taken.trim(),
        campaign: form.campaign.trim() || null,
        metric_before: form.metric_before.trim() || null,
        expected_outcome: form.expected_outcome.trim() || null,
        review_date: form.review_date || null,
        playbook_worthy: false,
      }

      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 409) {
        const data = await res.json()
        const confirmed = window.confirm(`⚠️ Possible duplicate detected!\n\n"${data.existing?.summary}" (${data.existing?.date})\n\nDo you still want to create this decision?`)
        if (!confirmed) { setLoading(false); return }
        // Retry with force flag
        const retryRes = await fetch('/api/decisions?force=true', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!retryRes.ok) {
          const body = await retryRes.json().catch(() => ({}))
          throw new Error(body.error || `Request failed: ${retryRes.status}`)
        }
        const created = await retryRes.json()
        router.push(created?.id ? `/decisions/${created.id}` : '/')
        return
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed: ${res.status}`)
      }

      const created = await res.json()
      router.push(created?.id ? `/decisions/${created.id}` : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Feed
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">Log a Decision</h1>
        <p className="text-sm text-gray-500 mt-1">Takes less than 3 minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
        {/* Platform / Country / Category */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="platform" className={labelClass}>
              Platform <span className="text-red-500">*</span>
            </label>
            <select
              id="platform"
              name="platform"
              value={form.platform}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select…</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="country"
              name="country"
              value={form.country}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select…</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleCategoryChange}
              required
              className={inputClass}
            >
              <option value="">Select…</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="summary" className={labelClass}>
            Summary <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="summary"
            name="summary"
            value={form.summary}
            onChange={handleChange}
            placeholder="1-2 sentences describing the decision"
            required
            className={inputClass}
          />
        </div>

        {/* Why */}
        <div>
          <label htmlFor="why" className={labelClass}>
            Why <span className="text-red-500">*</span>
          </label>
          <textarea
            id="why"
            name="why"
            value={form.why}
            onChange={handleChange}
            placeholder="What triggered this decision?"
            rows={3}
            required
            className={`${inputClass} min-h-[100px]`}
          />
        </div>

        {/* Action Taken */}
        <div>
          <label htmlFor="action_taken" className={labelClass}>
            Action Taken <span className="text-red-500">*</span>
          </label>
          <textarea
            id="action_taken"
            name="action_taken"
            value={form.action_taken}
            onChange={handleChange}
            placeholder="What was actually done?"
            rows={3}
            required
            className={`${inputClass} min-h-[100px]`}
          />
        </div>

        {/* Optional Fields Toggle */}
        <button
          type="button"
          onClick={() => setShowOptional((v) => !v)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          {showOptional ? '− Hide optional fields' : '+ Add optional details'}
        </button>

        {showOptional && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label htmlFor="review_date" className={labelClass}>
                Review Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="date"
                  id="review_date"
                  name="review_date"
                  value={form.review_date}
                  onChange={handleChange}
                  className={inputClass}
                  style={{ maxWidth: '200px' }}
                />
                {form.review_date && (
                  <a
                    href={buildGCalUrl(form.summary, form.review_date)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    📅 Add to Google Calendar
                  </a>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="campaign" className={labelClass}>
                Campaign <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="campaign"
                name="campaign"
                value={form.campaign}
                onChange={handleChange}
                placeholder="Campaign name or ID"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="metric_before" className={labelClass}>
                Metric Before <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="metric_before"
                name="metric_before"
                value={form.metric_before}
                onChange={handleChange}
                placeholder="e.g. CPL: €2.50, ROAS: 1.8"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="expected_outcome" className={labelClass}>
                Expected Outcome <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="expected_outcome"
                name="expected_outcome"
                value={form.expected_outcome}
                onChange={handleChange}
                placeholder="What do you expect to happen?"
                rows={2}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Saving…' : 'Save Decision'}
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-center text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
