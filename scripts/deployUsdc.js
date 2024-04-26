const { ethers } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("UsdcToken");
  const supply = process.env.USDC_SUPPLY;
  const domainRegistar = await factory.deploy(supply);
  await domainRegistar.waitForDeployment();
  console.log("Contract deployed to:", await domainRegistar.getAddress());
}

main();
