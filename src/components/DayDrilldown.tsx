"use client";

import { useState } from "react";
import type { DayPoint, WalletDay } from "@/lib/metrics";
import { formatCompactUsd, formatDate } from "@/lib/metrics";

const PAGE_SIZE = 25;

function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function DayDrilldown({
  day,
  onClose,
}: {
  day: DayPoint;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(day.wallets.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const slice = day.wallets.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const startRank = safePage * PAGE_SIZE + 1;

  return (
    <div className="rounded-xl border border-border bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">
            Drill-down · {formatDate(day.t)}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
            <span>
              <span className="text-muted">Total:</span>{" "}
              <span className="font-semibold">{formatCompactUsd(day.total)}</span>
            </span>
            <span>
              <span className="text-muted">Visitors:</span>{" "}
              <span className="font-semibold">{day.visitors.toLocaleString()}</span>
            </span>
            <span>
              <span className="text-muted">Balance:</span>{" "}
              <span>{formatCompactUsd(day.balance)}</span>
            </span>
            <span>
              <span className="text-muted">Harvest:</span>{" "}
              <span>{formatCompactUsd(day.harvest)}</span>
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-border bg-bg px-3 py-1 text-xs text-muted hover:text-white"
        >
          Close ✕
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="py-2 pr-3 font-normal">#</th>
              <th className="py-2 pr-3 font-normal">Wallet</th>
              <th className="py-2 pr-3 text-right font-normal">Net worth</th>
              <th className="py-2 pr-3 text-right font-normal">Balance</th>
              <th className="py-2 pr-3 text-right font-normal">Harvest</th>
              <th className="py-2 pr-3 font-normal">Time (UTC)</th>
              <th className="py-2 font-normal" />
            </tr>
          </thead>
          <tbody>
            {slice.map((w: WalletDay, i) => (
              <tr key={w.wallet} className="border-t border-border">
                <td className="py-2 pr-3 text-muted tabular-nums">{startRank + i}</td>
                <td className="py-2 pr-3 font-mono">
                  <span title={w.wallet}>{shortAddr(w.wallet)}</span>
                </td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatCompactUsd(w.total)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted">
                  {formatCompactUsd(w.balance)}
                </td>
                <td className="py-2 pr-3 text-right tabular-nums text-muted">
                  {formatCompactUsd(w.harvest)}
                </td>
                <td className="py-2 pr-3 text-muted tabular-nums">
                  {formatTime(w.connectedAt)}
                </td>
                <td className="py-2">
                  <a
                    href={`https://debank.com/profile/${w.wallet}`}
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

      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-end gap-2 text-xs">
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
  );
}
