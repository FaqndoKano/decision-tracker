'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += char }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  }).filter(row => Object.values(row).some(v => v !== ''))
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const rows = parseCSV(text)
      setPreview(rows.slice(0, 5)) // show first 5 rows as preview
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      setFile(null)
      setPreview([])
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Import CSV</h2>
        <p className="text-sm text-gray-500 mt-1">Bulk import decisions from a spreadsheet</p>
      </div>

      {/* Format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-blue-800 mb-2">Expected CSV columns:</p>
        <code className="text-blue-700 text-xs">date, platform, country, campaign, category, summary, why, action_taken, metric_before</code>
        <p className="text-blue-600 mt-2 text-xs">Flexible — also accepts: Budget change, Justification, CPL, Campaign, etc.</p>
      </div>

      {/* File upload */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" id="csv-input" />
        <label htmlFor="csv-input" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600 font-medium">Click to select CSV file</p>
          <p className="text-gray-400 text-sm mt-1">or drag and drop</p>
        </label>
        {file && <p className="mt-3 text-sm text-green-700 font-medium">✓ {file.name}</p>}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <p className="font-semibold text-gray-800 text-sm">Preview (first 5 rows)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(preview[0]).map(h => (
                    <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="px-3 py-2 text-gray-700 max-w-[150px] truncate">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">✓ Import complete</p>
          <p className="text-green-700 text-sm mt-1">{result.imported} imported · {result.skipped} skipped</p>
          <Link href="/" className="mt-2 inline-block text-blue-600 text-sm hover:underline">View decisions →</Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {file && !result && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {importing ? 'Importing...' : `Import decisions`}
        </button>
      )}
    </div>
  )
}
