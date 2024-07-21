const { ethers, ethernal } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("DomainRegistar");
  const domainPrice = process.env.USDC_DOMAIN_PRICE;
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
  const usdc2EthAddress = process.env.USDC2ETH_CONTRACT_ADDRESS
  const contract = await factory.deploy(usdcAddress, usdc2EthAddress, domainPrice);
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());

  await ethernal.push({
    name: 'DomainRegistar',
    address: await contract.getAddress(),
    workspace: 'domainregistar'
  });
}

main();
