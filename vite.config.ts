import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      // Existing (kept for compatibility)
      'process.env.API_KEY'        : JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY' : JSON.stringify(env.GEMINI_API_KEY),
    },
    // VITE_ prefixed vars are automatically exposed to the browser build.
    // The following are read by utils/web3Config.ts:
    //   VITE_CONTRACT_ADDRESS    – deployed CertificateValidation address on Sepolia
    //   VITE_SEPOLIA_RPC_URL     – Infura / Alchemy endpoint (read-only, no key in URL if possible)
    // Set these in your .env file (see .env.example).
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
