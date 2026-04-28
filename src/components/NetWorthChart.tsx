"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint } from "@/lib/metrics";
import {
  filterByDays,
  formatCompactUsd,
  pickAxisFormatter,
} from "@/lib/metrics";

type Range = { label: string; days: number | null };

const RANGES: Range[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

type Mode = "total" | "breakdown";

type Row = {
  label: string;
  Total: number;
  Balance: number;
  Harvest: number;
  visitors: number;
  ma7: number | null;
};

export function NetWorthChart({ days }: { days: DayPoint[] }) {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [mode, setMode] = useState<Mode>("total");

  const range = RANGES[rangeIdx];
  const filtered = useMemo(() => filterByDays(days, range.days), [days, range.days]);

  const data: Row[] = useMemo(
    () =>
      filtered.map((d) => ({
        label: d.label,
        Total: Math.round(d.total),
        Balance: Math.round(d.balance),
        Harvest: Math.round(d.harvest),
        visitors: d.visitors,
        ma7: d.ma7 === null ? null : Math.round(d.ma7),
      })),
    [filtered],
  );

  const maxValue = useMemo(() => {
    let m = 0;
    for (const d of data) m = Math.max(m, d.Total);
    return m;
  }, [data]);

  const axisFmt = useMemo(() => pickAxisFormatter(maxValue), [maxValue]);

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Daily visitor net worth</div>
          <div className="text-sm text-muted">
            {filtered.length} day{filtered.length === 1 ? "" : "s"} in range · 7-day moving average overlaid
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border bg-bg p-1">
            {(["total", "breakdown"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs ${
                  mode === m ? "bg-panel text-white" : "text-muted hover:text-white"
                }`}
              >
                {m === "total" ? "Total" : "Breakdown"}
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
          {mode === "total" ? (
            <ComposedChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f252d" vertical={false} />
              <XAxis dataKey="label" stroke="#8a93a0" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#8a93a0"
                tickLine={false}
                axisLine={false}
                tickFormatter={axisFmt}
                width={70}
              />
              <Tooltip content={<DailyTooltip />} cursor={{ fill: "#1f252d" }} />
              <Legend wrapperStyle={{ color: "#8a93a0" }} />
              <Bar
                dataKey="Total"
                name="Daily total"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                type="monotone"
                dataKey="ma7"
                name="7-day avg"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            </ComposedChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#1f252d" vertical={false} />
              <XAxis dataKey="label" stroke="#8a93a0" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#8a93a0"
                tickLine={false}
                axisLine={false}
                tickFormatter={axisFmt}
                width={70}
              />
              <Tooltip content={<DailyTooltip />} cursor={{ fill: "#1f252d" }} />
              <Legend wrapperStyle={{ color: "#8a93a0" }} />
              <Bar
                dataKey="Balance"
                stackId="b"
                fill="#60a5fa"
                radius={[0, 0, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Harvest"
                stackId="b"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DailyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: Row }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-bg p-3 text-sm">
      <div className="mb-1 font-medium text-white">{label}</div>
      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 tabular-nums">
        <span className="text-muted">Total</span>
        <span className="text-white">{formatCompactUsd(row.Total)}</span>
        <span className="text-muted">Balance</span>
        <span className="text-white">{formatCompactUsd(row.Balance)}</span>
        <span className="text-muted">Harvest</span>
        <span className="text-white">{formatCompactUsd(row.Harvest)}</span>
        <span className="text-muted">Visitors</span>
        <span className="text-white">{row.visitors.toLocaleString()}</span>
        {row.ma7 !== null ? (
          <>
            <span className="text-muted">7d avg</span>
            <span className="text-white">{formatCompactUsd(row.ma7)}</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
