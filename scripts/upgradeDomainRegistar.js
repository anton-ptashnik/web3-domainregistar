const { ethers, upgrades } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("DomainRegistar");
  const liveContractAddr = process.env.CONTRACT_ADDR
  await upgrades.upgradeProxy(liveContractAddr, factory, {unsafeSkipStorageCheck: true});
  console.log("Upgrade complete");
}

main();
