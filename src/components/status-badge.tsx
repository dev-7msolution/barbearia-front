import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, PaymentMethod } from "@/types/api";

const statusLabel: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const statusClass: Record<AppointmentStatus, string> = {
  SCHEDULED:
    "border-transparent bg-sky-500/15 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300",
  COMPLETED:
    "border-transparent bg-emerald-500/15 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  CANCELLED:
    "border-transparent bg-red-500/15 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  NO_SHOW:
    "border-transparent bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <Badge variant="outline" className={cn(statusClass[status])}>
      {statusLabel[status]}
    </Badge>
  );
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  CARD: "Cartão",
  PIX: "Pix",
};
