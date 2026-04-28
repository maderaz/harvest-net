"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function WalletSelector({
  wallets,
  current,
}: {
  wallets: string[];
  current: string | null;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function setWallet(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "all") next.delete("wallet");
    else next.set("wallet", value);
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs uppercase tracking-wider text-muted">Wallet</label>
      <select
        value={current ?? "all"}
        onChange={(e) => setWallet(e.target.value)}
        className="rounded-lg border border-border bg-panel px-3 py-2 text-sm font-mono"
      >
        <option value="all">All wallets ({wallets.length})</option>
        {wallets.map((w) => (
          <option key={w} value={w}>
            {w.slice(0, 6)}…{w.slice(-4)}
          </option>
        ))}
      </select>
    </div>
  );
}
