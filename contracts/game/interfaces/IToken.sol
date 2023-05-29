// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of CDH Tower token
/// @notice this is used to help interact with real tower token
interface IToken {
    function balanceOf(address owner) external view returns (uint256);

    function safeTransferFrom(address from, address to, uint256 amount) external;
}
