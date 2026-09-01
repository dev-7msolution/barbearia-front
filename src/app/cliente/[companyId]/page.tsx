"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";

import { BookingForm } from "@/components/appointments/booking-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { barbearia } from "@/lib/api/barbearia";
import { money } from "@/lib/format";

export default function BookingPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);

  const company = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => barbearia.companies.get(companyId),
  });
  const services = useQuery({
    queryKey: ["services", companyId],
    queryFn: () => barbearia.services.list(companyId),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-6">
        <PageHeader
          title={company.data?.name ?? "Agendar"}
          description="Escolha o barbeiro, os serviços e um horário livre."
        />
        <Card>
          <CardContent className="pt-1">
            <BookingForm companyId={companyId} mode="client" />
          </CardContent>
        </Card>
      </div>
      <aside className="grid gap-3 self-start">
        <p className="text-sm font-medium">Cardápio</p>
        {services.data
          ?.filter((s) => s.active)
          .map((service) => (
            <div key={service.id} className="rounded-xl border p-4">
              <p className="font-medium">{service.name}</p>
              <p className="text-muted-foreground text-sm">
                {service.durationMinutes} min · {money(service.price)}
              </p>
            </div>
          ))}
      </aside>
    </div>
  );
}
