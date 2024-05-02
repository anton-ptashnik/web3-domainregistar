// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.25;

import { AggregatorV3Interface } from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/// @title UsdcEthDataFeed
/// @author Me
/// @notice Stub Datafeed contract for USDC to ETH
contract UsdcEthDataFeed is AggregatorV3Interface, Ownable {
    int256 rate;
    constructor(int256 initialRate) Ownable(msg.sender) {
        rate = initialRate;
    }

    function decimals() external view returns (uint8) {
        return 18;
    }

    function description() external view returns (string memory) {
        return "Stub USDC to ETH Data feed";
    }

    function version() external view returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {}

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        answer = rate;
    }

    /**
     * Admin func to imitate a live contract by allowing owner to update USDC to ETH rate
     * @param newRate new USDC to ETH rate
     */
    function updateRate(int256 newRate) external onlyOwner {
        rate = newRate;
    }
}
