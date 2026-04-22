/**
 * utils/networkGuard.ts
 *
 * Utility functions for MetaMask connection and network management.
 * Used by the WalletStatus component and the blockchain service.
 */

import { ethers } from 'ethers';
import { WEB3_CONFIG } from './web3Config';

export interface WalletState {
  connected    : boolean;
  address      : string | null;
  chainId      : number | null;
  isCorrectNet : boolean;
  isMetaMask   : boolean;
}

/** Returns the current MetaMask wallet state (non-throwing). */
export async function getWalletState(): Promise<WalletState> {
  const empty: WalletState = {
    connected   : false,
    address     : null,
    chainId     : null,
    isCorrectNet: false,
    isMetaMask  : false,
  };

  if (!window.ethereum) return empty;

  try {
    const provider  = new ethers.BrowserProvider(window.ethereum);
    const network   = await provider.getNetwork();
    const accounts  = await provider.listAccounts();   // does NOT prompt — just reads
    const chainId   = Number(network.chainId);

    return {
      connected   : accounts.length > 0,
      address     : accounts.length > 0 ? accounts[0].address : null,
      chainId,
      isCorrectNet: chainId === WEB3_CONFIG.networkId,
      isMetaMask  : Boolean(window.ethereum?.isMetaMask),
    };
  } catch {
    return empty;
  }
}

/** Prompt MetaMask to switch to Sepolia. Returns true on success. */
export async function switchToSepolia(): Promise<boolean> {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + WEB3_CONFIG.networkId.toString(16) }],
    });
    return true;
  } catch (err: unknown) {
    // Error code 4902 = chain not added yet → add it
    if ((err as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId        : '0x' + WEB3_CONFIG.networkId.toString(16),
            chainName      : 'Sepolia Testnet',
            nativeCurrency : { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
            rpcUrls        : [WEB3_CONFIG.rpcUrl],
            blockExplorerUrls: [WEB3_CONFIG.explorerUrl],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/** Request account access (triggers MetaMask popup if not already connected). */
export async function connectWallet(): Promise<string | null> {
  if (!window.ethereum) return null;
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];
    return accounts[0] ?? null;
  } catch {
    return null;
  }
}
