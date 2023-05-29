// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./WBBData.sol";
import "./interfaces/IGameAccessControls.sol";

contract WBBActions is Initializable, ContextUpgradeable, WBBData {
    IGameAccessControls public accessControls;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IGameAccessControls _accessControls) public initializer {
        accessControls = IGameAccessControls(_accessControls);
    }

    /*
        ---------------------------------------
        ╔╗ ┌─┐┌┬┐┌┬┐┬  ┌─┐  ╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
        ╠╩╗├─┤ │  │ │  ├┤   ╠═╣│   │ ││ ││││└─┐
        ╚═╝┴ ┴ ┴  ┴ ┴─┘└─┘  ╩ ╩└─┘ ┴ ┴└─┘┘└┘└─┘
        ---------------------------------------
    */

    function checkBattleExists(string memory _battleId) public view returns (bool) {
        return battleExists[_battleId];
    }

    function setBattleStatus(string memory _battleId, bool _status) external {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to set battle status");
        require(checkBattleExists(_battleId), "WBB: Battle doesn't exist");
        Battle storage battleInstance = battles[_battleId];
        battleInstance.status = _status;
        emit SetBattleStatus(operatorAddress, _battleId, _status);
    }

    /**
     * @notice function to create battle requires battleId and bossId, starting time and ending time
     * @param _battleId which is a string and identify battles,
     * @param _bossIds which is an array of string,
     * @param _startTime and
     * @param _endTime are unix timestamp
     */
    function createBattle(string memory _battleId, string[] memory _bossIds, uint256 _startTime, uint256 _endTime) external {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to create battle");
        require(!checkBattleExists(_battleId), "WBB: Battle already Exists");
        require(_endTime > _startTime, "WBB: invalid battle period");

        Battle storage battleInstance = battles[_battleId];
        battleInstance.battleId = _battleId;
        battleInstance.startTime = _startTime;
        battleInstance.endTime = _endTime;
        battleInstance.status = true;
        battleInstance.bossCount = _bossIds.length;
        battleList.push(_battleId);
        battleExists[_battleId] = true;

        battleInstance.index = battleList.length - 1;
        for (uint i = 0; i < _bossIds.length; i++) {
            require(checkBossStatus(_bossIds[i]), "WBB: boss not created");
            battleInstance.bossIds.push(_bossIds[i]);
        }
        emit CreateBattle(operatorAddress, _battleId, _bossIds, _startTime, _endTime);
    }

    /**
     * @notice function to update battle requires battleId, bossId, starting time and ending time along with battle status.
     *         Note: 1. Battle should be inactive to be able to update.
     *               2. If battle should be updated with new bosses or updated boss, new battle SHOULD be created
     * @param _battleId which is a string and identify battles,
     * @param _startTime and
     * @param _endTime are unix timestamp
     */
    function updateBattle(string memory _battleId, uint256 _startTime, uint256 _endTime) external {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to update battle");
        require(checkBattleExists(_battleId), "WBB: Battle doesn't exists");
        require(!battles[_battleId].status, "WBB: Battle is active");
        require(_endTime > _startTime, "WBB: invalid battle period");

        Battle storage battleInstance = battles[_battleId];
        require(block.timestamp < battleInstance.endTime, "WBB: battle already ended");

        battleInstance.startTime = _startTime;
        battleInstance.endTime = _endTime;

        emit UpdateBattle(operatorAddress, _battleId, _startTime, _endTime);
    }

    /// @notice function to check the battleStatus i.e true or false
    /// @param _battleId its a string
    function checkBattleStatus(string calldata _battleId) public view returns (bool) {
        require(checkBattleExists(_battleId), "WBB: Battle doesn't exists");
        return battles[_battleId].status;
    }

    /// @notice to check the battle Ended or not i.e true or false
    /// @param _battleId its a string
    function checkBattleEnded(string calldata _battleId) public view returns (bool) {
        return block.timestamp > battles[_battleId].endTime;
    }

    /// @notice to check the battle Started or not i.e true or false
    /// @param _battleId its a string
    function checkBattleStarted(string calldata _battleId) public view returns (bool) {
        return block.timestamp > battles[_battleId].startTime;
    }

    /// @notice gives the end time of an battle in unix
    /// @param _battleId which is in string format
    function getBattlePeriod(string calldata _battleId) public view returns (uint256 startTime, uint256 endTime) {
        return (battles[_battleId].startTime, battles[_battleId].endTime);
    }

    /// @notice return the last created battle
    function getLatestBattle() public view returns (string memory battleId) {
        return battleList[battleList.length - 1];
    }

    /// @notice return the list of all bosses
    function getAllBattle() public view returns (string[] memory) {
        return battleList;
    }

    /*
        ---------------------------------
        ╔╗ ┌─┐┌─┐┌─┐  ╔═╗┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
        ╠╩╗│ │└─┐└─┐  ╠═╣│   │ ││ ││││└─┐
        ╚═╝└─┘└─┘└─┘  ╩ ╩└─┘ ┴ ┴└─┘┘└┘└─┘
        ---------------------------------
    */

    function checkBossExists(string memory _bossId) public view returns (bool) {
        return bossExists[_bossId];
    }

    function setBossStatus(string memory _bossId, bool _status) external {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to update boss status");
        require(checkBossExists(_bossId), "WBB: Boss doesn't exist");
        Boss storage bossInstance = bosses[_bossId];
        bossInstance.status = _status;
        emit SetBossStatus(operatorAddress, _bossId, _status);
    }

    /// @notice checks the boss is available or not
    /// @param _bossId is should be given as parameter
    function checkBossStatus(string memory _bossId) public view returns (bool) {
        return bosses[_bossId].status;
    }

    /**
     * @notice Method to create a new boss.
     * @param bossId which is a string and identify boss,
     * @param name which is name of string,
     * @param maxHp is uint that have boss health and
     * @param uri is a string
     */
    function createBoss(string calldata bossId, string calldata name, uint256 maxHp, string calldata uri) public {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to create boss");
        require(!checkBossExists(bossId), "WBB: Boss already Exists");

        Boss storage bossInstance = bosses[bossId];

        bossInstance.bossId = bossId;
        bossInstance.name = name;
        bossInstance.maxHp = maxHp;
        bossInstance.uri = uri;
        bossInstance.status = true;
        bossList.push(bossId);
        bossExists[bossId] = true;

        bossInstance.index = bossList.length - 1;
        emit CreateBoss(operatorAddress, bossId, name, maxHp, uri);
    }

    /**
     * @notice function to update the boss character
     * @param bossId which is a string and identify boss,
     * @param name which is name of string,
     * @param maxHp is uint that have boss health and
     * @param uri is a string
     */
    function updateBoss(string calldata bossId, string calldata name, uint256 maxHp, string calldata uri) public {
        address operatorAddress = msg.sender;
        require(accessControls.hasManagerRole(operatorAddress), "WBB: Unauthorized to update boss");
        require(checkBossExists(bossId), "WBB: Boss doesn't exist");

        Boss storage bossInstance = bosses[bossId];
        require(!bossInstance.status, "WBB: Boss is active");

        bossInstance.bossId = bossId;
        bossInstance.name = name;
        bossInstance.maxHp = maxHp;
        bossInstance.uri = uri;

        emit UpdateBoss(operatorAddress, bossId, name, maxHp, uri);
    }

    /// @notice return the list of all bosses
    function getAllBosses() public view virtual returns (string[] memory) {
        return bossList;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] __gap;
}
