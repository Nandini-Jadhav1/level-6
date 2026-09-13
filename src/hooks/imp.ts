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

// The Midnight Preprod network ID string expected by the DApp Connector API.
// Matches the official @midnight-ntwrk/dapp-connector-api specification.
const NETWORK_ID = 'preprod';

export function useMidnight() {
  const [walletState, setWalletState] = useState<WalletState>(INITIAL_STATE);

  // Detect whether window.midnight['1am'] (1AM DApp connector) is present.
  // Browser-confirmed: the injected object exposes .connect, not .enable.
  // Called on mount and on window focus — NEVER sets isConnected.
  const checkWalletInstalled = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    const m = (window as any).midnight;
    return !!(m && m['1am'] && typeof m['1am'].connect === 'function');
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

      if (typeof midnight['1am'].connect !== 'function') {
        throw new Error(
          '1AM Wallet extension found but does not expose a connect() method. Please update the extension.'
        );
      }

      // --- Step 1: Call connect(networkId) to get the ConnectedAPI ---
      // Per the official DApp Connector API spec:
      //   InitialAPI.connect(networkId: string) => Promise<ConnectedAPI>
      // This triggers the 1AM approval popup when not yet approved.
      // On subsequent calls (page refresh, already approved), it resolves
      // immediately without a popup.
      let api: any;
      try {
        api = await midnight['1am'].connect(NETWORK_ID);
      } catch (e: any) {
        // Detect user rejection via the DApp Connector error shape.
        // APIError uses { type: 'DAppConnectorAPIError', code, reason }
        // rather than extending Error, so we check type explicitly.
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

      // If connect() returned nothing at all, the extension is broken.
      if (!api) {
        throw new Error(
          '1AM did not return a connector API. The request may have been rejected or the extension is not properly configured.'
        );
      }

      // --- Step 2: Obtain the wallet address from the ConnectedAPI ---
      // DEBUG: Log raw API shape to diagnose address retrieval issues
      console.log('=== DEBUG: 1AM API RESPONSE SHAPE ===');
      console.log('connectedApi type:', typeof api);
      console.log('connectedApi keys:', api ? Object.keys(api) : 'null');
      console.log('connectedApi:', JSON.stringify(api, null, 2));

      // Per the DApp Connector API spec, ConnectedAPI exposes:
      //   getShieldedAddresses()  => { shieldedAddress: string }   (Bech32m)
      //   getUnshieldedAddress()  => { unshieldedAddress: string } (Bech32m)
      //   getConfiguration()     => { networkId, indexerUri, ... }
      // There is no api.state() method — that does not exist on ConnectedAPI.
      let connectedAddress: string | null = null;
      let resolvedNetwork: string = NETWORK_ID;

      // Prefer the shielded address (primary identity on Midnight).
      // Fall back to unshielded address if shielded is unavailable.
      if (typeof api.getShieldedAddresses === 'function') {
        try {
          const shielded = await api.getShieldedAddresses();
          console.log('getShieldedAddresses raw:', JSON.stringify(shielded, null, 2));
          console.log('getShieldedAddresses type:', typeof shielded);
          console.log('Keys in shielded result:', shielded ? Object.keys(shielded) : 'null');
          connectedAddress = shielded?.shieldedAddress ?? null;
        } catch (e) {
          console.log('getShieldedAddresses threw:', e);
          // getShieldedAddresses failed — will try unshielded next
        }
      } else {
        console.log('getShieldedAddresses method NOT FOUND on api');
      }

      console.log('After shielded, connectedAddress:', connectedAddress);

      if (!connectedAddress && typeof api.getUnshieldedAddress === 'function') {
        try {
          const unshielded = await api.getUnshieldedAddress();
          console.log('getUnshieldedAddress raw:', JSON.stringify(unshielded, null, 2));
          console.log('getUnshieldedAddress type:', typeof unshielded);
          connectedAddress = unshielded?.unshieldedAddress ?? null;
        } catch (e) {
          console.log('getUnshieldedAddress threw:', e);
          // getUnshieldedAddress also failed — address will remain null
        }
      }

      console.log('=== END DEBUG ===');

      // Pull the canonical networkId from the wallet's own configuration.
      if (typeof api.getConfiguration === 'function') {
        try {
          const config = await api.getConfiguration();
          if (config?.networkId) resolvedNetwork = config.networkId;
        } catch {
          // Non-fatal — fall back to the constant we passed in
        }
      }

      // If we still have no address after all methods, the wallet account
      // is not set up or not synced with the selected network.
      if (
        !connectedAddress ||
        typeof connectedAddress !== 'string' ||
        connectedAddress.trim() === ''
      ) {
        throw new Error(
          '1AM connected but returned no wallet address. Please ensure an account is selected and the extension is synced with Midnight Preprod.'
        );
      }

      // --- Step 3: Only now set isConnected: true, with the real address ---
      setWalletState({
        isConnected: true,
        isConnecting: false,
        address: connectedAddress,
        network: resolvedNetwork,
        error: null,
        isWalletInstalled: true,
      });

      console.log('[useMidnight] 1AM connected. Address:', connectedAddress);
    } catch (err: any) {
      console.error('[useMidnight] Connection failed:', err);

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