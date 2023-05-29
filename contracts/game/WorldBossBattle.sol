// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./WBBActions.sol";

import "./interfaces/IToken.sol";
import "./interfaces/ICDHNFTInventory.sol";
import "./interfaces/IWBBActions.sol";
import "./interfaces/GameStakeOps.sol";
import "./interfaces/IGameAccessControls.sol";

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

error NotEnoughTokens();

/**
 * @title WorldBossBattle, the game will support NFTs for in-game items and stakes the NFTs to join the P2E event.
 * @notice you can use this contract for only staking, un-staking and re-staking the NFTs
 * @dev BattleOps are being inherited in this contract
 */

contract WorldBossBattle is Initializable, ContextUpgradeable, GameStakeOps, PausableUpgradeable, ReentrancyGuardUpgradeable, ERC1155Holder {
    using ECDSA for bytes32;

    /// @notice Event for when setting ERC20 Token contract which emits old token address and new token address along with sender address
    event SetTokenContract(address indexed _oldTokenContract, address indexed _newTokenContract, address _sender);
    /// @notice Event for when setting NFT contract which emits old NFT address and new NFT address along with sender address
    event SetNFTContract(address indexed _oldNFTContract, address indexed _nftContract, address _sender);
    /// @notice Event for setting WBBActions contract Address which emits old WBBActions address and new WBBActions address along with sender address
    event SetWBBActionsAddress(address indexed _oldWBBActionsAddress, address indexed _newWBBActionsAddress, address _sender);
    /// @notice Event for when setting maximum number of token a user can stake which emits old count and new count address along with sender address
    event SetMaxStakeCount(uint256 _maxOldCount, uint256 _maxNewCount, address _sender);
    /// @notice Event for setting cooldown period for user to be able to restake / unstake token
    event SetCoolDownPeriod(uint256 _coolDownPeriod, uint256 _newCoolDownPeriod, address _sender);
    /// @notice Event is emitted when NFT is staked with owner address, token id and in which battle the token is staked
    event NFTStaked(address indexed _nftOwner, uint256 _tokenId, string _battleId, uint256 _stakedTokenTime);
    /// @notice Event is emitted when NFT is un-staked with owner address, token id and in which battle the token is un-staked
    event NFTUnstaked(address indexed _nftReceiver, uint256 _tokenId, string _battleId);
    /// @notice Event is emitted when battle period unstake status is set
    event SetBattlePeriodUnstakeStatus(address indexed setterAddress, bool _status);

    /// @notice to store cdhNFT contract address
    ICDHNFTInventory public cdhNFT;
    /// @notice to store ERC20 token contract
    IToken public tokenAddress;

    IWBBActions public wbbActions;
    IGameAccessControls public accessControls;
    uint256 public lastInteractionTime;

    /// @notice to store data of staker
    struct TokenStaker {
        mapping(string => uint256[]) battleTokenIds;
        mapping(uint256 => uint256) tokenIndex;
        mapping(uint256 => uint256) stakedTokenTime;
        uint256 blockNumber;
    }

    /// @notice List of stakers address
    address[] public stakersAddress;

    /// @notice Mapping for TokenStakers
    mapping(address => TokenStaker) public stakers;

    /// @notice Mapping of tokenId to owner's address
    mapping(uint256 => address) public tokenOwner;

    /// @notice maps tokenId to battleId
    mapping(uint256 => string) public tokenToBattleId;

    ///  to store the cooldownPeriod
    uint256 public cooldownPeriod;

    /// @notice to store the value in which a user can stake
    uint256 public maxStakeCount;

    /// @notice Flag to enable or disable the battle unstake period.
    /// @dev true - unstake after cool down period end, false - unstake after battle ends
    bool public enableBattlePeriodUnstake;

    /// @notice minimum Tokens for staking
    uint256 public minTokensRequired;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Since it is upgradable function it is initialized instead of using constructor
     * @param _cdhNFTAddress Contract address for NFT Inventory,
     * @param _tokenAddress Contract address for ERC20 token
     * @param _maxStakeCount Number of tokens
     * @param _wbbActionsAddress Contract address for WorldBossBattle Actions
     * @param _accessControls Contract address for access controls
     */
    function initialize(
        ICDHNFTInventory _cdhNFTAddress,
        IToken _tokenAddress,
        uint256 _maxStakeCount,
        IWBBActions _wbbActionsAddress,
        IGameAccessControls _accessControls
    ) public initializer {
        cdhNFT = _cdhNFTAddress;
        tokenAddress = _tokenAddress;

        maxStakeCount = _maxStakeCount;
        wbbActions = IWBBActions(_wbbActionsAddress);
        accessControls = IGameAccessControls(_accessControls);

        lastInteractionTime = block.timestamp;
        minTokensRequired = 100;

        __Context_init();
        __Pausable_init();
        __ReentrancyGuard_init();
    }

    modifier whenBattleIsActive(string memory _battleId) {
        require(wbbActions.checkBattleStarted(_battleId), "WBB: not started");
        require(!wbbActions.checkBattleEnded(_battleId), "WBB: battle ended");
        require(wbbActions.checkBattleStatus(_battleId), "WBB: battle not created or active");
        _;
    }

    modifier unstakeValidate(string memory _battleId) {
        require(wbbActions.checkBattleStatus(_battleId), "WBB: battle not created or active");
        if (!enableBattlePeriodUnstake) {
            require(wbbActions.checkBattleEnded(_battleId), "WBB: Battle not ended.");
        }
        _;
    }

    /**
     * @notice function to change the contract address of ERC20 token
     * @param _tokenAddress is the new token address
     * @dev only authorized addresses could change token contract address
     */
    function setToken(address _tokenAddress) external {
        address msgSender = _msgSender();
        require(accessControls.hasManagerRole(msgSender), "WBB: Unauthorized");
        require(_tokenAddress != address(0), "WBB: Invalid token address");

        emit SetTokenContract(address(tokenAddress), _tokenAddress, msgSender);
        tokenAddress = IToken(_tokenAddress);
    }

    /**
     * @notice function to change the contract address of CDH NFT
     * @param _nftContract new NFT address
     * @dev only authorized addresses could change NFT contract address
     */
    function setCDHNFTContractAddress(address _nftContract) external {
        address msgSender = _msgSender();
        require(accessControls.hasManagerRole(msgSender), "WBB: Unauthorized");
        require(_nftContract != address(0), "WBB: Invalid NFT contract");

        emit SetNFTContract(address(cdhNFT), _nftContract, msgSender);
        cdhNFT = ICDHNFTInventory(_nftContract);
    }

    /**
     * @notice Change the WBBActionsContract address that will set WBBActionsContract
     * @param _wbbActionsAddress new wbbActionsContract address
     * @dev only authorized addresses could change WBB Actions contract address
     */
    function setWBBActionsContract(address _wbbActionsAddress) external {
        address msgSender = _msgSender();
        require(accessControls.hasManagerRole(msgSender), "WBB: Unauthorized");
        require(_wbbActionsAddress != address(0), "WBB: Invalid Actions contract");

        emit SetWBBActionsAddress(address(wbbActions), _wbbActionsAddress, msgSender);
        wbbActions = IWBBActions(_wbbActionsAddress);
    }

    /**
     * @notice Check the limit of token that can be staked
     * @param _tokenIds tokenIDs that about to staked
     */
    function validStakeCount(uint256[] memory _tokenIds, string memory _battleId, address _player) public view returns (bool) {
        return (stakers[_player].battleTokenIds[_battleId].length + _tokenIds.length) <= maxStakeCount;
    }

    /**
     * @notice function to set the limit of token that can be staked
     */
    function setMaxStakeCount(uint256 _maxCount) external {
        address msgSender = _msgSender();
        require(accessControls.hasManagerRole(msgSender), "WBB: Unauthorized");
        emit SetMaxStakeCount(maxStakeCount, _maxCount, msgSender);
        maxStakeCount = _maxCount;
    }

    /**
     * @notice to set the cooldown period
     * @param _time in unix
     * @return _time
     */
    function setCoolDownPeriod(uint256 _time) external returns (uint256) {
        address msgSender = _msgSender();
        require(accessControls.hasManagerRole(msgSender), "WBB: Unauthorized");

        emit SetCoolDownPeriod(cooldownPeriod, _time, msgSender);
        cooldownPeriod = _time;
        return cooldownPeriod;
    }

    /**
     * @notice Set the boolean status to enable Battle period stake
     * @param _unstakeStatus boolean
     */
    function setBattlePeriodUnstakeStatus(bool _unstakeStatus) external {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        enableBattlePeriodUnstake = _unstakeStatus;
        emit SetBattlePeriodUnstakeStatus(_msgSender(), _unstakeStatus);
    }

    /**
     * @notice Set the minimum number of tokens required for staking nft in WBB
     * @param _value a uint value for setting minimum tokens required.
     */
    function setMinTokensRequired(uint256 _value) external {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        minTokensRequired = _value;
    }

    /**************************
     *     Game Operations    *
     **************************/

    /**
     * @notice function to get the latest battle that is created
     */
    function latestBattle() public view returns (string memory) {
        return wbbActions.getLatestBattle();
    }

    /**
     * @param _pastBattleId Previous battleID
     * @param _player Address of player checking eligibility of
     * @return boolean if statement is true
     */
    function isEligibleToStake(string memory _pastBattleId, address _player) public view returns (bool) {
        return stakers[_player].battleTokenIds[_pastBattleId].length > 0;
    }

    /**
     * @notice Internal methods for staking operations
     * @param _nftCount how many nft user have
     * @param _balance user ERC20 token balance
     * @return true if he has higher ERC20 token balance than required
     */
    function checkRequiredTokenBalance(uint256 _nftCount, uint256 _balance) public view returns (bool) {
        uint256 requiredBalance = (_nftCount * minTokensRequired) * 10 ** 18;
        return _balance >= requiredBalance;
    }

    /**
     * @notice function to see user stakedTokenTime for specific tokenId
     * @param _player Address of player getting staked time for token
     * @param _tokenId Staked TokenID
     */
    function getStakedTokenTime(address _player, uint256 _tokenId) public view returns (uint256) {
        TokenStaker storage staker = stakers[_player];
        return staker.stakedTokenTime[_tokenId];
    }

    /// STAKE Operations

    /**
     * @notice function to get all the token that a address has in the Inventory contract
     * @param _player Address of the player to get all tokens
     */
    function getAllToken(address _player) public view returns (uint256[] memory) {
        uint256[] memory allTokens = cdhNFT.getAllTokens(_player);
        return allTokens;
    }

    /**
     * @notice Function to stake a single CDHNFT that sender owns
     * @param _tokenId TokenID of CDH NFT
     * @param _battleId is unique battle in which the NFT will be staked
     * @dev it calls internalStake function for further processing
     */
    function stake(uint256 _tokenId, string memory _battleId) external override whenBattleIsActive(_battleId) {
        internalStake(_msgSender(), _tokenId, _battleId);
        ICDHNFTInventory(cdhNFT).safeTransferFrom(_msgSender(), address(this), _tokenId, 1, "0x");
    }

    /**
     * @notice Function to stake a array of CDH NFT that sender owns
     * @param tokenIds is an array of tokenId of CDH NFT
     * @param _battleId is unique battle in which the NFT will be staked
     * @dev it calls internalStake function for further processing
     */
    function stakeTokens(uint256[] memory tokenIds, string memory _battleId) external override whenBattleIsActive(_battleId) {
        address player = _msgSender();
        require(validStakeCount(tokenIds, _battleId, player), "WBB: Max tokens staked.");
        uint256[] memory tokenAmounts = new uint256[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            internalStake(player, tokenIds[i], _battleId);
            tokenAmounts[i] = 1;
        }
        ICDHNFTInventory(cdhNFT).safeBatchTransferFrom(player, address(this), tokenIds, tokenAmounts, "0x");
    }

    /**
     * @notice internal function where actual staking works
     * @param _player is address of a user
     * @param _tokenId is tokenId that user have
     * @param _battleId in which the token id will be staked
     */
    function internalStake(address _player, uint256 _tokenId, string memory _battleId) internal whenNotPaused nonReentrant {
        TokenStaker storage staker = stakers[_player];

        uint256[] memory existingStakedTokens = staker.battleTokenIds[_battleId];
        uint256 existingStakedTokensCount = existingStakedTokens.length;

        uint256 tokenBalance = tokenAddress.balanceOf(_player);

        if (checkRequiredTokenBalance(existingStakedTokensCount + 1, tokenBalance)) {
            staker.blockNumber = block.number;
            staker.battleTokenIds[_battleId].push(_tokenId);
            staker.tokenIndex[_tokenId] = staker.battleTokenIds[_battleId].length - 1;
            staker.stakedTokenTime[_tokenId] = block.timestamp;
            tokenOwner[_tokenId] = _player;
            tokenToBattleId[_tokenId] = _battleId;

            if (existingStakedTokensCount == 0) {
                stakersAddress.push(_player);
            }

            emit NFTStaked(_player, _tokenId, _battleId, block.timestamp);
        } else {
            revert NotEnoughTokens();
        }
    }

    /**
     * @notice Get all the tokens staked by user in the battleId
     * @param _player is the user address
     */
    function getStakedTokensForBattle(address _player, string memory _battleId) public view returns (uint256[] memory tokenIds) {
        return stakers[_player].battleTokenIds[_battleId];
    }

    /// UN-STAKE Operations

    /**
     * @notice public function to unstake a single CDHNFT that sender owns
     * @param _tokenId TokenId of CDH NFT
     * @param _battleId is unique battle from which the NFT will be unstaked
     * @dev Calls internalUnStake function for unstaking tokens
     */
    function unstake(uint256 _tokenId, string memory _battleId) external override unstakeValidate(_battleId) {
        address player = _msgSender();
        internalUnstake(player, _tokenId, _battleId);
        ICDHNFTInventory(cdhNFT).safeTransferFrom(address(this), player, _tokenId, 1, "0x");
    }

    /**
     * @notice public function to unstake all CDHNFT that sender owns
     * @param _battleId is unique battle in which the NFT will be unstaked
     * @dev it calls internalUnStakeAll function for further processing
     */
    function unstakeAll(string memory _battleId) external override unstakeValidate(_battleId) {
        address player = _msgSender();
        internalUnstakeAll(player, _battleId);
    }

    /**
     * @notice public function to unstake an array of  CDHNFT that sender owns
     * @param tokenIds is tokenId of CDHNFT
     * @param _battleId is unique battle in which the NFT will be unstaked
     * @dev it calls internalUnStake function for further processing
     */
    function unstakeTokens(uint256[] memory tokenIds, string memory _battleId) external override unstakeValidate(_battleId) {
        address player = _msgSender();
        uint256[] memory tokenAmounts = new uint256[](tokenIds.length);
        for (uint i = 0; i < tokenIds.length; i++) {
            internalUnstake(player, tokenIds[i], _battleId);
            tokenAmounts[i] = 1;
        }
        ICDHNFTInventory(cdhNFT).safeBatchTransferFrom(address(this), player, tokenIds, tokenAmounts, "0x");
    }

    /**
     * @notice internal function where actual unstaking works
     * @param _player is address of a user
     * @param _tokenId is tokenid that user staked
     * @param _battleId in which the token id will be unstaked
     */
    function internalUnstake(address _player, uint256 _tokenId, string memory _battleId) internal nonReentrant {
        require(tokenOwner[_tokenId] == _player, "WBB: Unauthorized.");

        require(keccak256(bytes(tokenToBattleId[_tokenId])) == keccak256(bytes(_battleId)), "WBB: Card not staked in given battle");

        TokenStaker storage staker = stakers[_player];

        if (enableBattlePeriodUnstake) {
            require(
                block.timestamp > (staker.stakedTokenTime[_tokenId] + cooldownPeriod) && !wbbActions.checkBattleEnded(_battleId),
                "WBB: cooldown not over"
            );
        }

        uint256 tokenIdIndex = staker.tokenIndex[_tokenId];
        uint256 battleTokenIdsLength = staker.battleTokenIds[_battleId].length;

        uint256 tokenBalance = tokenAddress.balanceOf(_player);
        require(checkRequiredTokenBalance(battleTokenIdsLength, tokenBalance), "WBB: Insufficient token balance");

        uint256 lastBattleTokenId = staker.battleTokenIds[_battleId][battleTokenIdsLength - 1];
        staker.battleTokenIds[_battleId].pop();
        if (staker.battleTokenIds[_battleId].length > 0) {
            if (lastBattleTokenId != _tokenId) {
                staker.battleTokenIds[_battleId][tokenIdIndex] = lastBattleTokenId;
                staker.tokenIndex[lastBattleTokenId] = tokenIdIndex;
                delete staker.tokenIndex[_tokenId];
            }
        }
        staker.stakedTokenTime[_tokenId] = 0;

        if (staker.battleTokenIds[_battleId].length == 0) {
            address lastStakerAddress = stakersAddress[stakersAddress.length - 1];
            stakersAddress.pop();
            if (stakersAddress.length > 0) {
                uint256 stakerIndex = 0;
                for (uint256 i = 0; i < stakersAddress.length; i++) {
                    if (stakersAddress[i] == _player) {
                        stakerIndex = i;
                        break;
                    }
                }
                stakersAddress[stakerIndex] = lastStakerAddress;
            }
        }
        delete tokenOwner[_tokenId];
        delete tokenToBattleId[_tokenId];

        emit NFTUnstaked(_player, _tokenId, _battleId);
    }

    /**
     * @notice internal function for unstaking all the tokens
     * @param _player is address of a user
     * @param _battleId in which the token id will be unstaked
     */
    function internalUnstakeAll(address _player, string memory _battleId) internal {
        uint256[] memory stakedToken = stakers[_player].battleTokenIds[_battleId];
        uint256 nftCounts = stakedToken.length;
        uint256[] memory tokenAmounts = new uint256[](stakedToken.length);
        require(nftCounts > 0, "WBB: NFTs aren't staked");
        for (uint i = 0; i < nftCounts; i++) {
            internalUnstake(_player, stakedToken[i], _battleId);
            tokenAmounts[i] = 1;
        }
        ICDHNFTInventory(cdhNFT).safeBatchTransferFrom(address(this), _player, stakedToken, tokenAmounts, "0x");
    }

    /**
     * @notice internal function where unstaking works for batch
     * @param _player is address of a user
     * @param _tokenIds is tokenid that user have
     * @param _battleId in which the token id will be unstaked
     */
    function internalUnstakeBatch(address _player, uint256[] memory _tokenIds, string memory _battleId) internal {
        uint256[] memory tokenAmounts = new uint256[](_tokenIds.length);
        for (uint i = 0; i < _tokenIds.length; i++) {
            internalUnstake(_player, _tokenIds[i], _battleId);
            tokenAmounts[i] = 1;
        }
        ICDHNFTInventory(cdhNFT).safeBatchTransferFrom(address(this), _player, _tokenIds, tokenAmounts, "0x");
    }

    /**
     * @notice Internal function to unstake all CDHNFT that sender owns
     * @param _battleId unique battle in which the NFT will be unstaked
     * @param _player the address of a user which nft will be unstaked
     * @dev it calls internalUnStakeAll function for further processing
     */
    function unstakeAllInternal(address _player, string memory _battleId) external unstakeValidate(_battleId) {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        internalUnstakeAll(_player, _battleId);
    }

    /**
     * @notice Internal function to unstake tokens CDHNFT that sender owns
     * @param _battleId unique battle in which the NFT will be unstaked
     * @param _tokenIds tokenid that user staked
     * @param _player the address of a user which nft will be unstaked
     * @dev it calls internalUnStakeAll function for further processing
     */
    function unstakeTokensInternal(address _player, uint256[] memory _tokenIds, string memory _battleId) external unstakeValidate(_battleId) {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        internalUnstakeBatch(_player, _tokenIds, _battleId);
    }

    /**
     * @notice Pause contract so users wont be able to stake new tokens
     */
    function pause() external {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        _pause();
    }

    /**
     * @notice UnPause contract so users be able to stake new tokens again
     */
    function unpause() external {
        require(accessControls.hasManagerRole(_msgSender()), "WBB: Unauthorized");
        _unpause();
    }
}
