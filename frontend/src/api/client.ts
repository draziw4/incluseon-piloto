import axios, { type InternalAxiosRequestConfig } from "axios"

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean }

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export const api = axios.create({ baseURL, withCredentials: true })

let refreshPromise: Promise<void> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config as RetryableRequest | undefined
    if (error.response?.status !== 401 || !request || request._retry) {
      return Promise.reject(error)
    }

    request._retry = true
    refreshPromise ??= axios
      .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null
      })

    try {
      await refreshPromise
      return api(request)
    } catch (refreshError) {
      window.dispatchEvent(new Event("auth:expired"))
      return Promise.reject(refreshError)
    }
  }
)
