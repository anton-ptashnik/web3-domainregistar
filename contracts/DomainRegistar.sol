// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./DomainUtils.sol";

error AccessDenied(string description);
error NotEnoughFunds(uint256 provided, uint256 required);
error DuplicateDomain();


/**
 * @title A simple contract for top-level domain registration
 * @author Me
 */
contract DomainRegistar is Initializable {
    // keccak256(abi.encode(uint256(keccak256("DomainRegistar.main")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant MAIN_STORAGE_LOCATION = 0x7b039d00eb6b93db42c4878af000bf4f52751a20d25ae3b0c322c5cf77ae8600;

    using DomainUtils for DomainUtils.DomainEntry;

    /// @custom:storage-location erc7201:DomainRegistar.main
    struct MainStorage {
        /// @notice A root entry holding top-level domains
        DomainUtils.DomainEntry rootEntry;

        /// @notice Per owner balance payed for registration of subdomains under domains held by the owner  
        mapping(address => uint256) shares;
    }

    /**
     * Emitted on domain registration
     * @param _owner domain owner
     * @param owner domain owner
     * @param domain name of a new domain 
     */
    event DomainRegistered(address indexed _owner, address owner, string domain);

    /**
     * Emitted on price change
     * @param newPrice new price in Wei
     * @param oldPrice old price in Wei
     */
    event PriceChanged(uint256 newPrice, uint256 oldPrice);

    function initialize(uint256 _domainPrice) public initializer {
        MainStorage storage $ = _getMainStorage();
        $.rootEntry.owner = payable(msg.sender);
        $.rootEntry.weiDomainPrice = _domainPrice;
    }

    function reinitialize() public reinitializer(2) {
        MainStorage storage $ = _getMainStorage();
        $.shares[$.rootEntry.owner] = address(this).balance;
    }

    /**
     * Return an address of a contract owner
     */
    function owner() external view returns (address) {
        return _getMainStorage().rootEntry.owner;
    }

    /**
     * Return an actual price for top level domain registration
     */
    function weiDomainPrice() external view returns (uint256) {
        return _getMainStorage().rootEntry.weiDomainPrice;
    }

    /**
     * Return price for registration of domains under the specified parent domain
     * @param domainFullpath domain name starting from top-level domain
     */
    function subdomainPrice(string calldata domainFullpath) external view returns(uint256) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        return $.rootEntry.findDomainEntry(domainLevels, domainLevels.length).weiDomainPrice;
    }

    /**
     * Set a new price for top-level domain registration. Allowed for contract owner only
     * @param newPrice price to be set
     */
    function updateDomainPrice(uint256 newPrice) external {
        MainStorage storage $ = _getMainStorage();
        if(msg.sender != $.rootEntry.owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChanged(newPrice, $.rootEntry.weiDomainPrice);
        $.rootEntry.weiDomainPrice = newPrice;
    }

    /**
     * Update price for new domains under the specified parent domain
     * @param newPrice new domain price
     * @param domainFullpath parent domain name starting from the top-level domain
     */
    function updateSubdomainPrice(uint256 newPrice, string calldata domainFullpath) external {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        DomainUtils.DomainEntry storage entry = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length);
        if(msg.sender != entry.owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChanged(newPrice, entry.weiDomainPrice);
        entry.weiDomainPrice = newPrice;
    }

    /**
     * Register a new domain
     * @param domainFullname domain to register provided as fullpath starting from root: mydomain.lvl1.lvl0
     */
    function registerDomain(string calldata domainFullname) external payable {
        MainStorage storage $ = _getMainStorage();

        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullname);
        string memory newSubdomainName = domainLevels[domainLevels.length - 1];
        DomainUtils.DomainEntry storage parentEntry = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length-1);
        _validateNewDomain(parentEntry, newSubdomainName);
        _validatePrice(parentEntry.weiDomainPrice);
        
        DomainUtils.DomainEntry storage newEntry = parentEntry.subdomains[newSubdomainName];
        newEntry.owner = payable(msg.sender);
        newEntry.domainName = newSubdomainName;
        newEntry.weiDomainPrice = $.rootEntry.weiDomainPrice;
        $.shares[parentEntry.owner] += parentEntry.weiDomainPrice;
        emit DomainRegistered(msg.sender, msg.sender, domainFullname);
    }

    /**
     * Send all coins to the owner. Allowed for the owner only
     */
    function withdraw() external {
        mapping(address => uint256) storage shares = _getMainStorage().shares;

        uint256 balance = shares[msg.sender];
        shares[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }

    function _getMainStorage() private pure returns (MainStorage storage $) {
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
    }

    function _validatePrice(uint256 requiredPrice) private view {
        if(msg.value < requiredPrice) revert NotEnoughFunds(msg.value, requiredPrice);
    }

    function _validateNewDomain(DomainUtils.DomainEntry storage parentEntry, string memory subdomain) private view {
        if (parentEntry.hasSubdomain(subdomain)) revert DuplicateDomain();
    }
}
