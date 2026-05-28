# Next.js Example

This folder shows how to integrate onchain-attribution-kit into a Next.js app.

## Setup

1. Copy the relevant files from this folder into your Next.js project.
2. Install the kit:
   ```bash
   npm install onchain-attribution-kit
   # or copy src/capture/browser-snippet.ts directly
   ```

3. Add a client component that initializes attribution on page load and hooks into your wallet connect event.

## Files

- `AttributionProvider.tsx` — React context provider. Wrap your app with this.
- `useAttributionConnect.ts` — Hook to call when a wallet connects.

## Usage

In `_app.tsx` or your root layout:

```tsx
import AttributionProvider from './AttributionProvider';

export default function App({ Component, pageProps }) {
  return (
    <AttributionProvider>
      <Component {...pageProps} />
    </AttributionProvider>
  );
}
```

In your wallet connect handler:

```tsx
import { useAttributionConnect } from './useAttributionConnect';

function ConnectButton() {
  const { trackConnect } = useAttributionConnect();

  const handleConnect = async (address: string, chainId: number) => {
    // ... your wallet connect logic
    await trackConnect(address, chainId);
  };
}
```

## Notes

- The attribution snippet must run on the client side only (uses localStorage and window.location).
- Use `'use client'` directive on any component that calls attribution functions.
- The backend endpoint can be your own Next.js API route (see `pages/api/attribution/event.ts` example).
