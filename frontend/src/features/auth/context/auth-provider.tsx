import { useCallback, useEffect, useState, type ReactNode } from "react"

import { api } from "../../../api/client"
import type { User } from "../types/user"
import { AuthContext } from "./auth-context"

type Props = { children: ReactNode }

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout")
    } finally {
      clearSession()
    }
  }, [clearSession])

  const loadUser = useCallback(async () => {
    try {
      const response = await api.get<User>("/users/me")
      setUser(response.data)
    } catch {
      clearSession()
    } finally {
      setLoading(false)
    }
  }, [clearSession])

  async function login() {
    await loadUser()
  }

  useEffect(() => {
    queueMicrotask(() => void loadUser())
    window.addEventListener("auth:expired", clearSession)
    return () => window.removeEventListener("auth:expired", clearSession)
  }, [loadUser, clearSession])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
