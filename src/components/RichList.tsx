"use client";

import { useMemo, useState } from "react";
import type { RichListEntry } from "@/lib/metrics";
import { formatCompactUsd, formatDate } from "@/lib/metrics";

const PAGE_SIZE = 15;

type Sort = "default" | "visits_desc" | "visits_asc";

function nextSort(s: Sort): Sort {
  if (s === "default") return "visits_desc";
  if (s === "visits_desc") return "visits_asc";
  return "default";
}

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function StatusBadge({
  visits,
  lastConnectedMs,
  nowMs,
}: {
  visits: number;
  lastConnectedMs: number;
  nowMs: number;
}) {
  const days = Math.max(0, Math.floor((nowMs - lastConnectedMs) / MS_PER_DAY));
  const tip = `${visits} visit${visits === 1 ? "" : "s"} · last ${days}d ago`;

  if (visits === 1) {
    return (
      <span
        title={tip}
        className="inline-flex items-center rounded-full border border-border bg-bg px-2 py-0.5 text-xs text-muted"
      >
        never returned
      </span>
    );
  }

  if (days <= 7) {
    return (
      <span
        title={tip}
        className="inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent"
      >
        active · {days}d
      </span>
    );
  }

  if (days > 30) {
    return (
      <span
        title={tip}
        className="inline-flex items-center rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400"
      >
        dormant · {days}d
      </span>
    );
  }

  return (
    <span
      title={tip}
      className="inline-flex items-center rounded-full border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400"
    >
      returning · {visits}×
    </span>
  );
}

export function RichList({
  entries,
  nowMs,
}: {
  entries: RichListEntry[];
  nowMs: number;
}) {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<Sort>("default");

  const sorted = useMemo(() => {
    if (sort === "default") return entries;
    const copy = [...entries];
    copy.sort((a, b) => (sort === "visits_desc" ? b.visits - a.visits : a.visits - b.visits));
    return copy;
  }, [entries, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const startRank = safePage * PAGE_SIZE + 1;

  function cycleSort() {
    setSort((s) => nextSort(s));
    setPage(0);
  }

  const sortIndicator =
    sort === "visits_desc" ? "↓ visits" : sort === "visits_asc" ? "↑ visits" : null;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Rich list</div>
          <div className="text-sm text-muted">
            Top {entries.length} wallet{entries.length === 1 ? "" : "s"} · min $10k ·{" "}
            {sort === "default"
              ? "ranked by latest net worth"
              : `sorted ${sort === "visits_desc" ? "most" : "fewest"} visits first`}
          </div>
        </div>
        {pageCount > 1 ? (
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded-md border border-border bg-bg px-3 py-1 text-muted hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-muted tabular-nums">
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded-md border border-border bg-bg px-3 py-1 text-muted hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted">
          No wallets above $10k yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted">
                <th className="py-2 pr-3 font-normal">#</th>
                <th className="py-2 pr-3 font-normal">Wallet</th>
                <th className="py-2 pr-3 text-right font-normal">Net worth</th>
                <th className="py-2 pr-3 font-normal">First connected</th>
                <th className="py-2 pr-3 font-normal">Last connected</th>
                <th className="py-2 pr-3 font-normal">
                  <button
                    onClick={cycleSort}
                    className="inline-flex items-center gap-1 uppercase tracking-wider text-muted hover:text-white"
                    title="Click to sort by visit count"
                  >
                    Status
                    <span className="text-[10px]">
                      {sortIndicator ?? "↕"}
                    </span>
                  </button>
                </th>
                <th className="py-2 font-normal" />
              </tr>
            </thead>
            <tbody>
              {slice.map((e, i) => (
                <tr key={e.wallet} className="border-t border-border">
                  <td className="py-3 pr-3 text-muted tabular-nums">{startRank + i}</td>
                  <td className="py-3 pr-3 font-mono">
                    <span title={e.wallet}>{shortAddr(e.wallet)}</span>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">
                    {formatCompactUsd(e.total)}
                  </td>
                  <td className="py-3 pr-3 text-muted">
                    {formatDate(e.firstConnectedMs)}
                  </td>
                  <td className="py-3 pr-3 text-muted">
                    {formatDate(e.lastConnectedMs)}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge
                      visits={e.visits}
                      lastConnectedMs={e.lastConnectedMs}
                      nowMs={nowMs}
                    />
                  </td>
                  <td className="py-3">
                    <a
                      href={`https://debank.com/profile/${e.wallet}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-2.5 py-1 text-xs text-muted hover:text-white"
                    >
                      DeBank ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
