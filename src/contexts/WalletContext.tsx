import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
  isWalletInstalled: boolean;
  connectedApi: any | null; // Store the 1AM ConnectedAPI instance
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  installUrl: string;
}

const INITIAL_STATE: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  error: null,
  isWalletInstalled: false,
  connectedApi: null,
};

const NETWORK_ID = 'preprod';

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  // Detect whether window.midnight['1am'] is present
  const checkWalletInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const m = (window as any).midnight;
    return !!(m && m['1am'] && typeof m['1am'].connect === 'function');
  }, []);

  useEffect(() => {
    // Update wallet installation status
    setWalletState((prev) => ({
      ...prev,
      isWalletInstalled: checkWalletInstalled(),
    }));

    const handleFocus = () => {
      setWalletState((prev) => ({
        ...prev,
        isWalletInstalled: checkWalletInstalled(),
      }));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkWalletInstalled]);

  const connect = useCallback(async () => {
    // Guard: don't double-fire
    if (walletState.isConnecting) return;

    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined') {
        throw new Error('Not a browser environment.');
      }

      const midnight = (window as any).midnight;

      if (!midnight || !midnight['1am']) {
        setWalletState({
          ...INITIAL_STATE,
          isWalletInstalled: false,
          error:
            '1AM Wallet extension not detected. Please install the 1AM browser extension and configure it for Midnight Preprod.',
        });
        return;
      }

      if (typeof midnight['1am'].connect !== 'function') {
        throw new Error(
          '1AM Wallet extension found but does not expose a connect() method. Please update the extension.'
        );
      }

      // Call 1AM connect() to get ConnectedAPI
      let api: any;
      try {
        api = await midnight['1am'].connect(NETWORK_ID);
      } catch (e: any) {
        // Handle user rejection
        const isDappError =
          e && typeof e === 'object' && e.type === 'DAppConnectorAPIError';
        const isRejected =
          isDappError
            ? e.code === 'Rejected' || e.code === 4001
            : e?.code === 4001 ||
              e?.message?.toLowerCase().includes('rejected') ||
              e?.message?.toLowerCase().includes('user denied') ||
              e?.message?.toLowerCase().includes('cancelled');

        setWalletState({
          ...INITIAL_STATE,
          isWalletInstalled: checkWalletInstalled(),
          error: isRejected
            ? 'Connection rejected in 1AM Wallet. Click "Connect 1AM Wallet" to try again.'
            : isDappError
            ? `1AM Wallet error: ${e.reason ?? e.code ?? 'Unknown error'}`
            : e?.message ?? 'Failed to connect to 1AM Wallet.',
        });
        return;
      }

      if (!api) {
        throw new Error(
          '1AM did not return a connector API. The request may have been rejected or the extension is not properly configured.'
        );
      }

      // Get wallet address from ConnectedAPI
      let connectedAddress: string | null = null;
      let resolvedNetwork: string = NETWORK_ID;

      // Prefer shielded address, fall back to unshielded
      if (typeof api.getShieldedAddresses === 'function') {
        try {
          const shielded = await api.getShieldedAddresses();
          connectedAddress = shielded?.shieldedAddress ?? null;
        } catch {
          // Will try unshielded next
        }
      }

      if (!connectedAddress && typeof api.getUnshieldedAddress === 'function') {
        try {
          const unshielded = await api.getUnshieldedAddress();
          connectedAddress = unshielded?.unshieldedAddress ?? null;
        } catch {
          // Address will remain null
        }
      }

      // Get network configuration
      if (typeof api.getConfiguration === 'function') {
        try {
          const config = await api.getConfiguration();
          if (config?.networkId) resolvedNetwork = config.networkId;
        } catch {
          // Non-fatal, fall back to constant
        }
      }

      if (
        !connectedAddress ||
        typeof connectedAddress !== 'string' ||
        connectedAddress.trim() === ''
      ) {
        throw new Error(
          '1AM connected but returned no wallet address. Please ensure an account is selected and the extension is synced with Midnight Preprod.'
        );
      }

      // Set connected state with the ConnectedAPI instance
      setWalletState({
        isConnected: true,
        isConnecting: false,
        address: connectedAddress,
        network: resolvedNetwork,
        error: null,
        isWalletInstalled: true,
        connectedApi: api, // Store the ConnectedAPI for reuse
      });

      console.log('[WalletProvider] 1AM connected. Address:', connectedAddress);
    } catch (err: any) {
      console.error('[WalletProvider] Connection failed:', err);

      const isRejected =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('rejected') ||
        err?.message?.toLowerCase().includes('user denied') ||
        err?.message?.toLowerCase().includes('cancelled');

      setWalletState({
        ...INITIAL_STATE,
        isWalletInstalled: checkWalletInstalled(),
        error: isRejected
          ? 'Connection rejected in 1AM Wallet. Click "Connect 1AM Wallet" to try again.'
          : err?.message ?? 'Failed to connect to 1AM Wallet.',
      });
    }
  }, [walletState.isConnecting, checkWalletInstalled]);

  const disconnect = useCallback(() => {
    setWalletState({
      ...INITIAL_STATE,
      isWalletInstalled: checkWalletInstalled(),
    });
    console.log('[WalletProvider] Wallet disconnected by user.');
  }, [checkWalletInstalled]);

  const contextValue: WalletContextValue = {
    ...walletState,
    connect,
    disconnect,
    installUrl: 'https://1am.xyz',
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}