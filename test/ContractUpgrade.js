const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");


describe("Post-upgrade integrity suite", function () {
    it("Should support top-level domain registration - pre/post upgrade", async function () {
        const allAccounts = await ethers.getSigners();
        const owner = allAccounts[0];
        const factory = await ethers.getContractFactory("DomainRegistar", owner);
        const domainRegistar = await factory.attach(process.env.CONTRACT_ADDR);
        
        const datafilePath = process.env.DATAFILE
        const datafile = fs.readFileSync(datafilePath);
        const topLevelDomainsDataset = JSON.parse(datafile.toString()).filter(val => val.level == 0)

        const initialDomainPrice = await domainRegistar.weiDomainPrice()
        for (let domainData of topLevelDomainsDataset) {
            const ownerAccount = allAccounts[domainData.ownerID];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            await expect(ownerAccountConn.registerDomain(domainData.domain, {value: initialDomainPrice}))
            .to.emit(domainRegistar, "DomainRegistered")
            .withArgs(anyValue, ownerAccount.address, domainData.domain);
        }
    });

    it("Should support subdomain registration - post upgrade", async function () {
        const allAccounts = await ethers.getSigners();
        const owner = allAccounts[0];
        const factory = await ethers.getContractFactory("DomainRegistar", owner);
        const domainRegistar = await factory.attach(process.env.CONTRACT_ADDR);
        
        const datafilePath = process.env.DATAFILE
        const datafile = fs.readFileSync(datafilePath);
        const domainsDataset = JSON.parse(datafile.toString());
        
        const toplevelDomains =  domainsDataset.filter(val => val.level == 0)
        let domainPrices = {};
        for (let domainData of toplevelDomains) {
            const ownerAccount = allAccounts[domainData.ownerID];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            await expect(ownerAccountConn.updateSubdomainPrice(domainData.price, domainData.domain))
            .to.emit(domainRegistar, "PriceChanged").withArgs(domainData.price, anyValue);
            domainPrices[domainData.domain] = domainData.price;
        }

        const level1Domains =  domainsDataset.filter(val => val.level == 1)
        for (let domainData of level1Domains) {
            const ownerAccount = allAccounts[domainData.ownerID];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            const parentDomain = domainData.domain.substring(domainData.domain.indexOf('.')+1);
            const subdomainPrice = domainPrices[parentDomain];
            await expect(ownerAccountConn.registerDomain(domainData.domain, {value: subdomainPrice}))
            .to.emit(domainRegistar, "DomainRegistered")
            .withArgs(anyValue, ownerAccount.address, domainData.domain);

            await expect(ownerAccountConn.updateSubdomainPrice(domainData.price, domainData.domain))
            .to.emit(domainRegistar, "PriceChanged").withArgs(domainData.price, anyValue);
            domainPrices[domainData.domain] = domainData.price;
        }

        const level2Domains =  domainsDataset.filter(val => val.level == 2)
        for (let domainData of level2Domains) {
            const ownerAccount = allAccounts[domainData.ownerID];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            const parentDomain = domainData.domain.substring(domainData.domain.indexOf('.')+1);
            const subdomainPrice = domainPrices[parentDomain];
            await expect(ownerAccountConn.registerDomain(domainData.domain, {value: subdomainPrice}))
            .to.emit(domainRegistar, "DomainRegistered")
            .withArgs(anyValue, ownerAccount.address, domainData.domain);

            await expect(ownerAccountConn.updateSubdomainPrice(domainData.price, domainData.domain))
            .to.emit(domainRegistar, "PriceChanged").withArgs(domainData.price, anyValue);
            domainPrices[domainData.domain] = domainData.price;
        }
    });

    it("Should allow withdrawals for all owners - post upgrade", async function () {
        const allAccounts = await ethers.getSigners();
        const owner = allAccounts[0];
        const factory = await ethers.getContractFactory("DomainRegistar", owner);
        const domainRegistar = await factory.attach(process.env.CONTRACT_ADDR);
        
        const datafilePath = process.env.DATAFILE
        const datafile = fs.readFileSync(datafilePath);
        const domainsDataset = JSON.parse(datafile.toString());
  
        for(let balanceData of domainsDataset) {
            const ownerAccount = allAccounts[balanceData.ownerID];
            const ownerAccountConn = domainRegistar.connect(ownerAccount)
            await expect(ownerAccountConn.withdraw())
              .to.changeEtherBalances([domainRegistar, ownerAccount], [-balanceData.balance, balanceData.balance]);
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
