import { api } from "@/api/client"

import type { RegisterData } from "../schemas/register-schema"

export type AuthCapabilities = {
  registration_enabled: boolean
  google_enabled: boolean
  google_client_id: string | null
}

export async function getAuthCapabilities() {
  const response = await api.get<AuthCapabilities>("/auth/config")
  return response.data
}

export async function registerAccount(data: RegisterData) {
  await api.post("/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
    accepted_terms: data.acceptedTerms,
  })
}

export async function loginWithGoogle(credential: string) {
  await api.post("/auth/google", { credential })
}
