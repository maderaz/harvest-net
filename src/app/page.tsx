import { fetchSnapshots, fetchWallets } from "@/lib/supabase";
import {
  aggregatePoints,
  allTimeChange,
  changeOver,
  formatPct,
  formatSignedCompactUsd,
  formatCompactUsd,
  toPoints,
  type Change,
} from "@/lib/metrics";
import { MetricCard } from "@/components/MetricCard";
import { NetWorthChart } from "@/components/NetWorthChart";
import { WalletSelector } from "@/components/WalletSelector";

export const dynamic = "force-dynamic";
export const revalidate = 60;

type SearchParams = { wallet?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const walletFilter = sp.wallet?.trim() || null;

  const [snapshots, wallets] = await Promise.all([
    fetchSnapshots(walletFilter ?? undefined),
    fetchWallets(),
  ]);

  const points = walletFilter ? toPoints(snapshots) : aggregatePoints(snapshots);
  const latest = points.length ? points[points.length - 1] : null;
  const first = points.length ? points[0] : null;

  const c7 = changeOver(points, 7);
  const c30 = changeOver(points, 30);
  const cAll = allTimeChange(points);

  const headerSubtitle = walletFilter
    ? `${snapshots.length} snapshot${snapshots.length === 1 ? "" : "s"} for this wallet`
    : `Aggregated across ${wallets.length} wallet${wallets.length === 1 ? "" : "s"} · ${snapshots.length} snapshot${snapshots.length === 1 ? "" : "s"}`;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Harvest Net Worth</h1>
          <p className="text-sm text-muted">
            {headerSubtitle}
            {first && latest ? (
              <>
                {" · "}
                {new Date(first.t).toLocaleDateString()} →{" "}
                {new Date(latest.t).toLocaleDateString()}
              </>
            ) : null}
          </p>
        </div>
        <WalletSelector wallets={wallets} current={walletFilter} />
      </header>

      {points.length === 0 ? (
        <EmptyState filtered={!!walletFilter} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label={walletFilter ? "Current" : "Current AUM"}
              primary={latest ? formatCompactUsd(latest.total) : "—"}
              secondary={
                latest ? `as of ${new Date(latest.t).toLocaleString()}` : undefined
              }
            />
            <ChangeCard label="7D" change={c7} />
            <ChangeCard label="30D" change={c30} />
            <ChangeCard label="All-time" change={cAll} />
          </div>

          <div className="mt-6">
            <NetWorthChart points={points} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MiniBreakdown
              label={walletFilter ? "Liquid balance" : "Liquid balance (sum)"}
              value={latest ? formatCompactUsd(latest.balance) : "—"}
              hint="balance column"
            />
            <MiniBreakdown
              label={walletFilter ? "Harvest balance" : "Harvest balance (sum)"}
              value={latest ? formatCompactUsd(latest.harvest) : "—"}
              hint="harvest_balance column"
            />
          </div>
        </>
      )}
    </main>
  );
}

function ChangeCard({ label, change }: { label: string; change: Change }) {
  if (!change) {
    return (
      <MetricCard label={label} primary="—" secondary="Not enough history" />
    );
  }
  const trend = change.abs > 0 ? "up" : change.abs < 0 ? "down" : "flat";
  return (
    <MetricCard
      label={label}
      primary={formatSignedCompactUsd(change.abs)}
      secondary={`${formatPct(change.pct)} · was ${formatCompactUsd(change.from.total)}`}
      trend={trend}
    />
  );
}

function MiniBreakdown({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-panel p-10 text-center">
      <div className="text-lg font-medium">No snapshots yet</div>
      <div className="mt-2 text-sm text-muted">
        {filtered
          ? "Nothing for that wallet. Pick another or clear the filter."
          : "Once your tracker writes rows to Supabase they will show up here."}
      </div>
    </div>
  );
}
