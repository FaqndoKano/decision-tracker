'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Decision, Category } from '@/types/decision'

const CATEGORY_ORDER: Category[] = ['Budget', 'Campaign', 'Creative', 'Audience', 'Experiment', 'Tracking', 'Strategy']

export default function PlaybookPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then((data: Decision[]) => {
        const playbook = data.filter(d => d.playbook_worthy && d.learning)
        setDecisions(playbook)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const grouped = CATEGORY_ORDER.reduce((acc, cat) => {
    const items = decisions.filter(d => d.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Decision[]>)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Playbook</h2>
        <p className="text-sm text-gray-500 mt-1">Rules and learnings extracted from reviewed decisions</p>
      </div>

      {loading && <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>}

      {!loading && decisions.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-2">No playbook rules yet.</p>
          <p className="text-sm text-gray-400">Mark decisions as &quot;Playbook worthy&quot; when reviewing them.</p>
          <Link href="/reviews" className="mt-4 inline-block text-blue-600 text-sm hover:underline">Go to Reviews →</Link>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full inline-block" />
            {category}
            <span className="text-sm font-normal text-gray-400">({items.length} rules)</span>
          </h3>
          <div className="space-y-3">
            {items.map((d, i) => (
              <div key={d.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-gray-400 font-bold text-sm shrink-0">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{d.learning}</p>
                    <p className="text-xs text-gray-500">From: <Link href={`/decisions/${d.id}`} className="text-blue-600 hover:underline">{d.summary}</Link> · {d.date} · {d.platform} · {d.country}</p>
                    {d.verdict && (
                      <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        d.verdict === 'Worked' ? 'bg-green-100 text-green-800' :
                        d.verdict === 'Did Not Work' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                      }`}>{d.verdict}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
