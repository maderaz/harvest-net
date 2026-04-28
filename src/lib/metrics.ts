import type { Snapshot } from "./supabase";

export type Point = {
  t: number;
  iso: string;
  total: number;
  balance: number;
  harvest: number;
};

export function toPoints(snapshots: Snapshot[]): Point[] {
  return snapshots.map((s) => ({
    t: new Date(s.connected_at).getTime(),
    iso: s.connected_at,
    total: s.balance + s.harvest_balance,
    balance: s.balance,
    harvest: s.harvest_balance,
  }));
}

function firstAtOrAfter(points: Point[], cutoffMs: number): Point | null {
  for (const p of points) if (p.t >= cutoffMs) return p;
  return null;
}

export type Change = { abs: number; pct: number | null; from: Point; to: Point } | null;

export function changeOver(points: Point[], days: number): Change {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];
  const cutoff = latest.t - days * 24 * 60 * 60 * 1000;
  const baseline = firstAtOrAfter(points, cutoff);
  if (!baseline || baseline.t === latest.t) return null;
  const abs = latest.total - baseline.total;
  const pct = baseline.total === 0 ? null : (abs / baseline.total) * 100;
  return { abs, pct, from: baseline, to: latest };
}

export function allTimeChange(points: Point[]): Change {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const abs = last.total - first.total;
  const pct = first.total === 0 ? null : (abs / first.total) * 100;
  return { abs, pct, from: first, to: last };
}

export function filterByDays(points: Point[], days: number | null): Point[] {
  if (days === null || points.length === 0) return points;
  const latest = points[points.length - 1].t;
  const cutoff = latest - days * 24 * 60 * 60 * 1000;
  return points.filter((p) => p.t >= cutoff);
}

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatSignedUsd(n: number): string {
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  const abs = Math.abs(n);
  return `${sign}${abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })}`;
}
