// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of worldBattleBoss contract
/// @notice this interface is used in main contract
/// @dev all the funtion present here might be overridden
interface GameStakeOps {
    function stake(uint256 _tokenId, string calldata _battleId) external;

    function stakeTokens(uint256[] memory _tokenIds, string calldata _battleId) external;

    function unstake(uint256 _tokenId, string calldata _battleId) external;

    function unstakeAll(string calldata _battleId) external;

    function unstakeTokens(uint256[] memory _tokenIds, string calldata _battleId) external;
}
