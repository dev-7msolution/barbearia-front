"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { EmptyState, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatDateTimeUTC, money } from "@/lib/format";

export default function MeusAgendamentosPage() {
  const queryClient = useQueryClient();
  const appointments = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => barbearia.appointments.listMine(),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => barbearia.appointments.cancelMine(id),
    onSuccess: async () => {
      toast.success("Horário cancelado.");
      await queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const list = appointments.data ?? [];

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Meus horários"
        description="Agendamentos em todas as barbearias."
      />
      {list.length === 0 ? (
        <EmptyState title="Você ainda não tem horários marcados" />
      ) : (
        <div className="grid gap-4">
          {list.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{item.company?.name ?? "Barbearia"}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {formatDateTimeUTC(item.startAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm">
                    {item.services.map((s) => s.serviceName).join(", ")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {money(
                      item.services.reduce((sum, s) => sum + Number(s.price), 0),
                    )}
                  </p>
                </div>
                {item.status === "SCHEDULED" ? (
                  <Button
                    variant="outline"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(item.id)}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
