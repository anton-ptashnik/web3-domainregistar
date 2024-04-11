// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "solidity-stringutils/strings.sol";

error InvalidDomainName();
error ParentDomainDoesNotExists();


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
        bytes1 zero = bytes1("0");
        bytes1 nine = bytes1("9");
        bytes1 dot = bytes1(".");
        bytes memory _bytes = bytes(domain);
        for (uint i = 0; i < _bytes.length; ++i) {
            if (!(
                (_bytes[i] >= a && _bytes[i] <= z) ||
                (_bytes[i] >= zero && _bytes[i] <= nine) ||
                _bytes[i] == dot)) {
                revert InvalidDomainName();
            }
        }
    }

    /**
     * Parse domain fullpath and returns an array of domain levels, starting from the top level 
     * @param domain full domain path, like subtwo.sub.top
     */
    function parseDomainLevels(string memory domain) internal pure returns (string[] memory levels) {
        _validateDomainFullname(domain);

        strings.slice memory sl = domain.toSlice();
        strings.slice memory delim = ".".toSlice();
        uint8 n = uint8(sl.count(delim) + 1);
        levels = new string[](n);
        for(uint i = 0; i < n; ++i) {
            levels[n-i-1] = sl.split(delim).toString();
        }
    }

    /**
     * Checks if a provided domain exists under the self parent domain
     * @param self DomainEntry
     * @param subdomain name of the domain to check
     */
    function hasSubdomain(DomainEntry storage self, string memory subdomain) internal view returns(bool) {
        return self.subdomains[subdomain].owner != address(0);
    }

    /**
     * Search for a DomainEntry under self by domain fullpath
     * @param self DomainEntry to search in
     * @param levels parsed domain fullpath
     * @param targetLevel depth limit 
     */
    function findDomainEntry(DomainEntry storage self, string[] memory levels, uint targetLevel) internal view returns (DomainEntry storage entry) {
        entry = self;
        
        for (uint domainLevel; domainLevel < targetLevel; ++domainLevel) {
            entry = entry.subdomains[levels[domainLevel]];
            if (entry.owner == address(0)) revert ParentDomainDoesNotExists();
        }
    }
}
