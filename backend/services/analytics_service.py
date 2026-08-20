from collections import Counter, defaultdict
from datetime import date, timedelta
from statistics import mean

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.models import BehaviorRecord, StudentGoal, StudentProgressReport


INDICATOR_FIELDS = {
    "participation": "participation_level",
    "autonomy": "autonomy_level",
    "communication": "communication_level",
    "regulation": "regulation_level",
    "support_need": "support_level",
}

REPORT_TEXT_FIELDS = {
    "participation_engagement": "Participação e engajamento",
    "progress": "Avanços observados",
    "difficulties": "Dificuldades e barreiras",
    "strategies_and_resources": "Estratégias e recursos",
    "communication_socialization": "Comunicação e socialização",
    "autonomy_functionality": "Autonomia e funcionalidade",
    "next_steps": "Próximos passos",
}


async def get_behavior_analytics_for_student(
    db: AsyncSession,
    student_id: int,
):
    behavior_result = await db.execute(
        select(BehaviorRecord)
        .where(BehaviorRecord.student_id == student_id)
        .order_by(BehaviorRecord.created_at.asc())
    )
    report_result = await db.execute(
        select(StudentProgressReport)
        .where(StudentProgressReport.student_id == student_id)
        .order_by(
            StudentProgressReport.period_end.asc(),
            StudentProgressReport.created_at.asc(),
        )
    )
    goal_result = await db.execute(
        select(StudentGoal)
        .where(StudentGoal.student_id == student_id)
        .order_by(StudentGoal.created_at.asc())
    )

    return build_student_analytics(
        behavior_records=behavior_result.scalars().all(),
        progress_reports=report_result.scalars().all(),
        goals=goal_result.scalars().all(),
    )


def build_student_analytics(
    behavior_records,
    progress_reports,
    goals,
    reference_date: date | None = None,
):
    today = reference_date or date.today()
    behavior_metrics = _build_behavior_metrics(behavior_records)
    report_metrics = _build_report_metrics(progress_reports, today)
    indicator_averages = _build_indicator_averages(progress_reports)
    indicator_evolution = _build_indicator_evolution(progress_reports)
    field_coverage = _build_field_coverage(progress_reports)
    goal_metrics = _build_goal_metrics(goals, today)
    insights = _build_insights(
        progress_reports,
        report_metrics,
        indicator_averages,
        goal_metrics,
    )

    return {
        **behavior_metrics,
        "report_analytics": report_metrics,
        "indicator_averages": indicator_averages,
        "indicator_evolution": indicator_evolution,
        "field_coverage": field_coverage,
        "goal_analytics": goal_metrics,
        "insights": insights,
    }


def _build_behavior_metrics(records):
    intensities = [record.intensity for record in records if record.intensity is not None]
    environments = [record.environment for record in records if record.environment]
    effective_strategies = [
        record.strategy_used
        for record in records
        if record.strategy_effective is True and record.strategy_used
    ]
    strategy_map = defaultdict(lambda: {"effective": 0, "not_effective": 0})

    for record in records:
        if not record.strategy_used:
            continue
        key = "effective" if record.strategy_effective is True else "not_effective"
        strategy_map[record.strategy_used][key] += 1

    return {
        "records_count": len(records),
        "average_intensity": round(mean(intensities), 2) if intensities else None,
        "most_common_environment": Counter(environments).most_common(1)[0][0] if environments else None,
        "most_effective_strategy": Counter(effective_strategies).most_common(1)[0][0] if effective_strategies else None,
        "intensity_evolution": [
            {"date": record.created_at.strftime("%d/%m"), "intensity": record.intensity}
            for record in records
            if record.intensity is not None and record.created_at is not None
        ],
        "environment_distribution": [
            {"environment": environment, "total": total}
            for environment, total in Counter(environments).most_common()
        ],
        "strategy_effectiveness": [
            {
                "strategy": strategy,
                "effective": values["effective"],
                "not_effective": values["not_effective"],
            }
            for strategy, values in strategy_map.items()
        ],
        "behavior_frequency": [
            {"behavior": behavior, "total": total}
            for behavior, total in Counter(
                record.behavior for record in records if record.behavior
            ).most_common()
        ],
        "antecedent_frequency": [
            {"antecedent": antecedent, "total": total}
            for antecedent, total in Counter(
                record.antecedent for record in records if record.antecedent
            ).most_common()
        ],
    }


def _build_report_metrics(reports, today: date):
    support_reports = [report for report in reports if report.professional_type == "support"]
    reviewed_reports = [
        report
        for report in support_reports
        if report.review_status in {"reviewed", "needs_adjustment"}
    ]
    structured_reports = [report for report in reports if _has_any_indicator(report)]
    populated_indicators = sum(
        getattr(report, field_name, None) is not None
        for report in reports
        for field_name in INDICATOR_FIELDS.values()
    )
    possible_indicators = len(reports) * len(INDICATOR_FIELDS)
    latest_date = max((report.period_end for report in reports), default=None)

    return {
        "total_reports": len(reports),
        "reports_last_30_days": sum(
            today - timedelta(days=29) <= report.period_end <= today for report in reports
        ),
        "aee_reports": sum(report.professional_type == "aee" for report in reports),
        "support_reports": len(support_reports),
        "pending_reviews": sum(report.review_status == "pending" for report in support_reports),
        "reviewed_reports": len(reviewed_reports),
        "needs_adjustment_reviews": sum(
            report.review_status == "needs_adjustment" for report in support_reports
        ),
        "review_completion_rate": (
            round(len(reviewed_reports) / len(support_reports) * 100, 1)
            if support_reports
            else None
        ),
        "structured_reports": len(structured_reports),
        "indicator_completion_rate": (
            round(populated_indicators / possible_indicators * 100, 1)
            if possible_indicators
            else 0.0
        ),
        "latest_report_date": latest_date.isoformat() if latest_date else None,
        "days_since_latest_report": max((today - latest_date).days, 0) if latest_date else None,
    }


def _build_indicator_averages(reports):
    return {
        public_name: _average(
            getattr(report, model_name, None)
            for report in reports
        )
        for public_name, model_name in INDICATOR_FIELDS.items()
    }


def _build_indicator_evolution(reports):
    grouped = defaultdict(lambda: {name: [] for name in INDICATOR_FIELDS})
    source_counts = Counter()

    for report in reports:
        values = {
            public_name: getattr(report, model_name, None)
            for public_name, model_name in INDICATOR_FIELDS.items()
        }
        if not any(value is not None for value in values.values()):
            continue
        date_key = report.period_end
        source_counts[date_key] += 1
        for name, value in values.items():
            if value is not None:
                grouped[date_key][name].append(value)

    return [
        {
            "date": date_key.strftime("%d/%m"),
            **{
                name: round(mean(values), 2) if values else None
                for name, values in grouped[date_key].items()
            },
            "source_count": source_counts[date_key],
        }
        for date_key in sorted(grouped)
    ]


def _build_field_coverage(reports):
    total = len(reports)
    coverage = []
    for field_name, label in REPORT_TEXT_FIELDS.items():
        completed = sum(_has_text(getattr(report, field_name, None)) for report in reports)
        coverage.append({
            "field": field_name,
            "label": label,
            "completed": completed,
            "total": total,
            "percentage": round(completed / total * 100, 1) if total else 0.0,
        })
    return coverage


def _build_goal_metrics(goals, today: date):
    statuses = Counter(_enum_value(goal.status) for goal in goals)
    overdue = sum(
        goal.target_date is not None
        and goal.target_date < today
        and _enum_value(goal.status) != "completed"
        for goal in goals
    )
    progress_values = [goal.progress for goal in goals if goal.progress is not None]
    return {
        "total_goals": len(goals),
        "not_started": statuses["not_started"],
        "in_progress": statuses["in_progress"],
        "completed": statuses["completed"],
        "paused": statuses["paused"],
        "overdue": overdue,
        "average_progress": round(mean(progress_values), 1) if progress_values else None,
    }


def _build_insights(reports, report_metrics, averages, goal_metrics):
    insights = []

    if report_metrics["total_reports"] == 0:
        insights.append({
            "kind": "attention",
            "title": "Base de acompanhamento ainda vazia",
            "description": "Não há relatórios AEE ou PA disponíveis para compor a análise integrada.",
            "recommendation": "Registre o primeiro acompanhamento com os indicadores de 1 a 5 para iniciar a linha de base.",
        })
    else:
        if report_metrics["indicator_completion_rate"] < 60:
            insights.append({
                "kind": "info",
                "title": "Indicadores precisam de maior cobertura",
                "description": f"{report_metrics['indicator_completion_rate']:.0f}% dos indicadores estruturados foram preenchidos nos relatórios.",
                "recommendation": "Nos próximos registros, preencha participação, autonomia, comunicação, autorregulação e necessidade de apoio.",
            })

        if report_metrics["pending_reviews"]:
            insights.append({
                "kind": "attention",
                "title": "Relatórios do PA aguardando avaliação",
                "description": f"Há {report_metrics['pending_reviews']} relatório(s) diário(s) pendente(s) de análise pelo AEE.",
                "recommendation": "Revise os registros pendentes e devolva orientações objetivas ao profissional de apoio.",
            })

        if report_metrics["needs_adjustment_reviews"]:
            insights.append({
                "kind": "attention",
                "title": "Alinhamento com o PA necessário",
                "description": f"{report_metrics['needs_adjustment_reviews']} relatório(s) recebeu(ram) indicação de ajuste.",
                "recommendation": "Retome as devolutivas registradas e verifique se o próximo relato apresenta evidências mais objetivas.",
            })

        if report_metrics["aee_reports"] and report_metrics["support_reports"]:
            insights.append({
                "kind": "positive",
                "title": "Acompanhamento compartilhado ativo",
                "description": "A análise reúne registros próprios do AEE e observações cotidianas do profissional de apoio.",
                "recommendation": "Compare os dois pontos de vista nas reuniões de acompanhamento e nas revisões do PAEE.",
            })

        days_since_latest = report_metrics["days_since_latest_report"]
        if days_since_latest is not None and days_since_latest > 7:
            insights.append({
                "kind": "attention",
                "title": "Acompanhamento sem registro recente",
                "description": f"O último relatório disponível tem {days_since_latest} dia(s).",
                "recommendation": "Atualize o acompanhamento para evitar decisões baseadas em informações desatualizadas.",
            })

    trend_insight = _build_trend_insight(reports, averages)
    if trend_insight:
        insights.append(trend_insight)

    if goal_metrics["overdue"]:
        insights.append({
            "kind": "attention",
            "title": "Metas do PAEE exigem revisão",
            "description": f"Há {goal_metrics['overdue']} meta(s) com prazo vencido e ainda não concluída(s).",
            "recommendation": "Registre evidências, ajuste o prazo ou redefina a estratégia conforme a evolução observada.",
        })
    elif goal_metrics["total_goals"] == 0:
        insights.append({
            "kind": "info",
            "title": "Análise ainda não vinculada a metas",
            "description": "Não há metas do PAEE cadastradas para relacionar os achados do acompanhamento.",
            "recommendation": "Transforme as principais barreiras e potencialidades em objetivos mensuráveis do PAEE.",
        })

    if not insights:
        insights.append({
            "kind": "positive",
            "title": "Acompanhamento atualizado",
            "description": "Os registros recentes não apresentam pendências automáticas de revisão, prazo ou cobertura.",
            "recommendation": "Mantenha a periodicidade e confronte os indicadores com evidências pedagógicas nas revisões do PAEE.",
        })

    return insights[:6]


def _build_trend_insight(reports, averages):
    autonomy_values = [
        report.autonomy_level
        for report in sorted(reports, key=lambda item: item.period_end)
        if getattr(report, "autonomy_level", None) is not None
    ]
    support_values = [
        report.support_level
        for report in sorted(reports, key=lambda item: item.period_end)
        if getattr(report, "support_level", None) is not None
    ]

    if len(autonomy_values) >= 4:
        midpoint = len(autonomy_values) // 2
        change = mean(autonomy_values[midpoint:]) - mean(autonomy_values[:midpoint])
        if change >= 0.5:
            return {
                "kind": "positive",
                "title": "Tendência de avanço na autonomia",
                "description": f"Os registros mais recentes indicam aumento médio de {change:.1f} ponto na autonomia.",
                "recommendation": "Mantenha as estratégias associadas ao avanço e registre evidências funcionais nos próximos períodos.",
            }

    if len(support_values) >= 4:
        midpoint = len(support_values) // 2
        change = mean(support_values[midpoint:]) - mean(support_values[:midpoint])
        if change >= 0.5:
            return {
                "kind": "attention",
                "title": "Necessidade de apoio em elevação",
                "description": f"Os registros mais recentes indicam aumento médio de {change:.1f} ponto na necessidade de apoio.",
                "recommendation": "Revise barreiras, contextos e estratégias antes de ampliar ou manter o apoio funcional.",
            }

    if averages["autonomy"] is not None or averages["support_need"] is not None:
        return {
            "kind": "info",
            "title": "Linha de base funcional em formação",
            "description": "Já existem indicadores de autonomia e apoio, mas ainda são necessários mais registros para confirmar uma tendência.",
            "recommendation": "Mantenha a mesma escala nos próximos relatórios para permitir comparação entre períodos.",
        }
    return None


def _has_any_indicator(report) -> bool:
    return any(
        getattr(report, field_name, None) is not None
        for field_name in INDICATOR_FIELDS.values()
    )


def _average(values):
    populated = [value for value in values if value is not None]
    return round(mean(populated), 2) if populated else None


def _has_text(value) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _enum_value(value):
    return getattr(value, "value", value)
