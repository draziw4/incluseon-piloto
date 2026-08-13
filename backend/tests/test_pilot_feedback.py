import unittest

from pydantic import ValidationError

from schemas.pilot_feedback import PilotFeedbackCreate, PilotFeedbackUpdate


class PilotFeedbackSchemaTests(unittest.TestCase):
    def test_accepts_feedback_without_personal_attachment(self):
        feedback = PilotFeedbackCreate(
            page_path="/students/1?tab=goals",
            category="improvement",
            title="Organizar metas por período",
            details="Preciso comparar as metas previstas e concluídas por trimestre.",
            expected_result="Exibir filtros de período acima da lista.",
        )
        self.assertEqual(feedback.category, "improvement")

    def test_rejects_unknown_category(self):
        with self.assertRaises(ValidationError):
            PilotFeedbackCreate(
                page_path="/",
                category="incident",
                title="Categoria inválida",
                details="Descrição suficientemente longa para o teste.",
            )

    def test_rejects_unknown_workflow_status(self):
        with self.assertRaises(ValidationError):
            PilotFeedbackUpdate(status="closed", admin_note="Teste")


if __name__ == "__main__":
    unittest.main()
