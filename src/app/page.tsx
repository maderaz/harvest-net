import { fetchSnapshots, fetchWallets } from "@/lib/supabase";
import {
  buildRichList,
  dailyAggregates,
  formatCompactUsd,
  formatDate,
  formatPct,
  latestDay,
  peakDay,
  pctChange,
  rollingAverage,
  type DailyMetric,
} from "@/lib/metrics";
import { MetricCard } from "@/components/MetricCard";
import { NetWorthChart } from "@/components/NetWorthChart";
import { RichList } from "@/components/RichList";
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

  const days = dailyAggregates(snapshots);
  const latest = latestDay(days);
  const first = days.length ? days[0] : null;
  const avg7 = rollingAverage(days, 7);
  const avg30 = rollingAverage(days, 30);
  const peak = peakDay(days);
  const richList = buildRichList(snapshots, 10_000, 20);

  const headerSubtitle = walletFilter
    ? `${snapshots.length} snapshot${snapshots.length === 1 ? "" : "s"} for this wallet`
    : `${wallets.length} wallets · ${snapshots.length} snapshots · ${days.length} day${days.length === 1 ? "" : "s"} of data`;

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
                {formatDate(first.t)} → {formatDate(latest.t)}
              </>
            ) : null}
          </p>
        </div>
        <WalletSelector wallets={wallets} current={walletFilter} />
      </header>

      {days.length === 0 ? (
        <EmptyState filtered={!!walletFilter} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Latest day"
              primary={latest ? formatCompactUsd(latest.total) : "—"}
              secondary={
                latest
                  ? `${formatDate(latest.t)} · ${latest.visitors.toLocaleString()} visitor${latest.visitors === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <AvgCard label="7D avg / day" metric={avg7} />
            <AvgCard label="30D avg / day" metric={avg30} />
            <MetricCard
              label="Peak day"
              primary={peak ? formatCompactUsd(peak.total) : "—"}
              secondary={
                peak
                  ? `${formatDate(peak.t)} · ${peak.visitors.toLocaleString()} visitor${peak.visitors === 1 ? "" : "s"}`
                  : undefined
              }
            />
          </div>

          <div className="mt-6">
            <NetWorthChart days={days} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MiniBreakdown
              label="Latest day balance"
              value={latest ? formatCompactUsd(latest.balance) : "—"}
              hint="balance column · sum of unique visitors"
            />
            <MiniBreakdown
              label="Latest day harvest"
              value={latest ? formatCompactUsd(latest.harvest) : "—"}
              hint="harvest_balance column · sum of unique visitors"
            />
            <MiniBreakdown
              label="Avg per visitor (latest)"
              value={
                latest && latest.visitors > 0
                  ? formatCompactUsd(latest.total / latest.visitors)
                  : "—"
              }
              hint="latest day total / visitors"
            />
          </div>

          <div className="mt-6">
            <RichList entries={richList} />
          </div>
        </>
      )}
    </main>
  );
}

function AvgCard({ label, metric }: { label: string; metric: DailyMetric | null }) {
  if (!metric) {
    return <MetricCard label={label} primary="—" secondary="No data" />;
  }
  if (!metric.prior) {
    return (
      <MetricCard
        label={label}
        primary={formatCompactUsd(metric.value)}
        secondary={`over ${metric.daysUsed} day${metric.daysUsed === 1 ? "" : "s"}`}
      />
    );
  }
  const delta = pctChange(metric.value, metric.prior.value);
  const trend = delta === null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <MetricCard
      label={label}
      primary={formatCompactUsd(metric.value)}
      secondary={`${formatPct(delta)} vs prior ${metric.prior.daysUsed}d`}
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
