# HydraDB local / Render connection selection

The application supports **one active HydraDB target at a time**. There is no automatic failover or replication: both databases may contain different data.

## Environment variables on Vercel

Keep existing variables unchanged:

```env
KYNTHERA_STORE=hydradb
HYDRADB_HTTP_URL=https://your-existing-cloudflare-tunnel.trycloudflare.com
HYDRADB_AUTH_TOKEN=YOUR_EXISTING_LOCAL_HYDRADB_TOKEN
HYDRADB_DATABASE=default
HYDRADB_NAMESPACE=default
HYDRADB_CELL_ID=cell-0
```

Keep the Render variables already added:

```env
HYDRADB_RENDER_URL=https://kynthera-hydradb.onrender.com
HYDRADB_RENDER_AUTH_TOKEN=YOUR_RENDER_TOKEN
```

**Add exactly one new variable to select a target:**

```env
HYDRADB_ACTIVE_TARGET=local
```

Valid values:

- `local`: uses the existing `HYDRADB_HTTP_URL` and `HYDRADB_AUTH_TOKEN` or local Bolt settings.
- `render`: uses `HYDRADB_RENDER_URL` and `HYDRADB_RENDER_AUTH_TOKEN`.

After changing `HYDRADB_ACTIVE_TARGET`, **redeploy the Vercel project**. Switching targets changes the entire graph dataset that the site sees; it does **not** synchronize or copy incidents, strategies, or accounts.

## Safety and hosting limits

Render's Free web service may sleep after inactivity. Its local filesystem is ephemeral, so graph data written there **can be lost** after redeployment, sleeping, or restarting. Do not store production records there until durable storage is configured and verified. Keep your original WSL data as-is.

The HydraDB authentication tokens must remain private, server-side environment variables. Do not put them into `NEXT_PUBLIC_*` variables or commit them into source control.

The console status endpoint indicates which target answered a graph query, but the health indicator alone does not prove durable persistence.
