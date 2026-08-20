import unittest
from datetime import date, datetime
from types import SimpleNamespace

from services.ai.prompt_builder import build_case_study_prompt
from services.assessment_instruments import (
    REQUIRED_INSTRUMENT_TYPES,
    format_instrument,
    latest_instruments_by_type,
    missing_required_instruments,
)


def make_instrument(instrument_type: str, **answers):
    return SimpleNamespace(
        assessment_type=instrument_type,
        assessment_data=answers,
        created_at=datetime(2026, 8, 20),
        psychologist=SimpleNamespace(name="Profissional AEE"),
    )


class AssessmentInstrumentTests(unittest.TestCase):
    def test_requires_exactly_the_three_case_study_instruments(self):
        assessments = [
            make_instrument("parent_interview", student_routine="Rotina estável"),
            make_instrument("student_assessment", attention_strengths="Mantém foco com apoio visual"),
        ]

        self.assertEqual(missing_required_instruments(assessments), ["school_interview"])

    def test_uses_the_first_occurrence_as_the_latest_instrument(self):
        newest = make_instrument("parent_interview", student_routine="Registro mais recente")
        oldest = make_instrument("parent_interview", student_routine="Registro anterior")

        selected = latest_instruments_by_type([newest, oldest])

        self.assertIs(selected["parent_interview"], newest)

    def test_formats_dynamic_answers_with_human_labels(self):
        instrument = make_instrument(
            "student_assessment",
            special_education_target=["tea", "deficiencia_intelectual"],
            attention_strengths="Responde bem a pistas visuais",
        )

        formatted = format_instrument(instrument)

        self.assertIn("Público-alvo da Educação Especial", formatted)
        self.assertIn("Transtorno do Espectro Autista", formatted)
        self.assertIn("Atenção - habilidades observadas", formatted)

    def test_prompt_uses_required_structure_and_excludes_downstream_sources(self):
        assessments = [make_instrument(item, observation="Dado do instrumental") for item in REQUIRED_INSTRUMENT_TYPES]
        student = SimpleNamespace(
            name="Estudante Teste",
            age=10,
            birth_date=date(2016, 1, 2),
            school_name="Escola Teste",
            guardian_name="Responsável",
            diagnosis=None,
            communication_notes=None,
            sensory_notes=None,
            general_observations=None,
        )

        prompt = build_case_study_prompt(
            student=student,
            assessments=assessments,
            behavior_records=[SimpleNamespace()],
            goals=[SimpleNamespace()],
            appointments=[SimpleNamespace()],
            analytics={"records_count": 999},
        )

        for section in range(1, 9):
            self.assertIn(f"5.4.{section}", prompt)
        self.assertNotIn("Total de registros", prompt)
        self.assertNotIn("Metas e itens", prompt)
        self.assertIn("O estudo de caso subsidia o PAEE", prompt)
        self.assertIn("o PEI é elaborado pelo professor da sala regular", prompt)


if __name__ == "__main__":
    unittest.main()
