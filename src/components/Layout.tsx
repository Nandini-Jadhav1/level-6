import React from 'react';
import { WalletConnect } from './WalletConnect';
import { Activity, ArrowUpRight, ExternalLink } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-white">
      <header className="app-header sticky top-0 z-50 w-full">
        <div className="app-cx app-header-inner">
          <a className="brand-lockup" href="#top" aria-label="Splitline home">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M11 12.5h11.5a6 6 0 0 1 0 12H17" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M29 27.5H17.5a6 6 0 0 1 0-12H23" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="11" cy="12.5" r="2.5" fill="currentColor" />
                <circle cx="29" cy="27.5" r="2.5" fill="currentColor" />
              </svg>
            </span>
            <span className="brand-copy">
              <span className="brand-name">Splitline</span>
              <span className="brand-caption">PRIVATE REVENUE</span>
            </span>
          </a>

          <div className="header-network" aria-label="Midnight Preprod network status">
            <span className="network-pulse" />
            <span className="header-network-name">Midnight</span>
            <span className="network-divider" />
            <span className="header-network-env">Preprod</span>
          </div>

          <WalletConnect />
        </div>
      </header>

      <main className="w-full flex-1">
        <div id="top" className="app-cx app-main">
          {children}
        </div>
      </main>

      <footer className="app-footer w-full">
        <div className="app-cx app-footer-inner">
          <span className="footer-note">
            <Activity className="w-3.5 h-3.5" />
            Confidential by design. Verified on Midnight.
          </span>
          <div className="footer-links">
            <a href="https://midnight.network" target="_blank" rel="noreferrer">
              Midnight <ArrowUpRight className="w-3 h-3" />
            </a>
            <a href="https://docs.midnight.network" target="_blank" rel="noreferrer">
              Documentation <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://1am.xyz" target="_blank" rel="noreferrer">
              1AM Wallet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
