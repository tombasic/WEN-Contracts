// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Dependencies/AggregatorV3Interface.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/SafeMath.sol";
import "./Dependencies/IBaseOracle.sol";

contract ChainlinkAssetPriceOracle is AggregatorV3Interface, Ownable {
    using SafeMath for uint;

    uint8 private decimals_;
    string private description_;
    IBaseOracle public baseOracle;

    address public asset;

    struct RoundData {
        uint80 roundId;
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    constructor(
        uint8 _decimals,
        string memory _description,
        IBaseOracle _baseOracle,
        address _asset) public {
        require(_asset != address(0), "AssetPriceOracle: asset address is zero");
        decimals_ = _decimals;
        description_ = _description;
        baseOracle = _baseOracle;
        asset = _asset;
    }

    function decimals() external view override returns (uint8) {
        return decimals_;
    }

    function description() external view override returns (string memory) {
        return description_;
    }

    function version() external view override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80 _roundId) public
    view override
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        roundId = _roundId;
        (uint price, uint updateAt, ) = baseOracle.getPriceInfo(asset);
        startedAt = 0;
        updatedAt = updateAt;

        if (decimals_ < 18) {
            answer = int(price.div(10 ** (18 - uint(decimals_))));
        } else if (decimals_ > 18) {
            answer = int(price.mul(10 ** (uint(decimals_) - 18)));
        } else {
            answer = int(price);
        }

        answeredInRound = roundId;
    }

    function latestRoundData()
    external
    view override
    returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return getRoundData(100);
    }

    function setBaseOracle(IBaseOracle _baseOracle) external onlyOwner {
        baseOracle = _baseOracle;
    }
}
