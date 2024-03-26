// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract DomainRegistar {
    address public owner;
    uint public domainPrice;

    event DomainRegistration(address indexed _owner, address owner, string domain);

    constructor(uint _domainPrice) {
        owner = msg.sender;
        domainPrice = _domainPrice;
    }

    function updateDomainPrice(uint newPrice) public {
        
    }

    function registerDomain(string calldata domain) public {

    }
}
