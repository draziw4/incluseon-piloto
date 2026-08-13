import { api } from "@/api/client"

import type {
  PilotFeedback,
  PilotFeedbackCreate,
  PilotFeedbackUpdate
} from "./types"


export async function createPilotFeedback(data: PilotFeedbackCreate) {
  const response = await api.post<PilotFeedback>("/pilot-feedback", data)
  return response.data
}

export async function listPilotFeedback() {
  const response = await api.get<PilotFeedback[]>("/pilot-feedback")
  return response.data
}

export async function updatePilotFeedback(id: number, data: PilotFeedbackUpdate) {
  const response = await api.patch<PilotFeedback>(`/pilot-feedback/${id}`, data)
  return response.data
}
