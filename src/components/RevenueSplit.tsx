import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, ArrowRight, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, Layers, Coins, EyeOff, UserCheck, Key, 
  Copy, Check, Terminal, FileText, Info
} from 'lucide-react';
import { contractHelper, PoolState } from '../utils/contract';

export const RevenueSplit: React.FC = () => {
  const [poolState, setPoolState] = useState<PoolState>(contractHelper.getLedgerState());
  const [activeTab, setActiveTab] = useState<'claim' | 'register' | 'overview' | 'logs'>('claim');

  // Claim Form State (Private Witnesses)
  const [claimSecret, setClaimSecret] = useState('alice_secret_123');
  const [claimSalt, setClaimSalt] = useState('salt_alice_999');
  const [claimAmount, setClaimAmount] = useState('700');
  const [showSecret, setShowSecret] = useState(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<{ nullifierHex: string; amount: bigint } | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [copiedNullifier, setCopiedNullifier] = useState(false);

  // Register Form State (Deal Creator)
  const [regSecret, setRegSecret] = useState('');
  const [regSalt, setRegSalt] = useState('');
  const [regShare, setRegShare] = useState('');
  const [regAddedRevenue, setRegAddedRevenue] = useState('0');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Live Proof Execution Log
  const [logs, setLogs] = useState<Array<{ id: number; timestamp: string; message: string; type: 'info' | 'success' | 'zk' }>>([
    { id: 1, timestamp: new Date().toLocaleTimeString(), message: 'Compact ZK Circuit initialized with 0 errors.', type: 'info' },
    { id: 2, timestamp: new Date().toLocaleTimeString(), message: 'Ledger state synced: Pool balance 1,000 tDUST.', type: 'info' },
    { id: 3, timestamp: new Date().toLocaleTimeString(), message: 'Initial commitments seeded for Alice (700) & Bob (300).', type: 'zk' },
  ]);

  const addLog = (message: string, type: 'info' | 'success' | 'zk' = 'info') => {
    setLogs((prev) => [
      { id: Date.now(), timestamp: new Date().toLocaleTimeString(), message, type },
      ...prev.slice(0, 19),
    ]);
  };

  const refreshState = () => {
    setPoolState(contractHelper.getLedgerState());
    addLog('On-chain ledger state refreshed successfully.', 'info');
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);
    setIsGeneratingProof(true);

    addLog(`Initiating ZK Proof for recipient claim: ${claimAmount} tDUST...`, 'zk');

    try {
      if (!claimSecret || !claimSalt || !claimAmount) {
        throw new Error('Please fill in all private witness fields');
      }

      const amountBigInt = BigInt(claimAmount);
      if (amountBigInt <= 0n) {
        throw new Error('Claim amount must be greater than zero');
      }

      // Simulate ZK Proving Time (1.2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const result = await contractHelper.claimPrivatePayout(
        claimSecret,
        claimSalt,
        amountBigInt
      );

      setClaimSuccess({
        nullifierHex: result.nullifierHex,
        amount: result.claimedAmount,
      });

      addLog(`ZK Proof verified! Nullifier: ${result.nullifierHex.slice(0, 16)}...`, 'success');
      addLog(`Private payout of ${result.claimedAmount} tDUST claimed cleanly.`, 'success');
      refreshState();
    } catch (err: any) {
      const msg = err.message || 'Failed to claim payout';
      setClaimError(msg);
      addLog(`Claim failed: ${msg}`, 'info');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setIsRegistering(true);

    addLog(`Registering new recipient commitment on-chain...`, 'zk');

    try {
      if (!regSecret || !regSalt || !regShare) {
        throw new Error('Please fill in recipient secret, salt, and private cut amount');
      }

      const shareBigInt = BigInt(regShare);
      const addedRevBigInt = BigInt(regAddedRevenue || '0');

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await contractHelper.registerRecipientCommitment(
        regSecret,
        regSalt,
        shareBigInt,
        addedRevBigInt
      );

      const succMsg = `Commitment registered on-chain: ${result.commitmentHex.slice(0, 16)}...`;
      setRegSuccess(succMsg);
      addLog(succMsg, 'success');

      setRegSecret('');
      setRegSalt('');
      setRegShare('');
      refreshState();
    } catch (err: any) {
      const msg = err.message || 'Failed to register recipient';
      setRegError(msg);
      addLog(`Registration error: ${msg}`, 'info');
    } finally {
      setIsRegistering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNullifier(true);
    setTimeout(() => setCopiedNullifier(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Systematic Protocol Header Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl glass-panel border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Midnight Compact Protocol
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% ZK Auditable
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Confidential Revenue Distribution
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Distribute revenue to partners, contractors, and investors with total confidentiality. Zero-knowledge proofs verify each recipient's share commitment without ever revealing individual payout amounts on the public ledger.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 min-w-[220px]">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Contract State:</span>
                <span className="text-emerald-400 font-semibold">Active</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Circuit Compiler:</span>
                <span className="text-indigo-300">Compact v0.16</span>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Verification:</span>
                <span className="text-purple-300">Off-Chain Witness</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Systematic 4-Metric Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Paid In */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-w-0 border border-slate-800/80 hover:border-indigo-500/40">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Paid In</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight my-1">
              {poolState.totalPaidIn.toString()} <span className="text-xs font-normal text-indigo-400 font-sans">tDUST</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              PUBLIC BAL
            </span>
            <span className="text-[11px] text-slate-400 truncate">On-Chain Pool</span>
          </div>
        </div>

        {/* Total Split Out */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-w-0 border border-slate-800/80 hover:border-purple-500/40">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Split Out</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight my-1">
              {poolState.totalSplitOut.toString()} <span className="text-xs font-normal text-purple-400 font-sans">tDUST</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
              ZK VERIFIED
            </span>
            <span className="text-[11px] text-slate-400 truncate">Claimed Pool</span>
          </div>
        </div>

        {/* Recipient Commitments */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-w-0 border border-slate-800/80 hover:border-cyan-500/40">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recipient Commitments</span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight my-1">
              {poolState.recipientCommitmentCount} <span className="text-xs font-normal text-cyan-400 font-sans">Parties</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 whitespace-nowrap">
              COMMITTED
            </span>
            <span className="text-[11px] text-slate-400 truncate">Cuts Concealed</span>
          </div>
        </div>

        {/* Claimed Nullifiers */}
        <div className="p-5 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-w-0 border border-slate-800/80 hover:border-emerald-500/40">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claims Executed</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight my-1">
              {poolState.claimCount.toString()} <span className="text-xs font-normal text-emerald-400 font-sans">Spent Nullifiers</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
              NO DOUBLE CLAIM
            </span>
            <span className="text-[11px] text-slate-400 truncate">Spent Set</span>
          </div>
        </div>
      </div>

      {/* Main Systematic Container with Navigation Tabs */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800/80 pb-5 mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('claim')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'claim'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <EyeOff className="w-4 h-4" /> Claim Private Cut
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Lock className="w-4 h-4" /> Register Split Rule
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Layers className="w-4 h-4" /> Ledger Architecture
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Terminal className="w-4 h-4" /> Proof Logs
            </button>
          </div>

          <button
            onClick={refreshState}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-indigo-400 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 transition-colors flex items-center justify-center gap-2 text-xs font-mono"
            title="Refresh On-Chain State"
          >
            <RefreshCw className="w-3.5 h-3.5" /> <span>Sync Ledger State</span>
          </button>
        </div>

        {/* Tab 1: Claim Private Cut */}
        {activeTab === 'claim' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-indigo-400" /> Recipient Confidential Claim
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your private secret key and salt. Your zero-knowledge proof verifies commitment eligibility without revealing your cut to co-recipients or observers.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 self-start sm:self-center">
                <Lock className="w-3.5 h-3.5" /> PRIVATE WITNESS INPUT
              </span>
            </div>

            {/* Presets / Demo helpers */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span className="font-semibold">Quick Test Credentials:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setClaimSecret('alice_secret_123');
                    setClaimSalt('salt_alice_999');
                    setClaimAmount('700');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                >
                  Alice (70% = 700 tDUST)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClaimSecret('bob_secret_456');
                    setClaimSalt('salt_bob_888');
                    setClaimAmount('300');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors"
                >
                  Bob (30% = 300 tDUST)
                </button>
              </div>
            </div>

            <form onSubmit={handleClaim} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Recipient Private Secret Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? "text" : "password"}
                      value={claimSecret}
                      onChange={(e) => setClaimSecret(e.target.value)}
                      placeholder="e.g. secret_passphrase"
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">Stays 100% on your device; never sent to on-chain ledger</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Recipient Salt Key
                  </label>
                  <input
                    type="text"
                    value={claimSalt}
                    onChange={(e) => setClaimSalt(e.target.value)}
                    placeholder="e.g. salt_999"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    required
                  />
                  <p className="text-[11px] text-slate-500">Blinds commitment hash off-chain</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Claim Payout Amount (tDUST)
                </label>
                <input
                  type="number"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  placeholder="e.g. 700"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-500">Proved equal to commitment; cut amount hidden from other recipients</p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingProof}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {isGeneratingProof ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generating Zero-Knowledge Proof...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-purple-300" />
                      <span>Prove & Claim Payout Confidentiality</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Error State Display */}
            {claimError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm mb-0.5">Claim Rejected</span>
                  <span>{claimError}</span>
                </div>
              </div>
            )}

            {/* Systematic Cryptographic Receipt Display */}
            {claimSuccess && (
              <div className="p-6 rounded-3xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <span>Zero-Knowledge Proof Verified & Executed!</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ON-CHAIN VALIDATED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/20">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans mb-0.5">Claimed Payout Amount</span>
                    <span className="text-lg font-bold text-emerald-400">{claimSuccess.amount.toString()} tDUST</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-sans mb-0.5">Privacy Level</span>
                    <span className="text-slate-200 font-sans">Individual Cut Hidden On-Chain</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-400 block text-[11px] font-sans mb-1">Disclosed Cryptographic Nullifier</span>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="truncate text-slate-300 text-[11px]">{claimSuccess.nullifierHex}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(claimSuccess.nullifierHex)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex-shrink-0"
                        title="Copy Nullifier Hex"
                      >
                        {copiedNullifier ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Register Split Rule */}
        {activeTab === 'register' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Lock className="w-5 h-5 text-indigo-400" /> Deal Creator — Register Recipient Payout Cut
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Register a recipient commitment on-chain. The recipient cut is converted into an off-chain cryptographic commitment so no one on-chain sees their share percentage.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Recipient Secret String
                  </label>
                  <input
                    type="text"
                    value={regSecret}
                    onChange={(e) => setRegSecret(e.target.value)}
                    placeholder="e.g. recipient_charlie_key"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Recipient Salt
                  </label>
                  <input
                    type="text"
                    value={regSalt}
                    onChange={(e) => setRegSalt(e.target.value)}
                    placeholder="e.g. salt_charlie_777"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    required
                  />
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                  <label className="block text-xs font-semibold text-slate-200">
                    Private Share Amount (tDUST)
                  </label>
                  <input
                    type="number"
                    value={regShare}
                    onChange={(e) => setRegShare(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-2">
                <label className="block text-xs font-semibold text-slate-200">
                  Additional Revenue Deposit (Optional tDUST)
                </label>
                <input
                  type="number"
                  value={regAddedRevenue}
                  onChange={(e) => setRegAddedRevenue(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <span>Registering Commitment...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Commit Recipient Cut On-Chain</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {regError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {regSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{regSuccess}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Public vs Private State Explanation */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Midnight Privacy Architecture Matrix
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Public Ledger State */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Unlock className="w-4 h-4" /> PUBLIC LEDGER STATE (ON-CHAIN)
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    AUDITABLE
                  </span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 font-mono">
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>totalPaidIn</span>
                    <span className="text-emerald-400 font-bold">{poolState.totalPaidIn.toString()} tDUST</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>totalSplitOut</span>
                    <span className="text-emerald-400 font-bold">{poolState.totalSplitOut.toString()} tDUST</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>splitCommitment</span>
                    <span className="text-slate-400 truncate max-w-[180px]">{poolState.splitCommitment}</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>claimedNullifiers</span>
                    <span className="text-purple-400 font-semibold">{poolState.claimedNullifierCount} spent</span>
                  </li>
                </ul>
              </div>

              {/* Private Witness State */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Lock className="w-4 h-4" /> PRIVATE WITNESSES (ZK PROVED OFF-CHAIN)
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    CONFIDENTIAL
                  </span>
                </div>
                <ul className="text-xs text-slate-300 space-y-2.5 font-mono">
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>recipientSecret</span>
                    <span className="text-purple-400 font-bold">NEVER ON-CHAIN</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>recipientSalt</span>
                    <span className="text-purple-400 font-bold">OFF-CHAIN BLINDING</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>individualCut</span>
                    <span className="text-purple-400 font-bold">HIDDEN FROM OTHERS</span>
                  </li>
                  <li className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span>ZK Sum Constraint</span>
                    <span className="text-emerald-400 font-sans font-semibold">sum(cuts) == totalPaidIn</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Proof Execution Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-indigo-400" /> Real-Time ZK Proof Execution Logs
              </h2>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                LIVE AUDIT
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 max-h-[380px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 border-b border-slate-900 pb-2 last:border-0">
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">{log.timestamp}</span>
                  <span className={`flex-1 ${
                    log.type === 'success' ? 'text-emerald-400 font-semibold' :
                    log.type === 'zk' ? 'text-purple-300' : 'text-slate-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
