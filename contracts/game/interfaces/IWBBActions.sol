// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of WorldBattleBoss Actions contract
/// @notice this interface is used for interface of Actions to use in WBB main contract
interface IWBBActions {
    function checkBattleExists(string calldata _battleId) external view returns (bool);

    function setBattleStatus(string calldata _battleId, bool _status) external;

    function createBattle(string calldata _battleId, string[] memory _bossIds, uint256 _startTime, uint256 _endTime) external;

    function updateBattle(string calldata _battleId, uint256 _startTime, uint256 _endTime) external;

    function checkBattleStatus(string calldata _battleId) external view returns (bool);

    function checkBattleEnded(string calldata _battleId) external view returns (bool);

    function checkBattleStarted(string calldata _battleId) external view returns (bool);

    function getBattlePeriod(string calldata _battleId) external view returns (uint256 startTime, uint256 endTime);

    function getLatestBattle() external view returns (string calldata battleId);

    function checkBossExists(string calldata _bossId) external view returns (bool);

    function setBossStatus(string calldata _bossId, bool _status) external;

    function checkActiveBosses(string[] memory _bossId) external;

    function checkBossStatus(string calldata _bossId) external view returns (bool);

    function createBoss(string calldata bossId, string calldata name, uint256 maxHp, string calldata uri) external;

    function updateBoss(string calldata bossId, string calldata name, uint256 maxHp, string calldata uri) external;
}
