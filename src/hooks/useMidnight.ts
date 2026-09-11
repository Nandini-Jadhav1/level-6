import { useState, useEffect, useCallback } from 'react';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
  isWalletInstalled: boolean;
}

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    network: 'Preprod',
    error: null,
    isWalletInstalled: false,
  });

  const checkWalletInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const midnight = (window as any).midnight;
    return !!(midnight && (midnight.mnLace || typeof midnight.enable === 'function'));
  }, []);

  // Update installation state on mount and window focus
  useEffect(() => {
    const installed = checkWalletInstalled();
    setWalletState((prev) => ({ ...prev, isWalletInstalled: installed }));

    const handleFocus = () => {
      setWalletState((prev) => ({ ...prev, isWalletInstalled: checkWalletInstalled() }));
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkWalletInstalled]);

  const connect = useCallback(async () => {
    setWalletState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined') {
        throw new Error('Window environment is not available');
      }

      const midnight = (window as any).midnight;

      if (!midnight) {
        setWalletState({
          isConnected: false,
          isConnecting: false,
          address: null,
          network: 'Preprod',
          error: 'Lace Wallet extension not detected. Please install the Lace Wallet browser extension configured for Midnight Preprod.',
          isWalletInstalled: false,
        });
        return;
      }

      // Real Midnight DApp Connector API (Lace Wallet)
      let api: any = null;

      if (midnight.mnLace && typeof midnight.mnLace.enable === 'function') {
        // Official Midnight Lace connector method
        api = await midnight.mnLace.enable();
      } else if (typeof midnight.enable === 'function') {
        api = await midnight.enable();
      } else {
        const providers = Object.values(midnight).filter(
          (p: any) => p && typeof p.enable === 'function'
        );
        if (providers.length > 0) {
          api = await (providers[0] as any).enable();
        }
      }

      if (!api) {
        throw new Error('Could not initialize Lace Wallet connector API. Please verify Lace is unlocked.');
      }

      // Query real on-chain address & state from connector
      const state = typeof api.state === 'function' ? await api.state() : null;
      const connectedAddress = state?.address || state?.bech32Address || null;

      if (!connectedAddress) {
        throw new Error('Connected to Lace, but no account address was returned. Please ensure an account is selected in Lace.');
      }

      setWalletState({
        isConnected: true,
        isConnecting: false,
        address: connectedAddress,
        network: state?.network || 'Preprod',
        error: null,
        isWalletInstalled: true,
      });

      console.log('Lace Wallet successfully connected:', connectedAddress);
    } catch (err: any) {
      console.error('Lace Wallet connection failed:', err);
      const isUserRejected = err?.message?.toLowerCase().includes('user') || err?.code === 4001;
      const errorMessage = isUserRejected
        ? 'Connection request was rejected in Lace Wallet.'
        : err?.message || 'Failed to connect to Lace Wallet.';

      setWalletState({
        isConnected: false,
        isConnecting: false,
        address: null,
        network: 'Preprod',
        error: errorMessage,
        isWalletInstalled: checkWalletInstalled(),
      });
    }
  }, [checkWalletInstalled]);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: null,
      network: 'Preprod',
      error: null,
      isWalletInstalled: checkWalletInstalled(),
    });
    console.log('Lace Wallet disconnected');
  }, [checkWalletInstalled]);

  return {
    ...walletState,
    connect,
    disconnect,
    installUrl: 'https://www.lace.io/',
  };
}
