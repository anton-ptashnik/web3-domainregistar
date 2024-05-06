const { ethers, ethernal } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("UsdcEthDataFeed");
  const rate = process.env.USDC2ETH_RATE;
  const contract = await factory.deploy(rate);
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());

  await ethernal.push({
    name: 'UsdcEthDataFeed',
    address: await contract.getAddress(),
    workspace: 'domainregistar'
  });
}

main();
