"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, NativeSelect } from "@/components/field";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { onlyDigits, maskCpf, maskPhone } from "@/lib/format";
import { shopClientSchema, type ShopClientInput } from "@/schemas/forms";
import type { ShopClient } from "@/types/api";

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "name" | "email";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 20, 50] as const;

function clientMatches(client: ShopClient, query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  const digits = onlyDigits(term);
  const text = [client.name, client.phone, client.email, client.cpf]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (text.includes(term)) return true;
  if (digits.length >= 3) {
    const contactDigits = onlyDigits(`${client.phone ?? ""}${client.cpf ?? ""}`);
    return contactDigits.includes(digits);
  }
  return false;
}

export default function ClientesPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const form = useForm<ShopClientInput>({
    resolver: zodResolver(shopClientSchema),
    defaultValues: { name: "", phone: "", email: "", cpf: "" },
  });

  const clients = useQuery({
    queryKey: ["shop-clients", companyId],
    queryFn: () => barbearia.clients.list(companyId!),
    enabled: Boolean(companyId),
  });

  const create = useMutation({
    mutationFn: (values: ShopClientInput) =>
      barbearia.clients.create(companyId!, {
        name: values.name,
        phone: values.phone ? onlyDigits(values.phone) : undefined,
        email: values.email || undefined,
        cpf: values.cpf ? onlyDigits(values.cpf) : undefined,
      }),
    onSuccess: async () => {
      toast.success("Cliente cadastrado.");
      setOpen(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["shop-clients"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const list = useMemo(() => {
    const rows = (clients.data ?? []).filter((client) => {
      if (status === "active" && client.active === false) return false;
      if (status === "inactive" && client.active !== false) return false;
      return clientMatches(client, query);
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return rows.sort((a, b) => {
      const left = (sortKey === "name" ? a.name : a.email) ?? "";
      const right = (sortKey === "name" ? b.name : b.email) ?? "";
      const empty = Number(!left) - Number(!right);
      if (empty !== 0) return empty;
      return left.localeCompare(right, "pt-BR", { sensitivity: "base" }) * dir;
    });
  }, [clients.data, query, status, sortKey, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [query, status, pageSize, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  if (!companyId) return null;

  const total = clients.data?.length ?? 0;
  const hasFilters = query.trim().length > 0 || status !== "all";
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const from = list.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, list.length);
  const pageRows = list.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Clientes"
        description="Cadastro interno da casa (incluindo quem agenda no balcão)."
        action={<Button onClick={() => setOpen(true)}>Novo cliente</Button>}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Buscar" className="min-w-0 flex-1">
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, telefone, e-mail ou CPF"
              className="pl-8"
            />
          </div>
        </Field>
        <Field label="Situação" className="sm:w-44">
          <NativeSelect
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </NativeSelect>
        </Field>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery("");
              setStatus("all");
            }}
          >
            Limpar
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-sm">
        {clients.isLoading
          ? "Carregando…"
          : list.length === 0
            ? `${list.length} de ${total} cliente${total === 1 ? "" : "s"}`
            : `Mostrando ${from}–${to} de ${list.length} (total ${total})`}
      </p>

      {clients.isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando clientes…</p>
      ) : total === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          description="Cadastre quem veio no balcão ou espere o primeiro agendamento pelo app."
          action={<Button onClick={() => setOpen(true)}>Novo cliente</Button>}
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="Nenhum resultado"
          description="Ajuste a busca ou a situação e tente de novo."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setStatus("all");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton
                      label="Nome"
                      active={sortKey === "name"}
                      dir={sortDir}
                      onClick={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>
                    <SortButton
                      label="E-mail"
                      active={sortKey === "email"}
                      dir={sortDir}
                      onClick={() => toggleSort("email")}
                    />
                  </TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {client.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {client.phone || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {client.cpf || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={client.active === false ? "outline" : "default"}
                      >
                        {client.active === false ? "Inativo" : "Ativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
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
                onChange={(event) =>
                  setPageSize(Number(event.target.value) as (typeof PAGE_SIZES)[number])
                }
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
                onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
              >
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Telefone" error={form.formState.errors.phone?.message}>
              <Input
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(11) 99999-9999"
                {...form.register("phone", {
                  onChange: (event) => {
                    event.target.value = maskPhone(event.target.value);
                  },
                })}
              />
            </Field>
            <Field label="E-mail">
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="CPF" error={form.formState.errors.cpf?.message}>
              <Input
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...form.register("cpf", {
                  onChange: (event) => {
                    event.target.value = maskCpf(event.target.value);
                  },
                })}
              />
            </Field>
            <Button type="submit" disabled={create.isPending}>
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:text-foreground inline-flex items-center gap-1"
    >
      {label}
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ArrowUpDown className="text-muted-foreground size-3.5" />
      )}
    </button>
  );
}
