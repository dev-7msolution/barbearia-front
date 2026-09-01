"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Users,
  Wallet,
  Percent,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/painel/servicos", label: "Serviços", icon: Scissors },
  { href: "/painel/profissionais", label: "Profissionais", icon: Users },
  { href: "/painel/clientes", label: "Clientes", icon: UserRound },
  { href: "/painel/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/painel/comissoes", label: "Comissões", icon: Percent },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {nav.map((item) => {
        const active =
          item.href === "/painel"
            ? pathname === "/painel"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { session, companyId, setCompanyId, signOut } = useAuth();
  const router = useRouter();
  const companies = session?.type === "staff" ? session.user.companies : [];

  return (
    <div className="flex h-full w-full flex-col gap-6 pl-1">
      <Logo tone="brand" />
      {companies.length > 1 ? (
        <NativeSelect
          value={companyId ?? ""}
          onChange={(event) => setCompanyId(event.target.value)}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </NativeSelect>
      ) : (
        <p className="text-muted-foreground text-sm">
          {companies[0]?.name ?? "Nenhuma barbearia"}
        </p>
      )}
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto grid gap-3">
        <Separator />
        <div>
          <p className="text-sm font-medium">
            {session?.type === "staff" ? session.user.name : ""}
          </p>
          <p className="text-muted-foreground text-xs">
            {session?.type === "staff" ? session.user.email : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
        >
          <LogOut data-icon="inline-start" />
          Sair
        </Button>
      </div>
    </div>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-svh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="relative hidden border-r bg-white p-5 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-primary"
        />
        <SidebarBody />
      </aside>
      <div className="flex min-h-svh flex-col">
        <header className="flex items-center justify-between border-b bg-white px-4 py-3 lg:hidden">
          <Logo tone="brand" />
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-5">
              <SidebarBody />
            </SheetContent>
          </Sheet>
        </header>
        <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
