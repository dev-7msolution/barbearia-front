"use client";

import type { ReactNode } from "react";

import { RequireAuth } from "@/components/guards/require-auth";
import { ClientShell } from "@/components/layout/client-shell";

export default function ClienteLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="client">
      <ClientShell>{children}</ClientShell>
    </RequireAuth>
  );
}
