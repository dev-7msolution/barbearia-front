"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyState, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { barbearia } from "@/lib/api/barbearia";

export default function ClienteHomePage() {
  const companies = useQuery({
    queryKey: ["companies"],
    queryFn: () => barbearia.companies.list(),
  });

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Escolha a casa"
        description="Todas as barbearias ativas no sistema."
      />
      {companies.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : companies.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.data.map((company) => (
            <Link key={company.id} href={`/cliente/${company.id}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader>
                  <CardTitle className="font-heading text-2xl">
                    {company.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Ver profissionais e horários
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Nenhuma barbearia disponível agora" />
      )}
    </div>
  );
}
