# Kynthera + free HydraDB (Ubuntu WSL)

HydraDB Cloud billing is **not** necessary for a local test. These commands start the **open-source graph-node** on your own computer. This is for development only, not a publicly reachable Vercel production database.

## Terminal 1: HydraDB server

If you already cloned `https://github.com/hydra-db/hydradb`, don't clone again.

```bash
cd ~/hydradb

sudo apt update
sudo apt install -y build-essential clang libclang-dev cmake pkg-config libcypher-parser-dev libgraphblas-dev curl git python3 python3-venv

rustc --version
```

As of November 2026 the upstream README requires **Rust 1.99+**. If `rustc` is missing, install Rust using https://rustup.rs. If your Rust is older, run `rustup update stable`, restart the shell if needed, and check `rustc --version` again.

```bash
mkdir -p .hydradb/store .hydradb/cache
openssl rand -hex 32 > .hydradb/auth-token
chmod 600 .hydradb/auth-token

export CLOUD_PROVIDER=local
export LOCAL_PATH="$PWD/.hydradb/store"
export GRAPH_NAMESPACE=default
export GRAPH_ID=default
export GRAPH_CELL_ID=cell-0
export GRAPH_CELLS=cell-0
export GRAPH_NODE_ID=node-0
export GRAPH_BOLT_NODE_ADDRESSES=node-0=127.0.0.1:7687
export GRAPH_ADVERTISED_BOLT_ADDR=127.0.0.1:7687
export GRAPH_DATA_CACHE_DIR="$PWD/.hydradb/cache"
export GRAPH_AUTH_TOKEN_FILE="$PWD/.hydradb/auth-token"
export GRAPH_ALLOW_PLAINTEXT=true
export RUST_MIN_STACK=33554432

cargo run --locked --features server-runtime --bin graph-node
```

Keep this terminal open. The first Rust compilation can take a while.

## Terminal 2: confirm the server is responding

```bash
curl -i http://127.0.0.1:9090/readyz
curl -i http://127.0.0.1:8443/healthz
```

Look for HTTP 200. This checks startup, not whether writes work. For a database write/read check, follow the **Verify the connection before building anything** section of the official [USING-HYDRADB.md](https://github.com/hydra-db/hydradb/blob/main/USING-HYDRADB.md).

## Terminal 3: Kynthera

Use your actual Windows username. If you extracted this ZIP into the Desktop's `kynthera` folder:

```bash
cd '/mnt/c/Users/NY PC/Desktop/kynthera'
cp .env.example .env.local
nano .env.local
```

Add/modify these lines in `.env.local`:

```env
KYNTHERA_STORE=hydradb
HYDRADB_BOLT_URL=bolt://127.0.0.1:7687
HYDRADB_DATABASE=default
HYDRADB_USERNAME=neo4j
HYDRADB_PASSWORD=PASTE_THE_LOCAL_AUTH_TOKEN_HERE
```

To view your token locally, run this in a terminal (do not send the token to anyone):

```bash
cd ~/hydradb
cat .hydradb/auth-token
```

Also fill in the Google OAuth variables for local sign-in. See `ENV-SETUP.md`.

```bash
cd '/mnt/c/Users/NY PC/Desktop/kynthera'
npm install
npm run typecheck
npm test
npm run dev
```

Open http://localhost:3000/console, sign in with Google, and check **Connection**. It should report the HydraDB graph database as connected. Create one recovery strategy, one incident, then mark an outcome, refresh and check whether both records persist.

## What is *not* connected

Your Vercel deployment cannot reach `bolt://127.0.0.1:7687` on your computer. Public deployment requires a persistent, securely hosted HydraDB graph-node with TLS and firewall/network rules. Use `neo4j+s://` when the server has a valid TLS certificate. Never expose the local plaintext Bolt port to the internet.

Kynthera's adapter has been adjusted to HydraDB's documented query subset, but it has not been tested against your running node here. Read/modify/write operations are not yet transaction-safe under concurrent users; do not advertise it as a production-ready multi-user data service until that is addressed.
