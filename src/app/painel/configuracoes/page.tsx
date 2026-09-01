"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";

export default function ConfiguracoesPage() {
  const { companyId, session } = useAuth();
  const queryClient = useQueryClient();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [minutesDraft, setMinutesDraft] = useState<string | null>(null);

  const company = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => barbearia.companies.get(companyId!),
    enabled: Boolean(companyId),
  });
  const settings = useQuery({
    queryKey: ["settings", companyId],
    queryFn: () => barbearia.companies.settings(companyId!),
    enabled: Boolean(companyId),
  });

  const name = nameDraft ?? company.data?.name ?? "";
  const minutes =
    minutesDraft ?? String(settings.data?.cancellationMinNoticeMinutes ?? 0);

  const saveCompany = useMutation({
    mutationFn: () => barbearia.companies.update(companyId!, { name }),
    onSuccess: async () => {
      toast.success("Nome atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["company"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const saveSettings = useMutation({
    mutationFn: () =>
      barbearia.companies.updateSettings(companyId!, {
        cancellationMinNoticeMinutes: Number(minutes),
      }),
    onSuccess: () => toast.success("Regra de cancelamento salva."),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (!companyId) return null;

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Configurações"
        description={
          session?.type === "staff" ? session.user.email : undefined
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Barbearia</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-md gap-4">
          <Field label="Nome">
            <Input value={name} onChange={(e) => setNameDraft(e.target.value)} />
          </Field>
          <Button
            onClick={() => saveCompany.mutate()}
            disabled={saveCompany.isPending}
          >
            Salvar nome
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cancelamento pelo cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-md gap-4">
          <Field label="Antecedência mínima (minutos)">
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutesDraft(e.target.value)}
            />
          </Field>
          <p className="text-muted-foreground text-sm">
            0 libera cancelar a qualquer momento. 120 exige 2 horas de
            antecedência.
          </p>
          <Button
            onClick={() => saveSettings.mutate()}
            disabled={saveSettings.isPending}
          >
            Salvar regra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
