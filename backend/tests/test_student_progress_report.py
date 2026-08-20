import unittest
from datetime import date, datetime

from pydantic import ValidationError

from models.models import StudentProgressReport
from schemas.student_progress_report import (
    StudentProgressReportCreate,
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
        ):
            self.assertIn(field, columns)


if __name__ == "__main__":
    unittest.main()
