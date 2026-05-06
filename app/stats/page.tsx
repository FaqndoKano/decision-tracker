'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Decision } from '@/types/decision'

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

export default function StatsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then((data: Decision[]) => { setDecisions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>

  const total = decisions.length
  const reviewed = decisions.filter(d => d.status === 'Reviewed').length
  const pending = decisions.filter(d => d.status === 'Pending Review').length
  const worked = decisions.filter(d => d.verdict === 'Worked').length
  const winRate = reviewed > 0 ? Math.round((worked / reviewed) * 100) : 0

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
    const endStr = end.toISOString().split('T')[0]
    const count = decisions.filter(d => d.date >= startStr && d.date < endStr).length
    weeks.push({ label: `W-${i}`, value: count })
  }

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
