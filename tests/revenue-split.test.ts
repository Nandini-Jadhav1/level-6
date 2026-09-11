import { describe, it, expect, beforeEach } from 'vitest';
import { RevenueSplitContract } from '../managed/RevenueSplit/index.js';

describe('Private Revenue Split — Compact Smart Contract', () => {
  let contract: RevenueSplitContract;
  
  // Helper for generating 32-byte Uint8Array from string/byte
  const makeBytes = (val: number, len = 32): Uint8Array => {
    const arr = new Uint8Array(len);
    arr.fill(val);
    return arr;
  };

  const organizerSecret = makeBytes(0xAA);
  let organizerPubKey: Uint8Array;
  const poolId = makeBytes(0x99);
  const ruleCommitment = makeBytes(0x77);

  beforeEach(() => {
    contract = new RevenueSplitContract();
    organizerPubKey = contract.sha256(organizerSecret);
  });

  it('1. Valid Split: total in == total out and each recipient can claim their share', async () => {
    const totalIncomingPayment = 1000n; // $1,000 revenue pool
    
    // Initialize pool with $1,000 initial total paid in
    await contract.initialize(organizerPubKey, totalIncomingPayment, ruleCommitment);

    // Recipient A (70% = $700)
    const secretA = makeBytes(0x01);
    const saltA = makeBytes(0x11);
    const shareA = 700n;
    const commitmentA = contract.computeRecipientCommitment(secretA, saltA, shareA);

    // Recipient B (30% = $300)
    const secretB = makeBytes(0x02);
    const saltB = makeBytes(0x22);
    const shareB = 300n;
    const commitmentB = contract.computeRecipientCommitment(secretB, saltB, shareB);

    // Organizer registers both commitments
    await contract.registerRecipient(organizerSecret, commitmentA, 0n);
    await contract.registerRecipient(organizerSecret, commitmentB, 0n);

    expect(contract.ledger.recipientCommitments.size).toBe(2);
    expect(contract.ledger.totalPaidIn).toBe(1000n);
    expect(contract.ledger.totalSplitOut).toBe(0n);

    // Recipient A claims their $700 payout privately
    const witnessA = { recipientSecret: secretA, recipientSalt: saltA };
    const nullifierA = await contract.claimPayout(witnessA, shareA, poolId);

    expect(nullifierA).toBeDefined();
    expect(nullifierA.length).toBe(32);
    expect(contract.ledger.totalSplitOut).toBe(700n);

    // Recipient B claims their $300 payout privately
    const witnessB = { recipientSecret: secretB, recipientSalt: saltB };
    const nullifierB = await contract.claimPayout(witnessB, shareB, poolId);

    expect(nullifierB).toBeDefined();
    expect(nullifierB.length).toBe(32);
    
    // Verify total paid in == total split out ($1,000 == $700 + $300)
    expect(contract.ledger.totalPaidIn).toBe(1000n);
    expect(contract.ledger.totalSplitOut).toBe(1000n);
    expect(contract.ledger.claimCount).toBe(2n);
  });

  it('2. Invalid Split Attempt: rejected when shares sum exceed total paid in or invalid witness provided', async () => {
    const totalIncomingPayment = 500n; // Only $500 in pool
    await contract.initialize(organizerPubKey, totalIncomingPayment, ruleCommitment);

    // Recipient tries to claim $700 (which exceeds $500 pool)
    const secret = makeBytes(0x05);
    const salt = makeBytes(0x55);
    const excessiveShare = 700n;
    const commitment = contract.computeRecipientCommitment(secret, salt, excessiveShare);

    await contract.registerRecipient(organizerSecret, commitment, 0n);

    // Claim should be rejected by ZK circuit total check
    await expect(
      contract.claimPayout({ recipientSecret: secret, recipientSalt: salt }, excessiveShare, poolId)
    ).rejects.toThrow('Claim rejected: Cumulative payouts exceed total pool revenue');
  });

  it('3. Privacy & Access Control: recipient cannot read/claim another recipient private share or double claim', async () => {
    const totalIncomingPayment = 2000n; // Sufficient pool balance for testing nullifier double claim
    await contract.initialize(organizerPubKey, totalIncomingPayment, ruleCommitment);

    const secretA = makeBytes(0x01);
    const saltA = makeBytes(0x11);
    const shareA = 700n;
    const commitmentA = contract.computeRecipientCommitment(secretA, saltA, shareA);

    await contract.registerRecipient(organizerSecret, commitmentA, 0n);

    // Unauthorized Recipient (Eve) tries to claim Recipient A's cut with a wrong secret or share
    const eveSecret = makeBytes(0xEE);
    await expect(
      contract.claimPayout({ recipientSecret: eveSecret, recipientSalt: saltA }, shareA, poolId)
    ).rejects.toThrow('Claim failed: Commitment not found in split registry');

    // Recipient A claims legitimately once
    await contract.claimPayout({ recipientSecret: secretA, recipientSalt: saltA }, shareA, poolId);

    // Recipient A tries to claim again (Double claim attack)
    await expect(
      contract.claimPayout({ recipientSecret: secretA, recipientSalt: saltA }, shareA, poolId)
    ).rejects.toThrow('Double claim rejected: Payout already claimed for this pool');
  });
});
