const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("DomainRegistar", function () {
  async function deployContract() {
    const [owner, ...otherAccounts] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("DomainRegistar");
    const initialDomainPrice = 6;

    const domainRegistar = await factory.deploy(initialDomainPrice);
    return { domainRegistar, initialDomainPrice, owner, otherAccounts};
  }

  async function deployContractWithData() {
    const deploymentData = await loadFixture(deployContract);

    let domainOwners = deploymentData.otherAccounts.slice(0, 5)
    const domainsPerOwner = 5;
    let domains = [...Array(domainsPerOwner*domainOwners.length).keys()].map(i => "dom"+i);
    let domainsByOwners = new Map();
    for (let owner of domainOwners) {
      const ownerDomains = domains.slice(0, domainsPerOwner)
      domains.splice(0, domainsPerOwner);
      domainsByOwners.set(owner.address, ownerDomains);

      const contract = deploymentData.domainRegistar.connect(owner);
      for(let domainName of ownerDomains) {
        await contract.registerDomain(domainName, {value: deploymentData.initialDomainPrice});
      }
    }

    return { ...deploymentData, domainsByOwners};
  }

  describe("Deployment", function () {
    it("Should set the owner and domain price", async function () {
      const [owner] = await ethers.getSigners();
      const domainPrice = 6;
      const factory = await ethers.getContractFactory("DomainRegistar");
      const domainRegistar = await factory.deploy(domainPrice);

      expect(await domainRegistar.owner()).to.equal(owner.address);
      expect(await domainRegistar.domainPrice()).to.equal(domainPrice);
    });
  });

  describe("Domain price update", function () {
    it("Should set a new domain price on contract owner request", async function () {
      const { domainRegistar, initialDomainPrice } = await loadFixture(deployContract);

      const newPrice = 99;
      await expect(domainRegistar.updateDomainPrice(newPrice))
        .to.emit(domainRegistar, "PriceChange").withArgs(newPrice, initialDomainPrice);
      expect(await domainRegistar.domainPrice()).to.equal(newPrice);
    });

    it("Should refuse domain price update for non-owners", async function () {
      const { domainRegistar, initialDomainPrice, otherAccounts } = await loadFixture(
        deployContract
      );
      const newPrice = 99;
      const domainRegistarNonOwner = domainRegistar.connect(otherAccounts[0]);

      await expect(domainRegistarNonOwner.updateDomainPrice(newPrice))
        .to.be.revertedWithCustomError(domainRegistar, "AccessDenied");
      expect(await domainRegistarNonOwner.domainPrice()).to.equal(initialDomainPrice);
    });
  });

  describe("Domain registration", function () {
    it("Should allow domain registration for different users", async function () {
      const { domainRegistar, initialDomainPrice, owner, otherAccounts } = await loadFixture(deployContract);

      const domainName = "hidomain";
      const anotherAccount = otherAccounts[0];
      const coinsMap = {value: initialDomainPrice}
      await expect(domainRegistar.registerDomain(domainName, coinsMap))
        .to.emit(domainRegistar, "DomainRegistration")
        .withArgs(anyValue, owner.address, domainName);

      const anotherDomainName = "hidomain2";
      const anotherDomainRegistar = domainRegistar.connect(anotherAccount)
      await expect(anotherDomainRegistar.registerDomain(anotherDomainName, coinsMap))
        .to.emit(anotherDomainRegistar, "DomainRegistration")
        .withArgs(anyValue, anotherAccount.address, anotherDomainName);
    });

    it("Should refuse same domain registration", async function () {
      const { domainRegistar, initialDomainPrice, owner, otherAccounts } = await loadFixture(deployContract);
      const domainName = "hidomain";
      const anotherDomainRegistar = domainRegistar.connect(otherAccounts[0])
      const coinsMap = {value: initialDomainPrice}

      await expect(domainRegistar.registerDomain(domainName, coinsMap))
        .to.emit(domainRegistar, "DomainRegistration")
        .withArgs(anyValue, owner.address, domainName);

      await expect(domainRegistar.registerDomain(domainName, coinsMap))
        .to.be.revertedWithCustomError(domainRegistar, "DuplicateDomain");
      await expect(anotherDomainRegistar.registerDomain(domainName, coinsMap))
        .to.be.revertedWithCustomError(domainRegistar, "DuplicateDomain");
    });

    it("Should refuse domain registration when not enough coins provided", async function () {
      const { domainRegistar, initialDomainPrice} = await loadFixture(deployContract);

      await expect(domainRegistar.registerDomain("hidomain", {value: initialDomainPrice-1}))
        .to.revertedWithCustomError(domainRegistar, "NotEnoughFunds");
    });
  });

  describe("Metrics query demo", function () {
    it("Should return event logs when requested", async function () {
      const { domainRegistar, domainsByOwners } = await loadFixture(deployContractWithData);
      console.log("Domains list per owner");
      for (let [ownerAddress, expDomainsOrdered] of domainsByOwners) {
        const filterByOwner = domainRegistar.filters.DomainRegistration(ownerAddress);
        const logs = await domainRegistar.queryFilter(filterByOwner, 0, "latest");
        const actDomains = logs.map(log => log.args.domain);
        expect(actDomains).to.include.ordered.members(expDomainsOrdered);
        console.log(`${ownerAddress} domains: ${actDomains}`);
      }
      
      console.log("All domains list");
      let allDomains = [];
      for (let [_owner, domains] of domainsByOwners) {
        allDomains.push(...domains);
      }
      const filterByRegEvent = domainRegistar.filters.DomainRegistration();
      const logs = await domainRegistar.queryFilter(filterByRegEvent, 0, "latest");
      const actDomains = logs.map(log => log.args.domain);
      expect(actDomains).to.include.ordered.members(allDomains);
      console.log(`All domains: ${allDomains}`);
    });
  });
});
