// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { DomainUtils } from "./DomainUtils.sol";

/**
 * Emitted on domain registration
 * @param _owner domain owner
 * @param owner domain owner
 * @param domain name of a new domain 
 * @param subdomainPriceUsdc USDC price for subdomain registration
 */
event DomainRegistered(address indexed _owner, address owner, string domain, uint256 subdomainPriceUsdc);

/**
 * Emitted on price change
 * @param newPrice new USDC price
 * @param oldPrice old USDC price
 */
event PriceChanged(uint256 newPrice, uint256 oldPrice);

/// Raised when a caller is not allowed to call the function
error AccessDenied(string description);
/// Raised when coins provided for domain registration is lower that subdomain price
error NotEnoughFunds(uint256 provided, uint256 required);
/// Raised when the requested domain name already exists
error DuplicateDomain();
/// Raised when domain name includes extra symbols (/*7&^ etc)
error InvalidDomainName();
/// Raised on attempt to create a subdomain under missing parent domain, like requested.missingparent
error ParentDomainDoesNotExists();
/// Raised on error during earnings withdrawal
error WithdrawalFailure();

/**
 * @title A simple contract for top-level domain registration
 * @author Me
 */
contract DomainRegistar {
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
        
        /// @notice current USDC to ETH rate used for ETH payments
        uint256 usdcEthRate;

        /// @notice USDC to ETH Data feed to enable USDC to ETH convertion for ETH domain purchases
        AggregatorV3Interface usdc2EthDataFeed;
    }

    constructor(address usdcContractAddress, address usdcToEthContractAddress, uint256 usdcDomainPrice) {
        MainStorage storage $ = _getMainStorage();
        $.rootEntry.owner = payable(msg.sender);
        $.rootEntry.usdcDomainPrice = usdcDomainPrice;
        $.usdcTokenContract = ERC20(usdcContractAddress);
        $.usdc2EthDataFeed = AggregatorV3Interface(usdcToEthContractAddress);
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        )  = $.usdc2EthDataFeed.latestRoundData();
        $.usdcEthRate = uint256(answer);
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
     * Return ETH price for registration of domains under the specified parent domain
     * @param domainFullpath domain name starting from top-level domain
     */
    function subdomainPriceEth(string calldata domainFullpath) external view returns(uint256) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils.parseDomainLevels(domainFullpath);
        uint256 usdcPrice = $.rootEntry.findDomainEntry(domainLevels, domainLevels.length).usdcDomainPrice;
        return _convertUsdcToEth(usdcPrice);
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
        uint256 ethPrice = _convertUsdcToEth(parentEntry.usdcDomainPrice);
        if(msg.value < ethPrice) revert NotEnoughFunds(msg.value, ethPrice);
        $.ethShares[parentEntry.owner] += ethPrice;
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

    /**
     * Send all Eth coins to the owner
     */
    function withdraw() external {
        mapping(address => uint256) storage shares = _getMainStorage().ethShares;

        uint256 balance = shares[msg.sender];
        shares[msg.sender] = 0;
        (bool ok,) = payable(msg.sender).call{value: balance}("");
        if(!ok) revert WithdrawalFailure();
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

    /**
     * Admin func to imitate a live contract by allowing owner to sync USDC2ETH rate with the Datafeed
     */
    function updateUsdc2EthRate() external {
        MainStorage storage $ = _getMainStorage();
        if (msg.sender != $.rootEntry.owner) revert AccessDenied("Allowed for owner only");
        (
            /* uint80 roundID */,
            int256 answer,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        )  = $.usdc2EthDataFeed.latestRoundData();
        $.usdcEthRate = uint256(answer);
    }

    /**
     * Return current in use USDC2ETH rate
     */
    function usdc2EthRate() external view returns(uint256) {
        return _getMainStorage().usdcEthRate;
    }

    function _getMainStorage() private pure returns (MainStorage storage $) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
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

        emit DomainRegistered(msg.sender, msg.sender, domainFullname, subdomainPriceUsdc);
        return parentEntry;
    }

    function _convertUsdcToEth(uint256 usdcPrice) private view returns(uint256) {
        uint256 usdcEthRate = _getMainStorage().usdcEthRate;
        return usdcPrice*usdcEthRate/1000000;
    }
}
