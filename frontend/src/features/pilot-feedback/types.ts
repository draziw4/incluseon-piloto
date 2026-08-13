export type FeedbackCategory = "defect" | "improvement" | "question"

export type FeedbackStatus =
  | "received"
  | "in_review"
  | "implemented"
  | "awaiting_validation"
  | "approved"

export type PilotFeedback = {
  id: number
  page_path: string
  category: FeedbackCategory
  title: string
  details: string
  expected_result?: string | null
  status: FeedbackStatus
  admin_note?: string | null
  author_name: string
  author_email?: string | null
  created_at: string
  updated_at: string
}

export type PilotFeedbackCreate = {
  page_path: string
  category: FeedbackCategory
  title: string
  details: string
  expected_result?: string
}

export type PilotFeedbackUpdate = {
  status: FeedbackStatus
  admin_note?: string
}
