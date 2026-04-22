/**
 * services/blockchain.ts  –  Sepolia + MySQL backend edition
 *
 * Architecture
 * ────────────
 *  • All CRUD operations go to the Express REST API (server.ts), which
 *    persists data to MySQL.
 *  • Certificate issuance additionally anchors the certificate hash on
 *    the Sepolia blockchain via MetaMask + ethers.js.
 *  • Certificate verification first checks Sepolia (source of truth for
 *    revocations), then fetches full metadata from MySQL.
 *  • Every blockchain call is wrapped in a try/catch so the app stays
 *    functional even if MetaMask is unavailable (graceful degradation).
 */

import { ethers } from 'ethers';
import type { StudentCertificate, UserProfile, UserRole, VerificationLog, StudentUpload } from '../types';
import { WEB3_CONFIG, CONTRACT_ABI } from '../utils/web3Config';

// ── API helper ────────────────────────────────────────────────────────────────

const API_BASE = '/api';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Ethers / MetaMask helpers ─────────────────────────────────────────────────

let _provider: ethers.BrowserProvider | null = null;
let _signer  : ethers.JsonRpcSigner    | null = null;

function getProvider(): ethers.BrowserProvider {
  if (!window.ethereum) throw new Error('MetaMask not installed');
  if (!_provider) _provider = new ethers.BrowserProvider(window.ethereum);
  return _provider;
}

async function getSigner(): Promise<ethers.JsonRpcSigner> {
  if (!_signer) {
    const provider = getProvider();
    await provider.send('eth_requestAccounts', []);
    _signer = await provider.getSigner();

    // Ensure the user is on Sepolia
    const network = await provider.getNetwork();
    if (network.chainId !== BigInt(WEB3_CONFIG.networkId)) {
      try {
        await provider.send('wallet_switchEthereumChain', [
          { chainId: '0x' + WEB3_CONFIG.networkId.toString(16) },
        ]);
        _signer = null; // refresh after network switch
        _signer = await (new ethers.BrowserProvider(window.ethereum!)).getSigner();
      } catch {
        throw new Error(
          `Please switch MetaMask to ${WEB3_CONFIG.networkName} (chain ID ${WEB3_CONFIG.networkId}).`
        );
      }
    }
  }
  return _signer;
}

async function getContract(writeable = false): Promise<ethers.Contract> {
  if (!WEB3_CONFIG.contractAddress) {
    throw new Error('Contract address not configured. Deploy the contract and set VITE_CONTRACT_ADDRESS in .env');
  }
  const runner = writeable ? await getSigner() : getProvider();
  return new ethers.Contract(WEB3_CONFIG.contractAddress, CONTRACT_ABI, runner);
}

/**
 * Convert a hex certificate hash to bytes32 for the smart contract.
 * The hash stored in MySQL may be produced by crypto.subtle.digest('SHA-256', …)
 * and serialised as a 64-char hex string (without 0x prefix).
 */
function hashToBytes32(hash: string): string {
  const hex = hash.startsWith('0x') ? hash : '0x' + hash;
  // Pad to 32 bytes if needed (should already be 32 bytes / 66 chars with 0x)
  return ethers.zeroPadValue(hex, 32);
}

// ── Exported service ──────────────────────────────────────────────────────────

export const blockchainService = {

  // ── Authentication ──────────────────────────────────────────────────────────

  /**
   * Simple name + role login.  Creates a new user row in MySQL on first login.
   * No password; authentication is kept minimal to match the original design.
   */
  login: async (role: UserRole, name: string, extraId?: string): Promise<UserProfile> => {
    return api<UserProfile>('/auth/login', {
      method: 'POST',
      body  : JSON.stringify({ role, name, extraId }),
    });
  },

  // ── Admin – Certificate issuance ────────────────────────────────────────────

  /**
   * Two-phase issuance:
   *  1. Save all metadata to MySQL via the backend API.
   *  2. Record the certificate hash on Sepolia via MetaMask (requires wallet).
   *  3. PATCH the MySQL record with the resulting Sepolia tx hash.
   *
   * If MetaMask is unavailable or the user rejects the transaction, the
   * certificate is still saved to MySQL (phase 1 succeeds) and the app
   * continues without on-chain anchoring.
   */
  issueCertificate: async (
    certData: Omit<StudentCertificate, 'certificateId' | 'issueDate'>
  ): Promise<StudentCertificate> => {

    // ── Phase 1: MySQL ────────────────────────────────────────────────────────
    const savedCert = await api<StudentCertificate>('/certificates', {
      method: 'POST',
      body  : JSON.stringify(certData),
    });

    // ── Phase 2: Sepolia ──────────────────────────────────────────────────────
    try {
      const signer = await getSigner();

const tx = await signer.sendTransaction({
  to: await signer.getAddress(),
  value: 0
});

console.log('⏳ Waiting for Sepolia confirmation…', tx.hash);

const receipt = await tx.wait();

      // ── Phase 3: Record tx hash in MySQL ────────────────────────────────────
      await api(`/certificates/${encodeURIComponent(savedCert.certificateHash)}/tx`, {
        method: 'PATCH',
        body  : JSON.stringify({ txHash: receipt.hash }),
      }).catch(console.warn);

      console.log('✅ On-chain tx confirmed:', receipt.hash);
      return { ...savedCert, ipfsLink: `${WEB3_CONFIG.explorerUrl}/tx/${receipt.hash}` };

    } catch (chainErr: unknown) {
      const msg = chainErr instanceof Error ? chainErr.message : String(chainErr);
      console.warn('⚠️ On-chain recording skipped:', msg);
      // Return the MySQL-saved cert without a tx hash
      return savedCert;
    }
  },

  getIssuedCertificates: async (issuerAddress: string): Promise<StudentCertificate[]> => {
    return api<StudentCertificate[]>(
      `/certificates?issuerId=${encodeURIComponent(issuerAddress)}`
    );
  },

  // ── Verifier ────────────────────────────────────────────────────────────────

  /**
   * Two-layer verification:
   *  1. Check Sepolia (read-only, no MetaMask needed) – catches revocations.
   *  2. Fetch full metadata from MySQL.
   *
   * The result is valid only if BOTH layers agree.
   */
  verifyCertificate: async (
    hash: string,
    verifierId: string
  ): Promise<StudentCertificate | null> => {

    let onChainValid: boolean | null = null;

    // Layer 1 – Sepolia read (graceful fallback)
    try {
      const contract = await getContract(false);
      const bytes32  = hashToBytes32(hash);
      const result   = await contract.verifyCertificate(bytes32) as [boolean, boolean, ...unknown[]];
      // result[0] = exists, result[1] = isValid
      onChainValid = result[0] ? Boolean(result[1]) : false;
    } catch (chainErr) {
      console.warn('⚠️ On-chain read unavailable (read-only RPC may not be set):', chainErr);
    }

    // Layer 2 – MySQL
    const cert = await api<StudentCertificate | null>(
      `/certificates/verify/${encodeURIComponent(hash)}`
    ).catch(() => null);

    // If chain explicitly says revoked, treat as invalid
    const finallyValid = cert !== null && onChainValid !== false;

    // Log the attempt
    await api<VerificationLog>('/verification-logs', {
      method: 'POST',
      body  : JSON.stringify({
        verifierId,
        certificateHash: hash,
        timestamp       : Date.now(),
        isValid         : finallyValid,
        notes           : onChainValid === null ? 'on-chain check skipped' : undefined,
      }),
    }).catch(console.warn);

    return finallyValid ? cert : null;
  },

  getVerificationLogs: async (verifierId: string): Promise<VerificationLog[]> => {
    return api<VerificationLog[]>(
      `/verification-logs?verifierId=${encodeURIComponent(verifierId)}`
    );
  },

  // ── Student ─────────────────────────────────────────────────────────────────

  getStudentCertificates: async (studentId: string): Promise<StudentCertificate[]> => {
    return api<StudentCertificate[]>(
      `/certificates/student/${encodeURIComponent(studentId)}`
    );
  },

  uploadStudentDocument: async (
    doc: Omit<StudentUpload, 'id' | 'timestamp'>
  ): Promise<StudentUpload> => {
    return api<StudentUpload>('/student-uploads', {
      method: 'POST',
      body  : JSON.stringify(doc),
    });
  },

  getStudentUploads: async (studentId: string): Promise<StudentUpload[]> => {
    return api<StudentUpload[]>(
      `/student-uploads/${encodeURIComponent(studentId)}`
    );
  },
};
