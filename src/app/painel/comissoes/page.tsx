"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { NativeSelect } from "@/components/field";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDateTimeUTC, money, monthRange } from "@/lib/format";

export default function ComissoesPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const initial = monthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [professionalId, setProfessionalId] = useState("");

  const professionals = useQuery({
    queryKey: ["professionals", companyId],
    queryFn: () => barbearia.professionals.list(companyId!),
    enabled: Boolean(companyId),
  });

  const selected = professionalId || professionals.data?.[0]?.id || "";

  const commissions = useQuery({
    queryKey: ["commissions", companyId, selected, from, to],
    queryFn: () =>
      barbearia.professionals.commissions(companyId!, selected, { from, to }),
    enabled: Boolean(companyId && selected),
  });

  const payouts = useQuery({
    queryKey: ["payouts", companyId, selected],
    queryFn: () => barbearia.professionals.payouts(companyId!, selected),
    enabled: Boolean(companyId && selected),
  });

  const pay = useMutation({
    mutationFn: () =>
      barbearia.professionals.payout(companyId!, selected, { from, to }),
    onSuccess: async () => {
      toast.success("Comissão fechada.");
      await queryClient.invalidateQueries({ queryKey: ["commissions"] });
      await queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!companyId) return null;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Comissões"
        description="Valores ainda não pagos e histórico de fechamentos."
        action={
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              value={selected}
              onChange={(e) => setProfessionalId(e.target.value)}
            >
              {professionals.data?.map((pro) => (
                <option key={pro.id} value={pro.id}>
                  {pro.name}
                </option>
              ))}
            </NativeSelect>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        }
      />

      {commissions.data ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pendente: {money(commissions.data.total)}</CardTitle>
            <Button
              disabled={pay.isPending || commissions.data.total === 0}
              onClick={() => pay.mutate()}
            >
              Fechar período
            </Button>
          </CardHeader>
          <CardContent>
            {commissions.data.items.length === 0 ? (
              <EmptyState title="Nada pendente neste intervalo" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Taxa</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDateTimeUTC(item.startAt)}</TableCell>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell>{item.commissionRate}%</TableCell>
                      <TableCell className="text-right">
                        {money(item.commissionAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-sm">Selecione um profissional.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.data?.length ? (
            <ul className="grid gap-2 text-sm">
              {payouts.data.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{formatDateTimeUTC(item.createdAt)}</span>
                  <span>{money(item.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum fechamento ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
