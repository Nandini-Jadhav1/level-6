import React from 'react';
import { WalletConnect } from './WalletConnect';
import { Shield, ExternalLink, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout centering strategy
 * ─────────────────────────
 * Every full-width zone (header, main, footer) contains ONE inner div
 * with className="app-cx".
 *
 * .app-cx is defined in index.css as plain CSS — NOT via Tailwind:
 *
 *   .app-cx {
 *     width: 100%;
 *     max-width: 1280px;
 *     margin-left: auto;
 *     margin-right: auto;
 *     padding-left: 40px;
 *     padding-right: 40px;
 *     box-sizing: border-box;
 *   }
 *
 * Using a plain CSS class (not a Tailwind utility) guarantees the rule
 * is compiled into the stylesheet unconditionally — no purging, no
 * arbitrary-value generation issues.
 *
 * At 1600px viewport:  160px gap | 1280px content | 160px gap
 * At 1440px viewport:   80px gap | 1280px content |  80px gap
 * At 1280px viewport:   padding only (40px each side)
 * At ≤1024px:           24px each side
 * At ≤640px:            16px each side
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-white">

      {/* ── Header: full-width bg, app-cx inner ──── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-[#07091a]/92 backdrop-blur-xl">
        <div className="app-cx" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>

          {/* Branding */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/12 border border-indigo-500/25
                            flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[15px] text-slate-100 tracking-tight">
                  Private Revenue Split
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md
                                 text-[10px] font-mono font-medium bg-indigo-500/10
                                 text-indigo-300 border border-indigo-500/20 shrink-0">
                  Preprod
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                <span>Midnight Network</span>
                <span className="text-slate-700">·</span>
                <span className="flex items-center gap-1 text-emerald-500/70">
                  <Activity className="w-2.5 h-2.5" />
                  ZK Active
                </span>
              </div>
            </div>
          </div>

          {/* Wallet */}
          <WalletConnect />
        </div>
      </header>

      {/* ── Main: full-width, app-cx inner ─────────── */}
      <main className="w-full flex-1">
        <div className="app-cx" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="space-y-10">
            {children}
          </div>
        </div>
      </main>

      {/* ── Footer: full-width border, app-cx inner ─ */}
      <footer className="w-full border-t border-white/[0.04] mt-16">
        <div className="app-cx" style={{ paddingTop: 32, paddingBottom: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <span className="text-[13px] text-slate-600">
            Built on Midnight Network · Compact ZK Protocol · Preprod
          </span>
          <div className="flex items-center gap-6 text-[13px] text-slate-600">
            <a href="https://midnight.network" target="_blank" rel="noreferrer"
               className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
              Midnight Network <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://docs.midnight.network" target="_blank" rel="noreferrer"
               className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
              Docs <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://1am.xyz" target="_blank" rel="noreferrer"
               className="hover:text-slate-300 transition-colors flex items-center gap-1.5">
              1AM Wallet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
