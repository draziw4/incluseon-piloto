import unittest

from pydantic import ValidationError

from access_policy import (
    ToolAccess,
    normalize_student_permissions,
    role_has_tool,
    tools_for_role,
)
from models.models import AccountStatus, UserRole
from schemas.user import AdminUserReview, UserResponse


class AccessPolicyTests(unittest.TestCase):
    def test_support_professional_only_has_operational_support_tools(self):
        self.assertTrue(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.BEHAVIOR_RECORDS))
        self.assertTrue(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.BEHAVIOR_ENTRY))
        self.assertTrue(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.APPOINTMENTS))
        self.assertFalse(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.ASSESSMENTS))
        self.assertFalse(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.AI_CASE_STUDIES))
        self.assertFalse(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.TEAM_MANAGEMENT))
        self.assertFalse(role_has_tool(UserRole.SUPPORT_PROFESSIONAL, ToolAccess.STUDENT_MANAGEMENT))

    def test_aee_can_manage_students_and_monitor_team_data_without_entering_aba(self):
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.ASSESSMENTS))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.GOALS))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.REPORTS))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.BEHAVIOR_RECORDS))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.ANALYTICS))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.TIMELINE))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.STUDENT_MANAGEMENT))
        self.assertTrue(role_has_tool(UserRole.AEE, ToolAccess.TEAM_MANAGEMENT))
        self.assertFalse(role_has_tool(UserRole.AEE, ToolAccess.BEHAVIOR_ENTRY))

    def test_student_permissions_are_clamped_by_global_profile(self):
        requested = {
            "can_view": True,
            "can_register_aba": True,
            "can_create_assessment": True,
            "can_create_pei": True,
            "can_generate_ai_report": True,
            "can_view_reports": True,
        }
        normalized = normalize_student_permissions(
            UserRole.SUPPORT_PROFESSIONAL,
            requested,
        )
        self.assertTrue(normalized["can_view"])
        self.assertTrue(normalized["can_register_aba"])
        self.assertFalse(normalized["can_create_assessment"])
        self.assertFalse(normalized["can_create_pei"])
        self.assertFalse(normalized["can_generate_ai_report"])
        self.assertFalse(normalized["can_view_reports"])

    def test_aee_cannot_receive_aba_entry_permission_from_student_link(self):
        normalized = normalize_student_permissions(
            UserRole.AEE,
            {"can_view": True, "can_register_aba": True},
        )
        self.assertTrue(normalized["can_view"])
        self.assertFalse(normalized["can_register_aba"])

    def test_admin_is_the_only_professional_review_profile(self):
        for role in UserRole:
            self.assertEqual(
                role_has_tool(role, ToolAccess.ADMIN_PROFESSIONALS),
                role == UserRole.ADMIN,
            )

    def test_response_exposes_tools_derived_from_role(self):
        response = UserResponse(
            id=10,
            name="Profissional",
            email="professional@example.com",
            role=UserRole.SUPPORT_PROFESSIONAL,
            auth_provider="password",
            account_status=AccountStatus.ACTIVE,
        )
        self.assertEqual(response.allowed_tools, tools_for_role(UserRole.SUPPORT_PROFESSIONAL))

    def test_admin_review_cannot_grant_admin_role(self):
        with self.assertRaises(ValidationError):
            AdminUserReview(
                status=AccountStatus.ACTIVE,
                role=UserRole.ADMIN,
            )


if __name__ == "__main__":
    unittest.main()
