import tempfile
import unittest
from pathlib import Path

from services.pdf.pdf_generator import delete_generated_report


class PdfCleanupTests(unittest.TestCase):
    def test_deletes_pdf_inside_reports_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            reports_directory = Path(directory)
            report = reports_directory / "report.pdf"
            report.write_bytes(b"test")

            deleted = delete_generated_report(
                str(report),
                reports_directory
            )

            self.assertTrue(deleted)
            self.assertFalse(report.exists())

    def test_refuses_to_delete_file_outside_reports_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            reports_directory = root / "reports"
            reports_directory.mkdir()
            external_file = root / "private.pdf"
            external_file.write_bytes(b"keep")

            deleted = delete_generated_report(
                str(external_file),
                reports_directory
            )

            self.assertFalse(deleted)
            self.assertTrue(external_file.exists())


if __name__ == "__main__":
    unittest.main()
