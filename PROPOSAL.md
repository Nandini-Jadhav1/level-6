# Project Proposal — Private Revenue Split (Midnight Network)

## 1. Executive Summary
**Private Revenue Split** is a confidential revenue-distribution tool built on the Midnight blockchain using Compact zero-knowledge smart contracts. It enables incoming payments (e.g. client retainers, sales revenue, royalties, or DAO earnings) to be automatically divided between multiple collaborators (e.g. 70/30 co-founder split or multi-way contributor royalties) without exposing individual cuts to co-recipients, clients, or public chain observers.

## 2. Problem Statement
On traditional public smart contract blockchains (Ethereum, Solana, Polygon), revenue splitting contracts record all recipient wallet addresses and their exact share percentages or payout amounts directly in readable state logs. This creates severe business and privacy risks:
- **Negotiation Disadvantage**: Clients and partners can inspect contract state to see internal profit margins or unequal partner cuts.
- **Poaching & Friction**: Competitors can identify co-founders' cuts and attempt to outbid or target individual contributors.
- **Financial Surveillance**: Public ledgers expose income details of freelancers, artists, and indie hackers to anyone with a block explorer.

## 3. The Midnight Zero-Knowledge Solution
Midnight Network's Compact language introduces a dual-state ledger model separating **Public Ledger State** from **Private Witness Inputs**.

### Privacy Architecture
- **Public Ledger State (Verifiable On-Chain)**:
  - `totalPaidIn`: Cumulative funds deposited into the revenue pool.
  - `totalSplitOut`: Cumulative sum of claimed payouts.
  - `recipientCommitments`: Set of cryptographic commitment hashes anchoring valid payout eligibility.
  - `claimedNullifiers`: Spent nullifiers preventing double claims.
- **Private Witnesses (Proved in ZK, Never Revealed)**:
  - `recipientSecret`: Private key proving ownership of payout eligibility.
  - `recipientSalt`: Hiding factor for off-chain commitment generation.
  - `claimAmount`: Recipient's exact individual share.
- **ZK Circuit Proof**:
  - Proves `sum(individual shares) <= totalPaidIn`.
  - Proves recipient commitment is registered without revealing recipient identity.
  - Emits unique nullifier preventing duplicate claims.

## 4. Target Audience
- **Indie Hackers & Co-founders**: Split product proceeds 70/30 or 50/50 without disclosing earnings to competitors.
- **Creative Collaborators & Royalty Collectors**: Divide streaming or digital sales among artists, producers, and writers privately.
- **DAOs & Freelance Guilds**: Distribute project bounties to contributors confidentially.

## 5. Technical Stack
- **Smart Contract**: Midnight Compact DSL (`contracts/revenue-split.compact`)
- **Managed Bindings**: Managed TypeScript Circuit Interfaces (`managed/RevenueSplit/`)
- **Frontend**: React 19 + Vite + TypeScript + TailwindCSS
- **Wallet Integration**: Midnight Lace Wallet DApp Connector API (`window.midnight`)
- **Testing**: Vitest unit test suite covering valid splits, invalid share rejection, and confidential claims.
