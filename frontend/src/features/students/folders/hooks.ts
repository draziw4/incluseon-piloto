import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  createStudentFolder,
  deleteStudentFolder,
  getStudentFolders,
  renameStudentFolder,
} from "./api"


export function useStudentFolders(enabled = true) {
  return useQuery({
    queryKey: ["student-folders"],
    queryFn: getStudentFolders,
    enabled,
  })
}

export function useStudentFolderMutations() {
  const queryClient = useQueryClient()

  async function refreshFoldersAndStudents() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["student-folders"] }),
      queryClient.invalidateQueries({ queryKey: ["students"] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: createStudentFolder,
    onSuccess: refreshFoldersAndStudents,
  })
  const renameMutation = useMutation({
    mutationFn: ({ folderId, name }: { folderId: number; name: string }) =>
      renameStudentFolder(folderId, name),
    onSuccess: refreshFoldersAndStudents,
  })
  const deleteMutation = useMutation({
    mutationFn: deleteStudentFolder,
    onSuccess: refreshFoldersAndStudents,
  })

  return { createMutation, renameMutation, deleteMutation }
}
