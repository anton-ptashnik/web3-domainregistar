// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./DomainUtils.sol";

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

        /// @notice Per owner Eth balance earned for subdomain registrations
        mapping(address => uint256) ethShares;

        /// @notice Per owner USDC balance earned for subdomain registrations
        mapping(address => uint256) usdcShares;

        /// @notice USDC token contract used for USDC payments
        ERC20 usdcTokenContract;
        
        /// @notice current Wei to USDC rate used for Eth payments
        uint256 weiUsdcRate;
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

    constructor(address usdcContractAddress, uint256 usdcDomainPrice) {
        MainStorage storage $ = _getMainStorage();
        $.rootEntry.owner = payable(msg.sender);
        $.rootEntry.usdcDomainPrice = usdcDomainPrice;
        $.usdcTokenContract = ERC20(usdcContractAddress);
        $.weiUsdcRate = 324046892602;
    }

    /**
     * Return an address of a contract owner
     */
    function owner() external view returns (address) {
        return _getMainStorage().rootEntry.owner;
    }

    /**
     * Return an address of a domain owner
     * @param domainFullpath domain name starting from top-level domain
     */
    function domainOwner(string calldata domainFullpath) external view returns(address) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        return $.rootEntry.findDomainEntry(domainLevels, domainLevels.length).owner;
    }

    /**
     * Return number of ETH earned by a given domain owner
     * @param domainOwner owner account address
     */
    function domainOwnerEarningsEth(address domainOwner) external view returns(uint256) {
        return _getMainStorage().ethShares[domainOwner];
    }

    /**
     * Return number of USDC earned by a given domain owner
     * @param domainOwner owner account address
     */
    function domainOwnerEarningsUsdc(address domainOwner) external view returns(uint256) {
        return _getMainStorage().usdcShares[domainOwner];
    }

    /**
     * Return Wei price for registration of domains under the specified parent domain
     * @param domainFullpath domain name starting from top-level domain
     */
    function subdomainPriceWei(string calldata domainFullpath) external view returns(uint256) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        uint256 usdcPrice = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length).usdcDomainPrice;
        return convertUsdcToWei(usdcPrice);
    }

    /**
     * Return Usdc price for registration of domains under the specified parent domain
     * @param domainFullpath domain name starting from top-level domain
     */
    function subdomainPriceUsdc(string calldata domainFullpath) external view returns(uint256) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        return $.rootEntry.findDomainEntry(domainLevels, domainLevels.length).usdcDomainPrice;
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
        emit PriceChanged(newPrice, $.rootEntry.usdcDomainPrice);
        $.rootEntry.usdcDomainPrice = newPrice;
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
        emit PriceChanged(newPrice, entry.usdcDomainPrice);
        entry.usdcDomainPrice = newPrice;
    }

    /**
     * Register a new domain paying Eth
     * @param domainFullname domain to register provided as fullpath starting from root: mydomain.lvl1.lvl0
     * @param subdomainPriceUsdc USDC price for subdomain registration
     */
    function registerDomain(string calldata domainFullname, uint256 subdomainPriceUsdc) external payable {
        DomainUtils.DomainEntry storage parentEntry = _registerDomain(domainFullname, subdomainPriceUsdc);
        MainStorage storage $ = _getMainStorage();
        uint256 weiPrice = convertUsdcToWei(parentEntry.usdcDomainPrice);
        if(msg.value < weiPrice) revert NotEnoughFunds(msg.value, weiPrice);
        $.ethShares[parentEntry.owner] += weiPrice;
    }

    /**
     * Register a new domain paying Usdc
     * @param domainFullname domain to register provided as fullpath starting from root: mydomain.lvl1.lvl0
     * @param subdomainPriceUsdc USDC price for subdomain registration
     */
    function registerDomainUsdc(string calldata domainFullname, uint256 subdomainPriceUsdc) external {
        DomainUtils.DomainEntry storage parentEntry = _registerDomain(domainFullname, subdomainPriceUsdc);
        MainStorage storage $ = _getMainStorage();
        $.usdcTokenContract.transferFrom(msg.sender, address(this), parentEntry.usdcDomainPrice);
        $.usdcShares[parentEntry.owner] += parentEntry.usdcDomainPrice;
    }

    function _registerDomain(string calldata domainFullname, uint256 subdomainPriceUsdc) private returns(DomainUtils.DomainEntry storage) {
        MainStorage storage $ = _getMainStorage();

        if(!DomainUtils.isValidDomainName(domainFullname)) revert InvalidDomainName();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullname);
        string memory newSubdomainName = domainLevels[domainLevels.length - 1];
        DomainUtils.DomainEntry storage parentEntry = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length-1);

        if(!parentEntry.exists()) revert ParentDomainDoesNotExists();
        if(parentEntry.subdomains[newSubdomainName].exists()) revert DuplicateDomain();
        
        DomainUtils.DomainEntry storage newEntry = parentEntry.subdomains[newSubdomainName];
        newEntry.owner = payable(msg.sender);
        newEntry.domainName = newSubdomainName;
        newEntry.usdcDomainPrice = subdomainPriceUsdc;

        emit DomainRegistered(msg.sender, msg.sender, domainFullname);
        return parentEntry;
    }

    function convertUsdcToWei(uint256 usdcPrice) private view returns(uint256) {
        uint weiUsdcRate = _getMainStorage().weiUsdcRate;
        return usdcPrice*weiUsdcRate/1000000;
    }

    /**
     * Send all Eth coins to the owner
     */
    function withdraw() external {
        mapping(address => uint256) storage shares = _getMainStorage().ethShares;

        uint256 balance = shares[msg.sender];
        shares[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: balance}("");
        require(ok, "Withdraw failure");
    }

    /**
     * Send all Usdc coins to the owner
     */
    function withdrawUsdc() external {
        MainStorage storage $ = _getMainStorage();

        uint256 balance = $.usdcShares[msg.sender];
        $.usdcShares[msg.sender] = 0;
        $.usdcTokenContract.transfer(msg.sender, balance);
    }

    function _getMainStorage() private pure returns (MainStorage storage $) {
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
    }
}
