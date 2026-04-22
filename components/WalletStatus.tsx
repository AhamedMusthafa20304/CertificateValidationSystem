/**
 * components/WalletStatus.tsx
 *
 * Displays the MetaMask connection state in the Admin Dashboard header.
 * Shows: connected address + Sepolia badge  OR  a "Connect / Switch Network" button.
 *
 * Usage (add near the top of AdminDashboard.tsx):
 *   import { WalletStatus } from './WalletStatus';
 *   …
 *   <WalletStatus />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, AlertTriangle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { getWalletState, connectWallet, switchToSepolia, WalletState } from '../utils/networkGuard';
import { WEB3_CONFIG } from '../utils/web3Config';

const POLL_INTERVAL_MS = 4000;

export function WalletStatus() {
  const [wallet, setWallet] = useState<WalletState>({
    connected   : false,
    address     : null,
    chainId     : null,
    isCorrectNet: false,
    isMetaMask  : false,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const state = await getWalletState();
    setWallet(state);
  }, []);

  // Poll for state changes (handles MetaMask account / network switches)
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Also react immediately to MetaMask events
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    eth.on('accountsChanged', refresh);
    eth.on('chainChanged',    refresh);
    return () => {
      eth.removeListener('accountsChanged', refresh);
      eth.removeListener('chainChanged',    refresh);
    };
  }, [refresh]);

  const handleConnect = async () => {
    setLoading(true);
    await connectWallet();
    await refresh();
    setLoading(false);
  };

  const handleSwitch = async () => {
    setLoading(true);
    await switchToSepolia();
    await refresh();
    setLoading(false);
  };

  // ── MetaMask not installed ────────────────────────────────────────────────

  if (!window.ethereum) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        style={pillStyle('#f59e0b', '#78350f')}
        title="MetaMask is required for issuing certificates on Sepolia"
      >
        <AlertTriangle size={13} />
        <span>Install MetaMask</span>
        <ExternalLink size={11} style={{ opacity: 0.7 }} />
      </a>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────

  if (!wallet.connected) {
    return (
      <button
        onClick={handleConnect}
        disabled={loading}
        style={pillStyle('#6366f1', '#1e1b4b')}
        title="Connect MetaMask to issue certificates on Sepolia"
      >
        {loading ? <RefreshCw size={13} className="spin" /> : <Wallet size={13} />}
        <span>{loading ? 'Connecting…' : 'Connect Wallet'}</span>
      </button>
    );
  }

  // ── Connected but wrong network ───────────────────────────────────────────

  if (!wallet.isCorrectNet) {
    return (
      <button
        onClick={handleSwitch}
        disabled={loading}
        style={pillStyle('#ef4444', '#7f1d1d')}
        title={`Switch to Sepolia (current chain ID: ${wallet.chainId})`}
      >
        {loading ? <RefreshCw size={13} className="spin" /> : <AlertTriangle size={13} />}
        <span>{loading ? 'Switching…' : 'Switch to Sepolia'}</span>
      </button>
    );
  }

  // ── Connected + correct network ───────────────────────────────────────────

  const short = wallet.address
    ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}`
    : '';

  return (
    <a
      href={`${WEB3_CONFIG.explorerUrl}/address/${wallet.address}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...pillStyle('#10b981', '#064e3b'), textDecoration: 'none', cursor: 'pointer' }}
      title={`Connected: ${wallet.address}\nView on Sepolia Etherscan`}
    >
      <CheckCircle size={13} />
      <span style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{short}</span>
      <span style={{
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '4px',
        padding: '1px 5px',
        fontSize: '10px',
        fontWeight: 700,
      }}>
        Sepolia
      </span>
    </a>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function pillStyle(bg: string, color: string): React.CSSProperties {
  return {
    display        : 'inline-flex',
    alignItems     : 'center',
    gap            : '5px',
    padding        : '5px 10px',
    borderRadius   : '20px',
    fontSize       : '12px',
    fontWeight     : 600,
    background     : bg,
    color          : '#fff',
    border         : 'none',
    cursor         : 'pointer',
    whiteSpace     : 'nowrap',
    textShadow     : `0 1px 2px ${color}`,
    boxShadow      : `0 2px 6px ${bg}55`,
    transition     : 'opacity 0.2s',
  };
}

// Inline spin keyframes injected once
if (typeof document !== 'undefined' && !document.getElementById('wallet-spin-style')) {
  const style = document.createElement('style');
  style.id = 'wallet-spin-style';
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`;
  document.head.appendChild(style);
}
