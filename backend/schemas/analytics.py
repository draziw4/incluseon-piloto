from typing import Literal

from pydantic import BaseModel, Field


class IntensityEvolutionItem(BaseModel):
    date: str
    intensity: int


class EnvironmentDistributionItem(BaseModel):
    environment: str
    total: int


class StrategyEffectivenessItem(BaseModel):
    strategy: str
    effective: int
    not_effective: int


class BehaviorFrequencyItem(BaseModel):
    behavior: str
    total: int


class AntecedentFrequencyItem(BaseModel):
    antecedent: str
    total: int


class ReportAnalytics(BaseModel):
    total_reports: int
    reports_last_30_days: int
    aee_reports: int
    support_reports: int
    pending_reviews: int
    reviewed_reports: int
    needs_adjustment_reviews: int
    review_completion_rate: float | None
    structured_reports: int
    indicator_completion_rate: float
    latest_report_date: str | None
    days_since_latest_report: int | None


class IndicatorAverages(BaseModel):
    participation: float | None
    autonomy: float | None
    communication: float | None
    regulation: float | None
    support_need: float | None


class IndicatorEvolutionItem(BaseModel):
    date: str
    participation: float | None = None
    autonomy: float | None = None
    communication: float | None = None
    regulation: float | None = None
    support_need: float | None = None
    source_count: int


class FieldCoverageItem(BaseModel):
    field: str
    label: str
    completed: int
    total: int
    percentage: float


class GoalAnalytics(BaseModel):
    total_goals: int
    not_started: int
    in_progress: int
    completed: int
    paused: int
    overdue: int
    average_progress: float | None


class AnalyticsInsight(BaseModel):
    kind: Literal["positive", "attention", "info"]
    title: str
    description: str
    recommendation: str


class StudentBehaviorAnalytics(BaseModel):
    records_count: int
    average_intensity: float | None
    most_common_environment: str | None
    most_effective_strategy: str | None
    intensity_evolution: list[IntensityEvolutionItem] = Field(default_factory=list)
    environment_distribution: list[EnvironmentDistributionItem] = Field(default_factory=list)
    strategy_effectiveness: list[StrategyEffectivenessItem] = Field(default_factory=list)
    behavior_frequency: list[BehaviorFrequencyItem] = Field(default_factory=list)
    antecedent_frequency: list[AntecedentFrequencyItem] = Field(default_factory=list)
    report_analytics: ReportAnalytics
    indicator_averages: IndicatorAverages
    indicator_evolution: list[IndicatorEvolutionItem] = Field(default_factory=list)
    field_coverage: list[FieldCoverageItem] = Field(default_factory=list)
    goal_analytics: GoalAnalytics
    insights: list[AnalyticsInsight] = Field(default_factory=list)
