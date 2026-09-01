"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field, NativeSelect } from "@/components/field";
import { EmptyState, PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { money } from "@/lib/format";
import { serviceSchema, type ServiceInput } from "@/schemas/forms";
import type { Service } from "@/types/api";

const PAGE_SIZES = [10, 20, 50] as const;

export default function ServicosPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: "", description: "", price: "", durationMinutes: "30" },
  });

  const services = useQuery({
    queryKey: ["services", companyId],
    queryFn: () => barbearia.services.list(companyId!),
    enabled: Boolean(companyId),
  });

  const create = useMutation({
    mutationFn: (values: ServiceInput) =>
      barbearia.services.create(companyId!, {
        name: values.name,
        description: values.description || undefined,
        price: Number(values.price),
        durationMinutes: Number(values.durationMinutes),
      }),
    onSuccess: async () => {
      toast.success("Serviço cadastrado.");
      setOpen(false);
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => barbearia.services.remove(companyId!, id),
    onSuccess: async () => {
      toast.success("Serviço desativado.");
      await queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const reactivate = useMutation({
    mutationFn: (id: string) =>
      barbearia.services.update(companyId!, id, { active: true }),
    onSuccess: async () => {
      toast.success("Serviço reativado.");
      await queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const list = useMemo(() => {
    return [...(services.data ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
    );
  }, [services.data]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, list.length]);

  if (!companyId) return null;

  const total = list.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);
  const pageRows: Service[] = list.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Serviços"
        description="Preço e duração desta barbearia."
        action={<Button onClick={() => setOpen(true)}>Novo serviço</Button>}
      />

      {services.isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando serviços…</p>
      ) : total === 0 ? (
        <EmptyState
          title="Nenhum serviço"
          action={<Button onClick={() => setOpen(true)}>Cadastrar</Button>}
        />
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            Mostrando {from}–{to} de {total}
          </p>
          <div className="overflow-hidden rounded-xl border bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((service) => (
                    <TableRow
                      key={service.id}
                      className={!service.active ? "opacity-50" : ""}
                    >
                      <TableCell>
                        <div className="font-medium">{service.name}</div>
                        {service.description ? (
                          <div className="text-muted-foreground text-xs">
                            {service.description}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {service.durationMinutes} min
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {money(service.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {service.active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(service.id)}
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={reactivate.isPending}
                            onClick={() => reactivate.mutate(service.id)}
                          >
                            Reativar
                          </Button>
                        )}
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
                    setPageSize(
                      Number(event.target.value) as (typeof PAGE_SIZES)[number],
                    )
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
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo serviço</DialogTitle>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <Field label="Nome" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Descrição">
              <Textarea {...form.register("description")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preço" error={form.formState.errors.price?.message}>
                <Input type="number" step="0.01" {...form.register("price")} />
              </Field>
              <Field
                label="Minutos"
                error={form.formState.errors.durationMinutes?.message}
              >
                <Input type="number" {...form.register("durationMinutes")} />
              </Field>
            </div>
            <Button type="submit" disabled={create.isPending}>
              Salvar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
