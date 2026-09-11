# Private Revenue Split

[![CI/CD](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml/badge.svg)](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod-purple.svg)](https://midnight.network)

> Split revenue privately — each recipient's individual cut is cryptographically hidden from all other parties.

---

## Live Demo

**TODO: Add Vercel production URL once deployment is confirmed via Vercel dashboard.**

Example format: `https://revenue-split.vercel.app`

To trigger a deployment: push to `main` on GitHub. Vercel is configured to auto-deploy from this repository via `vercel.json`.

---

## Contract Address (Midnight Preprod)

| Network | Address |
|---------|---------|
| Preprod | **TODO: Deploy contract via 1AM Wallet on Midnight Preprod and paste the on-chain address here.** |

The contract is defined in `contracts/revenue-split.compact`. To obtain an on-chain address you must deploy it using a funded Preprod wallet and the Midnight SDK or CLI. Once deployed, paste the address in this table and in `src/utils/contract.ts`.

---

## Demo Video

**TODO: Record and upload the MVP demo video, then replace this line with the real URL.**

The demo should show: wallet connection, ZK proof generation, claim execution, and Preprod evidence. See the [Demo Recording Checklist](#demo-recording-checklist) section below.

---

## Product X (Twitter/X) Profile

**TODO: Create a project X profile and paste the real URL here.**

Example format: `https://x.com/YourProjectHandle`

---

## Problem Statement

On public blockchains like Ethereum and Solana, revenue splits are transparent by design. When a smart contract distributes funds, every recipient address, share percentage, and payout amount is publicly visible on the ledger. This creates real friction for businesses:

- Clients can inspect internal margins during negotiations
- Competitors can identify co-founder earnings to poach talent
- Contributors lose financial privacy in every transaction

---

## Solution

**Private Revenue Split** uses Midnight Network's zero-knowledge technology to split an incoming payment among multiple recipients while keeping each individual cut completely confidential. The ZK circuit proves that the sum of all claimed payouts does not exceed the total pool — without revealing any individual amount to co-recipients or public observers.

---

## Features

- **Confidential payouts** — each recipient's share is a private witness, never written to the public ledger
- **ZK proof verification** — Midnight Compact circuit enforces `sum(cuts) ≤ totalPaidIn` without revealing individual values
- **Double-claim prevention** — cryptographic nullifiers prevent any recipient from claiming twice
- **1AM wallet integration** — connects via the official Midnight DApp Connector API (`window.midnight['1am'].connect()`)
- **Commitment-based registration** — deal organiser registers `hash(secret, salt, amount)` commitments on-chain; the raw amounts stay off-chain
- **Live ledger display** — real-time view of pool balance, total split out, recipient count, and claim count

---

## Technology Stack

| Layer | Technology |
|---|---|
| Smart Contract DSL | Midnight Compact Language (`contracts/revenue-split.compact`) |
| ZK Circuit Artifacts | Managed TypeScript interfaces (`managed/RevenueSplit/`) |
| Frontend | React 19, Vite 6, TypeScript 5, Tailwind CSS v4 |
| Wallet | 1AM Wallet — Midnight DApp Connector API (`window.midnight['1am']`) |
| Testing | Vitest 2, tsx, Node.js 22 |
| CI/CD | GitHub Actions (4-job pipeline) |
| Hosting | Vercel (auto-deploy from `main`) |

---

## Midnight Network / Preprod

This project targets the **Midnight Preprod** network — Midnight's public pre-production environment that tracks mainnet most closely.

- Network ID: `preprod`
- Wallet: [1AM Wallet](https://1am.xyz) — browser extension built natively for Midnight
- DApp Connector API: `window.midnight['1am'].connect('preprod')`
- Addresses are returned in Bech32m format

---

## 1AM Wallet Integration

The wallet connection is implemented in `src/hooks/useMidnight.ts`.

**Verified browser API shape (confirmed from live browser):**
```
Object.keys(window.midnight)        // ['1am', '<uuid>']
Object.keys(window.midnight['1am']) // ['rdns', 'name', 'icon', 'apiVersion', 'connect']
typeof window.midnight['1am'].enable // 'undefined'  ← does NOT exist
typeof window.midnight['1am'].connect // 'function'  ← correct method
```

**Connection flow:**
1. `window.midnight['1am'].connect('preprod')` — triggers approval popup on first use; resolves immediately on subsequent calls
2. `api.getShieldedAddresses()` → `{ shieldedAddress }` — primary Midnight identity (Bech32m)
3. `api.getUnshieldedAddress()` → `{ unshieldedAddress }` — fallback if shielded unavailable
4. `api.getConfiguration()` → `{ networkId }` — validates network match

**Handled cases:**
- First-time connection (popup appears)
- Re-connection after page refresh (no popup, resolves immediately)
- Disconnect and reconnect
- User rejects the popup (clean error, no crash)
- Extension not installed (install prompt shown)

---

## Architecture Overview

```
Browser
  └── React App (Vite)
        ├── useMidnight.ts          ← 1AM DApp Connector API integration
        ├── RevenueSplit.tsx         ← ZK proof UI (claim + register)
        ├── WalletConnect.tsx        ← Wallet connection button/status
        └── utils/contract.ts       ← In-browser contract state + ZK logic

Midnight Preprod
  └── revenue-split.compact         ← Compact ZK smart contract
        ├── initialize()            ← Set up organizer key and pool
        ├── registerRecipient()     ← Register commitment (organizer only)
        └── claimPayout()           ← ZK-proven confidential claim

CI/CD
  └── .github/workflows/ci.yml      ← 4-job: typecheck → test → build → audit
  └── .github/workflows/deploy.yml  ← Vercel deployment on push to main
```

---

## Prerequisites

- **Node.js** `v22.0.0` or higher — [download](https://nodejs.org/)
- **npm** (included with Node.js)
- **1AM Wallet** browser extension — [1am.xyz](https://1am.xyz), configured for **Midnight Preprod**

No environment variables are required for local development or the production build. The app connects directly to the 1AM browser extension via `window.midnight`.

---

## Installation

```bash
git clone https://github.com/Nandini-Jadhav1/revenue-split.git
cd revenue-split
npm install
```

---

## Local Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. The 1AM extension must be installed in the same browser for wallet features to work.

---

## Build

```bash
npm run build
```

This runs three steps in sequence:
1. `npm run compile` — generates managed ZK contract artifacts into `contracts/managed/`, `managed/`, and `src/contracts/managed/`
2. `npx tsc` — TypeScript type check
3. `npx vite build` — production bundle → `dist/`

Output is in `dist/`. No external compiler binary is required — the compile step is a self-contained Node.js script.

---

## Tests

```bash
npm test
```

Runs the Vitest suite covering valid ZK claim flows, double-claim rejection, invalid commitment rejection, and organizer authorization checks.

---

## Deployment (Vercel)

The project is connected to Vercel project `revenue-split` under the `nandini-jadhav1s-projects` team.

**`vercel.json` configuration:**
```json
{
  "buildCommand": "npx tsc && npx vite build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": null
}
```

Note: Vercel's build command skips `npm run compile` because the managed artifacts are committed to the repository. If you clean them, run `npm run compile` locally and commit the output before pushing.

**To trigger a deployment:** push any commit to the `main` branch. Vercel auto-deploys from GitHub.

**To set up the GitHub Actions deploy workflow**, add these three secrets to the GitHub repository (`Settings → Secrets → Actions`):
- `VERCEL_TOKEN` — from [vercel.com/account/tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` — from Vercel project settings
- `VERCEL_PROJECT_ID` — from Vercel project settings

---

## Usage

### Connect 1AM Wallet

1. Install the [1AM browser extension](https://1am.xyz) and set it to **Preprod** network
2. Open the app and click **Connect 1AM Wallet** in the top navigation bar
3. Approve the connection popup in 1AM
4. Your Preprod wallet address appears in the header

### Claim a Private Payout

1. Navigate to the **Claim Private Cut** tab
2. Enter your private `Secret Key` and `Salt` (use the Alice or Bob quick-fill buttons for demo)
3. Enter the `Claim Amount` in tDUST
4. Click **Prove & Claim Payout Confidentiality**
5. A ZK proof is generated locally and the nullifier is disclosed on successful claim

### Register a New Recipient

1. Navigate to **Register Split Rule**
2. Enter the recipient's `Secret`, `Salt`, and `Private Share Amount`
3. Optionally add additional revenue to the pool
4. Click **Register Commitment On-Chain**

---

## CI/CD Pipeline

Four-job GitHub Actions workflow on every push and pull request to `main`:

| Job | Action |
|---|---|
| TypeScript Type Check | `npm run compile` then `npx tsc --noEmit` |
| Unit Tests | `npm test` (Vitest) |
| Production Build | `npm run build` + artifact upload |
| Security Audit | `npm audit --audit-level=high` |

[![CI/CD](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml/badge.svg)](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml)

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

---

## Submission Checklist

| Requirement | Status | Evidence |
|---|---|---|
| Working MVP live on Preprod | **TODO: add live URL** | Vercel project: `revenue-split` |
| README + setup + usage docs | ✅ | This file + [docs/USAGE.md](docs/USAGE.md) |
| CI/CD pipeline | ✅ | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| CI/CD badge | ✅ | Badge above links to live workflow runs |
| Product X profile | **TODO: add real URL** | — |
| Minimum 15 meaningful commits | ✅ 23 commits | [Commit history](https://github.com/Nandini-Jadhav1/revenue-split/commits/main) |
| Public GitHub repository | ✅ | [github.com/Nandini-Jadhav1/revenue-split](https://github.com/Nandini-Jadhav1/revenue-split) |
| Preprod contract address | **TODO: deploy and add** | Contract: `contracts/revenue-split.compact` |
| Demo video | **TODO: record and add URL** | See checklist below |

---

## Demo Recording Checklist

Record in this order for a complete submission video:

1. Show the GitHub repository and README in browser
2. Show the CI/CD workflow runs passing on GitHub Actions
3. Open the live Vercel URL (or `localhost:5173`)
4. Show the application landing page / dashboard
5. Click **Connect 1AM Wallet** — show the 1AM approval popup
6. Approve — show the connected wallet address appearing in the UI
7. Use the **Alice** quick-fill (secret: `alice_secret_123`, salt: `salt_alice_999`, amount: `700`)
8. Click **Prove & Claim Payout Confidentiality** — show the ZK proof generating
9. Show the successful claim receipt with the nullifier hash
10. Show ledger state update (Total Split Out increased)
11. Refresh the page — click Connect again — show reconnection works without popup
12. Navigate to **Register Split Rule** and demonstrate registering a new commitment
13. Show the Midnight Preprod network indicator in the wallet / app

---

## Privacy Model

| Data | Visibility |
|---|---|
| `totalPaidIn` | Public — on-chain |
| `totalSplitOut` | Public — on-chain |
| `splitCommitment` | Public — on-chain |
| `claimedNullifiers` | Public — on-chain (spent set) |
| `recipientSecret` | **Private** — never on-chain |
| `recipientSalt` | **Private** — never on-chain |
| `claimAmount` (individual cut) | **Private** — proved in ZK, never disclosed |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first. All contributions must preserve the privacy guarantees defined in the Compact contract specification.

---

## License

[MIT](LICENSE) — 2026.
