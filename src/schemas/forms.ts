"use client";

import { z } from "zod";

import { onlyDigits } from "@/lib/format";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
});

export const clientRegisterSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
  phone: z.string().optional(),
  cpf: z
    .string()
    .optional()
    .refine((value) => !value || onlyDigits(value).length === 11, "CPF deve ter 11 dígitos"),
});

export const onboardSchema = z.object({
  companyName: z.string().min(2, "Informe o nome da barbearia"),
  cnpj: z
    .string()
    .refine((value) => onlyDigits(value).length === 14, "CNPJ deve ter 14 dígitos"),
  name: z.string().min(2, "Informe o seu nome"),
  email: z.email("Informe um e-mail válido"),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres"),
});

export const serviceSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional(),
  price: z.string().min(1, "Informe o preço"),
  durationMinutes: z.string().min(1, "Informe a duração"),
});

export const professionalSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  cpf: z
    .string()
    .refine((value) => onlyDigits(value).length === 11, "CPF deve ter 11 dígitos"),
  phone: z.string().optional(),
  email: z.string().optional(),
});

export const shopClientSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  phone: z
    .string()
    .optional()
    .refine(
      (value) => !value || [10, 11].includes(onlyDigits(value).length),
      "Telefone deve ter 10 ou 11 dígitos",
    ),
  email: z.string().optional(),
  cpf: z
    .string()
    .optional()
    .refine(
      (value) => !value || onlyDigits(value).length === 11,
      "CPF deve ter 11 dígitos",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientRegisterInput = z.infer<typeof clientRegisterSchema>;
export type OnboardInput = z.infer<typeof onboardSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type ProfessionalInput = z.infer<typeof professionalSchema>;
export type ShopClientInput = z.infer<typeof shopClientSchema>;
