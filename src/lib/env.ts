import { z } from "zod";

function resolveApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "").trim();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";
  return "";
}

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: resolveApiUrl(),
});
