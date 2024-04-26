const { ethers } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("DomainRegistar");
  const domainPrice = 5;
  const usdcAddress = process.env.USDC_CONTRACT_ADDRESS;
  const domainRegistar = await factory.deploy(usdcAddress, domainPrice);
  await domainRegistar.waitForDeployment();
  console.log("Contract deployed to:", await domainRegistar.getAddress());
}

main();
