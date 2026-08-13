export type BehaviorRecord = {
  id: number
  student_id: number
  created_by_id?: number | null

  antecedent: string
  behavior: string
  consequence: string

  strategy_used?: string | null
  strategy_effective?: boolean | null

  environment?: string | null
  people_present?: string | null

  intensity?: number | null
  duration_minutes?: number | null

  function_hypothesis?: string | null
  observations?: string | null

  created_at: string
}
