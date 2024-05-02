require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");
require('hardhat-ethernal');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.25",
  gasReporter: {
    enabled: true,
    currency: 'USD',
    // L1: "ethereum",
    // coinmarketcap: "9b16d67e-2979-4ebf-9a98-42f1005970fb",
  },
  ethernal: {
    apiToken: process.env.ETHERNAL_API_TOKEN,
    resetOnStart: "domainregistar"
  },
};
