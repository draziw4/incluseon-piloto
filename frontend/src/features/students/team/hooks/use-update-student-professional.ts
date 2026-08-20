import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query"

import {
  updateStudentProfessional
} from "../api/update-student-professional"

export function useUpdateStudentProfessional(
  studentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateStudentProfessional,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "student-professionals",
          studentId
        ]
      })

      queryClient.invalidateQueries({
        queryKey: ["notifications"]
      })
    }
  })
}
