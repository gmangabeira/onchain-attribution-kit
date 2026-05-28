'use client';
/**
 * AttributionProvider.tsx
 *
 * Client-side React provider that initializes campaign attribution on mount.
 * Wrap your app with this component to capture UTMs on every page load.
 *
 * Requires: onchain-attribution-kit installed, or browser-snippet.ts copied to your project.
 */

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { initAttribution, AttributionConfig } from '../../capture/browser-snippet';

const AttributionContext = createContext<AttributionConfig | null>(null);

interface AttributionProviderProps {
  children: ReactNode;
  endpoint?: string;
  writeKey?: string;
  windowDays?: number;
  attributionModel?: 'last_touch' | 'first_touch';
}

export function AttributionProvider({
  children,
  endpoint = '/api/attribution/event',
  writeKey = process.env.NEXT_PUBLIC_ATTRIBUTION_WRITE_KEY ?? '',
  windowDays = 7,
  attributionModel = 'last_touch',
}: AttributionProviderProps) {
  const config: AttributionConfig = { endpoint, writeKey, windowDays, attributionModel };

  useEffect(() => {
    initAttribution(config);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AttributionContext.Provider value={config}>
      {children}
    </AttributionContext.Provider>
  );
}

export function useAttributionConfig(): AttributionConfig | null {
  return useContext(AttributionContext);
}

export default AttributionProvider;
