// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title UsdcToken
/// @author Me
/// @notice USDC contract used to enable buying domains with Usdc
contract UsdcToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("USDC", "USDC") {
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }
}
