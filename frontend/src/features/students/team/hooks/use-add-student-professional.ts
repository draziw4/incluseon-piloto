import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query"

import {
  addStudentProfessional
} from "../api/add-student-professional"

export function useAddStudentProfessional(
  studentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addStudentProfessional,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "student-professionals",
          studentId
        ]
      })

      queryClient.invalidateQueries({
        queryKey: ["students"]
      })

      queryClient.invalidateQueries({
        queryKey: ["notifications"]
      })
    }
  })
}
