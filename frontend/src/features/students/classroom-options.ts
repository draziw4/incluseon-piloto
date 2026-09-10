export const schoolGradeOptions = [
  "Maternal I",
  "Maternal II",
  "Infantil IV",
  "Infantil V",
  "1º ano do Ensino Fundamental",
  "2º ano do Ensino Fundamental",
  "3º ano do Ensino Fundamental",
  "4º ano do Ensino Fundamental",
  "5º ano do Ensino Fundamental",
  "6º ano do Ensino Fundamental",
  "7º ano do Ensino Fundamental",
  "8º ano do Ensino Fundamental",
  "9º ano do Ensino Fundamental",
  "1º ano do Ensino Médio",
  "2º ano do Ensino Médio",
  "3º ano do Ensino Médio",
  "EJA — Ensino Fundamental",
  "EJA — Ensino Médio",
] as const

export const classGroupOptions = ["A", "B", "C", "D", "E", "F", "Única"] as const

export function formatStudentClassroom(
  schoolGrade?: string | null,
  classGroup?: string | null,
) {
  if (schoolGrade && classGroup) return `${schoolGrade} — Turma ${classGroup}`
  if (schoolGrade) return schoolGrade
  if (classGroup) return `Turma ${classGroup}`
  return "Turma não informada"
}
