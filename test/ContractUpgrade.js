const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");


describe("Post-upgrade integrity suite", function () {
    it("Should support top-level domain registration - pre/post upgrade", async function () {
        const [owner, ...otherAccounts] = await ethers.getSigners();
        const factory = await ethers.getContractFactory("DomainRegistar", owner);
        const domainRegistar = await factory.attach(process.env.CONTRACT_ADDR);
        
        const datafilePath = process.env.DATAFILE
        const datafile = fs.readFileSync(datafilePath);
        const topLevelDomainsDataset = JSON.parse(datafile.toString()).filter(val => val.level == 0)

        const initialDomainPrice = await domainRegistar.weiDomainPrice()
        for (let domainData of topLevelDomainsDataset) {
            const ownerAccount = otherAccounts[domainData.ownerID+1];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            await expect(ownerAccountConn.registerDomain(domainData.domain, {value: initialDomainPrice}))
            .to.emit(domainRegistar, "DomainRegistered")
            .withArgs(anyValue, ownerAccount.address, domainData.domain);
        }
    });

    it("Should access domains created by v1 - post upgrade", async function () {
        const [owner] = await ethers.getSigners();
        const factory = await ethers.getContractFactory("DomainRegistar", owner);
        const domainRegistar = await factory.attach(process.env.CONTRACT_ADDR);
        
        const datafilePath = process.env.DATAFILE
        const datafile = fs.readFileSync(datafilePath);
        const topLevelDomainsDataset = JSON.parse(datafile.toString()).filter(val => val.level == 0)

        const filterByEvent = domainRegistar.filters.DomainRegistered();
        const logs = await domainRegistar.queryFilter(filterByEvent, 0, "latest");
        const actDomains = logs.map(log => log.args.domain);
        const expDomains = topLevelDomainsDataset.map(val => val.domain);
        expect(actDomains).to.include.ordered.members(expDomains);
    });
});
