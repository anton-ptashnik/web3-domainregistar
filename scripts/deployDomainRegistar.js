const { ethers, upgrades } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("DomainRegistar");
  const domainPrice = 2;
  const domainRegistar = await upgrades.deployProxy(factory, [domainPrice]);
  await domainRegistar.waitForDeployment();
  console.log("Contract deployed to:", await domainRegistar.getAddress());
}

main();
