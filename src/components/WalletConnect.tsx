import React from 'react';
import { Wallet, ShieldCheck, AlertCircle, LogOut, ExternalLink } from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight';

export const WalletConnect: React.FC = () => {
  const { isConnected, isConnecting, address, network, error, isWalletInstalled, connect, disconnect, installUrl } = useMidnight();

  const truncateAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-3">
        {isConnected ? (
          <div className="flex items-center gap-2.5">
            {/* Network Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{network || 'Preprod'}</span>
            </div>

            {/* Address Display */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 text-slate-200 text-xs font-mono border border-indigo-500/30 shadow-md">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{truncateAddress(address)}</span>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={disconnect}
              title="Disconnect Wallet"
              className="p-2 rounded-xl bg-slate-900/90 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {!isWalletInstalled && (
              <a
                href={installUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-medium transition-colors"
              >
                <span>Get 1AM Wallet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-indigo-400/30"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Awaiting 1AM Approval...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Connect 1AM Wallet</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs max-w-sm text-right animate-fadeIn">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="truncate">{error}</span>
          {!isWalletInstalled && (
            <a
              href={installUrl}
              target="_blank"
              rel="noreferrer"
              className="underline text-indigo-300 hover:text-white font-medium ml-1 whitespace-nowrap"
            >
              Install 1AM
            </a>
          )}
        </div>
      )}
    </div>
  );
};
