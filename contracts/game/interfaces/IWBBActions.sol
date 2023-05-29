// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of WorldBattleBoss Actions contract
/// @notice this interface is used for interface of Actions to use in WBB main contract
interface IWBBActions {
    function checkBattleExists(string memory _battleId) external view returns (bool);

    function setBattleStatus(string memory _battleId, bool _status) external;

    function createBattle(string memory _battleId, string[] memory _bossIds, uint256 _startTime, uint256 _endTime) external;

    function updateBattle(string memory _battleId, uint256 _startTime, uint256 _endTime) external;

    function checkBattleStatus(string memory _battleId) external view returns (bool);

    function checkBattleEnded(string memory _battleId) external view returns (bool);

    function checkBattleStarted(string memory _battleId) external view returns (bool);

    function getBattlePeriod(string memory _battleId) external view returns (uint256 startTime, uint256 endTime);

    function getLatestBattle() external view returns (string memory battleId);

    function checkBossExists(string memory _bossId) external view returns (bool);

    function setBossStatus(string memory _bossId, bool _status) external;

    function checkActiveBosses(string[] memory _bossId) external;

    function checkBossStatus(string memory _bossId) external view returns (bool);

    function createBoss(string memory bossId, string memory name, uint256 maxHp, string memory uri) external;

    function updateBoss(string memory bossId, string memory name, uint256 maxHp, string memory uri) external;
}
