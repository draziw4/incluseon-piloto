import { formatStudentClassroom } from "../classroom-options"
import type { Student } from "../types/student"
import type { StudentFolder, StudentFolderView } from "./types"


export function groupStudentsIntoFolders(
  students: Student[],
  customFolders: StudentFolder[],
): StudentFolderView[] {
  const folders = new Map<string, StudentFolderView>()

  for (const customFolder of customFolders) {
    folders.set(`custom:${customFolder.id}`, {
      key: `custom:${customFolder.id}`,
      label: customFolder.name,
      description: "Pasta personalizada",
      students: [],
      isCustom: true,
      folderId: customFolder.id,
      canManage: customFolder.can_manage,
    })
  }

  for (const student of students) {
    const customKey = student.folder_id ? `custom:${student.folder_id}` : null
    const customFolder = customKey ? folders.get(customKey) : undefined
    if (customFolder) {
      customFolder.students.push(student)
      continue
    }

    const schoolName = student.school_name?.trim() || "Escola não informada"
    const schoolGrade = student.school_grade?.trim() || null
    const classGroup = student.class_group?.trim() || null
    const automaticKey = [schoolName, schoolGrade || "", classGroup || ""]
      .map((value) => value.toLocaleLowerCase("pt-BR"))
      .join("::")
    const key = `automatic:${automaticKey}`
    const folder = folders.get(key) ?? {
      key,
      label: formatStudentClassroom(schoolGrade, classGroup),
      description: schoolName,
      students: [],
      isCustom: false,
      canManage: false,
    }

    folder.students.push(student)
    folders.set(key, folder)
  }

  return [...folders.values()].sort((first, second) => {
    if (first.isCustom !== second.isCustom) return first.isCustom ? -1 : 1
    return first.label.localeCompare(second.label, "pt-BR", { numeric: true })
  })
}
