"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { money } from "@/lib/format";

export const METHOD_COLORS = {
  PIX: "#059669",
  CARD: "#0284c7",
  CASH: "#d97706",
} as const;

export function RevenueAreaChart({
  data,
}: {
  data: { date: string; label: string; total: number }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8B923" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#E8B923" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece7d8" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#737373" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#737373" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value)
            }
            width={42}
          />
          <Tooltip
            cursor={{ stroke: "#E8B923", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const point = payload[0].payload as { date: string; total: number };
              return (
                <div className="rounded-lg border bg-white px-3 py-2 text-sm shadow-md">
                  <p className="text-muted-foreground text-xs">{point.date}</p>
                  <p className="font-semibold">{money(point.total)}</p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#C9A227"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MethodPieChart({
  data,
}: {
  data: { method: string; label: string; value: number; color: string }[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-4 sm:flex-row">
      <div className="size-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item) => (
                <Cell key={item.method} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => money(Number(value ?? 0))}
              contentStyle={{ borderRadius: 10, border: "1px solid #e5e5e5" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2 text-sm">
        {data.map((item) => (
          <li key={item.method} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </span>
            <span className="tabular-nums font-medium">
              {total ? Math.round((item.value / total) * 100) : 0}%
              <span className="text-muted-foreground ml-2 font-normal">
                {money(item.value)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
