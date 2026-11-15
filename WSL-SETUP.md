# Kynthera — WSL setup and GitHub push

Your screenshot shows Ubuntu WSL already open in `/mnt/c/Users/NY PC/Desktop`.

Place `kynthera-latest.zip` on your Windows Desktop. In WSL, run:

```bash
cd '/mnt/c/Users/NY PC/Desktop'
unzip -o kynthera-latest.zip
cd kynthera-complete
node --version
npm install
cp .env.example .env.local
openssl rand -base64 32
nano .env.local
```

Fill GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET. Keep NEXTAUTH_URL=http://localhost:3000 locally. Google OAuth authorized redirect: `http://localhost:3000/api/auth/callback/google`.

```bash
npm run typecheck
npm test
npm run dev
```

Visit http://localhost:3000. Open another terminal to push:

```bash
cd '/mnt/c/Users/NY PC/Desktop/kynthera-complete'
git init
git add .
git commit -m 'Initial Kynthera application'
git branch -M main
gh auth login
gh repo create kynthera --public --source=. --remote=origin --push
```

If `gh: command not found`, install GitHub CLI (Ubuntu): `sudo apt update && sudo apt install gh`.

**Security:** Never commit `.env.local`. Public Google sign-in requires Google OAuth External audience and publishing. The app is not production ready until a durable HydraDB backend is connected, validated, and deployed. Local storage is only for development. Recovery outcomes are user-reported, not independently executed or verified.
