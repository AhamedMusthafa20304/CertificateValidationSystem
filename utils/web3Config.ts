/**
 * utils/web3Config.ts
 * Sepolia network configuration and CertificateValidation contract ABI.
 *
 * After deploying with `npx hardhat run scripts/deploy.ts --network sepolia`,
 * set VITE_CONTRACT_ADDRESS in .env to the deployed contract address.
 */

import type { InterfaceAbi } from 'ethers';

export const WEB3_CONFIG = {
  networkId      : 11155111,    // Sepolia chain ID
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS ?? '',
  rpcUrl         : import.meta.env.VITE_SEPOLIA_RPC_URL  ?? 'https://sepolia.infura.io/v3/YOUR_KEY',
  explorerUrl    : 'https://sepolia.etherscan.io',
  networkName    : 'Sepolia Testnet',
};

/**
 * ABI for CertificateValidation.sol.
 * Keep in sync with contracts/CertificateValidation.sol.
 */
export const CONTRACT_ABI: InterfaceAbi = [
  // ── Write functions ────────────────────────────────────────────────────────

  {
    name           : 'issueCertificate',
    type           : 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'certHash',      type: 'bytes32' },
      { name: 'certificateId', type: 'string'  },
      { name: 'studentId',     type: 'string'  },
      { name: 'studentName',   type: 'string'  },
      { name: 'course',        type: 'string'  },
      { name: 'year',          type: 'string'  },
      { name: 'issuerName',    type: 'string'  },
    ],
    outputs: [],
  },

  {
    name           : 'revokeCertificate',
    type           : 'function',
    stateMutability: 'nonpayable',
    inputs : [{ name: 'certHash', type: 'bytes32' }],
    outputs: [],
  },

  {
    name           : 'addAdmin',
    type           : 'function',
    stateMutability: 'nonpayable',
    inputs : [{ name: 'admin', type: 'address' }],
    outputs: [],
  },

  {
    name           : 'removeAdmin',
    type           : 'function',
    stateMutability: 'nonpayable',
    inputs : [{ name: 'admin', type: 'address' }],
    outputs: [],
  },

  // ── Read functions ─────────────────────────────────────────────────────────

  {
    name           : 'verifyCertificate',
    type           : 'function',
    stateMutability: 'view',
    inputs : [{ name: 'certHash', type: 'bytes32' }],
    outputs: [
      { name: 'exists',        type: 'bool'    },
      { name: 'isValid',       type: 'bool'    },
      { name: 'certificateId', type: 'string'  },
      { name: 'studentName',   type: 'string'  },
      { name: 'course',        type: 'string'  },
      { name: 'year',          type: 'string'  },
      { name: 'issuerName',    type: 'string'  },
      { name: 'issueDate',     type: 'uint256' },
    ],
  },

  {
    name           : 'owner',
    type           : 'function',
    stateMutability: 'view',
    inputs : [],
    outputs: [{ type: 'address' }],
  },

  {
    name           : 'authorizedAdmins',
    type           : 'function',
    stateMutability: 'view',
    inputs : [{ name: 'admin', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },

  // ── Events ─────────────────────────────────────────────────────────────────

  {
    name  : 'CertificateIssued',
    type  : 'event',
    inputs: [
      { name: 'certHash',      type: 'bytes32', indexed: true  },
      { name: 'certificateId', type: 'string',  indexed: false },
      { name: 'studentId',     type: 'string',  indexed: false },
      { name: 'issuerId',      type: 'address', indexed: true  },
    ],
  },

  {
    name  : 'CertificateRevoked',
    type  : 'event',
    inputs: [
      { name: 'certHash',  type: 'bytes32', indexed: true },
      { name: 'revokedBy', type: 'address', indexed: true },
    ],
  },

  {
    name  : 'AdminAdded',
    type  : 'event',
    inputs: [{ name: 'admin', type: 'address', indexed: true }],
  },

  {
    name  : 'AdminRemoved',
    type  : 'event',
    inputs: [{ name: 'admin', type: 'address', indexed: true }],
  },
];
