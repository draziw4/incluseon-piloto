import unittest
from datetime import date, datetime
from types import SimpleNamespace

from fastapi import HTTPException
from pydantic import ValidationError

from models.models import StudentProgressReport, UserRole
from routes.student_progress_reports import resolve_professional_type, reset_support_report_review
from schemas.student_progress_report import (
    StudentProgressReportCreate,
    StudentProgressReportReview,
    StudentProgressReportResponse,
)


def valid_payload(**changes):
    payload = {
        "report_type": "daily",
        "period_start": date(2026, 8, 20),
        "period_end": date(2026, 8, 20),
        "title": "Acompanhamento diário",
        "summary": "O estudante participou das atividades propostas com mediação visual.",
    }
    payload.update(changes)
    return payload


class StudentProgressReportTests(unittest.TestCase):
    def test_daily_report_requires_a_single_reference_date(self):
        with self.assertRaises(ValidationError):
            StudentProgressReportCreate.model_validate(
                valid_payload(period_end=date(2026, 8, 21))
            )

    def test_weekly_report_accepts_at_most_seven_days(self):
        report = StudentProgressReportCreate.model_validate(
            valid_payload(
                report_type="weekly",
                period_start=date(2026, 8, 17),
                period_end=date(2026, 8, 23),
            )
        )
        self.assertEqual(report.report_type, "weekly")

        with self.assertRaises(ValidationError):
            StudentProgressReportCreate.model_validate(
                valid_payload(
                    report_type="weekly",
                    period_start=date(2026, 8, 16),
                    period_end=date(2026, 8, 23),
                )
            )

    def test_response_preserves_author_snapshot_when_user_is_removed(self):
        response = StudentProgressReportResponse(
            id=1,
            student_id=2,
            created_by_id=None,
            created_by_name="Profissional AEE",
            created_by_role="aee",
            professional_type="aee",
            review_status=None,
            review_notes=None,
            reviewed_by_id=None,
            reviewed_by_name=None,
            reviewed_by_role=None,
            reviewed_at=None,
            created_at=datetime(2026, 8, 20, 10, 0),
            updated_at=datetime(2026, 8, 20, 10, 0),
            **valid_payload(),
        )
        self.assertIsNone(response.created_by_id)
        self.assertEqual(response.created_by_name, "Profissional AEE")

    def test_model_has_detailed_follow_up_fields(self):
        columns = StudentProgressReport.__table__.columns
        for field in (
            "summary",
            "activities",
            "participation_engagement",
            "progress",
            "difficulties",
            "strategies_and_resources",
            "communication_socialization",
            "autonomy_functionality",
            "family_school_notes",
            "next_steps",
            "professional_type",
            "review_status",
            "review_notes",
            "reviewed_by_id",
            "reviewed_at",
        ):
            self.assertIn(field, columns)

    def test_support_report_is_always_daily(self):
        report = StudentProgressReportCreate.model_validate(
            valid_payload(professional_type="support")
        )
        self.assertEqual(report.professional_type, "support")

        with self.assertRaises(ValidationError):
            StudentProgressReportCreate.model_validate(
                valid_payload(
                    professional_type="support",
                    report_type="weekly",
                    period_start=date(2026, 8, 17),
                    period_end=date(2026, 8, 23),
                )
            )

    def test_professional_type_is_derived_from_user_role(self):
        aee = SimpleNamespace(role=UserRole.AEE)
        support = SimpleNamespace(role=UserRole.SUPPORT_PROFESSIONAL)
        self.assertEqual(resolve_professional_type(aee, None), "aee")
        self.assertEqual(resolve_professional_type(support, None), "support")

        with self.assertRaises(HTTPException):
            resolve_professional_type(support, "aee")

    def test_aee_review_requires_status_and_written_opinion(self):
        review = StudentProgressReportReview.model_validate(
            {"review_status": "reviewed", "review_notes": "Relatório avaliado e coerente."}
        )
        self.assertEqual(review.review_status, "reviewed")

        with self.assertRaises(ValidationError):
            StudentProgressReportReview.model_validate(
                {"review_status": "pending", "review_notes": ""}
            )

    def test_support_edit_resets_previous_aee_review(self):
        report = StudentProgressReport(
            professional_type="support",
            review_status="reviewed",
            review_notes="Parecer anterior",
            reviewed_by_id=10,
            reviewed_by_name="Profissional AEE",
            reviewed_by_role="aee",
            reviewed_at=datetime(2026, 8, 21, 9, 0),
        )
        reset_support_report_review(report)
        self.assertEqual(report.review_status, "pending")
        self.assertIsNone(report.review_notes)
        self.assertIsNone(report.reviewed_by_id)
        self.assertIsNone(report.reviewed_at)


if __name__ == "__main__":
    unittest.main()
