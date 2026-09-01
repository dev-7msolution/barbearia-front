"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Field, NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatTimeUTC, money, onlyDigits, todayISODate } from "@/lib/format";
import type { ShopClient } from "@/types/api";

export function BookingForm({
  companyId,
  mode,
  defaultDate,
  onSuccess,
}: {
  companyId: string;
  mode: "staff" | "client";
  defaultDate?: string;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const [professionalId, setProfessionalId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [date, setDate] = useState(defaultDate ?? todayISODate());
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");

  const professionalsQuery = useQuery({
    queryKey: ["professionals", companyId],
    queryFn: () => barbearia.professionals.list(companyId),
    enabled: Boolean(companyId),
  });

  const clientsQuery = useQuery({
    queryKey: ["shop-clients", companyId],
    queryFn: () => barbearia.clients.list(companyId),
    enabled: mode === "staff" && Boolean(companyId),
  });

  const professional = professionalsQuery.data?.find((item) => item.id === professionalId);
  const availableServices = useMemo(
    () => professional?.services ?? [],
    [professional],
  );

  const clientMatches = useMemo(() => {
    const term = clientQuery.trim().toLowerCase();
    const rows = (clientsQuery.data ?? []).filter((client) => client.active !== false);
    if (!term) return [];
    const digits = onlyDigits(term);
    return rows
      .filter((client) => {
        if (client.name.toLowerCase().includes(term)) return true;
        if (client.email?.toLowerCase().includes(term)) return true;
        if (digits.length >= 3 && onlyDigits(client.phone ?? "").includes(digits)) {
          return true;
        }
        return false;
      })
      .slice(0, 8);
  }, [clientsQuery.data, clientQuery]);

  const slotsQuery = useQuery({
    queryKey: ["slots", companyId, professionalId, date, serviceIds],
    queryFn: () =>
      barbearia.professionals.slots(companyId, professionalId, {
        date,
        serviceIds,
      }),
    enabled: Boolean(companyId && professionalId && date && serviceIds.length > 0),
  });

  const duration = useMemo(
    () => availableServices.filter((s) => serviceIds.includes(s.id)).length,
    [availableServices, serviceIds],
  );

  const create = useMutation({
    mutationFn: async () => {
      if (mode === "staff") {
        return barbearia.appointments.createStaff(companyId, {
          professionalId,
          clientId,
          serviceIds,
          startAt,
          notes: notes || undefined,
        });
      }
      return barbearia.appointments.createMine({
        companyId,
        professionalId,
        serviceIds,
        startAt,
        notes: notes || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Horário reservado.");
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setStartAt("");
      setClientId("");
      setClientQuery("");
      onSuccess?.();
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  function toggleService(id: string) {
    setStartAt("");
    setServiceIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!professionalId || !startAt || serviceIds.length === 0) {
          toast.error("Escolha profissional, serviços e horário.");
          return;
        }
        if (mode === "staff" && !clientId) {
          toast.error("Escolha o cliente.");
          return;
        }
        create.mutate();
      }}
    >
      {mode === "staff" ? (
        <Field label="Cliente">
          <ClientNameSearch
            query={clientQuery}
            open={clientOpen}
            loading={clientsQuery.isLoading}
            results={clientMatches}
            onQueryChange={(value) => {
              setClientQuery(value);
              setClientOpen(true);
              const selected = clientsQuery.data?.find((item) => item.id === clientId);
              if (selected && value !== selected.name) setClientId("");
            }}
            onFocus={() => setClientOpen(true)}
            onBlur={() => window.setTimeout(() => setClientOpen(false), 150)}
            onSelect={(client) => {
              setClientId(client.id);
              setClientQuery(client.name);
              setClientOpen(false);
            }}
          />
        </Field>
      ) : null}

      <Field label="Profissional">
        <NativeSelect
          value={professionalId}
          onChange={(event) => {
            setProfessionalId(event.target.value);
            setServiceIds([]);
            setStartAt("");
          }}
          required
        >
          <option value="">Selecione</option>
          {professionalsQuery.data
            ?.filter((item) => item.active)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </NativeSelect>
      </Field>

      {professional ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">Serviços</legend>
          {availableServices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Este profissional ainda não tem serviços vinculados.
            </p>
          ) : (
            availableServices.map((service) => (
              <label key={service.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={serviceIds.includes(service.id)}
                  onChange={() => toggleService(service.id)}
                />
                <span>{service.name}</span>
              </label>
            ))
          )}
        </fieldset>
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

      {serviceIds.length > 0 ? (
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
          {slotsQuery.data ? (
            <p className="text-muted-foreground text-xs">
              Duração estimada: {slotsQuery.data.durationMinutes} min
              {duration ? ` · ${duration} serviço(s)` : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <Field label="Observações">
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Opcional"
        />
      </Field>

      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Reservando…" : "Confirmar horário"}
      </Button>
    </form>
  );
}

function ClientNameSearch({
  query,
  open,
  loading,
  results,
  onQueryChange,
  onFocus,
  onBlur,
  onSelect,
}: {
  query: string;
  open: boolean;
  loading: boolean;
  results: ShopClient[];
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (client: ShopClient) => void;
}) {
  const showList = open && query.trim().length > 0;

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Digite o nome do cliente"
        autoComplete="off"
        required
      />
      {showList ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-white py-1 shadow-md">
          {loading ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">Buscando…</li>
          ) : results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">
              Nenhum cliente com esse nome.
            </li>
          ) : (
            results.map((client) => (
              <li key={client.id}>
                <button
                  type="button"
                  className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onSelect(client)}
                >
                  <span className="block font-medium">{client.name}</span>
                  <span className="text-muted-foreground block text-xs">
                    {client.phone || client.email || "Sem contato"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function ServicePriceHint({
  services,
  serviceIds,
}: {
  services: { id: string; name: string; price: string }[];
  serviceIds: string[];
}) {
  const total = services
    .filter((service) => serviceIds.includes(service.id))
    .reduce((sum, service) => sum + Number(service.price), 0);
  if (!total) return null;
  return <p className="text-sm">Total estimado: {money(total)}</p>;
}
