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

  // Detect whether window.midnight['1am'] (1AM DApp connector) is present.
  // Called on mount and on window focus — NEVER sets isConnected.
  const checkWalletInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const m = (window as any).midnight;
    return !!(m && m['1am'] && typeof m['1am'].enable === 'function');
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

      if (!midnight || !midnight['1am']) {
        setWalletState({
          ...INITIAL_STATE,
          isWalletInstalled: false,
          error:
            '1AM Wallet extension not detected. Please install the 1AM browser extension and configure it for Midnight Preprod.',
        });
        return;
      }

      // --- Step 1: Get the DApp Connector API by calling .enable() ---
      // This is the call that triggers the 1AM approval popup.
      let api: any = null;

      if (typeof midnight['1am'].enable === 'function') {
        api = await midnight['1am'].enable();
      }

      // If enable() returned nothing, the user rejected or extension is broken.
      if (!api) {
        throw new Error(
          '1AM did not return a connector API. The request may have been rejected or the extension is not properly configured.'
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
          '1AM connected but returned no wallet address. Please ensure an account is selected and the extension is synced with Midnight Preprod.'
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

      console.log('[useMidnight] 1AM connected. Address:', connectedAddress);
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
    console.log('[useMidnight] Wallet disconnected by user.');
  }, [checkWalletInstalled]);

  return {
    ...walletState,
    connect,
    disconnect,
    installUrl: 'https://1am.xyz',
  };
}
