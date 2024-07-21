const { ethers, ethernal } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("UsdcToken");
  const supply = process.env.USDC_SUPPLY;
  const contract = await factory.deploy(supply);
  await contract.waitForDeployment();
  console.log("Contract deployed to:", await contract.getAddress());

  const otherAccounts = (await ethers.getSigners()).slice(1);
  for (let account of otherAccounts) {
    await contract.mint(account.getAddress(), supply);
  }

  await ethernal.push({
    name: 'UsdcToken',
    address: await contract.getAddress(),
    workspace: 'domainregistar'
  });
}

main();
