"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Point } from "@/lib/metrics";
import { filterByDays, formatUsd } from "@/lib/metrics";

type Range = { label: string; days: number | null };

const RANGES: Range[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

type Mode = "area" | "lines";

export function NetWorthChart({ points }: { points: Point[] }) {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [mode, setMode] = useState<Mode>("area");

  const range = RANGES[rangeIdx];
  const filtered = useMemo(() => filterByDays(points, range.days), [points, range.days]);

  const data = useMemo(
    () =>
      filtered.map((p) => ({
        t: p.t,
        date: new Date(p.t).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        Total: Math.round(p.total),
        Balance: Math.round(p.balance),
        Harvest: Math.round(p.harvest),
      })),
    [filtered],
  );

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Net worth over time</div>
          <div className="text-sm text-muted">
            {filtered.length} snapshot{filtered.length === 1 ? "" : "s"} in range
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border bg-bg p-1">
            {(["area", "lines"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs ${
                  mode === m ? "bg-panel text-white" : "text-muted hover:text-white"
                }`}
              >
                {m === "area" ? "Total" : "Breakdown"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border bg-bg p-1">
            {RANGES.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setRangeIdx(i)}
                className={`rounded-md px-3 py-1 text-xs ${
                  i === rangeIdx ? "bg-panel text-white" : "text-muted hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "area" ? (
            <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f252d" vertical={false} />
              <XAxis dataKey="date" stroke="#8a93a0" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#8a93a0"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0d10",
                  border: "1px solid #1f252d",
                  borderRadius: 8,
                  color: "#e6e9ee",
                }}
                formatter={(v: number) => formatUsd(v)}
              />
              <Area
                type="monotone"
                dataKey="Total"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#totalFill)"
              />
            </AreaChart>
          ) : (
            <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f252d" vertical={false} />
              <XAxis dataKey="date" stroke="#8a93a0" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#8a93a0"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  background: "#0b0d10",
                  border: "1px solid #1f252d",
                  borderRadius: 8,
                  color: "#e6e9ee",
                }}
                formatter={(v: number) => formatUsd(v)}
              />
              <Legend wrapperStyle={{ color: "#8a93a0" }} />
              <Line type="monotone" dataKey="Total" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Balance" stroke="#60a5fa" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Harvest" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
