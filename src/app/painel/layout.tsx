"use client";

import type { ReactNode } from "react";

import { RequireAuth } from "@/components/guards/require-auth";
import { StaffShell } from "@/components/layout/staff-shell";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth role="staff">
      <StaffShell>{children}</StaffShell>
    </RequireAuth>
  );
}
