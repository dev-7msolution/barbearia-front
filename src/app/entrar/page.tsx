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
import { loginSchema, type LoginInput } from "@/schemas/forms";

export default function ClientLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: (values: LoginInput) => barbearia.auth.loginClient(values),
    onSuccess: (data) => {
      signIn({ type: "client", token: data.token, client: data.client });
      toast.success("Pronto para agendar.");
      router.replace("/cliente");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <AuthCard
      panel="client"
      title="Entrar"
      description="Use o e-mail e a senha da sua conta para agendar."
    >
      <form
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
      >
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
        </Field>
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-neutral-500">
        Novo por aqui?{" "}
        <Link href="/cadastro" className="text-neutral-950 underline">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
