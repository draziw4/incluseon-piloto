import unittest

from pydantic import ValidationError

from schemas.student_folder import StudentFolderCreate, StudentFolderUpdate


class StudentFolderSchemaTests(unittest.TestCase):
    def test_normalizes_folder_name(self):
        folder = StudentFolderCreate(name="  Atendimento de terça-feira  ")

        self.assertEqual(folder.name, "Atendimento de terça-feira")

    def test_rejects_blank_folder_name(self):
        with self.assertRaises(ValidationError):
            StudentFolderCreate(name="   ")

    def test_applies_same_validation_when_renaming(self):
        folder = StudentFolderUpdate(name="  Turma A  ")

        self.assertEqual(folder.name, "Turma A")


if __name__ == "__main__":
    unittest.main()
