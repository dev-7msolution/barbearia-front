"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { barbearia } from "@/lib/api/barbearia";
import { formatDate, money, monthRange, percent } from "@/lib/format";
import { useState } from "react";

export default function DashboardPage() {
  const { companyId } = useAuth();
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const overview = useQuery({
    queryKey: ["overview", companyId, from, to],
    queryFn: () => barbearia.reports.overview(companyId!, { from, to }),
    enabled: Boolean(companyId),
  });

  if (!companyId) {
    return (
      <EmptyState
        title="Nenhuma barbearia neste acesso"
        description="Crie uma casa nova para começar."
        action={
          <Button nativeButton={false} render={<Link href="/cadastro-barbearia" />}>
            Cadastrar barbearia
          </Button>
        }
      />
    );
  }

  const data = overview.data;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Visão geral"
        description={`${formatDate(from)} — ${formatDate(to)}`}
        action={
          <div className="flex gap-2">
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        }
      />

      {overview.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi title="Receita" value={money(data.revenue.total)} />
            <Kpi title="Ticket médio" value={money(data.revenue.averageTicket)} />
            <Kpi title="Agendamentos" value={String(data.appointments.total)} />
            <Kpi
              title="Cancelamentos"
              value={percent(data.appointments.cancellationRate)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <RankCard
              title="Serviços"
              rows={data.topServices.map((item) => ({
                label: item.name,
                value: money(item.revenue),
                hint: `${item.count}x`,
              }))}
            />
            <RankCard
              title="Profissionais"
              rows={data.topProfessionals.map((item) => ({
                label: item.name,
                value: money(item.revenue),
                hint: `${item.appointmentsCompleted} cortes`,
              }))}
            />
            <RankCard
              title="Clientes"
              rows={data.topClients.map((item) => ({
                label: item.name,
                value: money(item.revenue),
                hint: `${item.visits} visitas`,
              }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi title="Novos clientes" value={String(data.clients.new)} />
            <Kpi title="Recorrentes" value={String(data.clients.returning)} />
            <Kpi
              title="No-show"
              value={percent(data.appointments.noShowRate)}
            />
          </div>
        </>
      ) : (
        <EmptyState title="Não foi possível carregar o período" />
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function RankCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; hint: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem dados ainda.</p>
        ) : (
          rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-muted-foreground text-xs">{row.hint}</p>
              </div>
              <p className="text-sm">{row.value}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
