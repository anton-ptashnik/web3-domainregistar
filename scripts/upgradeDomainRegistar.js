const { ethers, upgrades } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("DomainRegistar");
  const liveContractAddr = process.env.CONTRACT_ADDR
  const contract = await upgrades.upgradeProxy(liveContractAddr, factory, {unsafeSkipStorageCheck: true});
  await contract.reinitialize();
  console.log("Upgrade complete");
}

main();
