import React from 'react';
import { Wallet, ShieldCheck, AlertCircle, LogOut, ExternalLink } from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const {
    isConnected, isConnecting, address, network, error,
    isWalletInstalled, connect, disconnect, installUrl,
  } = useMidnight();

  const truncateAddress = (addr: string | null) => {
    if (!addr) return '';
    if (addr.length <= 18) return addr;
    return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
  };

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2.5">

        {isConnected ? (
          <>
            {/* Network badge */}
            <span className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              {network || 'Preprod'}
            </span>

            {/* Address chip */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900/70 border border-indigo-500/20 text-slate-200 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{truncateAddress(address)}</span>
            </div>

            {/* Disconnect */}
            <button
              onClick={disconnect}
              title="Disconnect wallet"
              aria-label="Disconnect wallet"
              className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            {/* Install hint */}
            {!isWalletInstalled && !isConnecting && (
              <a
                href={installUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800/80 text-xs font-medium transition-colors"
              >
                Get 1AM Wallet <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* Connect button */}
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-colors disabled:opacity-55 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="hidden sm:inline">Connecting…</span>
                  <span className="sm:hidden">…</span>
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span>Connect 1AM Wallet</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Error strip */}
      {error && (
        <div className="flex items-start gap-2 px-3.5 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-red-400 text-xs max-w-sm">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-snug line-clamp-2">{error}</span>
          {!isWalletInstalled && (
            <a href={installUrl} target="_blank" rel="noreferrer"
              className="ml-1 underline text-indigo-300 hover:text-white whitespace-nowrap shrink-0 text-[11px]">
              Install
            </a>
          )}
        </div>
      )}
    </div>
  );
};
