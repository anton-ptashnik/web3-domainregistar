// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DomainRegistar {
    address public owner;
    uint8 public domainPrice;

    event DomainRegistration(address indexed _owner, address owner, string domain);
    event PriceChange(uint8 newPrice, uint8 oldPrice);

    constructor(uint8 _domainPrice) {
        owner = msg.sender;
        domainPrice = _domainPrice;
    }

    function updateDomainPrice(uint8 newPrice) public {
        require(msg.sender == owner);
        emit PriceChange(newPrice, domainPrice);
        domainPrice = newPrice;
    }

    function registerDomain(string calldata domain) public {

    }
}
