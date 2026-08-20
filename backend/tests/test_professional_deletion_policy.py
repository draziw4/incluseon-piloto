import unittest

from models.models import (
    AIReport,
    AIReportRevision,
    Appointment,
    Assessment,
    PilotFeedback,
    StudentGoal,
    User,
    UserRole,
)
from routes.users import replacement_roles


class ProfessionalDeletionPolicyTests(unittest.TestCase):
    def test_only_professionals_who_manage_students_can_receive_ownership(self):
        self.assertEqual(
            set(replacement_roles()),
            {UserRole.PSYCHOLOGIST, UserRole.SUPERVISOR, UserRole.AEE},
        )

    def test_deleting_user_does_not_cascade_to_students_or_appointments(self):
        self.assertNotIn("delete", User.students.property.cascade)
        self.assertNotIn("delete", User.appointments.property.cascade)

    def test_historical_author_references_allow_set_null(self):
        columns = (
            StudentGoal.created_by_id.property.columns[0],
            Assessment.psychologist_id.property.columns[0],
            AIReport.created_by_id.property.columns[0],
            AIReport.last_edited_by_id.property.columns[0],
            AIReportRevision.edited_by_id.property.columns[0],
            Appointment.professional_id.property.columns[0],
            PilotFeedback.created_by_id.property.columns[0],
        )

        for column in columns:
            with self.subTest(column=str(column)):
                self.assertTrue(column.nullable)
                self.assertEqual(next(iter(column.foreign_keys)).ondelete, "SET NULL")


if __name__ == "__main__":
    unittest.main()
