"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { AuthCard } from "@/components/layout/auth-card";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { onlyDigits } from "@/lib/format";
import { onboardSchema, type OnboardInput } from "@/schemas/forms";

export default function OnboardPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const form = useForm<OnboardInput>({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      companyName: "",
      cnpj: "",
      name: "",
      email: "",
      password: "",
    },
  });

  const onboard = useMutation({
    mutationFn: async (values: OnboardInput) => {
      const company = await barbearia.companies.create({
        name: values.companyName,
        cnpj: onlyDigits(values.cnpj),
      });
      await barbearia.auth.createUser({
        name: values.name,
        email: values.email,
        password: values.password,
        companyIds: [company.id],
      });
      return barbearia.auth.loginStaff({
        email: values.email,
        password: values.password,
      });
    },
    onSuccess: (data) => {
      signIn({ type: "staff", token: data.token, user: data.user });
      toast.success("Barbearia criada. Agora cadastre serviços e profissionais.");
      router.replace("/painel");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <AuthCard
      title="Abrir sua barbearia"
      description="Cria a empresa e o primeiro acesso de gestão."
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => onboard.mutate(values))}
      >
        <Field
          label="Nome da barbearia"
          error={form.formState.errors.companyName?.message}
        >
          <Input {...form.register("companyName")} />
        </Field>
        <Field label="CNPJ" error={form.formState.errors.cnpj?.message}>
          <Input {...form.register("cnpj")} placeholder="14 dígitos" />
        </Field>
        <Field label="Seu nome" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
        <Button type="submit" disabled={onboard.isPending}>
          {onboard.isPending ? "Criando…" : "Começar"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem acesso?{" "}
        <Link href="/login" className="text-foreground underline">
          Entrar no painel
        </Link>
      </p>
    </AuthCard>
  );
}
