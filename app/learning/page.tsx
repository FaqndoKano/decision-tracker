'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Decision } from '@/types/decision'

function getVerdictBadgeClass(verdict?: string) {
  switch (verdict) {
    case 'Worked': return 'bg-green-100 text-green-800'
    case 'Did Not Work': return 'bg-red-100 text-red-800'
    case 'Neutral': return 'bg-gray-100 text-gray-700'
    case 'No Data': return 'bg-yellow-100 text-yellow-800'
    default: return 'bg-gray-100 text-gray-500'
  }
}

export default function LearningPage() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/decisions')
      .then(r => r.json())
      .then((data: Decision[]) => {
        const withLearning = data.filter(d => d.learning && d.learning.trim() !== '')
        setDecisions(withLearning)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Learnings</h2>
          <p className="text-sm text-gray-500 mt-1">What we've learned from past decisions</p>
        </div>
        <span className="text-sm text-gray-400">{decisions.length} learnings</span>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && decisions.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-2">No learnings yet.</p>
          <p className="text-sm text-gray-400">Review decisions and add learnings to see them here.</p>
          <Link href="/reviews" className="mt-4 inline-block text-blue-600 text-sm hover:underline">
            Go to Reviews →
          </Link>
        </div>
      )}

      {!loading && decisions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24 hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20 hidden md:table-cell">Platform</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20 hidden md:table-cell">Country</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Decision</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Learning</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-28">Verdict</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 w-20 hidden sm:table-cell">Playbook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {decisions.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap hidden sm:table-cell">{d.date}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">{d.platform}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">{d.country}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/decisions/${d.id}`} className="font-medium text-gray-900 hover:text-blue-600 transition">
                        {d.summary}
                      </Link>
                      {d.campaign && <p className="text-xs text-gray-400 mt-0.5">{d.campaign}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.learning}</td>
                    <td className="px-4 py-3">
                      {d.verdict ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getVerdictBadgeClass(d.verdict)}`}>
                          {d.verdict}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {d.playbook_worthy ? (
                        <span className="text-green-600 font-bold text-base" title="Playbook worthy">✓</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
