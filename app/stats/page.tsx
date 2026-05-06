'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Decision } from '@/types/decision'

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) {
  return (
    <div className="space-y-2">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 shrink-0 text-right">{label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full rounded-full flex items-center pl-2 text-xs text-white font-medium transition-all ${color}`}
              style={{ width: maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%', minWidth: value > 0 ? '2rem' : '0' }}
            >
              {value > 0 ? value : ''}
            </div>
          </div>
          <span className="text-xs text-gray-400 w-6">{value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Decision Timeline ────────────────────────────────────────────────────────

const META_COLOR  = '#10b981'  // emerald-500
const GOOGLE_COLOR = '#3b82f6' // blue-500

function DecisionTimeline({ decisions, rangeDays }: { decisions: Decision[]; rangeDays: number }) {
  const router = useRouter()
  const [hovered, setHovered] = useState<string | null>(null)

  const today     = new Date()
  today.setHours(23, 59, 59, 999)
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - rangeDays)
  startDate.setHours(0, 0, 0, 0)

  const totalMs = today.getTime() - startDate.getTime()

  const inRange = decisions.filter(d => {
    if (!d.date) return false
    const t = new Date(d.date).getTime()
    return t >= startDate.getTime() && t <= today.getTime()
  })

  // SVG coordinate system
  const W  = 900
  const H  = 160
  const PX = 20  // horizontal padding
  const midY = 80

  const dateToX = (dateStr: string) => {
    const ms = new Date(dateStr).getTime() - startDate.getTime()
    return PX + (ms / totalMs) * (W - PX * 2)
  }

  // X-axis tick marks
  const tickInterval = rangeDays <= 14 ? 2 : rangeDays <= 30 ? 7 : rangeDays <= 60 ? 14 : 30
  const ticks: { x: number; label: string }[] = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const dateStr = cursor.toISOString().split('T')[0]
    ticks.push({
      x: dateToX(dateStr),
      label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
    cursor.setDate(cursor.getDate() + tickInterval)
  }

  // Group decisions by date to offset dots that land on same day
  const byDate = new Map<string, Decision[]>()
  for (const d of inRange) {
    const key = d.date ?? ''
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(d)
  }

  // Build dot positions
  const dots: { d: Decision; cx: number; cy: number; color: string }[] = []
  for (const [, group] of byDate) {
    const cx = dateToX(group[0].date!)
    // If multiple decisions on same day, space them vertically
    group.forEach((dec, idx) => {
      const isMeta   = dec.platform === 'Meta'
      const isGoogle = dec.platform === 'Google'
      // Meta above the line, Google below, Both at center
      const baseY = isMeta ? midY - 24 : isGoogle ? midY + 24 : midY
      const cy = baseY - (idx > 0 ? idx * 18 : 0)
      const color = isMeta ? META_COLOR : isGoogle ? GOOGLE_COLOR : '#6b7280'
      dots.push({ d: dec, cx, cy, color })
    })
  }

  const hoveredDot = hovered ? dots.find(dot => dot.d.id === hovered) : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ userSelect: 'none' }}
      >
        {/* Background grid lines */}
        {ticks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x} y1={30}
            x2={tick.x} y2={midY - 6}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}

        {/* Center axis line */}
        <line
          x1={PX} y1={midY}
          x2={W - PX} y2={midY}
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* "Meta" label (above line) */}
        <text x={PX + 4} y={midY - 28} fontSize="9" fill={META_COLOR} fontWeight="600" opacity="0.7">META</text>
        {/* "Google" label (below line) */}
        <text x={PX + 4} y={midY + 36} fontSize="9" fill={GOOGLE_COLOR} fontWeight="600" opacity="0.7">GOOGLE</text>

        {/* Tick marks + labels */}
        {ticks.map((tick, i) => (
          <g key={i}>
            <line x1={tick.x} y1={midY - 4} x2={tick.x} y2={midY + 4} stroke="#d1d5db" strokeWidth="1" />
            <text x={tick.x} y={H - 4} textAnchor="middle" fontSize="10" fill="#9ca3af">{tick.label}</text>
          </g>
        ))}

        {/* Stem lines from axis to dots */}
        {dots.map(({ d, cx, cy }) => (
          <line
            key={`stem-${d.id}`}
            x1={cx} y1={midY}
            x2={cx} y2={cy}
            stroke="#e5e7eb"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        ))}

        {/* Decision dots */}
        {dots.map(({ d, cx, cy, color }) => (
          <g
            key={d.id}
            onClick={() => router.push(`/decisions/${d.id}`)}
            onMouseEnter={() => setHovered(d.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Pulse ring on hover */}
            {hovered === d.id && (
              <circle cx={cx} cy={cy} r="14" fill={color} opacity="0.15" />
            )}
            <circle
              cx={cx} cy={cy} r="8"
              fill={color}
              opacity={hovered && hovered !== d.id ? 0.4 : 0.92}
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}

        {/* Tooltip for hovered dot */}
        {hoveredDot && (() => {
          const { d, cx, cy } = hoveredDot
          const ttW = 180
          const ttH = 46
          // Keep tooltip inside SVG bounds
          const ttX = Math.min(Math.max(cx - ttW / 2, 4), W - ttW - 4)
          const ttY = cy < midY
            ? cy - ttH - 10   // above the dot (Meta)
            : cy + 14          // below the dot (Google)
          return (
            <g pointerEvents="none">
              <rect x={ttX} y={ttY} width={ttW} height={ttH} rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" filter="url(#shadow)" />
              <text x={ttX + 10} y={ttY + 16} fontSize="10" fontWeight="600" fill="#111827" style={{ maxWidth: `${ttW - 20}px` }}>
                {d.summary.length > 28 ? d.summary.slice(0, 28) + '…' : d.summary}
              </text>
              <text x={ttX + 10} y={ttY + 32} fontSize="9" fill="#6b7280">
                {d.platform} · {d.country} · {d.date}
              </text>
            </g>
          )
        })()}

        {/* Drop-shadow filter */}
        <defs>
          <filter id="shadow" x="-10%" y="-10%" width="120%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>
      </svg>

      {/* Empty state */}
      {inRange.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-400">No Meta/Google decisions in this period</p>
        </div>
      )}
    </div>
  )
}

// ─── Stats Page ───────────────────────────────────────────────────────────────

export default function StatsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [timelineRange, setTimelineRange] = useState(30)

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then((data: Decision[]) => { setDecisions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>

  const total    = decisions.length
  const reviewed = decisions.filter(d => d.status === 'Reviewed').length
  const pending  = decisions.filter(d => d.status === 'Pending Review').length
  const worked   = decisions.filter(d => d.verdict === 'Worked').length
  const winRate  = reviewed > 0 ? Math.round((worked / reviewed) * 100) : 0

  // By platform
  const platforms = ['Meta', 'Google', 'Both']
  const byPlatform = platforms.map(p => ({ label: p, value: decisions.filter(d => d.platform === p).length }))

  // By category
  const categories = ['Budget', 'Campaign', 'Creative', 'Audience', 'Experiment', 'Tracking', 'Strategy']
  const byCategory = categories.map(c => ({ label: c, value: decisions.filter(d => d.category === c).length })).filter(d => d.value > 0)

  // By country
  const countries = ['IT', 'ES', 'DE', 'FR', 'Global']
  const byCountry = countries.map(c => ({ label: c, value: decisions.filter(d => d.country === c).length })).filter(d => d.value > 0)

  // By verdict
  const verdicts = ['Worked', 'Did Not Work', 'Neutral', 'No Data']
  const byVerdict = verdicts.map(v => ({ label: v, value: decisions.filter(d => d.verdict === v).length })).filter(d => d.value > 0)

  // Decisions over time (last 8 weeks)
  const weeks: { label: string; value: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - i * 7 - 7)
    const end = new Date()
    end.setDate(end.getDate() - i * 7)
    const startStr = start.toISOString().split('T')[0]
    const endStr   = end.toISOString().split('T')[0]
    const count    = decisions.filter(d => d.date >= startStr && d.date < endStr).length
    weeks.push({ label: `W-${i}`, value: count })
  }

  const RANGE_OPTIONS = [
    { label: '14d', days: 14 },
    { label: '30d', days: 30 },
    { label: '60d', days: 60 },
    { label: '90d', days: 90 },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Stats</h2>
        <p className="text-sm text-gray-500 mt-1">Overview of your decision-making</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Decisions', value: total, color: 'text-blue-600' },
          { label: 'Reviewed', value: reviewed, color: 'text-green-600' },
          { label: 'Pending Review', value: pending, color: 'text-yellow-600' },
          { label: 'Win Rate', value: `${winRate}%`, color: 'text-purple-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Decision Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Decision Timeline</h3>
            <p className="text-xs text-gray-400 mt-0.5">Click any dot to open the decision</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="flex items-center gap-3 mr-4">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: META_COLOR }} />
                Meta
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: GOOGLE_COLOR }} />
                Google
              </span>
            </div>
            {/* Range buttons */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {RANGE_OPTIONS.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setTimelineRange(days)}
                  className={`px-3 py-1 text-xs font-medium transition ${
                    timelineRange === days
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DecisionTimeline decisions={decisions} rangeDays={timelineRange} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By Platform */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">By Platform</h3>
          <BarChart data={byPlatform} maxValue={Math.max(...byPlatform.map(d => d.value), 1)} color="bg-blue-500" />
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">By Category</h3>
          <BarChart data={byCategory} maxValue={Math.max(...byCategory.map(d => d.value), 1)} color="bg-indigo-500" />
        </div>

        {/* By Country */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">By Country</h3>
          <BarChart data={byCountry} maxValue={Math.max(...byCountry.map(d => d.value), 1)} color="bg-purple-500" />
        </div>

        {/* By Verdict */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">By Verdict</h3>
          <BarChart data={byVerdict} maxValue={Math.max(...byVerdict.map(d => d.value), 1)} color="bg-green-500" />
        </div>
      </div>

      {/* Over time */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Decisions over time (last 8 weeks)</h3>
        <BarChart data={weeks} maxValue={Math.max(...weeks.map(d => d.value), 1)} color="bg-blue-400" />
      </div>

      {/* Playbook worthy */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">Playbook Rules Generated</h3>
            <p className="text-sm text-gray-500 mt-1">{decisions.filter(d => d.playbook_worthy).length} decisions marked as playbook worthy</p>
          </div>
          <Link href="/playbook" className="text-blue-600 text-sm hover:underline">View Playbook &rarr;</Link>
        </div>
      </div>
    </div>
  )
}
