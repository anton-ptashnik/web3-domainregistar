// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import  {DomainUtils} from "./DomainUtils.sol";

error AccessDenied(string description);
error NotEnoughFunds(uint256 provided, uint256 required);
error DuplicateDomain();
error InvalidDomainName();
error ParentDomainDoesNotExists();


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

    function initialize(uint256 domainPrice) public initializer {
        MainStorage storage $ = _getMainStorage();
        $.rootEntry.owner = payable(msg.sender);
        $.rootEntry.weiDomainPrice = domainPrice;
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

        if(!DomainUtils.isValidDomainName(domainFullname)) revert InvalidDomainName();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullname);
        string memory newSubdomainName = domainLevels[domainLevels.length - 1];
        DomainUtils.DomainEntry storage parentEntry = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length-1);

        if(!parentEntry.exists()) revert ParentDomainDoesNotExists();
        if(msg.value < parentEntry.weiDomainPrice) revert NotEnoughFunds(msg.value, parentEntry.weiDomainPrice);
        if(parentEntry.subdomains[newSubdomainName].exists()) revert DuplicateDomain();
        
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
        (bool ok,) = payable(msg.sender).call{value: balance}("");
        // used require for backwards compat with v1 to throw the same error - Error
        // solhint-disable-next-line gas-custom-errors, custom-errors
        require(ok, "Withdraw failure");
    }

    function _getMainStorage() private pure returns (MainStorage storage $) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
    }
}
