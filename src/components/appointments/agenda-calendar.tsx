"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import {
  dateAndMinutesToISO,
  formatTimeUTC,
  isoToMinutesUTC,
} from "@/lib/format";
import type { Appointment, Professional } from "@/types/api";

const ROW_PX = 22;
const STEP = 15;
const START = 8 * 60;
const END = 20 * 60;

const statusClass: Record<Appointment["status"], string> = {
  SCHEDULED:
    "bg-sky-600 text-white border-sky-500/30 cursor-grab active:cursor-grabbing dark:bg-sky-500",
  COMPLETED:
    "bg-emerald-600 text-white border-emerald-500/30 dark:bg-emerald-500",
  CANCELLED:
    "bg-red-500/15 text-red-800 border-red-500/20 dark:text-red-300",
  NO_SHOW:
    "bg-amber-500/15 text-amber-900 border-amber-500/20 dark:text-amber-300",
};

export function AgendaCalendar({
  date,
  appointments,
  professionals,
  onMove,
  onStatus,
}: {
  date: string;
  appointments: Appointment[];
  professionals: Professional[];
  onMove: (id: string, startAt: string, professionalId: string) => void;
  onStatus: (id: string, status: "COMPLETED" | "NO_SHOW") => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const columns = useMemo(
    () => professionals.filter((item) => item.active),
    [professionals],
  );

  const slots = useMemo(() => {
    const list: number[] = [];
    for (let minutes = START; minutes < END; minutes += STEP) list.push(minutes);
    return list;
  }, []);

  const height = slots.length * ROW_PX;

  if (columns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Cadastre um profissional para ver o calendário.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <div
        className="min-w-max"
        style={{
          display: "grid",
          gridTemplateColumns: `72px repeat(${columns.length}, minmax(196px, 1fr))`,
        }}
      >
        <div className="bg-muted/50 sticky left-0 z-20 border-b border-r px-2 py-3 text-xs font-medium">
          Horário
        </div>
        {columns.map((pro) => (
          <div
            key={pro.id}
            className="border-b px-3 py-3 text-sm font-medium"
          >
            {pro.name}
          </div>
        ))}

        <div className="bg-background sticky left-0 z-10 border-r">
          {slots.map((minutes) => (
            <div
              key={minutes}
              className="text-muted-foreground border-b px-2 text-[11px] leading-[22px]"
              style={{ height: ROW_PX }}
            >
              {minutes % 60 === 0
                ? `${String(Math.floor(minutes / 60)).padStart(2, "0")}:00`
                : ""}
            </div>
          ))}
        </div>

        {columns.map((pro) => {
          const items = appointments.filter(
            (item) => item.professionalId === pro.id,
          );
          return (
            <div key={pro.id} className="relative border-l" style={{ height }}>
              {slots.map((minutes) => {
                const key = `${pro.id}-${minutes}`;
                return (
                  <div
                    key={key}
                    className={cn(
                      "border-b",
                      minutes % 60 === 0 ? "border-border" : "border-border/40",
                      overKey === key && draggingId
                        ? "bg-primary/15"
                        : minutes % 60 === 0
                          ? "bg-transparent"
                          : "bg-transparent",
                    )}
                    style={{ height: ROW_PX }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setOverKey(key);
                    }}
                    onDragLeave={() => {
                      setOverKey((current) => (current === key ? null : current));
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const id =
                        event.dataTransfer.getData("text/appointment-id") ||
                        draggingId;
                      setOverKey(null);
                      setDraggingId(null);
                      if (!id) return;
                      const current = appointments.find((item) => item.id === id);
                      const startAt = dateAndMinutesToISO(date, minutes);
                      if (
                        current?.professionalId === pro.id &&
                        current.startAt === startAt
                      ) {
                        return;
                      }
                      onMove(id, startAt, pro.id);
                    }}
                  />
                );
              })}

              {items.map((item) => {
                const start = isoToMinutesUTC(item.startAt);
                const duration =
                  item.services.reduce((sum, line) => sum + line.durationMinutes, 0) ||
                  Math.max(STEP, isoToMinutesUTC(item.endAt) - start);
                const top = ((start - START) / STEP) * ROW_PX;
                const minRows = item.status === "SCHEDULED" ? 4 : 2;
                const blockHeight = Math.max(
                  ROW_PX * minRows - 4,
                  (duration / STEP) * ROW_PX - 4,
                );
                const canDrag = item.status === "SCHEDULED";

                return (
                  <article
                    key={item.id}
                    draggable={canDrag}
                    onDragStart={(event) => {
                      if ((event.target as HTMLElement).closest("button, a")) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData("text/appointment-id", item.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverKey(null);
                    }}
                    className={cn(
                      "absolute right-1 left-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-xs shadow-sm",
                      statusClass[item.status],
                      draggingId === item.id && "opacity-40",
                      draggingId && "pointer-events-none",
                      !canDrag && "cursor-default",
                    )}
                    style={{ top: top + 2, height: blockHeight }}
                    title={`${item.client?.name ?? "Cliente"} · ${formatTimeUTC(item.startAt)}`}
                  >
                    <p className="truncate font-medium">
                      {item.client?.name ?? "Cliente"}
                    </p>
                    <p className="truncate opacity-80">
                      {formatTimeUTC(item.startAt)} ·{" "}
                      {item.services.map((s) => s.serviceName).join(", ")}
                    </p>
                    {canDrag ? (
                      <div
                        className="mt-1 flex gap-1"
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        <Link
                          href={`/painel/agenda/${item.id}`}
                          className="rounded bg-white/90 px-1.5 py-0.5 font-medium text-sky-800"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Editar
                        </Link>
                        <button
                          type="button"
                          className="rounded bg-white px-1.5 py-0.5 font-medium text-emerald-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            onStatus(item.id, "COMPLETED");
                          }}
                        >
                          Concluir
                        </button>
                        <button
                          type="button"
                          className="rounded border border-white/50 px-1.5 py-0.5 font-medium text-white"
                          onClick={(event) => {
                            event.stopPropagation();
                            onStatus(item.id, "NO_SHOW");
                          }}
                        >
                          Falta
                        </button>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
