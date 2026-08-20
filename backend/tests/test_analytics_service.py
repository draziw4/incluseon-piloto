import unittest
from datetime import date, datetime
from types import SimpleNamespace

from schemas.analytics import StudentBehaviorAnalytics
from services.analytics_service import build_student_analytics


def report(
    professional_type,
    period_end,
    review_status=None,
    level=3,
):
    return SimpleNamespace(
        professional_type=professional_type,
        period_end=period_end,
        created_at=datetime.combine(period_end, datetime.min.time()),
        review_status=review_status,
        participation_level=level,
        autonomy_level=level,
        communication_level=level,
        regulation_level=level,
        support_level=level,
        participation_engagement="Participou com mediação visual.",
        progress="Iniciou a atividade com menos ajuda.",
        difficulties="Ruído intenso dificultou a permanência.",
        strategies_and_resources="Rotina visual e pausa breve.",
        communication_socialization="Usou imagens para solicitar ajuda.",
        autonomy_functionality="Organizou dois materiais sem ajuda.",
        next_steps="Manter a rotina visual.",
    )


class AnalyticsServiceTests(unittest.TestCase):
    def test_reports_and_goals_generate_metrics_without_behavior_records(self):
        reports = [
            report("support", date(2026, 8, 20), review_status="pending", level=2),
            report("aee", date(2026, 8, 21), level=4),
        ]
        goals = [
            SimpleNamespace(
                status="in_progress",
                target_date=date(2026, 8, 10),
                progress=50,
            )
        ]

        analytics = build_student_analytics(
            behavior_records=[],
            progress_reports=reports,
            goals=goals,
            reference_date=date(2026, 8, 22),
        )
        validated = StudentBehaviorAnalytics.model_validate(analytics)

        self.assertEqual(validated.records_count, 0)
        self.assertEqual(validated.report_analytics.total_reports, 2)
        self.assertEqual(validated.report_analytics.reports_last_30_days, 2)
        self.assertEqual(validated.report_analytics.pending_reviews, 1)
        self.assertEqual(validated.report_analytics.indicator_completion_rate, 100)
        self.assertEqual(validated.indicator_averages.autonomy, 3)
        self.assertEqual(validated.goal_analytics.overdue, 1)
        self.assertTrue(any(item.title == "Relatórios do PA aguardando avaliação" for item in validated.insights))
        self.assertTrue(any(item.title == "Acompanhamento compartilhado ativo" for item in validated.insights))

    def test_empty_sources_still_return_actionable_analysis(self):
        analytics = build_student_analytics(
            behavior_records=[],
            progress_reports=[],
            goals=[],
            reference_date=date(2026, 8, 22),
        )
        validated = StudentBehaviorAnalytics.model_validate(analytics)

        self.assertEqual(validated.report_analytics.total_reports, 0)
        self.assertEqual(validated.field_coverage[0].percentage, 0)
        self.assertTrue(any(item.title == "Base de acompanhamento ainda vazia" for item in validated.insights))

    def test_repeated_indicators_identify_autonomy_trend(self):
        reports = [
            report("aee", date(2026, 8, 1), level=1),
            report("aee", date(2026, 8, 8), level=2),
            report("aee", date(2026, 8, 15), level=4),
            report("aee", date(2026, 8, 22), level=5),
        ]
        analytics = build_student_analytics(
            behavior_records=[],
            progress_reports=reports,
            goals=[],
            reference_date=date(2026, 8, 22),
        )

        self.assertTrue(any(item["title"] == "Tendência de avanço na autonomia" for item in analytics["insights"]))


if __name__ == "__main__":
    unittest.main()
