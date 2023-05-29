// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ICDHNFTInventory {
    function balanceOf(address owner) external view returns (uint256);
    function safeTransferFrom(address from, address to, uint256 tokenId, uint256 amount, bytes calldata data) external;
    function getAllTokens(address user) external view returns (uint256[] memory);
    function mintBatch(address to, uint256[] memory cardIds, uint256[] memory amounts, bytes memory data)external;
}
