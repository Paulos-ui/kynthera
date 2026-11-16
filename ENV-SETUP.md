# Kynthera environment setup

## 1. Google sign-in (required)

1. Open https://console.cloud.google.com/auth/overview and select your Google Cloud project.
2. Configure **Branding** (app name Kynthera, support email, developer contact).
3. Under **Audience**, choose **External**. In testing mode add test users; publish when ready for general access.
4. Under **Clients**, create a **Web application** OAuth client.
5. Authorized JavaScript origins: `http://localhost:3000` and `https://kynthera.vercel.app`.
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://kynthera.vercel.app/api/auth/callback/google`.
7. Copy the client ID and client secret into your local `.env.local` and Vercel environment settings. Do not share the client secret.
8. Set `NEXTAUTH_URL` to the exact origin for each environment (local vs Vercel). Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.

## 2. HydraDB graph database (required for durable graph data)

The open-source graph database uses a **Bolt connection**, not necessarily a hosted REST API key. Refer to https://github.com/hydra-db/hydradb for current installation instructions and supported hosting options.

Set:

- `KYNTHERA_STORE=hydradb`
- `HYDRADB_BOLT_URL=bolt://your-host:7687` (or `bolt+s://...` when supported and configured)
- `HYDRADB_USERNAME=...`
- `HYDRADB_PASSWORD=...`

For local development, `KYNTHERA_STORE=local` stores data in `.data/` on your computer. **Do not deploy local mode to Vercel**; its filesystem is ephemeral. A locally hosted HydraDB server cannot be reached from Vercel using `127.0.0.1`.

The graph adapter and public multi-user isolation have not been independently audited or verified under concurrent production traffic. Do not launch public user data until you have tested authorization and durability.

## 3. Example local `.env.local`

```
GOOGLE_CLIENT_ID=replace_with_google_client_id
GOOGLE_CLIENT_SECRET=replace_with_google_client_secret
NEXTAUTH_SECRET=replace_with_generated_random_secret
NEXTAUTH_URL=http://localhost:3000
KYNTHERA_STORE=local
HYDRADB_BOLT_URL=bolt://127.0.0.1:7687
HYDRADB_USERNAME=neo4j
HYDRADB_PASSWORD=
```

## 4. Vercel

Open Project > Settings > Environment Variables. Add the same Google credentials and secret, set `NEXTAUTH_URL=https://kynthera.vercel.app`, and configure reachable durable HydraDB connection details. Redeploy after saving variables. Ensure the production OAuth callback URL is registered in Google Cloud.

Never prefix secrets with `NEXT_PUBLIC_`, never commit `.env.local`, and rotate any accidentally exposed credentials.
