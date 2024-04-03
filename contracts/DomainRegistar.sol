// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

error AccessDenied(string description);
error NotEnoughFunds(uint provided, uint required);
error DuplicateDomain();
error TopLevelDomainsOnly();

/**
 * @title A simple contract for top-level domain registration
 * @author Me
 */
contract DomainRegistar {
    /// @notice Address of the account that deployed the contract
    address payable public owner;

    /// @notice Price payed for domain registration
    uint public weiDomainPrice;

    string[] private _domains;
    mapping (address => uint16[]) private _ownerDomainsByIndex;
    /**
     * Emitted on domain registration
     * @param _owner domain owner
     * @param owner domain owner
     * @param domain name of a new domain 
     */
    event DomainRegistration(address indexed _owner, address owner, string domain);

    /**
     * Emitted on price change
     * @param newPrice new price in Wei
     * @param oldPrice old price in Wei
     */
    event PriceChange(uint newPrice, uint oldPrice);

    constructor(uint _domainPrice) {
        owner = payable(msg.sender);
        weiDomainPrice = _domainPrice;
    }

    /**
     * Set a new price for domain registration. Allowed for owner only
     * @param newPrice price to be set
     */
    function updateDomainPrice(uint newPrice) public {
        if(msg.sender != owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChange(newPrice, weiDomainPrice);
        weiDomainPrice = newPrice;
    }

    /**
     * Register a new domain
     * @param domain domain to register
     */
    function registerDomain(string calldata domain) public payable {
        if(msg.value < weiDomainPrice) {
            revert NotEnoughFunds(msg.value, weiDomainPrice);
        }
        if(!_isTopLevelDomain(domain)) {
            revert TopLevelDomainsOnly();
        }
        if(!_isNewDomain(domain)) {
            revert DuplicateDomain();
        }

        uint16 domainIndex = uint16(_domains.length);
        _domains.push(domain);
        _ownerDomainsByIndex[msg.sender].push(domainIndex);
        emit DomainRegistration(msg.sender, msg.sender, domain);
    }

    /**
     * Send all coins to the owner. Allowed for the owner only
     */
    function withdraw() public {
        if(msg.sender != owner) {
            revert AccessDenied("Only owner can request balance withdrawal");
        }
        owner.transfer(address(this).balance);
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

    function _isTopLevelDomain(string memory domain) private pure returns (bool) {
        bytes1 a = bytes1("a");
        bytes1 z = bytes1("z");
        bytes1 A = bytes1("A");
        bytes1 Z = bytes1("Z");
        bytes1 zero = bytes1("0");
        bytes1 nine = bytes1("9");
        bytes memory _bytes = bytes(domain);
        for (uint i = 0; i < _bytes.length; i++) {
            if (!(
                (_bytes[i] >= a && _bytes[i] <= z) ||
                (_bytes[i] >= A && _bytes[i] <= Z) ||
                (_bytes[i] >= zero && _bytes[i] <= nine))) {
                return false;
            }
        }
        return true;
    }
}
