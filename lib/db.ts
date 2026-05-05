import fs from 'fs'
import path from 'path'
import { Decision } from '@/types/decision'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'decisions.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readDb(): Decision[] {
  ensureDataDir()
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]), 'utf-8')
    return []
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(raw) as Decision[]
  } catch {
    return []
  }
}

function writeDb(decisions: Decision[]): void {
  ensureDataDir()
  fs.writeFileSync(DB_FILE, JSON.stringify(decisions, null, 2), 'utf-8')
}

export function getAllDecisions(): Decision[] {
  return readDb().sort((a, b) => b.date.localeCompare(a.date))
}

export function getDecisionById(id: string): Decision | undefined {
  return readDb().find((d) => d.id === id)
}

export function createDecision(decision: Decision): Decision {
  const decisions = readDb()
  decisions.push(decision)
  writeDb(decisions)
  return decision
}

export function updateDecision(id: string, updates: Partial<Decision>): Decision | null {
  const decisions = readDb()
  const index = decisions.findIndex((d) => d.id === id)
  if (index === -1) return null
  decisions[index] = {
    ...decisions[index],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  writeDb(decisions)
  return decisions[index]
}
