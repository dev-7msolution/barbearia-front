"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, NativeSelect } from "@/components/field";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { minutesToTime, onlyDigits, timeToMinutes, WEEKDAYS } from "@/lib/format";
import { professionalSchema, type ProfessionalInput } from "@/schemas/forms";
import type { Professional } from "@/types/api";

export default function ProfissionaisPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Professional | null>(null);
  const form = useForm<ProfessionalInput>({
    resolver: zodResolver(professionalSchema),
    defaultValues: { name: "", cpf: "", phone: "", email: "" },
  });
  const [serviceIds, setServiceIds] = useState<string[]>([]);

  const professionals = useQuery({
    queryKey: ["professionals", companyId],
    queryFn: () => barbearia.professionals.list(companyId!),
    enabled: Boolean(companyId),
  });
  const services = useQuery({
    queryKey: ["services", companyId],
    queryFn: () => barbearia.services.list(companyId!),
    enabled: Boolean(companyId),
  });

  const create = useMutation({
    mutationFn: (values: ProfessionalInput) =>
      barbearia.professionals.create(companyId!, {
        name: values.name,
        cpf: onlyDigits(values.cpf),
        phone: values.phone || undefined,
        email: values.email || undefined,
        serviceIds,
      }),
    onSuccess: async () => {
      toast.success("Profissional cadastrado.");
      setOpen(false);
      form.reset();
      setServiceIds([]);
      await queryClient.invalidateQueries({ queryKey: ["professionals"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!companyId) return null;
  const list = professionals.data ?? [];

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Profissionais"
        description="Barbeiros, serviços e grade de horários."
        action={<Button onClick={() => setOpen(true)}>Novo profissional</Button>}
      />
      {list.length === 0 ? (
        <EmptyState title="Nenhum profissional nesta casa" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((pro) => (
            <Card key={pro.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {pro.name}
                  {!pro.active ? (
                    <span className="text-muted-foreground text-xs">Inativo</span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-muted-foreground text-sm">
                  {pro.services.map((s) => s.name).join(", ") || "Sem serviços"}
                </p>
                <Button variant="outline" onClick={() => setSelected(pro)}>
                  Grade e comissão
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo profissional</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="CPF" error={form.formState.errors.cpf?.message}>
              <Input {...form.register("cpf")} />
            </Field>
            <Field label="Telefone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="E-mail">
              <Input type="email" {...form.register("email")} />
            </Field>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Serviços</legend>
              {services.data
                ?.filter((s) => s.active)
                .map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={serviceIds.includes(service.id)}
                      onChange={() =>
                        setServiceIds((current) =>
                          current.includes(service.id)
                            ? current.filter((id) => id !== service.id)
                            : [...current, service.id],
                        )
                      }
                    />
                    {service.name}
                  </label>
                ))}
            </fieldset>
            <Button type="submit" disabled={create.isPending}>
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {selected ? (
        <ProfessionalEditor
          companyId={companyId}
          professional={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function ProfessionalEditor({
  companyId,
  professional,
  onClose,
}: {
  companyId: string;
  professional: Professional;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("18:00");
  const [rate, setRate] = useState("40");

  const availability = useQuery({
    queryKey: ["availability", companyId, professional.id],
    queryFn: () => barbearia.professionals.availability(companyId, professional.id),
  });

  const addSlot = useMutation({
    mutationFn: () =>
      barbearia.professionals.addAvailability(companyId, professional.id, {
        weekday,
        startMinute: timeToMinutes(start),
        endMinute: timeToMinutes(end),
      }),
    onSuccess: async () => {
      toast.success("Horário adicionado.");
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeSlot = useMutation({
    mutationFn: (id: string) =>
      barbearia.professionals.removeAvailability(companyId, professional.id, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const saveCommission = useMutation({
    mutationFn: () =>
      barbearia.professionals.setCommission(
        companyId,
        professional.id,
        Number(rate),
      ),
    onSuccess: () => toast.success("Comissão padrão salva."),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{professional.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6">
          <div className="grid gap-3">
            <p className="text-sm font-medium">Grade semanal</p>
            <div className="grid grid-cols-3 gap-2">
              <NativeSelect
                value={weekday}
                onChange={(event) => setWeekday(Number(event.target.value))}
              >
                {WEEKDAYS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <Button size="sm" onClick={() => addSlot.mutate()} disabled={addSlot.isPending}>
              Adicionar período
            </Button>
            <ul className="grid gap-2">
              {availability.data?.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {WEEKDAYS[item.weekday]} {minutesToTime(item.startMinute)}–
                    {minutesToTime(item.endMinute)}
                  </span>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => removeSlot.mutate(item.id)}
                  >
                    Remover
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <Field label="Comissão padrão (%)">
              <Input value={rate} onChange={(e) => setRate(e.target.value)} />
            </Field>
            <Button
              variant="outline"
              onClick={() => saveCommission.mutate()}
              disabled={saveCommission.isPending}
            >
              Salvar comissão
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
