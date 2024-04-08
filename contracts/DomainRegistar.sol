// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "solidity-stringutils/strings.sol";

error AccessDenied(string description);
error NotEnoughFunds(uint provided, uint required);
error DuplicateDomain();
error ParentDomainDoesNotExists();
error InvalidDomainName();

/**
 * @title Provides tools for storing and retrieving domain data
 * @author Me
 */
library DomainUtils {
    using strings for *;

    struct DomainEntry {
        /// @notice Address of the account that deployed the contract
        address payable owner;

        /// @notice Price payed for domain registration
        uint weiDomainPrice;

        /// @notice Domain name
        string domainName;

        /// @notice Collection of subdomains
        mapping (string => DomainEntry) subdomains;
    }

    function _validateDomainFullname(string memory domain) private pure {
        bytes1 a = bytes1("a");
        bytes1 z = bytes1("z");
        bytes1 A = bytes1("A");
        bytes1 Z = bytes1("Z");
        bytes1 zero = bytes1("0");
        bytes1 nine = bytes1("9");
        bytes1 dot = bytes1(".");
        bytes memory _bytes = bytes(domain);
        for (uint i = 0; i < _bytes.length; i++) {
            if (!(
                (_bytes[i] >= a && _bytes[i] <= z) ||
                (_bytes[i] >= A && _bytes[i] <= Z) ||
                (_bytes[i] >= zero && _bytes[i] <= nine) ||
                _bytes[i] == dot)) {
                revert InvalidDomainName();
            }
        }
    }

    function _parseDomainLevels(string memory domain) internal pure returns (string[] memory parts) {
        _validateDomainFullname(domain);

        strings.slice memory sl = domain.toSlice();
        strings.slice memory delim = ".".toSlice();
        uint n = sl.count(delim) + 1;
        parts = new string[](n);
        for(uint i = 0; i < parts.length; ++i) {
            parts[n-i-1] = sl.split(delim).toString();
        }
    }

    function _checkSubdomainExists(DomainEntry storage parentDomainEntry, string memory domain) internal view returns(bool) {
        return parentDomainEntry.subdomains[domain].owner != address(0);
    }

    function _findParentDomainEntry(DomainEntry storage rootEntry, string[] memory domainLevels) internal view returns (DomainEntry storage) {
        DomainEntry storage e = rootEntry;
        
        for (uint domainLevel; domainLevel < domainLevels.length-1; ++domainLevel) {
            e = e.subdomains[domainLevels[domainLevel]];
            if (e.owner == address(0)) revert ParentDomainDoesNotExists();
        }
        return e;
    }

    function _findDomainEntry(DomainEntry storage rootEntry, string[] memory domainLevels) internal view returns (DomainEntry storage) {
        DomainEntry storage e = rootEntry;
        
        for (uint domainLevel; domainLevel < domainLevels.length; ++domainLevel) {
            e = e.subdomains[domainLevels[domainLevel]];
            if (e.owner == address(0)) revert ParentDomainDoesNotExists();
        }
        return e;
    }
}

/**
 * @title A simple contract for top-level domain registration
 * @author Me
 */
contract DomainRegistar is Initializable {
    /// @custom:storage-location erc7201:DomainRegistar.main
    struct MainStorage {
        /// @notice A root entry holding top-level domains
        DomainUtils.DomainEntry rootEntry;

        /// @notice Per owner balance payed for registration of subdomains under domains held by the owner  
        mapping(address => uint) shares;
    }
    
    // keccak256(abi.encode(uint256(keccak256("DomainRegistar.main")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant MAIN_STORAGE_LOCATION = 0x7b039d00eb6b93db42c4878af000bf4f52751a20d25ae3b0c322c5cf77ae8600;
    
    function _getMainStorage() private pure returns (MainStorage storage $) {
        assembly {
            $.slot := MAIN_STORAGE_LOCATION
        }
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
    event PriceChanged(uint newPrice, uint oldPrice);

    using DomainUtils for DomainUtils.DomainEntry;

    function initialize(uint _domainPrice) public initializer {
        MainStorage storage $ = _getMainStorage();
        $.rootEntry.owner = payable(msg.sender);
        $.rootEntry.weiDomainPrice = _domainPrice;
    }

    /**
     * Return an actual price for domain registration
     */
    function weiDomainPrice() external view returns (uint) {
        return _getMainStorage().rootEntry.weiDomainPrice;
    }

    /**
     * Return an address of contract owner
     */
    function owner() external view returns (address) {
        return _getMainStorage().rootEntry.owner;
    }

    /**
     * Set a new price for domain registration. Allowed for owner only
     * @param newPrice price to be set
     */
    function updateDomainPrice(uint newPrice) public {
        MainStorage storage $ = _getMainStorage();
        if(msg.sender != $.rootEntry.owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChanged(newPrice, $.rootEntry.weiDomainPrice);
        $.rootEntry.weiDomainPrice = newPrice;
    }

    /**
     * Return price for domain registration belonging to the specified parent domain
     * @param domainFullpath domain name starting from top-level domain
     */
    function subdomainPrice(string calldata domainFullpath) external view returns(uint) {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils._parseDomainLevels(domainFullpath);
        DomainUtils.DomainEntry storage e = $.rootEntry._findDomainEntry(domainLevels);
        return e.weiDomainPrice;
    }

    /**
     * Update price for new domains under the specified parent domain
     * @param newPrice new domain price
     * @param domainFullpath parent domain name starting from the top-level domain
     */
    function updateSubdomainPrice(uint newPrice, string calldata domainFullpath) public {
        MainStorage storage $ = _getMainStorage();
        string[] memory domainLevels = DomainUtils._parseDomainLevels(domainFullpath);
        DomainUtils.DomainEntry storage e = $.rootEntry._findDomainEntry(domainLevels);
        if(msg.sender != e.owner) {
            revert AccessDenied("Domain price can be changed by owner only");
        }
        emit PriceChanged(newPrice, e.weiDomainPrice);
        e.weiDomainPrice = newPrice;
    }

    /**
     * Register a new domain
     * @param domainFullname domain to register provided as fullpath starting from root: mydomain.lvl1.lvl0
     */
    function registerDomain(string calldata domainFullname) public payable {
        MainStorage storage $ = _getMainStorage();

        string[] memory domainLevels = DomainUtils._parseDomainLevels(domainFullname);
        string memory newSubdomainName = domainLevels[domainLevels.length - 1];
        DomainUtils.DomainEntry storage parentEntry = $.rootEntry._findParentDomainEntry(domainLevels);
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
    function withdraw() public {
        MainStorage storage $ = _getMainStorage();

        address payable receiver = payable(msg.sender);
        uint balance = $.shares[msg.sender];
        $.shares[msg.sender] = 0;
        receiver.transfer(balance);
    }

    function _validatePrice(uint requiredPrice) private view {
        if(msg.value < requiredPrice) {
            revert NotEnoughFunds(msg.value, requiredPrice);
        }
    }

    function _validateNewDomain(DomainUtils.DomainEntry storage parentEntry, string memory subdomain) private view {
        if (parentEntry._checkSubdomainExists(subdomain)) revert DuplicateDomain();
    }
}
