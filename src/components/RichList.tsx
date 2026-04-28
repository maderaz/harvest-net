"use client";

import { useState } from "react";
import type { RichListEntry } from "@/lib/metrics";
import { formatCompactUsd, formatDate } from "@/lib/metrics";

const PAGE_SIZE = 15;

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function RichList({ entries }: { entries: RichListEntry[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = entries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const startRank = safePage * PAGE_SIZE + 1;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Rich list</div>
          <div className="text-sm text-muted">
            Top {entries.length} wallet{entries.length === 1 ? "" : "s"} · min $10k · ranked by latest net worth
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
