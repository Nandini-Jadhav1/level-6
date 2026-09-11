import React from 'react';
import { WalletConnect } from './WalletConnect';
import { Shield, Sparkles, ExternalLink, Activity, Cpu } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white bg-[#060913] text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#060913]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">Private Revenue Split</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  Preprod
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Midnight Network</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                  <Activity className="w-3 h-3 animate-pulse" /> Compact ZK Active
                </span>
              </div>
            </div>
          </div>

          {/* Right Wallet Action */}
          <WalletConnect />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built for Level 4 of Midnight Builder Challenge on Rise In</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Compact ZK Protocol
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://midnight.network"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              Midnight Network <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://docs.midnight.network"
              target="_blank"
              rel="noreferrer"
              className="hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

