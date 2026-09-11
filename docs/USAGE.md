# How to Use Private Revenue Split

Welcome to **Private Revenue Split** — the zero-knowledge dApp that lets you split incoming payments confidentially on the Midnight Network without exposing individual cuts to anyone.

---

## What You Need

Before getting started, make sure you have:
1. **Lace Wallet (Midnight Preprod Network)** installed in your browser.
2. **Preprod Test Tokens (tDUST)** funded via the Midnight Preprod Faucet.
3. Your private deal credentials (secret passphrase and salt) provided by your project manager or generated off-chain.

---

## Step-by-Step Guide

### Scenario 1: How to Set Up a Revenue Split (Deal Creator / Organizer)

1. **Connect Your Wallet**:
   - Click **Connect Lace Wallet** at the top right of the dApp header.
   - Confirm the network badge displays **Preprod**.

2. **Navigate to "Register Split Rule"**:
   - Click the **Register Split Rule** tab on the dashboard.

3. **Generate Off-Chain Recipient Commitments**:
   - For each recipient (e.g. Alice & Bob), enter their private secret string (e.g. `alice_secret_123`), salt (`salt_alice_999`), and their private share amount (e.g. `700 tDUST`).

4. **Submit Commitment On-Chain**:
   - Click **Commit Recipient Cut On-Chain**.
   - The contract hashes the secret, salt, and amount into a 32-byte cryptographic commitment on the Midnight ledger.
   - **Result**: The ledger registers the commitment and total deposit without storing Alice or Bob's individual cuts!

---

### Scenario 2: How to Claim Your Payout (Recipient)

1. **Open "Claim My Private Cut"**:
   - Click the **Claim My Private Cut** tab.

2. **Enter Your Private Witness Credentials**:
   - **Recipient Secret Key**: Enter your private passphrase (e.g. `alice_secret_123`).
   - **Recipient Salt Key**: Enter your blinding salt (e.g. `salt_alice_999`).
   - **Claim Payout Amount**: Enter your exact cut (e.g. `700`).

3. **Generate & Submit Zero-Knowledge Proof**:
   - Click **Prove & Claim Payout Confidentiality**.
   - The dApp compiles a zero-knowledge proof locally on your browser.
   - The proof verifies that your commitment matches the registered list and that total payouts do not exceed the pool balance.

4. **Receive Payout & Nullifier**:
   - Once verified, the contract emits a unique nullifier on-chain to mark your payout as spent.
   - Your payout is collected into your wallet while keeping your cut hidden from co-recipients!

---

## What Gets Proved (and What Stays Private)

| Data Field | Visibility | Description |
|---|---|---|
| **Total Paid In** | `PUBLIC` (On-Chain) | Total revenue deposited into the pool, auditable by anyone. |
| **Total Split Out** | `PUBLIC` (On-Chain) | Cumulative payouts claimed across all parties. |
| **Split Commitment** | `PUBLIC` (On-Chain) | Anchor proving split structure validity. |
| **Nullifiers** | `PUBLIC` (On-Chain) | One-time spent markers preventing double claims. |
| **Recipient Secret Key** | `PRIVATE` (Witness) | Stays on recipient's local machine; never leaves device. |
| **Recipient Salt** | `PRIVATE` (Witness) | Blinds off-chain commitment. |
| **Individual Cut Amount** | `PRIVATE` (Witness) | Hidden from co-recipients, clients, and block explorers. |
| **ZK Sum Proof** | `PROVED` | Proves `sum(cuts) <= totalPaidIn` without exposing individual numbers. |

---

## Troubleshooting

### Issue 1: "Claim failed: Commitment not found in split registry"
- **Cause**: The secret key, salt, or claim amount does not match the exact values used when the commitment was registered.
- **Solution**: Double-check typos or capitalization in your secret string and salt.

### Issue 2: "Double claim rejected: Payout already claimed for this pool"
- **Cause**: A payout nullifier has already been recorded on the Midnight ledger for this secret and pool ID.
- **Solution**: Payouts can only be claimed once per pool. Verify whether you already executed the claim.

### Issue 3: "Claim rejected: Cumulative payouts exceed total pool revenue"
- **Cause**: The total claimed amount across all recipients would exceed `totalPaidIn`.
- **Solution**: Ensure the organizer has funded the pool with adequate `totalPaidIn` balance.
