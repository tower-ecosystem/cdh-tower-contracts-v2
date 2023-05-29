// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ITowerInventory {
    function balanceOf(address owner) external view returns (uint256);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;
}

