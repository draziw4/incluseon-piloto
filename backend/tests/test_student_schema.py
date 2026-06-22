import unittest
from datetime import date, timedelta

from pydantic import ValidationError

from schemas.student import StudentCreate, StudentUpdate


class StudentSchemaTests(unittest.TestCase):
    def test_partial_update_only_contains_fields_sent_by_client(self):
        update = StudentUpdate(name="Maria Silva")

        self.assertEqual(
            update.model_dump(exclude_unset=True),
            {"name": "Maria Silva"}
        )

    def test_rejects_age_outside_supported_range(self):
        with self.assertRaises(ValidationError):
            StudentUpdate(age=0)

        with self.assertRaises(ValidationError):
            StudentUpdate(age=121)

    def test_rejects_future_birth_date(self):
        with self.assertRaises(ValidationError):
            StudentCreate(
                name="Maria Silva",
                age=10,
                birth_date=date.today() + timedelta(days=1)
            )


if __name__ == "__main__":
    unittest.main()
