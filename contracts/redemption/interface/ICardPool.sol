// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface ICardPool {
     function identifier() external pure returns (bytes1);
     function numberOfCardsByRarity(bytes1 rarity) external view returns (uint256);
     function getCardIdByRarity(bytes1 rarity, uint256 index) external view returns (uint256);
     function exists(uint256 cardId) external view returns (bool);

}
