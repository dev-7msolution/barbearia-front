import axios from "axios";

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return "Não foi possível conectar ao servidor. Tente novamente em instantes.";
    }
    const message = error.response.data?.message;
    if (error.response.status === 401) {
      const url = error.config?.url ?? "";
      const isLogin =
        url.includes("/auth/login") || url.includes("/clients/login");
      return isLogin
        ? "E-mail ou senha incorretos."
        : "Sessão expirada. Entre novamente.";
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    return "Não foi possível completar a operação.";
  }

  return "Não foi possível completar a operação.";
}
