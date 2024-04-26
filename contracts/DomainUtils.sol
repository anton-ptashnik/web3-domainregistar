// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "solidity-stringutils/strings.sol";


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
        uint256 usdcDomainPrice;

        /// @notice Domain name
        string domainName;

        /// @notice Collection of subdomains
        mapping (string => DomainEntry) subdomains;
    }

    /**
     * Check if a given string represents a valid domain name
     * @param domain string to check
     */
    function isValidDomainName(string calldata domain) internal pure returns (bool) {
        bytes1 a = bytes1("a");
        bytes1 z = bytes1("z");
        bytes1 zero = bytes1("0");
        bytes1 nine = bytes1("9");
        bytes1 dot = bytes1(".");
        bytes memory _bytes = bytes(domain);
        for (uint256 i = 0; i < _bytes.length; ++i) {
            if (!(
                (_bytes[i] >= a && _bytes[i] <= z) ||
                (_bytes[i] >= zero && _bytes[i] <= nine) ||
                _bytes[i] == dot)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Parse domain fullpath and returns an array of domain levels, starting from the top level 
     * @param domain full domain path, like subtwo.sub.top
     */
    function parseDomainLevels(string calldata domain) internal pure returns (string[] memory levels) {
        strings.slice memory sl = domain.toSlice();
        strings.slice memory delim = ".".toSlice();
        uint8 n;
        if (!sl.empty()) n = uint8(sl.count(delim) + 1);
        levels = new string[](n);
        for(uint256 i = 0; i < n; ++i) {
            levels[n-i-1] = sl.split(delim).toString();
        }
    }

    /**
     * Search for a DomainEntry under self by domain fullpath
     * @param self DomainEntry to search in
     * @param levels parsed domain fullpath
     * @param targetLevel depth limit 
     */
    function findDomainEntry(DomainEntry storage self, string[] memory levels, uint256 targetLevel) internal view returns (DomainEntry storage entry) {
        entry = self;
        
        for (uint256 domainLevel; domainLevel < targetLevel; ++domainLevel) {
            entry = entry.subdomains[levels[domainLevel]];
            if (entry.owner == address(0)) break;
        }
    }

    /**
     * Check if a given DomainEntry is registered / owned by anyone
     * @param self DomainEntry to check
     */
    function exists(DomainEntry storage self) internal view returns (bool) {
        return self.owner != address(0);
    }
}
