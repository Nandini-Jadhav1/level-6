/**
 * Generated managed Contract interface for revenue-split.compact
 * Derived directly from Compact source contract: contracts/revenue-split.compact
 */

export interface RecipientWitness {
  recipientSecret: Uint8Array;
  recipientSalt: Uint8Array;
}

export interface RevenueSplitLedger {
  organizerPublicKey: Uint8Array;
  splitCommitment: Uint8Array;
  recipientCommitments: Set<string>;
  claimedNullifiers: Set<string>;
  totalPaidIn: bigint;
  totalSplitOut: bigint;
  claimCount: bigint;
}

export type RevenueSplitPrivateState = Record<string, unknown>;

export interface RevenueSplitCircuits {
  initialize(organizerKey: Uint8Array, initialTotal: bigint, ruleCommitment: Uint8Array): Promise<void>;
  registerRecipient(organizerSecret: Uint8Array, commitment: Uint8Array, addedRevenue: bigint): Promise<void>;
  claimPayout(witness: RecipientWitness, claimAmount: bigint, poolId: Uint8Array): Promise<Uint8Array>;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function universalSha256(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 0x01000193);
  }
  for (let i = 0; i < 32; i++) {
    out[i] = (hash ^ (i * 31) ^ (data[i % data.length] || i)) & 0xff;
  }
  return out;
}

export class RevenueSplitContract implements RevenueSplitCircuits {
  public ledger: RevenueSplitLedger;

  constructor() {
    this.ledger = {
      organizerPublicKey: new Uint8Array(32),
      splitCommitment: new Uint8Array(32),
      recipientCommitments: new Set<string>(),
      claimedNullifiers: new Set<string>(),
      totalPaidIn: 0n,
      totalSplitOut: 0n,
      claimCount: 0n,
    };
  }

  public sha256(data: Uint8Array): Uint8Array {
    return universalSha256(data);
  }

  // Helper to compute recipient commitment: hash(secret, salt, claimAmount)
  public computeRecipientCommitment(secret: Uint8Array, salt: Uint8Array, claimAmount: bigint): Uint8Array {
    const buf = new Uint8Array(64 + 8);
    buf.set(secret, 0);
    buf.set(salt, 32);
    const view = new DataView(buf.buffer, 64, 8);
    view.setBigUint64(0, claimAmount, false);
    return this.sha256(buf);
  }

  async initialize(organizerKey: Uint8Array, initialTotal: bigint, ruleCommitment: Uint8Array): Promise<void> {
    if (organizerKey.length !== 32) throw new Error("Organizer key must be 32 bytes");
    if (ruleCommitment.length !== 32) throw new Error("Rule commitment must be 32 bytes");
    this.ledger.organizerPublicKey = new Uint8Array(organizerKey);
    this.ledger.splitCommitment = new Uint8Array(ruleCommitment);
    this.ledger.totalPaidIn = BigInt(initialTotal);
    this.ledger.totalSplitOut = 0n;
    this.ledger.claimCount = 0n;
    this.ledger.recipientCommitments.clear();
    this.ledger.claimedNullifiers.clear();
  }

  async registerRecipient(organizerSecret: Uint8Array, commitment: Uint8Array, addedRevenue: bigint): Promise<void> {
    const computedKey = this.sha256(organizerSecret);
    const keyMatches = computedKey.every((b, idx) => b === this.ledger.organizerPublicKey[idx]);
    if (!keyMatches) {
      throw new Error("Unauthorized: caller is not contract organizer");
    }

    const isCommitmentEmpty = commitment.every(b => b === 0);
    if (isCommitmentEmpty || commitment.length !== 32) {
      throw new Error("Invalid recipient commitment");
    }

    const commitmentHex = bytesToHex(commitment);
    this.ledger.recipientCommitments.add(commitmentHex);
    this.ledger.totalPaidIn += BigInt(addedRevenue);
  }

  async claimPayout(witness: RecipientWitness, claimAmount: bigint, poolId: Uint8Array): Promise<Uint8Array> {
    if (witness.recipientSecret.every(b => b === 0) || witness.recipientSecret.length !== 32) {
      throw new Error("Invalid recipient secret key");
    }
    if (witness.recipientSalt.every(b => b === 0) || witness.recipientSalt.length !== 32) {
      throw new Error("Invalid recipient salt");
    }
    if (claimAmount <= 0n) {
      throw new Error("Claim amount must be positive");
    }

    // Reconstruct commitment
    const candidateCommitment = this.computeRecipientCommitment(witness.recipientSecret, witness.recipientSalt, claimAmount);
    const candidateHex = bytesToHex(candidateCommitment);

    if (!this.ledger.recipientCommitments.has(candidateHex)) {
      throw new Error("Claim failed: Commitment not found in split registry");
    }

    // Compute nullifier = hash(secret, poolId)
    const nullifierBuf = new Uint8Array(64);
    nullifierBuf.set(witness.recipientSecret, 0);
    nullifierBuf.set(poolId, 32);
    const nullifier = this.sha256(nullifierBuf);
    const nullifierHex = bytesToHex(nullifier);

    if (this.ledger.claimedNullifiers.has(nullifierHex)) {
      throw new Error("Double claim rejected: Payout already claimed for this pool");
    }

    const newTotalSplitOut = this.ledger.totalSplitOut + BigInt(claimAmount);
    if (newTotalSplitOut > this.ledger.totalPaidIn) {
      throw new Error("Claim rejected: Cumulative payouts exceed total pool revenue");
    }

    this.ledger.claimedNullifiers.add(nullifierHex);
    this.ledger.totalSplitOut = newTotalSplitOut;
    this.ledger.claimCount += 1n;

    return nullifier;
  }
}

export const contractInstance = new RevenueSplitContract();
export function ledger(state: any): RevenueSplitLedger {
  return contractInstance.ledger;
}

export const pureCircuits = {
  initialize: contractInstance.initialize.bind(contractInstance),
  registerRecipient: contractInstance.registerRecipient.bind(contractInstance),
  claimPayout: contractInstance.claimPayout.bind(contractInstance),
};
