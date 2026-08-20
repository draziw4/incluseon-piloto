import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query"

import {
  removeStudentProfessional
} from "../api/remove-student-professional"

export function useRemoveStudentProfessional(
  studentId: string
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeStudentProfessional,

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
