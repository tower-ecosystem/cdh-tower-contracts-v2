// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IERC1155 {
    function supportsInterface(bytes4 interfaceId) external pure returns (bool);

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external;

    function balanceOf(address account, uint256 id) external returns (uint256);
}
