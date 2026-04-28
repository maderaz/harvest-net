import type { Change } from "@/lib/metrics";
import { formatPct, formatSignedUsd } from "@/lib/metrics";

type Props = {
  label: string;
  value: string;
  change?: Change;
  subtitle?: string;
};

export function MetricCard({ label, value, change, subtitle }: Props) {
  const trend = change && change.abs !== 0 ? (change.abs > 0 ? "up" : "down") : "flat";
  const color =
    trend === "up" ? "text-accent" : trend === "down" ? "text-danger" : "text-muted";

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
      {change ? (
        <div className={`mt-1 text-sm tabular-nums ${color}`}>
          {formatSignedUsd(change.abs)} ({formatPct(change.pct)})
        </div>
      ) : subtitle ? (
        <div className="mt-1 text-sm text-muted">{subtitle}</div>
      ) : (
        <div className="mt-1 text-sm text-muted">—</div>
      )}
    </div>
  );
}
