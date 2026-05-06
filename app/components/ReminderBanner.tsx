'use client'

import { useEffect, useState } from 'react'

function getReminderMessage(): string | null {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes

  const morning = { start: 8 * 60, end: 8 * 60 + 30 }    // 8:00-8:30
  const afternoon = { start: 15 * 60, end: 15 * 60 + 30 } // 15:00-15:30

  if (totalMinutes >= morning.start && totalMinutes <= morning.end) {
    return '📝 Morning check-in — what decisions did you make yesterday or this morning?'
  }
  if (totalMinutes >= afternoon.start && totalMinutes <= afternoon.end) {
    return '⏰ Afternoon check-in — time to log today\'s paid media decisions.'
  }
  return null
}

function getTodayKey(suffix: string) {
  const today = new Date().toISOString().split('T')[0]
  return `reminder_dismissed_${suffix}_${today}`
}

export default function ReminderBanner() {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours()
    const suffix = hours < 12 ? 'morning' : 'afternoon'
    const key = getTodayKey(suffix)

    const dismissed = localStorage.getItem(key)
    if (dismissed) return

    const msg = getReminderMessage()
    if (msg) setMessage(msg)
  }, [])

  const dismiss = () => {
    const now = new Date()
    const hours = now.getHours()
    const suffix = hours < 12 ? 'morning' : 'afternoon'
    localStorage.setItem(getTodayKey(suffix), '1')
    setMessage(null)
  }

  if (!message) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-amber-800 text-sm font-medium">{message}</p>
      <div className="flex gap-2 shrink-0">
        <a
          href="/new"
          className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-medium hover:bg-amber-700 transition"
        >
          + Log decision
        </a>
        <button
          onClick={dismiss}
          className="px-3 py-1 border border-amber-300 text-amber-700 rounded text-xs hover:bg-amber-100 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
