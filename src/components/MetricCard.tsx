type Props = {
  label: string;
  primary: string;
  secondary?: string;
  primaryClassName?: string;
};

export function MetricCard({ label, primary, secondary, primaryClassName }: Props) {
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          primaryClassName ?? "text-white"
        }`}
      >
        {primary}
      </div>
      <div className="mt-1 text-sm text-muted">{secondary ?? "—"}</div>
    </div>
  );
}

export function pctColorClass(pct: number | null): string {
  if (pct === null) return "text-white";
  if (pct >= 25) return "text-emerald-400";
  if (pct >= 10) return "text-green-400";
  if (pct >= 3) return "text-lime-400";
  if (pct > -3) return "text-white";
  if (pct >= -10) return "text-yellow-400";
  if (pct >= -25) return "text-orange-400";
  if (pct >= -50) return "text-orange-500";
  return "text-red-500";
}
