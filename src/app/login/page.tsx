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

export default function StaffLoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const login = useMutation({
    mutationFn: (values: LoginInput) => barbearia.auth.loginStaff(values),
    onSuccess: (data) => {
      signIn({ type: "staff", token: data.token, user: data.user });
      toast.success("Bem-vindo de volta.");
      router.replace("/painel");
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <AuthCard
      title="Painel da barbearia"
      description="Entre com o login de dono ou funcionário."
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
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Ainda não tem barbearia?{" "}
        <Link href="/cadastro-barbearia" className="text-foreground underline">
          Cadastrar
        </Link>
      </p>
    </AuthCard>
  );
}
