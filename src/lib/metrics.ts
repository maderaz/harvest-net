import type { Snapshot } from "./supabase";

export type DayPoint = {
  t: number;
  date: string;
  label: string;
  total: number;
  balance: number;
  harvest: number;
  visitors: number;
  ma7: number | null;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const OUTLIER_THRESHOLD = 100_000_000;

function dayKeyUtc(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function dayLabel(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function dailyAggregates(snapshots: Snapshot[]): DayPoint[] {
  if (snapshots.length === 0) return [];

  const byDay = new Map<string, Map<string, Snapshot>>();

  for (const s of snapshots) {
    const key = dayKeyUtc(s.connected_at);
    let walletMap = byDay.get(key);
    if (!walletMap) {
      walletMap = new Map();
      byDay.set(key, walletMap);
    }
    const existing = walletMap.get(s.wallet_address);
    if (
      !existing ||
      new Date(existing.connected_at).getTime() <
        new Date(s.connected_at).getTime()
    ) {
      walletMap.set(s.wallet_address, s);
    }
  }

  const sortedKeys = [...byDay.keys()].sort();
  const days: DayPoint[] = sortedKeys.map((key) => {
    const walletMap = byDay.get(key)!;
    let bal = 0;
    let har = 0;
    for (const s of walletMap.values()) {
      bal += s.balance;
      har += s.harvest_balance;
    }
    return {
      t: new Date(key + "T00:00:00Z").getTime(),
      date: key,
      label: dayLabel(key),
      total: bal + har,
      balance: bal,
      harvest: har,
      visitors: walletMap.size,
      ma7: null,
    };
  });

  for (let i = 0; i < days.length; i++) {
    const start = Math.max(0, i - 6);
    const slice = days.slice(start, i + 1);
    if (slice.length < 2) continue;
    const sum = slice.reduce((acc, d) => acc + d.total, 0);
    days[i].ma7 = sum / slice.length;
  }

  return days;
}

export function filterByDays(days: DayPoint[], range: number | null): DayPoint[] {
  if (range === null || days.length === 0) return days;
  const latest = days[days.length - 1].t;
  const cutoff = latest - (range - 1) * MS_PER_DAY;
  return days.filter((d) => d.t >= cutoff);
}

export type DailyMetric = {
  value: number;
  daysUsed: number;
  excluded: number;
  prior?: { value: number; daysUsed: number; excluded: number };
};

export function latestDay(days: DayPoint[]): DayPoint | null {
  return days.length ? days[days.length - 1] : null;
}

function avgExcludingOutliers(
  slice: DayPoint[],
  excludeAbove: number | undefined,
): { value: number; daysUsed: number; excluded: number } | null {
  const kept =
    excludeAbove === undefined
      ? slice
      : slice.filter((d) => d.total <= excludeAbove);
  if (kept.length === 0) return null;
  const value = kept.reduce((s, d) => s + d.total, 0) / kept.length;
  return {
    value,
    daysUsed: kept.length,
    excluded: slice.length - kept.length,
  };
}

export function rollingAverage(
  days: DayPoint[],
  window: number,
  excludeAbove?: number,
): DailyMetric | null {
  if (days.length === 0) return null;

  const recent = avgExcludingOutliers(days.slice(-window), excludeAbove);
  if (!recent) return null;

  const priorRaw = days.slice(-window * 2, -window);
  const prior =
    priorRaw.length > 0
      ? avgExcludingOutliers(priorRaw, excludeAbove) ?? undefined
      : undefined;

  return { ...recent, prior };
}

export function peakDay(days: DayPoint[], excludeAbove?: number): DayPoint | null {
  const eligible =
    excludeAbove === undefined ? days : days.filter((d) => d.total <= excludeAbove);
  if (eligible.length === 0) return null;
  return eligible.reduce((best, d) => (d.total > best.total ? d : best), eligible[0]);
}

export function pctChange(curr: number, prior: number): number | null {
  if (prior === 0) return null;
  return ((curr - prior) / prior) * 100;
}

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatCompactUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(2)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function pickAxisFormatter(maxValue: number): (v: number) => string {
  if (maxValue >= 1_000_000) return (v) => `$${(v / 1_000_000).toFixed(1)}M`;
  if (maxValue >= 10_000) return (v) => `$${(v / 1_000).toFixed(0)}k`;
  return (v) => `$${v.toFixed(0)}`;
}

export function formatPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function formatDate(t: number): string {
  return new Date(t).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export type RichListEntry = {
  wallet: string;
  total: number;
  balance: number;
  harvest: number;
  firstConnectedMs: number;
  lastConnectedMs: number;
  visits: number;
};

export function buildRichList(
  snapshots: Snapshot[],
  minTotal: number,
  excludeAddresses: string[] = [],
): RichListEntry[] {
  const excluded = new Set(excludeAddresses.map((a) => a.toLowerCase()));

  const byWallet = new Map<string, Snapshot[]>();
  for (const s of snapshots) {
    if (excluded.has(s.wallet_address.toLowerCase())) continue;
    let arr = byWallet.get(s.wallet_address);
    if (!arr) {
      arr = [];
      byWallet.set(s.wallet_address, arr);
    }
    arr.push(s);
  }

  const entries: RichListEntry[] = [];
  for (const [wallet, snaps] of byWallet) {
    snaps.sort(
      (a, b) =>
        new Date(a.connected_at).getTime() - new Date(b.connected_at).getTime(),
    );
    const latest = snaps[snaps.length - 1];
    const first = snaps[0];
    const total = latest.balance + latest.harvest_balance;
    if (total < minTotal) continue;
    entries.push({
      wallet,
      total,
      balance: latest.balance,
      harvest: latest.harvest_balance,
      firstConnectedMs: new Date(first.connected_at).getTime(),
      lastConnectedMs: new Date(latest.connected_at).getTime(),
      visits: snaps.length,
    });
  }

  entries.sort((a, b) => b.total - a.total);
  return entries;
}
