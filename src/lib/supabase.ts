import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

function table(): string {
  return process.env.SUPABASE_TABLE ?? "wallets";
}

export type Snapshot = {
  id: string;
  wallet_address: string;
  connected_at: string;
  balance: number;
  harvest_balance: number;
};

const PAGE_SIZE = 1000;
const MAX_PAGES = 100;

export async function fetchSnapshots(walletAddress?: string): Promise<Snapshot[]> {
  const all: Snapshot[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = getClient()
      .from(table())
      .select("id, wallet_address, connected_at, balance, harvest_balance")
      .order("connected_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    if (walletAddress) query = query.eq("wallet_address", walletAddress);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const r of data) {
      all.push({
        id: r.id,
        wallet_address: r.wallet_address,
        connected_at: r.connected_at,
        balance: Number(r.balance ?? 0),
        harvest_balance: Number(r.harvest_balance ?? 0),
      });
    }

    if (data.length < PAGE_SIZE) break;
  }
  return all;
}

export async function fetchWallets(): Promise<string[]> {
  const set = new Set<string>();
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await getClient()
      .from(table())
      .select("wallet_address")
      .order("wallet_address", { ascending: true })
      .range(from, to);
    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const r of data as Array<{ wallet_address: string }>) {
      set.add(r.wallet_address);
    }
    if (data.length < PAGE_SIZE) break;
  }
  return [...set].sort();
}
