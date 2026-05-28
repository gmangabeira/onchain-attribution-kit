'use client';
/**
 * useAttributionConnect.ts
 *
 * React hook that fires an attribution event when a wallet connects.
 * Call trackConnect() from your wallet connect handler.
 */

import { useCallback } from 'react';
import { onWalletConnect } from '../../capture/browser-snippet';
import { useAttributionConfig } from './AttributionProvider';

export function useAttributionConnect() {
  const config = useAttributionConfig();

  const trackConnect = useCallback(
    async (address: string, chainId: number, metadata: Record<string, unknown> = {}) => {
      if (!config) {
        console.warn('[onchain-attribution] AttributionProvider not found in tree.');
        return;
      }
      await onWalletConnect({ address, chainId }, config, metadata);
    },
    [config]
  );

  return { trackConnect };
}
