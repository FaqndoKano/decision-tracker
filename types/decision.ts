export type Platform = 'Meta' | 'Google' | 'Both'
export type Country = 'IT' | 'ES' | 'DE' | 'FR' | 'Global'
export type Category = 'Budget' | 'Campaign' | 'Creative' | 'Audience' | 'Experiment' | 'Tracking' | 'Strategy'
export type Verdict = 'Worked' | 'Did Not Work' | 'Neutral' | 'No Data'
export type Status = 'Pending Review' | 'Reviewed' | 'Archived'

export interface Decision {
  id: string
  date: string // ISO date
  platform: Platform
  country: Country
  campaign?: string
  category: Category
  summary: string
  why: string
  metric_before?: string
  metric_after?: string
  action_taken: string
  expected_outcome?: string
  review_date?: string

  // Review fields
  result?: string
  verdict?: Verdict
  learning?: string
  playbook_worthy: boolean

  // Auto
  status: Status
  created_by: string
  created_at: string
  updated_at: string
  edit_history?: string
}

export type DecisionInsert = Omit<Decision, 'id' | 'status' | 'created_by' | 'created_at' | 'updated_at'>
export type DecisionReview = Pick<Decision, 'id' | 'result' | 'verdict' | 'learning' | 'playbook_worthy'>
