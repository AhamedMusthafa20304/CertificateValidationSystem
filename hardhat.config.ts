import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version : '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // Local dev (Hardhat in-process node)
    hardhat: {},
    // Sepolia testnet
    sepolia: {
      url     : process.env.SEPOLIA_RPC_URL ?? '',
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      chainId : 11155111,
    },
  },
  etherscan: {
    // Optional: verify contract source on Etherscan after deploy
    apiKey: process.env.ETHERSCAN_API_KEY ?? '',
  },
  paths: {
    sources  : './contracts',
    tests    : './test',
    cache    : './cache',
    artifacts: './artifacts',
  },
};

export default config;
