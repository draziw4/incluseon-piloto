import { api } from "@/api/client"

import type { RegisterData } from "../schemas/register-schema"

export type AuthCapabilities = {
  registration_enabled: boolean
  google_enabled: boolean
  google_client_id: string | null
  professional_roles: Array<{ value: RegisterData["requestedRole"]; label: string }>
}

export type RegistrationResult = {
  account_status: "pending" | "active" | "rejected" | "suspended"
  message: string
}

export type GoogleAuthResult = RegistrationResult & { authenticated: boolean }

export async function getAuthCapabilities() {
  const response = await api.get<AuthCapabilities>("/auth/config")
  return response.data
}

export async function registerAccount(data: RegisterData) {
  const response = await api.post<RegistrationResult>("/auth/register", {
    name: data.name,
    email: data.email,
    password: data.password,
    requested_role: data.requestedRole,
    credential_reference: data.credentialReference,
    accepted_terms: data.acceptedTerms,
  })
  return response.data
}

export async function loginWithGoogle(
  credential: string,
  registration?: Pick<RegisterData, "requestedRole" | "credentialReference">,
) {
  const response = await api.post<GoogleAuthResult>("/auth/google", {
    credential,
    requested_role: registration?.requestedRole,
    credential_reference: registration?.credentialReference,
  })
  return response.data
}
