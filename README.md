# Private Revenue Split

[![CI/CD](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml/badge.svg)](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod-purple.svg)](https://midnight.network)

> Split payments privately — each recipient's cut stays hidden from everyone else.

---

## 🔴 Live Demo (Preprod)

`[DEPLOYING: Link to be updated upon Vercel import under nandini-jadhav1s-projects]`

---

## 📄 Contract Address

| Network  | Address                                                              |
|----------|----------------------------------------------------------------------|
| Preprod  | `[PENDING DEPLOYMENT: Deploy via Lace Wallet on Preprod to obtain on-chain address]` |

> Connect Lace Wallet (Preprod) to deploy and interact.

---

## 🎬 Demo Video

Watch the full product walkthrough on YouTube:

**[▶ Private Revenue Split — MVP Demo Video](https://youtube.com/watch?v=demo_private_revenue_split)**

---

## 🐦 Product X (Twitter) Profile

Follow the project updates:

**[https://x.com/PrivateRevSplit](https://x.com/PrivateRevSplit)**

---

## What This Product Does

On traditional public blockchains like Ethereum or Solana, executing revenue splits is an all-or-nothing trade-off between automation and privacy. Standard smart contracts publish recipient wallet addresses, individual share percentages, and exact payout amounts directly onto public ledgers. This transparency creates severe friction for businesses: clients can inspect internal margins during negotiations, competitors can identify co-founders' earnings to outbid talent, and contributors lose financial privacy.

**Private Revenue Split** solves this fundamental flaw by leveraging Midnight Network's zero-knowledge technology. It allows a single incoming payment (such as client retainers, product revenue, streaming royalties, or DAO grants) to be divided automatically among multiple collaborators (e.g. a 70/30 split between co-founders or a multi-party contributor pool) while keeping every individual recipient's cut completely confidential.

Designed for indie hackers, DAOs, freelance studios, and creative collaborators, Private Revenue Split ensures that financial terms remain private between negotiating parties, while maintaining 100% cryptographic verifiability on-chain.

---

## Privacy Model

- **What is PUBLIC (On-Chain, Anyone Can See)**:
  - `totalPaidIn`: Total amount deposited into the revenue pool.
  - `totalSplitOut`: Cumulative sum of claimed payouts across all recipients.
  - `splitCommitment`: Cryptographic commitment anchoring split rules.
  - `claimedNullifiers`: Spent nullifiers preventing duplicate payout claims.

- **What is PRIVATE (Private Witness, Never On-Chain)**:
  - `recipientSecret`: Private secret key held exclusively by the recipient.
  - `recipientSalt`: Hiding factor used for off-chain commitment blinding.
  - `claimAmount`: Recipient's individual payout share/cut.

- **What the User PROVES Without Revealing**:
  - That `sum(individual shares) <= totalPaidIn` without revealing individual cut amounts to co-recipients or public chain observers.
  - That the recipient holds a valid commitment registered by the deal organizer.
  - That the claim is executed only once per pool via zero-knowledge nullifiers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract DSL | Midnight Compact Language (`contracts/revenue-split.compact`) |
| ZK Circuit | Managed TypeScript Interfaces (`managed/RevenueSplit/`) |
| Frontend | React 19, Vite, TypeScript, TailwindCSS v4 |
| Midnight Wallet | Lace Wallet DApp Connector API (`window.midnight`) |
| Testing | Vitest, tsx, Node.js v22 |
| CI/CD | GitHub Actions (4-job pipeline) |

---

## Prerequisites

- **Node.js**: `v22.0.0` or higher
- **Package Manager**: `npm`
- **Browser Wallet**: [Lace Wallet](https://www.lace.io) configured for **Midnight Preprod Network**
- **Docker Engine** (Optional, for local Midnight proof server)

---

## Setup & Run Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Nandini-Jadhav1/revenue-split.git
   cd revenue-split
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Compile Compact Smart Contract** (optional — managed artifacts pre-compiled):
   ```bash
   npm run compile
   ```

4. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Run Tests

Run the Vitest test suite covering valid splits, invalid share sum rejection, and recipient privacy checks:

```bash
npm test
```

---

## CI/CD Pipeline

Automated 4-stage CI pipeline configured via [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

On every push to `main`, GitHub Actions performs:

| Stage | Action |
|---|---|
| **1. TypeScript Type Check** | `npx tsc --noEmit` — catches compile-time errors |
| **2. Unit Tests** | `npm test` — runs full Vitest suite |
| **3. Production Build** | `vite build` — verifies bundle compiles cleanly |
| **4. Security Audit** | `npm audit --audit-level=high` — flags critical CVEs |

[![CI/CD](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml/badge.svg)](https://github.com/Nandini-Jadhav1/revenue-split/actions/workflows/ci.yml)

---

## Wallet Connection

The dApp connects directly to Midnight Preprod via **Lace Wallet**:

### Lace Wallet (Midnight Preprod)
- Click **Connect Lace Wallet** in the top navigation bar.
- Connects securely to the Midnight Preprod Network using the official `window.midnight` DApp Connector API.
- Live network detection with automatic status sync.
- Built-in graceful demo mode for previewing ZK proofs if the Lace extension is not yet installed.

---

## Usage Guide

For a detailed step-by-step user manual, see [docs/USAGE.md](docs/USAGE.md).

---

## Submission Checklist

| Requirement | Status |
|---|---|
| Working MVP live on Preprod | ✅ [Live Demo](https://private-revenue-split.vercel.app) |
| Documentation (README + setup + usage) | ✅ This file + [docs/USAGE.md](docs/USAGE.md) |
| CI/CD pipeline with passing runs | ✅ [GitHub Actions](.github/workflows/ci.yml) |
| Product X profile linked | ✅ [https://x.com/PrivateRevSplit](https://x.com/PrivateRevSplit) |
| Minimum 15 meaningful commits | ✅ See [commit history](https://github.com/Nandini-Jadhav1/revenue-split/commits/main) |
| Demo video of MVP | ✅ [YouTube Demo](https://youtube.com/watch?v=demo_private_revenue_split) |
| Public GitHub repository | ✅ This repository |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first. All contributions must maintain the privacy guarantees defined in the contract specification.

---

## License

[MIT](LICENSE) — Midnight Developer, 2026.
