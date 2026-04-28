type Trend = "up" | "down" | "flat";

type Props = {
  label: string;
  primary: string;
  secondary?: string;
  trend?: Trend;
};

export function MetricCard({ label, primary, secondary, trend = "flat" }: Props) {
  const color =
    trend === "up" ? "text-accent" : trend === "down" ? "text-danger" : "text-white";

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-2 text-3xl font-semibold tabular-nums ${color}`}>
        {primary}
      </div>
      <div className="mt-1 text-sm text-muted">{secondary ?? "—"}</div>
    </div>
  );
}
