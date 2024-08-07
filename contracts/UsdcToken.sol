// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title UsdcToken
/// @author Me
/// @notice USDC contract used to enable buying domains with Usdc
contract UsdcToken is ERC20, Ownable {
    constructor(uint256 initialSupply) ERC20("USDC", "USDC") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 value) external onlyOwner {
        _mint(to, value);
    }

    // override parent impl to emit Approval with remaining coins left after transfer
    function transferFrom(address from, address to, uint256 value) public override returns (bool) {
        bool ok = super.transferFrom(from, to, value);
        address spender = _msgSender();
        uint256 newAllowance = allowance(from, spender);
        emit Approval(from, spender, newAllowance);
        return ok;
    }
}
