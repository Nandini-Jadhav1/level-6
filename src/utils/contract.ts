import { RevenueSplitContract, RecipientWitness } from '../contracts/managed/RevenueSplit/index.js';

export interface PoolState {
  organizerPublicKey: string;
  splitCommitment: string;
  totalPaidIn: bigint;
  totalSplitOut: bigint;
  claimCount: bigint;
  recipientCommitmentCount: number;
  claimedNullifierCount: number;
}

export class RevenueSplitHelper {
  private contract: RevenueSplitContract;
  private currentPoolId: Uint8Array;
  private organizerSecret: Uint8Array;

  constructor() {
    this.contract = new RevenueSplitContract();
    this.currentPoolId = new Uint8Array(32);
    this.currentPoolId.fill(0x99);
    
    // Default organizer secret key
    this.organizerSecret = new Uint8Array(32);
    this.organizerSecret.fill(0xaa);
    
    // Initialize default pool with 1,000 tDUST / revenue tokens
    const pubKey = this.contract.sha256(this.organizerSecret);
    const ruleCommitment = new Uint8Array(32);
    ruleCommitment.fill(0x77);
    
    this.contract.initialize(pubKey, 1000n, ruleCommitment);
    
    // Seed initial demo 70/30 split commitments
    // Recipient 1: Secret "alice_secret_123", Salt "salt_alice_999", Cut = 700 tDUST
    const secret1 = this.stringToBytes32("alice_secret_123");
    const salt1 = this.stringToBytes32("salt_alice_999");
    const commitment1 = this.contract.computeRecipientCommitment(secret1, salt1, 700n);
    this.contract.registerRecipient(this.organizerSecret, commitment1, 0n);

    // Recipient 2: Secret "bob_secret_456", Salt "salt_bob_888", Cut = 300 tDUST
    const secret2 = this.stringToBytes32("bob_secret_456");
    const salt2 = this.stringToBytes32("salt_bob_888");
    const commitment2 = this.contract.computeRecipientCommitment(secret2, salt2, 300n);
    this.contract.registerRecipient(this.organizerSecret, commitment2, 0n);
  }

  public stringToBytes32(str: string): Uint8Array {
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const encoded = encoder.encode(str);
    bytes.set(encoded.slice(0, 32));
    return bytes;
  }

  public bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  public getLedgerState(): PoolState {
    const ledger = this.contract.ledger;
    return {
      organizerPublicKey: this.bytesToHex(ledger.organizerPublicKey),
      splitCommitment: this.bytesToHex(ledger.splitCommitment),
      totalPaidIn: ledger.totalPaidIn,
      totalSplitOut: ledger.totalSplitOut,
      claimCount: ledger.claimCount,
      recipientCommitmentCount: ledger.recipientCommitments.size,
      claimedNullifierCount: ledger.claimedNullifiers.size,
    };
  }

  public async registerRecipientCommitment(
    recipientSecretStr: string,
    recipientSaltStr: string,
    shareAmount: bigint,
    addedRevenue: bigint = 0n
  ): Promise<{ commitmentHex: string }> {
    const secret = this.stringToBytes32(recipientSecretStr);
    const salt = this.stringToBytes32(recipientSaltStr);
    const commitment = this.contract.computeRecipientCommitment(secret, salt, shareAmount);
    
    await this.contract.registerRecipient(this.organizerSecret, commitment, addedRevenue);
    return { commitmentHex: this.bytesToHex(commitment) };
  }

  public async claimPrivatePayout(
    recipientSecretStr: string,
    recipientSaltStr: string,
    claimAmount: bigint
  ): Promise<{ nullifierHex: string; claimedAmount: bigint }> {
    const secret = this.stringToBytes32(recipientSecretStr);
    const salt = this.stringToBytes32(recipientSaltStr);

    const witness: RecipientWitness = {
      recipientSecret: secret,
      recipientSalt: salt,
    };

    const nullifier = await this.contract.claimPayout(witness, claimAmount, this.currentPoolId);
    return {
      nullifierHex: this.bytesToHex(nullifier),
      claimedAmount: claimAmount,
    };
  }
}

export const contractHelper = new RevenueSplitHelper();
