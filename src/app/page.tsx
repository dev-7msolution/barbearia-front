import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-white text-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 80% -10%, oklch(0.86 0.17 95 / 0.55), transparent 50%), radial-gradient(ellipse at 0% 100%, oklch(0.86 0.17 95 / 0.22), transparent 40%)",
        }}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Logo tone="brand" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="text-neutral-950 hover:bg-neutral-100 hover:text-neutral-950"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Painel
          </Button>
          <Button
            className="bg-[oklch(0.86_0.17_95)] text-neutral-950 hover:bg-[oklch(0.8_0.17_95)]"
            nativeButton={false}
            render={<Link href="/entrar" />}
          >
            Agendar
          </Button>
        </div>
      </header>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-12 px-6 pb-20">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-medium text-neutral-800">
            Gestão + agendamento
          </p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
            O corte certo,
            <br />
            no horário certo.
          </h1>
          <p className="max-w-xl text-lg text-neutral-600">
            Um painel para a barbearia e um fluxo simples para o cliente
            escolher profissional, serviço e horário — sem planilha, sem
            WhatsApp perdido.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <Link
            href="/entrar"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-[oklch(0.86_0.17_95)] hover:bg-[oklch(0.86_0.17_95)]/20"
          >
            <p className="text-sm text-neutral-500">Sou cliente</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Reservar um horário
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Escolha a casa, o barbeiro e o serviço. Confirme em segundos.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-neutral-950">
              Entrar →
            </span>
          </Link>
          <Link
            href="/login"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition-colors hover:border-[oklch(0.86_0.17_95)] hover:bg-[oklch(0.86_0.17_95)]/20"
          >
            <p className="text-sm text-neutral-500">Sou da barbearia</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Abrir o painel
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Agenda do dia, caixa, comissões e visão gerencial.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-neutral-950">
              Acessar →
            </span>
          </Link>
        </div>
        <p className="text-sm text-neutral-500">
          Primeira barbearia no sistema?{" "}
          <Link href="/cadastro-barbearia" className="text-neutral-950 underline">
            Criar conta da casa
          </Link>
        </p>
      </main>
    </div>
  );
}
