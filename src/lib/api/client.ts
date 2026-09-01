import axios from "axios";

import { clearSessionStorage, readSession } from "@/lib/auth/session";
import { env } from "@/lib/env";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isLogin = url.includes("/auth/login") || url.includes("/clients/login");
      if (!isLogin && typeof window !== "undefined") {
        clearSessionStorage();
        const path = window.location.pathname;
        const dest = path.startsWith("/painel") ? "/login" : "/entrar";
        if (path.startsWith("/painel") || path.startsWith("/cliente") || path === "/entrar") {
          window.location.assign(dest);
        }
      }
    }
    return Promise.reject(error);
  },
);
