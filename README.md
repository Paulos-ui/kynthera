# Kynthera — authenticated recovery intelligence

A Next.js application for incident capture, recovery strategy ranking, feedback and graph investigation. **No sample dataset is automatically loaded.** Google sign-in protects the workspace and APIs.

## Requirements
- Node.js 20+
- Google Cloud OAuth web application client credentials
- HydraDB graph endpoint for durable deployed storage

## Start
```bash
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

## Google sign-in
1. Visit https://console.cloud.google.com/apis/credentials and select/create a project.
2. Configure Google Auth Platform branding and audience. If in testing, add your Google account as a test user.
3. Create OAuth client ID → Web application.
4. Authorized JavaScript origin: `http://localhost:3000`.
5. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`.
6. Copy client ID and client secret into `.env.local`. Generate NEXTAUTH_SECRET with `openssl rand -base64 32`.
7. Set Google OAuth Audience to External. Publish the OAuth app when ready for public sign-in. Restart `npm run dev`.
8. For Vercel, add the deployed origin and `https://YOUR_DOMAIN/api/auth/callback/google` to Google Cloud, set NEXTAUTH_URL to your deployed URL, and configure the same server-side environment variables in Vercel.

## Data and security
- No automatic demo/seed data; create incidents and strategies from the console.
- Local storage writes `.data/kynthera.json`, intended only for single-process local development.
- `KYNTHERA_STORE=hydradb` connects to a HydraDB Bolt endpoint with the configured credentials. Verify your HydraDB version supports the Neo4j driver queries in `lib/hydra.ts`.
- For production deployment, **do not use local storage**: Vercel's filesystem is not durable.
- The API partitions incidents and strategies by the signed-in Google email hash. Local development uses a separate file per account; HydraDB records carry an owner property. This is a starter isolation model, not a security audit.
- Recovery strategies are suggestions; the app does not automatically execute shell commands or deploy code.
- Feedback records are user-attested, not automatically verified by a sandbox. Benchmark displays recorded data only; it does not prove causal improvement.
- Do not commit `.env.local` or Google client secrets.

## GitHub from WSL
```bash
cd /mnt/c/Users/YOUR_WINDOWS_USERNAME/Desktop
unzip kynthera-authenticated.zip
cd kynthera-complete
npm install
cp .env.example .env.local
# Fill credentials then npm run dev

git init
git add .
git commit -m "Build Kynthera authenticated recovery intelligence"
git branch -M main
gh auth login
gh repo create kynthera --public --source=. --remote=origin --push
```

Use `npm run typecheck`, `npm test`, and `npm run build` to validate. No actual HydraDB cloud connection is bundled; provide your own endpoint.

## Deployment readiness
Google sign-in is open to Google users after OAuth app publication. Set `KYNTHERA_STORE=hydradb` with a reachable persistent HydraDB Bolt endpoint before deploying to Vercel. Verify network access, schema compatibility, authorization, and concurrent writes in your production environment. Local JSON mode is development-only.
