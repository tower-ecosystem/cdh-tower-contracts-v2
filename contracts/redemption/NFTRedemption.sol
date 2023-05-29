// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

error PoolNotFound();

import "./interface/ICDHNFTInventory.sol";
import "./interface/ITowerInventory.sol";
import "./interface/ICardPool.sol";

import "./constants/Constants.sol";

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "hardhat/console.sol";

contract NFTRedemption is Ownable, Pausable {
    using ECDSA for bytes32;

    // @dev Interface for interacting with the NFT inventory.
    ICDHNFTInventory public cdhNFT;
    // @dev Interface for interacting with the tower inventory.
    ITowerInventory public towerInventory;
    // @dev Interface for interacting with the equipment card pool.
    ICardPool public equipmentPool;
    // @dev Interface for interacting with the hero card pool.
    ICardPool public heroPool;
    // @dev Interface for interacting with the spell card pool.
    ICardPool public spellPool;
    // @dev Interface for interacting with the tower card pool.
    ICardPool public towerPool;
    // @dev Address of the contract responsible for destroying NFTs.
    address public blackHoleAddress;
    // @dev Address of the contract responsible for generating random numbers.
    address public randomNumberSigner;

    // @dev Total number of pools being handled while chests are opened
    uint8 public constant NUMBER_OF_POOLS = 4;

    // @dev Seed Nonce value for a address
    mapping(address => uint256) public seedNonce;

    // @dev Enumeration of the possible ticket types.
    enum TicketType {
        UNKNOWN_TICKET,
        GOLD_TICKET,
        SILVER_TICKET,
        BRONZE_TICKET
    }

    event SetRandomNumberSenderAddress(address oldSender, address newSender);
    event SetBlackHoleAddress(address oldblackHoleAddress, address newblackHoleAddress);
    event TicketRedemption(address indexed sender, uint256 quantity, uint256[] cards, TicketType ticketType, uint256 ticketCount);

    /**
     * @notice NFTRedemption has multiple parameters while deployment
     * @param _cdhNft Contract Address for TOWER Battle Cards Inventory contract
     * @param _towerInventory Contract Address for TOWER Treasury Inventory contract
     * @param _equipmentPool Contract Address for Equipment Pool
     * @param _heroPool Contract Address for Hero Pool
     * @param _spellPool Contract Address for Spell Pool
     * @param _towerPool Contract Address for Tower Pool
     * @param _blackHoleAddress Contract Address for BlackHole contract
     * @param _randomNumberSigner Random Number sender wallet for signing message
     */
    constructor(
        address _cdhNft,
        address _towerInventory,
        address _equipmentPool,
        address _heroPool,
        address _spellPool,
        address _towerPool,
        address _blackHoleAddress,
        address _randomNumberSigner
    ) {
        equipmentPool = ICardPool(_equipmentPool);
        heroPool = ICardPool(_heroPool);
        spellPool = ICardPool(_spellPool);
        towerPool = ICardPool(_towerPool);
        cdhNFT = ICDHNFTInventory(_cdhNft);
        towerInventory = ITowerInventory(_towerInventory);
        blackHoleAddress = _blackHoleAddress;
        randomNumberSigner = _randomNumberSigner;
    }

    /**
     * @notice Set wallet address used for generating random number and sign from backend
     * @dev This is the trusted setup for generating random number and signing the value through the wallet.
     * @param _newSigner New Random Number sender wallet, for signing message
     */
    function setRandomNumberSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "NFTRedemption: Invalid signer");

        emit SetRandomNumberSenderAddress(randomNumberSigner, _newSigner);
        randomNumberSigner = _newSigner;
    }

    /**
     * @notice  Address that acts as burner for tokens that will be burnt in polygon network
     * @dev BlackHole address should not be 0x00
     * @param _newBlackHoleAddress Address of new BlackHole Address or burner Address
     */
    function setBlackHoleAddress(address _newBlackHoleAddress) external onlyOwner {
        require(_newBlackHoleAddress != address(0), "NFTRedemption: Invalid Address");

        emit SetBlackHoleAddress(blackHoleAddress, _newBlackHoleAddress);
        blackHoleAddress = _newBlackHoleAddress;
    }

    /**
     * @notice Generate Base Seed for the sender while opening chest, generated using random number signed value from backend
     * @dev Nonce value for a sender is stored for maintaining uniqueness in contract itself as well and is used in backend
     *      while generating random number for the user
     * @param _sender Address that requested random number
     * @param _quantity Number of tickets to redeem
     * @param _ticketType Type of ticket for which the seed is being generated.
     * @param _sig Signature of the message hash.
     * @return The generated base seed.
     */
    function _generateBaseSeed(address _sender, uint256 _quantity, TicketType _ticketType, bytes memory _sig) internal returns (bytes32) {
        uint256 nonce = seedNonce[_sender];
        bytes32 hash = keccak256(abi.encodePacked(_sender, address(this), _quantity, uint256(_ticketType), nonce));
        require(hash.toEthSignedMessageHash().recover(_sig) == randomNumberSigner, "NFTRedemption: invalid signature");
        seedNonce[_sender]++;
        return keccak256(abi.encodePacked(_sig));
    }

    /**
     * @notice Address of pool contracts based on identifier of pool
     * @dev Constants are defined for each Pool Identifiers
     * @param _category Category is the Identifier of pools
     * @return Returns Address of respective pool contracts
     */
    function _getPool(bytes1 _category) internal view returns (address) {
        if (_category == Constants.EQUIPMENT_POOL_IDENTIFIER) return address(equipmentPool);
        else if (_category == Constants.HERO_POOL_IDENTIFIER) return address(heroPool);
        else if (_category == Constants.SPELL_POOL_IDENTIFIER) return address(spellPool);
        else if (_category == Constants.TOWER_POOL_IDENTIFIER) return address(towerPool);
        else revert PoolNotFound();
    }

    /**
     * @dev Returns the number of redeemable cards for a given ticket type.
     * @param _ticketType Type of ticket.
     * @return Number of redeemable cards.
     */
    function numberOfRedeemableCards(TicketType _ticketType) internal pure returns (uint256) {
        if (_ticketType == TicketType.GOLD_TICKET) {
            return 5;
        } else if (_ticketType == TicketType.SILVER_TICKET) {
            return 4;
        } else if (_ticketType == TicketType.BRONZE_TICKET) {
            return 3;
        }
        return 0;
    }

    /**
     * @dev Returns the rarity of a card for a given ticket type.
     * @param _ticketType Type of ticket.
     * @param _rarityProb Random probabilistic value for Rarity
     * @param _counter Card index for the ticket redemption.
     * @return rarity Rarity of the card.
     */
    function getRarityForTicket(TicketType _ticketType, uint256 _rarityProb, uint256 _counter) internal pure returns (bytes1 rarity) {
        if (_ticketType == TicketType.GOLD_TICKET) {
            rarity = _getProbabilisticRarityGold(_rarityProb, _counter);
        } else if (_ticketType == TicketType.SILVER_TICKET) {
            rarity = _getProbabilisticRaritySilver(_rarityProb, _counter);
        } else {
            rarity = _getProbabilisticRarityBronze(_rarityProb, _counter);
        }
    }

    /**
     * @dev Returns the random cardId generated for specific card index using the random base seed for the ticket type
     * @param _baseSeed Base seed for generating the card ID.
     * @param _ticketType Type of ticket.
     * @param i Iteration number.
     * @param _counter Card index for the ticket redemption.
     * @return randomly generated Card ID for token
     */
    function generateCardId(bytes32 _baseSeed, TicketType _ticketType, uint256 i, uint256 _counter) public view returns (uint256) {
        bytes32 poolSeed = keccak256(abi.encodePacked("POOL", _baseSeed, i, _counter));
        bytes1 poolId = bytes1(bytes32(((uint256(poolSeed) % NUMBER_OF_POOLS) + 1) << 248));
        address poolAddress = _getPool(poolId);
        ICardPool pool = ICardPool(poolAddress);

        bytes32 raritySeed = keccak256(abi.encodePacked("RARITY", poolSeed));
        uint256 rarityProb = (uint256(raritySeed) % 100) + 1;

        bytes1 rarityOfTicket = getRarityForTicket(_ticketType, rarityProb, _counter);

        uint256 totalCardsByRarity = pool.numberOfCardsByRarity(rarityOfTicket);
        uint256 cardIndex = uint256(keccak256(abi.encodePacked("CARD", raritySeed))) % totalCardsByRarity;
        uint256 cardId = pool.getCardIdByRarity(rarityOfTicket, cardIndex);
        return cardId;
    }

    /**
     * @notice Main method for opening chest, this has provision of handling multiple chests at once. Random number signature
     *         is passed for base random seed.
     * @dev Meta Transactions are processed for this open() method.
     *      On opening chest/s, transfer the chest token from owner's wallet to blackhole contract for locking the token.
     *      `BaseSeed` is generated with `_generateBaseSeed()` method and other random seed for pool and rarity selection
     *      is also generated based on that base seed, to ensure high accuracy random values and signature.
     *      Methods in pools are called through this method for getting Card Ids from each data pool of each category.
     * @param _ticketType this defines how many number of opener card will be there
     * @param _quantity Number of tower chest tokens
     * @param _sig Random Number signature generated from backend for random seed
     */
    function redeemTicket(TicketType _ticketType, uint256 _quantity, bytes memory _sig) external whenNotPaused {
        address redeemAddress = msg.sender;
        require(_quantity > 0, "NFTRedemption: should be greater than 0");
        require(redeemAddress != address(0), "NFTRedemption: Invalid redeem address");

        ITowerInventory(towerInventory).safeTransferFrom(redeemAddress, blackHoleAddress, uint256(_ticketType), _quantity, "0x00");

        uint256 noOfRedeemableCards = numberOfRedeemableCards(_ticketType);
        bytes32 baseSeed = _generateBaseSeed(redeemAddress, _quantity, _ticketType, _sig);

        uint256[] memory idBatch = new uint256[](_quantity * noOfRedeemableCards);
        uint256[] memory amountBatch = new uint256[](_quantity * noOfRedeemableCards);

        uint256 inner = 0;
        uint256 outer = 0;

        for (uint256 i = 1; i <= _quantity; i++) {
            for (uint256 counter = 1; counter <= noOfRedeemableCards; counter++) {
                uint256 cardId = generateCardId(baseSeed, _ticketType, i, counter);

                idBatch[inner + outer] = cardId;
                amountBatch[inner + outer] = 1;
                inner++;
            }
            inner--;
            outer++;
        }

        ICDHNFTInventory(cdhNFT).mintBatch(redeemAddress, idBatch, amountBatch, "0x00");
        emit TicketRedemption(redeemAddress, _quantity, idBatch, _ticketType, noOfRedeemableCards);
    }

    /**
     * @notice Drop rate probability of rarity of cards generated for each card positions for Gold Ticket
     * @dev Probabilistic Rarity value randomly generated when ticket is redeemed and passed in parameter for Rarity
     * @param _rarityProb Rarity value randomly generated for each card position and pool seed
     * @param _counter Position of the card when a ticket is redeemed
     * @return rarity of card generated on redeeming gold ticket
     */
    function _getProbabilisticRarityGold(uint256 _rarityProb, uint256 _counter) internal pure returns (bytes1) {
        if (_counter == 1 || _counter == 2) {
            return Constants.RARITY_EPIC;
        } else if (_counter == 3 || _counter == 4 || _counter == 5) {
            if (_rarityProb <= 50) {
                return Constants.RARITY_RARE;
            } else if (_rarityProb > 50 && _rarityProb <= 85) {
                return Constants.RARITY_EPIC;
            } else if (_rarityProb > 85 && _rarityProb <= 100) {
                return Constants.RARITY_LEGENDARY;
            }
        }
        return Constants.RARITY_UNKNOWN;
    }

    /**
     *  @notice Drop rate probability of rarity of cards generated for each card positions for Bronze ticket
     *  @param _rarityProb Rarity value randomly generated for each card position and pool seed
     *  @param _counter Position of the card when a ticket is redeemed
     *  @return rarity of card generated for Bronze ticket
     */
    function _getProbabilisticRarityBronze(uint256 _rarityProb, uint256 _counter) internal pure returns (bytes1) {
        if (_counter == 1) {
            return Constants.RARITY_RARE;
        } else if (_counter == 2 || _counter == 3) {
            if (_rarityProb <= 50) {
                return Constants.RARITY_COMMON;
            } else if (_rarityProb > 50 && _rarityProb <= 85) {
                return Constants.RARITY_RARE;
            } else if (_rarityProb > 85 && _rarityProb <= 100) {
                return Constants.RARITY_EPIC;
            }
        }
        return Constants.RARITY_UNKNOWN;
    }

    /**
     *  @notice Drop rate probability of rarity of cards generated for each card positions for Silver ticket
     *  @param _rarityProb Rarity value randomly generated for each card position and pool seed
     *  @param _counter Position of the card when a ticket is redeemed
     *  @return rarity of card generated for silver ticket
     */
    function _getProbabilisticRaritySilver(uint256 _rarityProb, uint256 _counter) internal pure returns (bytes1) {
        if (_counter == 1) {
            return Constants.RARITY_EPIC;
        } else if (_counter == 2) {
            if (_rarityProb <= 50) {
                return Constants.RARITY_RARE;
            } else if (_rarityProb > 50 && _rarityProb <= 95) {
                return Constants.RARITY_EPIC;
            } else if (_rarityProb > 95 && _rarityProb <= 100) {
                return Constants.RARITY_LEGENDARY;
            }
        } else if (_counter == 3) {
            if (_rarityProb <= 50) {
                return Constants.RARITY_RARE;
            } else if (_rarityProb > 50 && _rarityProb <= 90) {
                return Constants.RARITY_EPIC;
            } else if (_rarityProb > 90 && _rarityProb <= 100) {
                return Constants.RARITY_LEGENDARY;
            }
        } else if (_counter == 4) {
            if (_rarityProb <= 50) {
                return Constants.RARITY_RARE;
            } else if (_rarityProb > 50 && _rarityProb <= 85) {
                return Constants.RARITY_EPIC;
            } else if (_rarityProb > 85 && _rarityProb <= 100) {
                return Constants.RARITY_LEGENDARY;
            }
        }
        return Constants.RARITY_UNKNOWN;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
