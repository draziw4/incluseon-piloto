
import { api } from "../../../api/client"

import type { LoginData } from "../schemas/login-schema"

type LoginResponse = {
  token_type: string
}

export async function login(data: LoginData) {
  const formData = new URLSearchParams()

  formData.append("username", data.email)
  formData.append("password", data.password)

  const response = await api.post<LoginResponse>(
    "/auth/login",
    formData,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  )

  return response.data
}
