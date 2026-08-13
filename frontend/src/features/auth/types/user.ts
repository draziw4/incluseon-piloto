export type AccountStatus = "pending" | "active" | "rejected" | "suspended"

export type User = {
  id: number
  name: string
  email: string
  role: string
  auth_provider: string
  account_status: AccountStatus
  requested_role: string | null
  credential_reference: string | null
  review_note: string | null
  reviewed_at: string | null
  allowed_tools: string[]
}
