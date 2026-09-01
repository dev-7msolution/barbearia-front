"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Field } from "@/components/field";
import { AuthCard } from "@/components/layout/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { barbearia } from "@/lib/api/barbearia";
import { getApiErrorMessage } from "@/lib/api/errors";
import { onlyDigits } from "@/lib/format";
import {
  clientRegisterSchema,
  type ClientRegisterInput,
} from "@/schemas/forms";

export default function ClientRegisterPage() {
  const router = useRouter();
  const form = useForm<ClientRegisterInput>({
    resolver: zodResolver(clientRegisterSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", cpf: "" },
  });

  const register = useMutation({
    mutationFn: (values: ClientRegisterInput) =>
      barbearia.auth.registerClient({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        cpf: values.cpf ? onlyDigits(values.cpf) : undefined,
      }),
    onSuccess: () => {
      toast.success("Conta criada. Entre para agendar.");
      router.replace("/entrar");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <AuthCard
      panel="client"
      title="Criar conta"
      description="Cadastro livre — depois você escolhe a barbearia."
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => register.mutate(values))}
      >
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input type="password" {...form.register("password")} />
        </Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}>
          <Input {...form.register("phone")} placeholder="Opcional" />
        </Field>
        <Field label="CPF" error={form.formState.errors.cpf?.message}>
          <Input {...form.register("cpf")} placeholder="Somente números" />
        </Field>
        <Button type="submit" disabled={register.isPending}>
          {register.isPending ? "Criando…" : "Cadastrar"}
        </Button>
      </form>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-foreground underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
