"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Field, NativeSelect } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatTimeUTC, isoToDateUTC } from "@/lib/format";

export default function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { companyId } = useAuth();
  const queryClient = useQueryClient();

  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");

  const appointment = useQuery({
    queryKey: ["appointment", companyId, id],
    queryFn: () => barbearia.appointments.get(companyId!, id),
    enabled: Boolean(companyId && id),
  });

  const professionals = useQuery({
    queryKey: ["professionals", companyId],
    queryFn: () => barbearia.professionals.list(companyId!),
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    const item = appointment.data;
    if (!item) return;
    setProfessionalId(item.professionalId);
    setDate(isoToDateUTC(item.startAt));
    setStartAt(item.startAt);
    setNotes(item.notes ?? "");
  }, [appointment.data]);

  const serviceIds = useMemo(
    () =>
      (appointment.data?.services ?? [])
        .map((line) => line.serviceId)
        .filter(Boolean),
    [appointment.data],
  );

  const slotsQuery = useQuery({
    queryKey: ["slots", companyId, professionalId, date, serviceIds, id],
    queryFn: () =>
      barbearia.professionals.slots(companyId!, professionalId, {
        date,
        serviceIds,
        excludeAppointmentId: id,
      }),
    enabled: Boolean(
      companyId &&
        professionalId &&
        date &&
        serviceIds.length > 0 &&
        appointment.data?.status === "SCHEDULED",
    ),
  });

  const save = useMutation({
    mutationFn: () =>
      barbearia.appointments.reschedule(companyId!, id, {
        startAt,
        professionalId,
        notes,
      }),
    onSuccess: async () => {
      toast.success("Agendamento atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["appointment", companyId, id] });
      router.push("/painel/agenda");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!companyId) return null;

  const item = appointment.data;
  const canEdit = item?.status === "SCHEDULED";
  const currentProfessional = professionals.data?.find((p) => p.id === professionalId);
  const professionalOptions = (professionals.data ?? []).filter(
    (pro) => pro.active || pro.id === item?.professionalId,
  );

  return (
    <div className="grid max-w-lg gap-6">
      <PageHeader
        title="Editar agendamento"
        description={item?.client?.name ?? "Carregando…"}
        action={
          <Button variant="outline" nativeButton={false} render={<Link href="/painel/agenda" />}>
            Voltar
          </Button>
        }
      />

      {appointment.isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando…</p>
      ) : appointment.isError || !item ? (
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar este agendamento.
        </p>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canEdit) return;
            if (!professionalId || !startAt) {
              toast.error("Escolha profissional e horário.");
              return;
            }
            save.mutate();
          }}
        >
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            {item.professional?.name ? (
              <span className="text-muted-foreground text-sm">
                {item.professional.name}
              </span>
            ) : null}
          </div>

          <p className="text-sm">
            {item.services.map((s) => s.serviceName).join(", ")}
          </p>

          {canEdit ? (
            <>
              <Field label="Profissional">
                <NativeSelect
                  value={professionalId}
                  onChange={(event) => {
                    setProfessionalId(event.target.value);
                    setStartAt("");
                  }}
                  required
                >
                  {professionalOptions.map((pro) => (
                    <option key={pro.id} value={pro.id}>
                      {pro.name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              {currentProfessional && currentProfessional.services.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Este profissional não tem serviços vinculados.
                </p>
              ) : null}

              <Field label="Data">
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => {
                    setDate(event.target.value);
                    setStartAt("");
                  }}
                  required
                />
              </Field>

              <div className="grid gap-2">
                <p className="text-sm font-medium">Horários livres</p>
                {slotsQuery.isLoading ? (
                  <p className="text-muted-foreground text-sm">Buscando horários…</p>
                ) : slotsQuery.data?.slots.length ? (
                  <div className="flex flex-wrap gap-2">
                    {slotsQuery.data.slots.map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        size="sm"
                        variant={startAt === slot ? "default" : "outline"}
                        onClick={() => setStartAt(slot)}
                      >
                        {formatTimeUTC(slot)}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nenhum horário neste dia. Tente outra data.
                  </p>
                )}
              </div>

              <Field label="Observações">
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>

              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              Só é possível editar horários ainda agendados. Use a agenda para
              concluir, marcar falta ou cancelar.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
