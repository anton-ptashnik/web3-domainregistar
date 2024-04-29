const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DomainRegistar", function () {
  async function deployContract(initialDomainPriceUsdc = 1000000) {
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const usdcContractFactory = await ethers.getContractFactory("UsdcToken");
    const usdcSupply = 99000000;
    const usdcContract = await usdcContractFactory.deploy(usdcSupply);

    const factory = await ethers.getContractFactory("DomainRegistar", owner);
    const domainRegistar = await factory.deploy(usdcContract.getAddress(), initialDomainPriceUsdc);
    const initialDomainPrice = Number(await domainRegistar.subdomainPriceWei(""));
    return { domainRegistar, usdcContract, initialDomainPrice, initialDomainPriceUsdc, owner, otherAccounts};
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
        await contract.registerDomain(domainName, deploymentData.initialDomainPriceUsdc, {value: deploymentData.initialDomainPrice});
      }
    }

    return { ...deploymentData, domainsByOwners};
  }

  describe("Deployment", function () {
    it("Should set the owner and domain price", async function () {
      const {domainRegistar, owner, initialDomainPrice, initialDomainPriceUsdc } = await loadFixture(deployContract);

      expect(await domainRegistar.owner()).to.equal(owner.address);
      expect(await domainRegistar.subdomainPriceWei("")).to.equal(initialDomainPrice);
      expect(await domainRegistar.subdomainPriceUsdc("")).to.equal(initialDomainPriceUsdc);
    });
  });

  describe("Domain price update", function () {
    it("Should set a new domain price on contract owner request", async function () {
      const { domainRegistar, initialDomainPriceUsdc } = await loadFixture(deployContract);

      const newPrice = 99;
      await expect(domainRegistar.updateDomainPrice(newPrice))
        .to.emit(domainRegistar, "PriceChanged").withArgs(newPrice, initialDomainPriceUsdc);
      expect(await domainRegistar.subdomainPriceUsdc("")).to.equal(newPrice);
    });

    it("Should refuse domain price update for non-owners", async function () {
      const { domainRegistar, initialDomainPriceUsdc, otherAccounts } = await loadFixture(
        deployContract
      );
      const newPrice = 99;
      const domainRegistarNonOwner = domainRegistar.connect(otherAccounts[0]);

      await expect(domainRegistarNonOwner.updateDomainPrice(newPrice))
        .to.be.revertedWithCustomError(domainRegistar, "AccessDenied");
      expect(await domainRegistarNonOwner.subdomainPriceUsdc("")).to.equal(initialDomainPriceUsdc);
    });

    it("Should set a new subdomain price on domain owner request", async function () {
      const { domainRegistar, initialDomainPrice, initialDomainPriceUsdc, otherAccounts } = await loadFixture(deployContract);

      const domainName0 = "domain";
      const domainName1 = "sub.domain";
      const contractOwnerPrice = initialDomainPrice;

      const domainOwner0 = otherAccounts[0]
      const domainRegistar0 = domainRegistar.connect(domainOwner0);
      const domainPrice0Usdc = initialDomainPriceUsdc+1000;
      await expect(domainRegistar0.registerDomain(domainName0, initialDomainPriceUsdc, {value: contractOwnerPrice}))
      .to.emit(domainRegistar, "DomainRegistered").withArgs(anyValue, domainOwner0.address, domainName0);
      
      await expect(domainRegistar0.updateSubdomainPrice(domainPrice0Usdc, domainName0))
      .to.emit(domainRegistar, "PriceChanged").withArgs(domainPrice0Usdc, initialDomainPriceUsdc);
      expect(await domainRegistar.subdomainPriceUsdc(domainName0)).to.equal(domainPrice0Usdc);

      const domainOwner1 = otherAccounts[1]
      const domainRegistar1 = domainRegistar.connect(domainOwner1);
      const domainPrice0 = await domainRegistar.subdomainPriceWei(domainName0);
      await expect(domainRegistar1.registerDomain(domainName1, initialDomainPriceUsdc, {value: domainPrice0}))
      .to.emit(domainRegistar, "DomainRegistered").withArgs(anyValue, domainOwner1.address, domainName1);
    });
  });

  describe("Domain registration", function () {
    it("Should allow domain registration for different users", async function () {
      const { domainRegistar, usdcContract, initialDomainPrice, initialDomainPriceUsdc, owner, otherAccounts } = await loadFixture(deployContract);

      const domainName = "hidomain";
      const anotherAccount = otherAccounts[0];
      const coinsMap = {value: initialDomainPrice}
      await expect(domainRegistar.registerDomain(domainName, initialDomainPriceUsdc, coinsMap))
        .to.emit(domainRegistar, "DomainRegistered")
        .withArgs(anyValue, owner.address, domainName);

      const anotherDomainName = "hidomain2";
      const anotherDomainRegistar = domainRegistar.connect(anotherAccount)
      await expect(anotherDomainRegistar.registerDomain(anotherDomainName, initialDomainPriceUsdc, coinsMap))
        .to.emit(anotherDomainRegistar, "DomainRegistered")
        .withArgs(anyValue, anotherAccount.address, anotherDomainName);

      const anotherDomainName2 = "hidomainbest";
      await usdcContract.approve(domainRegistar.getAddress(), initialDomainPriceUsdc+10000)
      await expect(domainRegistar.registerDomainUsdc(anotherDomainName2, initialDomainPriceUsdc))
        .to.emit(domainRegistar, "DomainRegistered")
        .withArgs(anyValue, owner.address, anotherDomainName2);
    });

    it("Should refuse same domain registration", async function () {
      const { domainRegistar, initialDomainPrice, initialDomainPriceUsdc, owner, otherAccounts } = await loadFixture(deployContract);
      const domainName = "hidomain";
      const anotherDomainRegistar = domainRegistar.connect(otherAccounts[0])
      const coinsMap = {value: initialDomainPrice}

      await expect(domainRegistar.registerDomain(domainName, initialDomainPriceUsdc, coinsMap))
        .to.emit(domainRegistar, "DomainRegistered")
        .withArgs(anyValue, owner.address, domainName);

      await expect(domainRegistar.registerDomain(domainName, initialDomainPriceUsdc, coinsMap))
        .to.be.revertedWithCustomError(domainRegistar, "DuplicateDomain");
      await expect(anotherDomainRegistar.registerDomain(domainName, initialDomainPriceUsdc, coinsMap))
        .to.be.revertedWithCustomError(domainRegistar, "DuplicateDomain");
    });

    it("Should refuse domain registration when not enough coins provided", async function () {
      const { domainRegistar, usdcContract, initialDomainPrice, initialDomainPriceUsdc, owner } = await loadFixture(deployContract);

      await expect(domainRegistar.registerDomain("hidomain", initialDomainPriceUsdc, {value: initialDomainPrice-1}))
        .to.revertedWithCustomError(domainRegistar, "NotEnoughFunds");

      await usdcContract.approve(domainRegistar.getAddress(), initialDomainPriceUsdc-100)
      await expect(domainRegistar.registerDomainUsdc("hidomain", initialDomainPriceUsdc)).to.be.reverted

      const newDomainPrice = 2000000
      await expect(domainRegistar.registerDomain("topdomain", newDomainPrice, {value: initialDomainPrice}))
        .to.be.ok

      await expect(domainRegistar.registerDomain("sub.topdomain", initialDomainPriceUsdc, {value: initialDomainPrice}))
        .to.revertedWithCustomError(domainRegistar, "NotEnoughFunds");
      
      await usdcContract.approve(domainRegistar.getAddress(), newDomainPrice);
      await expect(domainRegistar.registerDomainUsdc("sub.topdomain", newDomainPrice-10))
        .to.emit(domainRegistar, "DomainRegistered")
        .withArgs(anyValue, owner.address, "sub.topdomain");
    });
    
    it.skip("Should scale", async function () {
      this.timeout(120000);
      const { domainRegistar, initialDomainPrice, owner } = await loadFixture(deployContract);
      const domainsCount = 1000;
      let domains = [...Array(domainsCount).keys()].map(i => "hidomain"+i);
      const coinsMap = {value: initialDomainPrice}
      
      for (let domain of domains) {
        await expect(domainRegistar.registerDomain(domain, coinsMap))
        .not.to.be.reverted
      }
    });
    
    it("Should allow subdomains", async function () {
      const { domainRegistar, initialDomainPrice, initialDomainPriceUsdc, owner, otherAccounts } = await loadFixture(deployContract);

      const domainName0 = "domain";
      const domainName1 = "sub.domain";
      const domainName2 = "sub.sub.domain";
      const coinsMap = {value: initialDomainPrice}
      await expect(domainRegistar.registerDomain(domainName0, initialDomainPriceUsdc, coinsMap))
      .to.emit(domainRegistar, "DomainRegistered")
      .withArgs(anyValue, owner.address, domainName0);
      
      const anotherAccount = otherAccounts[0];
      const domainRegistarAnotherAccount = domainRegistar.connect(anotherAccount);
      await expect(domainRegistarAnotherAccount.registerDomain(domainName1, initialDomainPriceUsdc, coinsMap))
      .to.emit(domainRegistar, "DomainRegistered")
      .withArgs(anyValue, anotherAccount.address, domainName1);

      const anotherAccount2 = otherAccounts[1];
      const domainRegistarAnotherAccount2 = domainRegistar.connect(anotherAccount2);
      await expect(domainRegistarAnotherAccount2.registerDomain(domainName2, initialDomainPriceUsdc, coinsMap))
      .to.emit(domainRegistar, "DomainRegistered")
      .withArgs(anyValue, anotherAccount2.address, domainName2);
    });

    it("Should refuse registration when parent domain does not exist", async function () {
      const { domainRegistar, initialDomainPrice } = await loadFixture(deployContract);
      const domainName = "sub.domain";
      await expect(domainRegistar.registerDomain(domainName, initialDomainPrice, {value: initialDomainPrice}))
        .to.be.revertedWithCustomError(domainRegistar, "ParentDomainDoesNotExists");
    });
  });

  describe("Coin withdrawal", function () {
    it("Should send all coins to the owner when requested", async function () {
      const {owner, domainRegistar, usdcContract, initialDomainPrice, initialDomainPriceUsdc, otherAccounts} = await loadFixture(deployContract);

      const domainRegistarAnotherAccount = domainRegistar.connect(otherAccounts[0]);
      await domainRegistarAnotherAccount.registerDomain("hidomain", initialDomainPriceUsdc, {value: initialDomainPrice});
      await expect(domainRegistar.withdraw())
        .to.changeEtherBalances([domainRegistar, owner], [-initialDomainPrice, initialDomainPrice]);

      await usdcContract.approve(domainRegistar.getAddress(), initialDomainPriceUsdc);
      await expect(domainRegistar.registerDomainUsdc("hidomain2", initialDomainPriceUsdc))
        .to.changeTokenBalances(usdcContract, [domainRegistar, owner], [initialDomainPriceUsdc, -initialDomainPriceUsdc]);
      await expect(domainRegistar.withdrawUsdc())
        .to.changeTokenBalances(usdcContract, [domainRegistar, owner], [-initialDomainPriceUsdc, initialDomainPriceUsdc]);
    });

    it("Should allow withdrawals for subdomain owners", async function () {
      const { domainRegistar, initialDomainPrice, initialDomainPriceUsdc, owner, otherAccounts } = await loadFixture(deployContract);

      const domainName0 = "domain";
      const accountDomainRegistar0 = otherAccounts[0];
      const domainRegistar0 = domainRegistar.connect(accountDomainRegistar0);
      const subdomains = [...Array(10).keys()].map(i => `sub${i}.domain`);
      const subdomainPriceUsdc = initialDomainPriceUsdc + 1000;
      await expect(domainRegistar0.registerDomain(domainName0, initialDomainPriceUsdc, {value: initialDomainPrice}))
      .to.emit(domainRegistar, "DomainRegistered")
      .withArgs(anyValue, accountDomainRegistar0.address, domainName0);
      
      await domainRegistar0.updateSubdomainPrice(subdomainPriceUsdc, domainName0);
      const subdomainPriceEth = await domainRegistar0.subdomainPriceWei(domainName0);

      const accountDomainRegistar1 = otherAccounts[0];
      const domainRegistar1 = domainRegistar.connect(accountDomainRegistar1);
      for(let domainName of subdomains) {
        await expect(domainRegistar1.registerDomain(domainName, initialDomainPriceUsdc, {value: subdomainPriceEth}))
        .to.emit(domainRegistar, "DomainRegistered")
        .withArgs(anyValue, accountDomainRegistar1.address, domainName);
      }

      const totalSpentSubdomains = BigInt(subdomains.length) * subdomainPriceEth;
      await expect(domainRegistar1.withdraw())
        .to.changeEtherBalances([domainRegistar, accountDomainRegistar1], [-totalSpentSubdomains, totalSpentSubdomains]);

      const totalSpentTopdomains = initialDomainPrice;
      await expect(domainRegistar.withdraw())
        .to.changeEtherBalances([domainRegistar, owner], [-totalSpentTopdomains, totalSpentTopdomains]);
    });
  });

  describe("Metrics query demo", function () {
    it("Should return event logs when requested", async function () {
      const { domainRegistar, domainsByOwners } = await loadFixture(deployContractWithData);
      console.log("Domains list per owner");
      for (let [ownerAddress, expDomainsOrdered] of domainsByOwners) {
        const filterByOwner = domainRegistar.filters.DomainRegistered(ownerAddress);
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
      const filterByRegEvent = domainRegistar.filters.DomainRegistered();
      const logs = await domainRegistar.queryFilter(filterByRegEvent, 0, "latest");
      const actDomains = logs.map(log => log.args.domain);
      expect(actDomains).to.include.ordered.members(allDomains);
      console.log(`All domains: ${allDomains}`);
    });
  });
});
