# Kynthera — HydraDB HTTPS bridge for a time-limited hackathon preview

**What this is:** An authenticated server-to-server HTTPS transport from the Vercel Next.js application to the self-hosted HydraDB HTTP API. The frontend never receives the database token. The new HTTP adapter is selected automatically if `HYDRADB_HTTP_URL` is set. Otherwise existing Bolt support remains unchanged.

**IMPORTANT:** The temporary Cloudflare Quick Tunnel route is NOT permanent online hosting. Your laptop, HydraDB and the tunnel must stay running; the URL changes when the tunnel restarts. Do not claim a continuously hosted database. Cloudflare's Quick Tunnel is intended for development/testing.

## 1. Verify local database is genuinely running
In a second WSL terminal:

```bash
curl -i http://127.0.0.1:9090/readyz
```

Only proceed after HTTP 200. If the original terminal still says `Compiling ...`, it is not ready yet. If it has a server startup log and is not returning the prompt, that is normal.

## 2. Verify an authenticated graph query (does not modify data)

```bash
TOKEN=$(cat ~/hydradb/.hydradb/auth-token)
curl -fsS http://127.0.0.1:8443/v1/graphs/default/query -H "Authorization: Bearer $TOKEN" -H 'X-Graph-Namespace: default' -H 'Content-Type: application/json' --data '{"cell_id":"cell-0","query":"MATCH (n:KIncident) RETURN count(n.id) AS total"}'
```

## 3. Create a temporary public HTTPS endpoint (development preview only)

```bash
curl -fsSL -o /tmp/cloudflared.deb "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$(dpkg --print-architecture).deb" && sudo dpkg -i /tmp/cloudflared.deb
cloudflared tunnel --url http://127.0.0.1:8443
```

Copy the `https://....trycloudflare.com` URL from the output. Keep this terminal running and do **not** publish the URL together with the bearer token. The database requires token authentication, but the public endpoint is Internet-accessible. For anything beyond a controlled hackathon preview, replace it with a stable, access-controlled tunnel or properly hosted service.

## 4. Vercel → Kynthera project → Settings → Environment Variables

```env
KYNTHERA_STORE=hydradb
HYDRADB_HTTP_URL=https://your-random-subdomain.trycloudflare.com
HYDRADB_AUTH_TOKEN=YOUR_LOCAL_HYDRADB_TOKEN
HYDRADB_DATABASE=default
HYDRADB_NAMESPACE=default
HYDRADB_CELL_ID=cell-0
```

Also keep `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set for your actual deployed domain. Change environment variables for the production deployment and **redeploy** Vercel. The `HYDRADB_AUTH_TOKEN` value is from `cat ~/hydradb/.hydradb/auth-token`; treat it as a secret, never commit it to Git or put it in a `NEXT_PUBLIC_` variable.

## 5. Verify with an actual create/read transaction

Sign in to your online Vercel app, open the Connection section, create a strategy and an incident, refresh, and verify they persist. A connection-status indicator alone is not proof of writable graph storage.

## Limitations

- Quick Tunnel stops when the laptop or terminal stops; it is not production hosting and has no uptime guarantee.
- Vercel runs serverlessly and cannot connect to your WSL `127.0.0.1` directly; HTTPS tunnels are reachable from Vercel.
- All local HydraDB graph data lives in the local `.hydradb/store` directory; keep your computer running for the preview.
- The current app records recovery attempts and feedback. It does not automatically execute arbitrary fixes in a sandbox.
- For a durable production installation deploy the HydraDB server to a persistent always-on VM/container, configure HTTPS and appropriate access controls and backups.
