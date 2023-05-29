// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IERC721 {
    function supportsInterface(bytes4 interfaceId) external pure returns (bool);

    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    function ownerOf(uint256 tokenId) external pure returns (address);
}
