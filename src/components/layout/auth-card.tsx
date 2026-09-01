import type { ReactNode } from "react";
import Link from "next/link";

import { Logo } from "@/components/logo";

const panels = {
  staff: {
    eyebrow: "Operação da casa",
    headline: "Controle de agenda, caixa e equipe.",
    body: "Um painel para o dia a dia da barbearia: horários, pagamentos e comissões no mesmo lugar.",
    highlights: [
      "Agenda por profissional",
      "Registro de caixa",
      "Comissões por serviço",
    ],
  },
  client: {
    eyebrow: "Agendamento",
    headline: "Horário marcado, sem fila.",
    body: "Acesso à casa, ao profissional e ao serviço com disponibilidade real — confirmado na hora.",
    highlights: [
      "Disponibilidade em tempo real",
      "Escolha de profissional e serviço",
      "Histórico dos seus horários",
    ],
  },
} as const;

export function AuthCard({
  title,
  description,
  children,
  panel = "staff",
}: {
  title: string;
  description: string;
  children: ReactNode;
  panel?: keyof typeof panels;
}) {
  const brand = panels[panel];

  return (
    <div className="grid min-h-svh bg-white text-neutral-950 lg:h-svh lg:grid-cols-2">
      <aside className="relative hidden bg-[oklch(0.86_0.17_95)] text-neutral-950 lg:flex lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-16 xl:py-14">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 w-1 bg-neutral-300"
        />
        <Logo tone="onColor" />

        <div className="max-w-md space-y-5">
          <p className="text-xs font-medium tracking-[0.16em] text-neutral-700 uppercase">
            {brand.eyebrow}
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            {brand.headline}
          </h1>
          <p className="text-[15px] leading-relaxed text-neutral-800">
            {brand.body}
          </p>
          <ul className="space-y-3 pt-4 text-sm text-neutral-900">
            {brand.highlights.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-neutral-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-neutral-700">
          Barbearia · gestão e agendamento
        </p>
      </aside>

      <section className="flex min-h-svh flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5">
          <Logo tone="brand" className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto text-sm text-neutral-500 hover:text-neutral-950"
          >
            Início
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[360px]">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
            <div className="mt-8 [&_button[type=submit]]:mt-2 [&_button[type=submit]]:h-10 [&_button[type=submit]]:w-full [&_button[type=submit]]:bg-neutral-950 [&_button[type=submit]]:text-white [&_button[type=submit]]:hover:bg-neutral-800 [&_input]:h-10 [&_input]:!border-neutral-200 [&_input]:!bg-white [&_input]:!text-neutral-950 [&_input]:placeholder:!text-neutral-400 [&_label>span]:text-sm [&_label>span]:font-medium [&_label>span]:text-neutral-700 [&_select]:h-10 [&_select]:!border-neutral-200 [&_select]:!bg-white [&_select]:!text-neutral-950 [&_textarea]:!border-neutral-200 [&_textarea]:!bg-white [&_textarea]:!text-neutral-950">
              {children}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
