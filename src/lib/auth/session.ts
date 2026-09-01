import type { ClientUser, Company, StaffUser } from "@/types/api";

export const SESSION_KEY = "barbearia.session";
export const COMPANY_KEY = "barbearia.companyId";

export type StaffSession = {
  type: "staff";
  token: string;
  user: StaffUser;
};

export type ClientSession = {
  type: "client";
  token: string;
  client: ClientUser;
};

export type Session = StaffSession | ClientSession;

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;
let sessionCacheReady = false;

function emit() {
  sessionCacheReady = false;
  listeners.forEach((listener) => listener());
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (sessionCacheReady && raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  sessionCacheReady = true;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    cachedSession = JSON.parse(raw) as Session;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
}

export function writeSession(session: Session) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
}

export function clearSessionStorage() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(COMPANY_KEY);
  emit();
}

export function readStoredCompanyId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(COMPANY_KEY);
}

export function readCompanyId(companies: Company[] = []) {
  const stored = readStoredCompanyId();
  if (stored && companies.some((company) => company.id === stored)) {
    return stored;
  }
  return companies[0]?.id ?? null;
}

export function writeCompanyId(companyId: string) {
  window.localStorage.setItem(COMPANY_KEY, companyId);
  emit();
}
