# Harvest Net Worth Dashboard

Read-only dashboard over the Supabase wallet tracker. Built with Next.js
App Router, server components, and Recharts.

## Setup

1. `cp .env.local.example .env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only, never exposed to the browser
   - `SUPABASE_TABLE` — name of the wallet snapshots table (default `wallets`)
2. `npm install`
3. `npm run dev` and open http://localhost:3000

## Schema assumed

```
id              uuid
wallet_address  text
connected_at    timestamptz
balance         numeric
harvest_balance numeric
```

Net worth is computed as `balance + harvest_balance`. If `balance` already
includes the harvest position in your data, change the `total` calculation
in `src/lib/metrics.ts` (`toPoints`).

## Deploy (Vercel)

1. Import the repo into Vercel
2. Add the same three env vars in Project Settings → Environment Variables
3. Recommended: enable **Vercel Deployment Protection** (Project Settings →
   Deployment Protection) so the dashboard isn't reachable without your
   Vercel auth — this app does not implement its own login

## Notes

- All Supabase reads happen in server components using the service-role
  key, so no key ships in the client bundle
- Page is rendered dynamically with `revalidate = 60` (60s ISR)
- Wallet selector filters by `wallet_address`; default view aggregates
  all rows in time order
