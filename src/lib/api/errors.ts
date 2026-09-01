import axios from "axios";

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) {
      return "Não foi possível falar com a API. Confira se ela está no ar (porta 3000) e se o front está em http://localhost:3001.";
    }
    const message = error.response.data?.message;
    if (error.response.status === 401) {
      return "E-mail ou senha incorretos.";
    }
    if (error.response.status === 404 && message?.includes("GET:/auth/login")) {
      return "O login do dono é POST em http://localhost:3000/auth/login. No site, use /login ou /auth/login.";
    }
    return message ?? "Não foi possível completar a operação.";
  }

  return "Não foi possível completar a operação.";
}
