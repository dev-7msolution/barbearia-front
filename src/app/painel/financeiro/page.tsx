"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CreditCard, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import {
  METHOD_COLORS,
  MethodPieChart,
  RevenueAreaChart,
} from "@/components/finance/finance-charts";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { paymentMethodLabel } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { barbearia } from "@/lib/api/barbearia";
import {
  formatDate,
  formatDateTimeUTC,
  money,
  monthRange,
  shiftISODate,
  todayISODate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Payment, PaymentMethod, PaymentStatus } from "@/types/api";

const PAGE_SIZES = [10, 20, 50] as const;

const statusLabel: Record<PaymentStatus, string> = {
  PAID: "Pago",
  REFUNDED: "Reembolsado",
};

function daysBetween(from: string, to: string) {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    days.push(cursor);
    cursor = shiftISODate(cursor, 1);
  }
  return days;
}

function chartLabel(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

export default function FinanceiroPage() {
  const { companyId } = useAuth();
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);

  const report = useQuery({
    queryKey: ["payments", companyId, from, to],
    queryFn: () => barbearia.payments.report(companyId!, { from, to }),
    enabled: Boolean(companyId),
  });
  const overview = useQuery({
    queryKey: ["overview", companyId, from, to],
    queryFn: () => barbearia.reports.overview(companyId!, { from, to }),
    enabled: Boolean(companyId),
  });

  const data = report.data;
  const paid = useMemo(
    () => (data?.payments ?? []).filter((item) => item.status === "PAID"),
    [data],
  );

  const daily = useMemo(() => {
    const totals = new Map<string, number>();
    for (const payment of paid) {
      const day = payment.paidAt.slice(0, 10);
      totals.set(day, (totals.get(day) ?? 0) + Number(payment.amount));
    }
    return daysBetween(from, to).map((date) => ({
      date: formatDate(date),
      label: chartLabel(date),
      total: totals.get(date) ?? 0,
    }));
  }, [paid, from, to]);

  const methodChart = useMemo(() => {
    const methods: PaymentMethod[] = ["PIX", "CARD", "CASH"];
    return methods
      .map((method) => ({
        method,
        label: paymentMethodLabel[method],
        value: Number(data?.byMethod[method] ?? 0),
        color: METHOD_COLORS[method],
      }))
      .filter((item) => item.value > 0);
  }, [data]);

  const rows = data?.payments ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (!companyId) return null;

  const pix = Number(data?.byMethod.PIX ?? 0);
  const card = Number(data?.byMethod.CARD ?? 0);
  const cash = Number(data?.byMethod.CASH ?? 0);
  const total = Number(data?.total ?? 0);

  function applyPreset(kind: "7d" | "month" | "last") {
    const today = todayISODate();
    if (kind === "7d") {
      setFrom(shiftISODate(today, -6));
      setTo(today);
    } else if (kind === "month") {
      const range = monthRange();
      setFrom(range.from);
      setTo(range.to);
    } else {
      const [year, month] = today.split("-").map(Number);
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const lastDay = new Date(prevYear, prevMonth, 0).getDate();
      const mm = String(prevMonth).padStart(2, "0");
      setFrom(`${prevYear}-${mm}-01`);
      setTo(`${prevYear}-${mm}-${String(lastDay).padStart(2, "0")}`);
    }
    setPage(1);
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Financeiro"
        description="Receita paga no período. Reembolsos ficam de fora do total."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("7d")}>
              7 dias
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("month")}>
              Este mês
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => applyPreset("last")}>
              Mês passado
            </Button>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
        }
      />

      {report.isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando caixa…</p>
      ) : !data ? (
        <EmptyState title="Não foi possível carregar o financeiro" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              title="Receita líquida"
              value={money(total)}
              hint={`${paid.length} pagamento${paid.length === 1 ? "" : "s"}`}
              icon={Wallet}
              className="bg-[oklch(0.86_0.17_95)] text-neutral-950 ring-0"
              muted
            />
            <Kpi
              title="Pix"
              value={money(pix)}
              hint={share(pix, total)}
              icon={Receipt}
              accent="bg-emerald-500"
            />
            <Kpi
              title="Cartão"
              value={money(card)}
              hint={share(card, total)}
              icon={CreditCard}
              accent="bg-sky-500"
            />
            <Kpi
              title="Dinheiro"
              value={money(cash)}
              hint={share(cash, total)}
              icon={Banknote}
              accent="bg-amber-500"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Receita por dia</CardTitle>
                <p className="text-muted-foreground text-sm">
                  Ticket médio {money(overview.data?.revenue.averageTicket ?? 0)}
                </p>
              </CardHeader>
              <CardContent>
                {paid.length === 0 ? (
                  <p className="text-muted-foreground py-16 text-center text-sm">
                    Sem receita neste intervalo.
                  </p>
                ) : (
                  <RevenueAreaChart data={daily} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por forma de pagamento</CardTitle>
                <p className="text-muted-foreground flex items-center gap-1 text-sm">
                  <TrendingUp className="size-3.5" />
                  Mix do período
                </p>
              </CardHeader>
              <CardContent>
                {methodChart.length === 0 ? (
                  <p className="text-muted-foreground py-16 text-center text-sm">
                    Nenhum método neste intervalo.
                  </p>
                ) : (
                  <MethodPieChart data={methodChart} />
                )}
              </CardContent>
            </Card>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="Nenhum lançamento neste período" />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="font-medium">Lançamentos</h2>
                <p className="text-muted-foreground text-sm">
                  {rows.length} registro{rows.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quando</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((payment) => (
                      <PaymentRow key={payment.id} payment={payment} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-muted-foreground flex items-center gap-2 text-sm">
                  Por página
                  <NativeSelect
                    className="w-20"
                    value={String(pageSize)}
                    onChange={(event) => {
                      setPageSize(
                        Number(event.target.value) as (typeof PAGE_SIZES)[number],
                      );
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((c) => Math.max(1, c - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm tabular-nums">
                    {currentPage} / {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= pageCount}
                    onClick={() => setPage((c) => Math.min(pageCount, c + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function share(part: number, total: number) {
  if (!total) return "0% do total";
  return `${Math.round((part / total) * 100)}% do total`;
}

function Kpi({
  title,
  value,
  hint,
  icon: Icon,
  className,
  accent,
  muted,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Wallet;
  className?: string;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className={cn("text-sm", muted ? "text-neutral-800" : "text-muted-foreground")}>
            {title}
          </CardTitle>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          <p className={cn("mt-1 text-xs", muted ? "text-neutral-700" : "text-muted-foreground")}>
            {hint}
          </p>
        </div>
        {accent ? (
          <span className={cn("flex size-9 items-center justify-center rounded-lg text-white", accent)}>
            <Icon className="size-4" />
          </span>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/70">
            <Icon className="size-4" />
          </span>
        )}
      </CardHeader>
    </Card>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {formatDateTimeUTC(payment.paidAt)}
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: METHOD_COLORS[payment.method] }}
          />
          {paymentMethodLabel[payment.method]}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={payment.status === "PAID" ? "default" : "outline"}>
          {statusLabel[payment.status]}
        </Badge>
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          payment.status === "REFUNDED" && "text-muted-foreground line-through",
        )}
      >
        {money(payment.amount)}
      </TableCell>
    </TableRow>
  );
}
