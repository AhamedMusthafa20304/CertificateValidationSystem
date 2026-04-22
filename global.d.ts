/**
 * global.d.ts
 * Type shim for window.ethereum (MetaMask / EIP-1193 provider).
 * Prevents TypeScript errors when accessing window.ethereum in the browser.
 */

interface Window {
  ethereum?: {
    isMetaMask?     : boolean;
    request         : (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on              : (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener  : (event: string, handler: (...args: unknown[]) => void) => void;
    selectedAddress?: string;
    chainId?        : string;
  };
}
