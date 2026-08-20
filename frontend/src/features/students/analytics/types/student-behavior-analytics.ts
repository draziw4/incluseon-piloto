export type IntensityEvolutionItem = {
  date: string
  intensity: number
}

export type EnvironmentDistributionItem = {
  environment: string
  total: number
}

export type StrategyEffectivenessItem = {
  strategy: string
  effective: number
  not_effective: number
}

export type BehaviorFrequencyItem = {
  behavior: string
  total: number
}

export type AntecedentFrequencyItem = {
  antecedent: string
  total: number
}

export type ReportAnalytics = {
  total_reports: number
  reports_last_30_days: number
  aee_reports: number
  support_reports: number
  pending_reviews: number
  reviewed_reports: number
  needs_adjustment_reviews: number
  review_completion_rate: number | null
  structured_reports: number
  indicator_completion_rate: number
  latest_report_date: string | null
  days_since_latest_report: number | null
}

export type IndicatorAverages = {
  participation: number | null
  autonomy: number | null
  communication: number | null
  regulation: number | null
  support_need: number | null
}

export type IndicatorEvolutionItem = IndicatorAverages & {
  date: string
  source_count: number
}

export type FieldCoverageItem = {
  field: string
  label: string
  completed: number
  total: number
  percentage: number
}

export type GoalAnalytics = {
  total_goals: number
  not_started: number
  in_progress: number
  completed: number
  paused: number
  overdue: number
  average_progress: number | null
}

export type AnalyticsInsight = {
  kind: "positive" | "attention" | "info"
  title: string
  description: string
  recommendation: string
}

export type StudentBehaviorAnalytics = {
  records_count: number
  average_intensity: number | null
  most_common_environment: string | null
  most_effective_strategy: string | null

  intensity_evolution: IntensityEvolutionItem[]
  environment_distribution: EnvironmentDistributionItem[]
  strategy_effectiveness: StrategyEffectivenessItem[]
  behavior_frequency: BehaviorFrequencyItem[]
  antecedent_frequency: AntecedentFrequencyItem[]
  report_analytics: ReportAnalytics
  indicator_averages: IndicatorAverages
  indicator_evolution: IndicatorEvolutionItem[]
  field_coverage: FieldCoverageItem[]
  goal_analytics: GoalAnalytics
  insights: AnalyticsInsight[]
}
