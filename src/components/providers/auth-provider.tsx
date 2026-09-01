"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  clearSessionStorage,
  readCompanyId,
  readSession,
  readStoredCompanyId,
  subscribeSession,
  writeCompanyId,
  writeSession,
  type Session,
} from "@/lib/auth/session";

type AuthContextValue = {
  session: Session | null;
  ready: boolean;
  companyId: string | null;
  setCompanyId: (id: string) => void;
  signIn: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const session = useSyncExternalStore(
    subscribeSession,
    readSession,
    () => null,
  );
  const storedCompanyId = useSyncExternalStore(
    subscribeSession,
    readStoredCompanyId,
    () => null,
  );
  const companies = session?.type === "staff" ? session.user.companies : [];
  const companyId =
    session?.type === "staff"
      ? companies.find((company) => company.id === storedCompanyId)?.id ??
        companies[0]?.id ??
        null
      : null;

  const signIn = useCallback((next: Session) => {
    writeSession(next);
    if (next.type === "staff") {
      const id = readCompanyId(next.user.companies);
      if (id) writeCompanyId(id);
    }
  }, []);

  const signOut = useCallback(() => {
    clearSessionStorage();
  }, []);

  const setCompanyId = useCallback((id: string) => {
    writeCompanyId(id);
  }, []);

  const value = useMemo(
    () => ({ session, ready, companyId, setCompanyId, signIn, signOut }),
    [session, ready, companyId, setCompanyId, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth precisa estar dentro de AuthProvider");
  }
  return ctx;
}
