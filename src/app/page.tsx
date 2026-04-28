import { fetchSnapshots, fetchWallets } from "@/lib/supabase";
import {
  allTimeChange,
  changeOver,
  formatUsd,
  toPoints,
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

  const points = toPoints(snapshots);
  const latest = points.length ? points[points.length - 1] : null;
  const first = points.length ? points[0] : null;

  const c7 = changeOver(points, 7);
  const c30 = changeOver(points, 30);
  const cAll = allTimeChange(points);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Harvest Net Worth</h1>
          <p className="text-sm text-muted">
            {points.length} snapshot{points.length === 1 ? "" : "s"}
            {first && latest ? (
              <>
                {" "}
                · {new Date(first.t).toLocaleDateString()} →{" "}
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
              label="Current"
              value={latest ? formatUsd(latest.total) : "—"}
              subtitle={
                latest
                  ? `as of ${new Date(latest.t).toLocaleString()}`
                  : undefined
              }
            />
            <MetricCard label="7D" value={latest ? formatUsd(latest.total) : "—"} change={c7} />
            <MetricCard label="30D" value={latest ? formatUsd(latest.total) : "—"} change={c30} />
            <MetricCard
              label="All-time"
              value={latest ? formatUsd(latest.total) : "—"}
              change={cAll}
            />
          </div>

          <div className="mt-6">
            <NetWorthChart points={points} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MiniBreakdown
              label="Liquid balance"
              value={latest ? formatUsd(latest.balance) : "—"}
              hint="balance column"
            />
            <MiniBreakdown
              label="Harvest balance"
              value={latest ? formatUsd(latest.harvest) : "—"}
              hint="harvest_balance column"
            />
          </div>
        </>
      )}
    </main>
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
