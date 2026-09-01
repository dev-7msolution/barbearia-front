"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AgendaCalendar } from "@/components/appointments/agenda-calendar";
import { BookingForm } from "@/components/appointments/booking-form";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge, paymentMethodLabel } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  formatDate,
  formatDateTimeUTC,
  formatTimeUTC,
  money,
  shiftISODate,
  todayISODate,
} from "@/lib/format";
import type { Appointment, PaymentMethod } from "@/types/api";

export default function AgendaPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayISODate());
  const [open, setOpen] = useState(false);
  const [paying, setPaying] = useState<Appointment | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("PIX");

  const appointments = useQuery({
    queryKey: ["appointments", companyId, date],
    queryFn: () => barbearia.appointments.list(companyId!, { date }),
    enabled: Boolean(companyId),
  });
  const professionals = useQuery({
    queryKey: ["professionals", companyId],
    queryFn: () => barbearia.professionals.list(companyId!),
    enabled: Boolean(companyId),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "COMPLETED" | "CANCELLED" | "NO_SHOW";
    }) => barbearia.appointments.updateStatus(companyId!, id, status),
    onSuccess: async () => {
      toast.success("Status atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const payMutation = useMutation({
    mutationFn: () =>
      barbearia.payments.create(companyId!, paying!.id, { method }),
    onSuccess: async () => {
      toast.success("Pagamento registrado.");
      setPaying(null);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const reschedule = useMutation({
    mutationFn: ({
      id,
      startAt,
      professionalId,
    }: {
      id: string;
      startAt: string;
      professionalId: string;
    }) =>
      barbearia.appointments.reschedule(companyId!, id, {
        startAt,
        professionalId,
      }),
    onSuccess: async () => {
      toast.success("Horário remarcado.");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!companyId) return null;

  const list = appointments.data ?? [];

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Agenda"
        description={formatDate(date)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDate((current) => shiftISODate(current, -1))}
            >
              <ChevronLeft />
            </Button>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setDate((current) => shiftISODate(current, 1))}
            >
              <ChevronRight />
            </Button>
            <Button variant="ghost" onClick={() => setDate(todayISODate())}>
              Hoje
            </Button>
            <Button onClick={() => setOpen(true)}>Novo horário</Button>
          </div>
        }
      />

      <Tabs defaultValue="calendario">
        <TabsList>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="calendario" className="mt-4 grid gap-3">
          <p className="text-muted-foreground text-sm">
            Arraste um cliente agendado para outro horário ou barbeiro.
          </p>
          {appointments.isLoading || professionals.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando agenda…</p>
          ) : (
            <AgendaCalendar
              date={date}
              appointments={list}
              professionals={professionals.data ?? []}
              onMove={(id, startAt, professionalId) =>
                reschedule.mutate({ id, startAt, professionalId })
              }
              onStatus={(id, status) => statusMutation.mutate({ id, status })}
            />
          )}
        </TabsContent>
        <TabsContent value="lista" className="mt-4">
          {appointments.isLoading ? (
            <p className="text-muted-foreground text-sm">Carregando agenda…</p>
          ) : list.length === 0 ? (
            <EmptyState
              title="Nada neste dia"
              description="Crie um agendamento por telefone ou espere os clientes."
              action={<Button onClick={() => setOpen(true)}>Agendar</Button>}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{formatTimeUTC(item.startAt)}</div>
                        <div className="text-muted-foreground text-xs">
                          {formatDateTimeUTC(item.endAt)}
                        </div>
                      </TableCell>
                      <TableCell>{item.client?.name ?? "—"}</TableCell>
                      <TableCell>{item.professional?.name ?? "—"}</TableCell>
                      <TableCell>
                        <div className="max-w-56 truncate text-sm">
                          {item.services.map((s) => s.serviceName).join(", ")}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {money(
                            item.services.reduce(
                              (sum, s) => sum + Number(s.price),
                              0,
                            ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === "SCHEDULED" ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                nativeButton={false}
                                render={<Link href={`/painel/agenda/${item.id}`} />}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: item.id,
                                    status: "COMPLETED",
                                  })
                                }
                              >
                                Concluir
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: item.id,
                                    status: "NO_SHOW",
                                  })
                                }
                              >
                                Falta
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  statusMutation.mutate({
                                    id: item.id,
                                    status: "CANCELLED",
                                  })
                                }
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : null}
                          {item.status === "COMPLETED" && !item.payment ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaying(item)}
                            >
                              Caixa
                            </Button>
                          ) : null}
                          {item.payment ? (
                            <span className="text-muted-foreground text-xs">Pago</span>
                          ) : null}
                          {item.status !== "SCHEDULED" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              nativeButton={false}
                              render={<Link href={`/painel/agenda/${item.id}`} />}
                            >
                              Ver
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg overflow-visible">
          <DialogHeader>
            <DialogTitle>Novo agendamento</DialogTitle>
          </DialogHeader>
          <BookingForm
            companyId={companyId}
            mode="staff"
            defaultDate={date}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(paying)} onOpenChange={() => setPaying(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <NativeSelect
              value={method}
              onChange={(event) => setMethod(event.target.value as PaymentMethod)}
            >
              {Object.entries(paymentMethodLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <Button disabled={payMutation.isPending} onClick={() => payMutation.mutate()}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
