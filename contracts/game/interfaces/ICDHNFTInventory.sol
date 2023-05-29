// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of CDH Inventory NFT
/// @notice this is used to help interact with real CDH Inventory
interface ICDHNFTInventory {
    function balanceOf(address owner) external view returns (uint256);

    function safeTransferFrom(address from, address to, uint256 tokenId, uint256 amount, bytes calldata data) external;

    function safeBatchTransferFrom(address from, address to, uint256[] memory tokenId, uint256[] memory amount, bytes calldata data) external;

    function getAllTokens(address user) external view returns (uint256[] memory);
}
