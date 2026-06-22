import unittest

from pydantic import ValidationError

from schemas.student_goal import StudentGoalCreate, StudentGoalUpdate
from routes.student_goals import normalize_goal_state
from models.models import StudentGoalStatus


class StudentGoalSchemaTests(unittest.TestCase):
    def test_rejects_progress_outside_zero_to_one_hundred(self):
        with self.assertRaises(ValidationError):
            StudentGoalCreate(title="Comunicação", area="Comunicação", progress=101)

    def test_partial_update_only_contains_sent_fields(self):
        update = StudentGoalUpdate(progress=50)

        self.assertEqual(update.model_dump(exclude_unset=True), {"progress": 50})

    def test_one_hundred_percent_marks_goal_as_completed(self):
        normalized = normalize_goal_state({"progress": 100})

        self.assertEqual(normalized["status"], StudentGoalStatus.COMPLETED)


if __name__ == "__main__":
    unittest.main()
