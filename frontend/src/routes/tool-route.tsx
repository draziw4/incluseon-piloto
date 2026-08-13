import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

import { hasTool, type ToolAccess } from "@/features/auth/access"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function ToolRoute({ tool, children }: { tool: ToolAccess; children: ReactNode }) {
  const { user } = useAuth()

  if (!hasTool(user, tool)) {
    return <Navigate to="/" replace />
  }

  return children
}
