/**
 * scripts/deploy.ts
 * Deploys CertificateValidation.sol to the selected Hardhat network.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.ts --network sepolia   # real testnet
 *   npx hardhat run scripts/deploy.ts --network hardhat   # local in-process node
 *
 * After a successful deploy, copy the printed contract address into .env:
 *   VITE_CONTRACT_ADDRESS=0x...
 *   CONTRACT_ADDRESS=0x...
 */

import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('\n━━━ CertiVerifier – Contract Deployment ━━━');
  console.log('Deployer  :', deployer.address);
  console.log('Balance   :', ethers.formatEther(balance), 'ETH');

  if (balance < ethers.parseEther('0.01')) {
    console.warn('\n⚠️  Low balance! Get Sepolia ETH from https://sepoliafaucet.com before deploying.\n');
  }

  console.log('\nDeploying CertificateValidation…');
  const Factory  = await ethers.getContractFactory('CertificateValidation');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log('\n✅  Deployed successfully!');
  console.log('Contract  :', address);
  console.log('Network   :', (await ethers.provider.getNetwork()).name);
  console.log('\nAdd these lines to your .env file:');
  console.log(`  VITE_CONTRACT_ADDRESS=${address}`);
  console.log(`  CONTRACT_ADDRESS=${address}`);
  console.log('\nVerify on Etherscan (optional):');
  console.log(`  npx hardhat verify --network sepolia ${address}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch((error) => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
