"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function RequireAuth({
  role,
  children,
}: {
  role: "staff" | "client";
  children: ReactNode;
}) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace(role === "staff" ? "/login" : "/entrar");
      return;
    }
    if (session.type !== role) {
      router.replace(session.type === "staff" ? "/painel" : "/cliente");
    }
  }, [ready, session, role, router]);

  if (!ready || !session || session.type !== role) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Skeleton className="h-32 w-full max-w-md" />
      </div>
    );
  }

  return children;
}
