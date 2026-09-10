import unittest
from datetime import date, datetime, timedelta

from pydantic import ValidationError

from schemas.student import StudentCreate, StudentResponse, StudentUpdate, calculate_age


class StudentSchemaTests(unittest.TestCase):
    def test_partial_update_only_contains_fields_sent_by_client(self):
        update = StudentUpdate(name="Maria Silva")

        self.assertEqual(
            update.model_dump(exclude_unset=True),
            {"name": "Maria Silva"}
        )

    def test_calculates_current_age_from_birth_date(self):
        self.assertEqual(calculate_age(date(2016, 9, 9), date(2026, 9, 9)), 10)
        self.assertEqual(calculate_age(date(2016, 9, 10), date(2026, 9, 9)), 9)

    def test_response_replaces_stale_stored_age(self):
        birth_date = date.today().replace(year=date.today().year - 10)
        response = StudentResponse.model_validate({
            "id": 1,
            "name": "Maria Silva",
            "age": None,
            "birth_date": birth_date,
            "takes_medication": False,
            "psychologist_id": 2,
            "created_at": datetime.now(),
        })
        self.assertEqual(response.age, calculate_age(birth_date))

    def test_requires_medication_names_when_usage_is_marked(self):
        with self.assertRaises(ValidationError):
            StudentCreate(
                name="Maria Silva",
                birth_date=date(2016, 1, 1),
                takes_medication=True,
                medications="",
            )

    def test_rejects_future_birth_date(self):
        with self.assertRaises(ValidationError):
            StudentCreate(
                name="Maria Silva",
                birth_date=date.today() + timedelta(days=1)
            )

    def test_accepts_and_normalizes_school_classroom(self):
        student = StudentCreate(
            name="Maria Silva",
            birth_date=date(2016, 1, 1),
            school_grade=" 1º ano do Ensino Médio ",
            class_group=" A ",
        )

        self.assertEqual(student.school_grade, "1º ano do Ensino Médio")
        self.assertEqual(student.class_group, "A")

    def test_empty_school_classroom_values_become_none(self):
        update = StudentUpdate(school_grade="  ", class_group="")

        self.assertEqual(
            update.model_dump(exclude_unset=True),
            {"school_grade": None, "class_group": None},
        )


if __name__ == "__main__":
    unittest.main()
