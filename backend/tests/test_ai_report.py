import os
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from pydantic import ValidationError

from schemas.ai_report import AIReportResponse, AIReportUpdate
from services.pdf.pdf_generator import generate_case_study_pdf


class AIReportTests(unittest.TestCase):
    def test_rejects_report_content_that_is_too_short(self):
        with self.assertRaises(ValidationError):
            AIReportUpdate(content="Texto curto", expected_revision=1)

    def test_response_exposes_availability_without_internal_path(self):
        response = AIReportResponse(
            id=1,
            student_id=2,
            report_type="case_study",
            content="x" * 100,
            pdf_path="generated_reports/private.pdf",
            model_used="model",
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            revision=1
        ).model_dump()

        self.assertTrue(response["pdf_available"])
        self.assertNotIn("pdf_path", response)

    def test_pdf_generation_accepts_special_characters(self):
        previous_directory = Path.cwd()

        with tempfile.TemporaryDirectory() as directory:
            try:
                os.chdir(directory)
                path = generate_case_study_pdf(
                    student_name="João & Família",
                    report_content=("Observação <importante> & comunicação. " * 10),
                    task_id="special-characters"
                )
                pdf = Path(path)

                self.assertTrue(pdf.is_file())
                self.assertEqual(pdf.read_bytes()[:4], b"%PDF")
            finally:
                os.chdir(previous_directory)


if __name__ == "__main__":
    unittest.main()
