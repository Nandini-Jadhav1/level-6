import { useState, useEffect, useCallback } from 'react';

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  network: string | null;
  error: string | null;
  isWalletInstalled: boolean;
}

// The ONLY initial state. isConnected MUST start false, address MUST start null.
// This is enforced by TypeScript — no mutations outside of explicit connect/disconnect.
const INITIAL_STATE: WalletState = {
  isConnected: false,
  isConnecting: false,
  address: null,
  network: null,
  error: null,
  isWalletInstalled: false,
};

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  // Detect whether window.midnight (Lace DApp connector) is present.
  // Called on mount and on window focus — NEVER sets isConnected.
  const checkWalletInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const m = (window as any).midnight;
    return !!(m && (m.mnLace || typeof m.enable === 'function'));
  }, []);

  useEffect(() => {
    // Only update the isWalletInstalled flag — nothing else.
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

      if (!midnight) {
        setWalletState({
          ...INITIAL_STATE,
          isWalletInstalled: false,
          error:
            'Lace Wallet extension not detected. Please install the Lace browser extension and configure it for Midnight Preprod.',
        });
        return;
      }

      // --- Step 1: Get the DApp Connector API by calling .enable() ---
      // This is the call that triggers the Lace approval popup.
      let api: any = null;

      if (midnight.mnLace && typeof midnight.mnLace.enable === 'function') {
        api = await midnight.mnLace.enable();
      } else if (typeof midnight.enable === 'function') {
        api = await midnight.enable();
      } else {
        // Walk the midnight object to find any provider with .enable()
        const providers = Object.values(midnight).filter(
          (p: any) => p && typeof p.enable === 'function'
        );
        if (providers.length > 0) {
          api = await (providers[0] as any).enable();
        }
      }

      // If enable() returned nothing, the user rejected or extension is broken.
      if (!api) {
        throw new Error(
          'Lace did not return a connector API. The request may have been rejected or the extension is not properly configured.'
        );
      }

      // --- Step 2: Query the real address AFTER enable() resolves ---
      const state =
        typeof api.state === 'function' ? await api.state() : null;

      const connectedAddress: string | null =
        state?.address ?? state?.bech32Address ?? null;

      // If enable() succeeded but no address came back, the account is not set up.
      if (!connectedAddress || typeof connectedAddress !== 'string' || connectedAddress.trim() === '') {
        throw new Error(
          'Lace connected but returned no wallet address. Please ensure an account is selected and the extension is synced with Midnight Preprod.'
        );
      }

      // --- Step 3: Only now set isConnected: true, with the real address ---
      setWalletState({
        isConnected: true,
        isConnecting: false,
        address: connectedAddress,
        network: state?.network ?? 'Preprod',
        error: null,
        isWalletInstalled: true,
      });

      console.log('[useMidnight] Lace connected. Address:', connectedAddress);
    } catch (err: any) {
      console.error('[useMidnight] Connection failed:', err);

      // Distinguish user-rejection from real errors
      const isRejected =
        err?.code === 4001 ||
        err?.message?.toLowerCase().includes('rejected') ||
        err?.message?.toLowerCase().includes('user denied') ||
        err?.message?.toLowerCase().includes('cancelled');

      setWalletState({
        ...INITIAL_STATE,
        isWalletInstalled: checkWalletInstalled(),
        error: isRejected
          ? 'Connection rejected in Lace Wallet. Click "Connect Lace Wallet" to try again.'
          : err?.message ?? 'Failed to connect to Lace Wallet.',
      });
    }
  }, [walletState.isConnecting, checkWalletInstalled]);

  const disconnect = useCallback(() => {
    setWalletState({
      ...INITIAL_STATE,
      isWalletInstalled: checkWalletInstalled(),
    });
    console.log('[useMidnight] Wallet disconnected by user.');
  }, [checkWalletInstalled]);

  return {
    ...walletState,
    connect,
    disconnect,
    installUrl: 'https://www.lace.io/',
  };
}
