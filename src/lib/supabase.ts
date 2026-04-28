import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

export const TABLE = process.env.SUPABASE_TABLE ?? "wallets";

export type Snapshot = {
  id: string;
  wallet_address: string;
  connected_at: string;
  balance: number;
  harvest_balance: number;
};

export async function fetchSnapshots(walletAddress?: string): Promise<Snapshot[]> {
  let query = supabase
    .from(TABLE)
    .select("id, wallet_address, connected_at, balance, harvest_balance")
    .order("connected_at", { ascending: true });

  if (walletAddress) query = query.eq("wallet_address", walletAddress);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase: ${error.message}`);

  return (data ?? []).map((r) => ({
    id: r.id,
    wallet_address: r.wallet_address,
    connected_at: r.connected_at,
    balance: Number(r.balance ?? 0),
    harvest_balance: Number(r.harvest_balance ?? 0),
  }));
}

export async function fetchWallets(): Promise<string[]> {
  const { data, error } = await supabase.from(TABLE).select("wallet_address");
  if (error) throw new Error(`Supabase: ${error.message}`);
  const set = new Set<string>();
  (data ?? []).forEach((r: { wallet_address: string }) => set.add(r.wallet_address));
  return [...set].sort();
}
