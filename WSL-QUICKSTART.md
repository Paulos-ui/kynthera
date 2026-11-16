# WSL quick start and GitHub push

Put the updated `kynthera-v2-hydra.zip` on the Windows Desktop. In Ubuntu WSL, make a backup of your existing project folder before merging updated source files. The commands below extract a new `kynthera` folder if one does not exist:

```bash
cd '/mnt/c/Users/NY PC/Desktop'
unzip kynthera-v2-hydra.zip
cd kynthera
npm install
cp .env.example .env.local
nano .env.local
npm run typecheck
npm test
npm run dev
```

Visit http://localhost:3000. See ENV-SETUP.md for OAuth and HydraDB credentials.

For the free HydraDB graph server, continue with `HYDRADB-LOCAL-SETUP.md`. Start the database in a separate WSL terminal before launching Kynthera.

To update an existing GitHub repository (after verifying the changes):

```bash
cd '/mnt/c/Users/NY PC/Desktop/kynthera'
git status
git add .
git commit -m "Refine Kynthera landing and onboarding"
git push origin main
```

If this is a fresh repository and `gh` is installed:

```bash
git init
git add .
git commit -m "Build Kynthera platform"
git branch -M main
gh auth login
gh repo create kynthera --public --source=. --remote=origin --push
```

Do not create a second GitHub repository if you already have one. Clone your existing repo and copy the updated source into it, or configure its remote correctly. Never commit `.env.local`.
