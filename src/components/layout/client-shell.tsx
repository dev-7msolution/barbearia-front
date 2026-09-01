"use client";

import { LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Logo } from "@/components/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/cliente", label: "Barbearias" },
  { href: "/cliente/agendamentos", label: "Meus horários" },
];

function Links({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
      {links.map((link) => {
        const active =
          link.href === "/cliente"
            ? pathname === "/cliente"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ClientShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="hidden items-center gap-3 lg:flex">
            <Links />
            <span className="text-muted-foreground text-sm">
              {session?.type === "client" ? session.client.name : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                signOut();
                router.replace("/");
              }}
            >
              <LogOut data-icon="inline-start" />
              Sair
            </Button>
          </div>
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="lg:hidden" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent className="p-5">
              <div className="grid gap-4 pt-6">
                <Links />
                <Button
                  variant="outline"
                  onClick={() => {
                    signOut();
                    router.replace("/");
                  }}
                >
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
