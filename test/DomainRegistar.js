const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe.only("DomainRegistar", function () {
  async function deployContract() {
    const [owner, anotherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("DomainRegistar");
    const domainPrice = 6;

    const domainRegistar = await factory.deploy(domainPrice);
    return { domainRegistar, domainPrice, owner, anotherAccount};
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
      const { domainRegistar, owner, anotherAccount } = await loadFixture(deployContract);

      const newPrice = 99;
      expect(await domainRegistar.updateDomainPrice(newPrice)).ok;
      expect(await domainRegistar.domainPrice()).to.equal(newPrice);
    });

    it("Should refuse domain price update for non-owners", async function () {
      const { domainRegistar, domainPrice, anotherAccount } = await loadFixture(
        deployContract
      );
      const initialPrice = domainPrice;
      const newPrice = 99;
      domainRegistarNonOwner = domainRegistar.connect(anotherAccount)

      await expect(domainRegistarNonOwner.updateDomainPrice(newPrice)).to.be.revertedWith(
        "You aren't the owner"
      );
      expect(await domainRegistarNonOwner.domainPrice()).to.equal(initialPrice);
    });
  });

  describe("Domain registration", function () {
    it("Should allow domain registration for different users", async function () {
      const { domainRegistar, owner, anotherAccount } = await loadFixture(deployContract);

      const domainName = "hidomain";
      await expect(domainRegistar.registerDomain(domainName))
        .to.emit(domainRegistar, "DomainRegistration")
        .withArgs(anyValue, owner.address, domainName);

      const anotherDomainName = "hidomain2";
      anotherDomainRegistar = domainRegistar.connect(anotherAccount)
      await expect(anotherDomainRegistar.registerDomain(anotherDomainName))
        .to.emit(anotherDomainRegistar, "DomainRegistration")
        .withArgs(anyValue, anotherAccount.address, anotherDomainName);
    });

    it("Should refuse same domain registration", async function () {
      const { domainRegistar, owner, anotherAccount } = await loadFixture(deployContract);
      const domainName = "hidomain";
      anotherDomainRegistar = domainRegistar.connect(anotherAccount)

      await expect(domainRegistar.registerDomain(domainName))
        .to.emit(domainRegistar, "DomainRegistration")
        .withArgs(anyValue, owner.address, domainName);

      await expect(domainRegistar.registerDomain(domainName)).to.be.reverted
      await expect(anotherDomainRegistar.registerDomain(domainName)).to.be.reverted
    });
  });
});
