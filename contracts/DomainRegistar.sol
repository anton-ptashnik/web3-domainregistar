// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

error AccessDenied(string description);
error NotEnoughFunds(uint8 provided, uint8 required);
error DuplicateDomain();

/**
 * @title A simple contract for top-level domain registration
 * @author Me
 */
contract DomainRegistar {
    address public owner;
    uint8 public domainPrice;
    string[] private _domains;
    mapping (address => uint16[]) private _ownerDomainsByIndex;

    event DomainRegistration(address indexed _owner, address owner, string domain);
    event PriceChange(uint8 newPrice, uint8 oldPrice);

    constructor(uint8 _domainPrice) {
        owner = msg.sender;
        domainPrice = _domainPrice;
    }

    /**
     * Set a new price for domain registration. Allowed for owner only
     * @param newPrice price to be set
     */
    function updateDomainPrice(uint8 newPrice) public {
        if(msg.sender != owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChange(newPrice, domainPrice);
        domainPrice = newPrice;
    }

    /**
     * Register a new domain
     * @param domain domain to register
     */
    function registerDomain(string calldata domain) public payable {
        if(msg.value < domainPrice) {
            revert NotEnoughFunds(uint8(msg.value), domainPrice);
        }
        if(!_isNewDomain(domain)) {
            revert DuplicateDomain();
        }

        uint16 domainIndex = uint16(_domains.length);
        _domains.push(domain);
        _ownerDomainsByIndex[msg.sender].push(domainIndex);
        emit DomainRegistration(msg.sender, msg.sender, domain);
    }

    function _isNewDomain(string memory domain) private view returns (bool) {
        bytes32 baseHash = keccak256(abi.encodePacked(domain));
        for (uint i = 0; i < _domains.length; i++) {
            if (keccak256(abi.encodePacked(_domains[i])) == baseHash) {
                return false;
            }
        }
        return true;
    }
}
