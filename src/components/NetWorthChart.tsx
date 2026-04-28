"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
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

const DISPLAY_CAP = 500_000_000;

type Range = { label: string; days: number | null };

const RANGES: Range[] = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

const DEFAULT_RANGE_IDX = RANGES.findIndex((r) => r.days === null);

type Row = {
  label: string;
  Total: number;
  realTotal: number;
  capped: boolean;
  visitors: number;
};

export function NetWorthChart({ days }: { days: DayPoint[] }) {
  const [rangeIdx, setRangeIdx] = useState(DEFAULT_RANGE_IDX);

  const range = RANGES[rangeIdx];
  const filtered = useMemo(() => filterByDays(days, range.days), [days, range.days]);

  const data: Row[] = useMemo(
    () =>
      filtered.map((d) => {
        const real = Math.round(d.total);
        const capped = real > DISPLAY_CAP;
        return {
          label: d.label,
          Total: capped ? DISPLAY_CAP : real,
          realTotal: real,
          capped,
          visitors: d.visitors,
        };
      }),
    [filtered],
  );

  const cappedCount = useMemo(() => data.filter((d) => d.capped).length, [data]);

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
            {filtered.length} day{filtered.length === 1 ? "" : "s"} in range
            {cappedCount > 0 ? (
              <>
                {" · "}
                <span className="text-danger">
                  {cappedCount} day{cappedCount === 1 ? "" : "s"} capped at $500M (likely outliers)
                </span>
              </>
            ) : null}
          </div>
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

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1f252d" vertical={false} />
            <XAxis dataKey="label" stroke="#8a93a0" tickLine={false} axisLine={false} />
            <YAxis
              stroke="#8a93a0"
              tickLine={false}
              axisLine={false}
              tickFormatter={axisFmt}
              width={70}
              domain={[0, DISPLAY_CAP]}
              allowDataOverflow
            />
            <Tooltip content={<DailyTooltip />} cursor={{ fill: "#1f252d" }} />
            {cappedCount > 0 ? (
              <ReferenceLine
                y={DISPLAY_CAP}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: "$500M cap",
                  fill: "#ef4444",
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
            ) : null}
            <Bar
              dataKey="Total"
              name="Daily total"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((row, i) => (
                <Cell key={i} fill={row.capped ? "#ef4444" : "#22c55e"} />
              ))}
            </Bar>
          </BarChart>
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
        <span className={row.capped ? "text-danger" : "text-white"}>
          {formatCompactUsd(row.realTotal)}
        </span>
        <span className="text-muted">Visitors</span>
        <span className="text-white">{row.visitors.toLocaleString()}</span>
      </div>
      {row.capped ? (
        <div className="mt-2 text-xs text-danger">
          Bar capped at $500M for display · likely an outlier wallet
        </div>
      ) : null}
    </div>
  );
}
