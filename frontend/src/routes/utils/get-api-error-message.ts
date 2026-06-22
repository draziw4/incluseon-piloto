import axios from "axios"

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    if (status === 401) {
      return "Sua sessão expirou. Faça login novamente."
    }

    if (status === 403) {
      return typeof detail === "string"
        ? detail
        : "Você não tem permissão para realizar esta ação."
    }

    if (status === 404) {
      return typeof detail === "string"
        ? detail
        : "Recurso não encontrado."
    }

    if (status === 409) {
      return typeof detail === "string"
        ? detail
        : "O recurso foi alterado por outra pessoa. Atualize a página e tente novamente."
    }

    if (status === 422) {
      return "Alguns dados enviados são inválidos. Verifique as informações."
    }

    if (typeof detail === "string") {
      return detail
    }
  }

  return "Não foi possível concluir a ação. Tente novamente."
}
