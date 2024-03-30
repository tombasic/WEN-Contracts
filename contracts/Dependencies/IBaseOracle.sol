// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface IBaseOracle {
    function getPriceInfo(address asset) external view returns (uint price, uint updatedAt, address reportedBy);
}