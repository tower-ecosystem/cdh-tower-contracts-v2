// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// @title Battle related actions and datastructures
/// @notice you can use this contract for only creating and updating boss and battle
contract WBBData {
    event CreateBattle(address indexed _operatorAddress, string _battleId, string[] _bossIds, uint256 _startTime, uint256 _endTime);
    event UpdateBattle(address indexed _operatorAddress, string _battleId, uint256 _startTime, uint256 _endTime);
    event CreateBoss(address indexed _operatorAddress, string _bossId, string _name, uint256 _maxHp, string _uri);
    event UpdateBoss(address indexed _operatorAddress, string _bossId, string _name, uint256 _maxHp, string _uri);
    event SetBossStatus(address indexed _operator, string _bossId, bool _status);
    event SetBattleStatus(address indexed _operator, string _battleId, bool _status);

    /** @notice Data structure to store the information of a battle.
     *  @field battleId The unique identifier for the battle.
     *  @field bossIds The unique identifier for the bosses in the battle.
     *  @field bossCount The number of bosses in the battle.
     *  @field startTime The time at which the battle starts (in Unix timestamp format).
     *  @field endTime The time at which the battle ends (in Unix timestamp format).
     *  @field status The current status of the battle (true for enabled, false for disabled).
     *  @field index An internal index used to keep track of the battle.
     */
    struct Battle {
        string battleId;
        string[] bossIds;
        uint256 bossCount;
        uint256 startTime;
        uint256 endTime;
        bool status;
        uint index;
    }

    /**
     * @notice Data structure to store the information of a boss.
     * @field bossId The unique identifier for the boss.
     * @field name The name of the boss.
     * @field maxHp The maximum hit points of the boss.
     * @field uri The URI where more information about the boss can be found.
     * @field status The current status of the boss (true for enabled, false for disabled).
     * @field index An internal index used to keep track of the boss.
     */
    struct Boss {
        string bossId;
        string name;
        uint256 maxHp;
        string uri;
        bool status;
        uint256 index;
    }

    /// @notice Mapping of battle data, where the key is the battle's identifier and the value is the battle's data structure.
    mapping(string => Battle) public battles;

    /// @notice An array of all the battle identifiers that have been created.
    string[] public battleList;

    /// @notice Mapping of boss data, where the key is the boss's identifier and the value is the boss's data structure.
    mapping(string => Boss) public bosses;

    /// @notice An array of all the boss identifiers that have been created.
    string[] public bossList;

    /// @notice A mapping of all battle with exists status.
    mapping(string => bool) public battleExists;

    /// @notice A mapping of all bosses with exists status.
    mapping(string => bool) public bossExists;
}
