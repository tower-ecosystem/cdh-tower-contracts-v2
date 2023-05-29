// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../NFTRedeemption/interface/IERC721.sol";
import "../NFTRedeemption/interface/IERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title
 * @notice This contract is a smart contract that implements the functionalities for redeeming NFT tokens (ERC721 & ERC1155) using hero points.
 * Imports
 * - The contract imports IERC721.sol and IERC1155.sol interfaces which provide the standard functions for ERC721 and ERC1155 tokens.
 * - Ownable.sol contract is used to implement access control functionalities.
 * - Pausable.sol contract is used to implement pausability of contract operations.
 * - ReentrancyGuard.sol contract is used to prevent reentrant calls.
 * - ECDSA.sol contract is used to perform cryptographic operations.
 */
contract HeroPointsERC1155Redemption is Ownable, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;

    /**
     * Emitted when NFT is redeemed from system
     * @param contractAddress Contract address to redeem NFT Token of
     * @param nftId Token ID of contract address to redeem
     * @param eventId Event ID/Name of the running event
     * @param quantity Number of hero points to use
     * @param redeemer Wallet address who redeems the token
     */
    event NFTReedemed(address indexed contractAddress, uint256 indexed nftId, uint256 indexed eventId, uint256 quantity, address redeemer);

    /**
     * Emitted when New Signer address is set for redemption
     * @param previousSigner Previous Address that signs the message for valid signature
     * @param newSigner New Address that signs the message for valid signature
     */
    event SetNewMessageSigner(address indexed previousSigner, address newSigner);

    /**
     * Emitted when setting new holder of the contract address for redemption
     * @param contractAddress Contract address to token holder address
     * @param previousHolder Previous Address that holds the token of the contract
     * @param newHolder New Address that holds the token of the contract
     */
    event SetNewHolderToNFT(address indexed contractAddress, address indexed previousHolder, address indexed newHolder);

    address public messageSigner;

    mapping(address => uint256) public seedNonce;
    mapping(address => address) public tokenHolder;

    /**
     * @dev Sets the values for {messageSigner}.
     * @param _messageSigner address that is used to sign message from backend
     * @notice The value is mutable: it can be set by the owner (deployer) of the contract
     */
    constructor(address _messageSigner) {
        messageSigner = _messageSigner;
    }

    /**
     * @dev Atomically increases the seedNonce value by 1 to `_sender` by the caller.
     * @notice This is the internal function called within redeemHeroPoints
     * @return the nonce value of caller.
     */
    function _updateNonce(address _sender) internal returns (uint256) {
        uint256 nonce = seedNonce[_sender];
        seedNonce[_sender]++;
        return nonce;
    }

    /**
     * @dev Sets `holder address` for  `nft address`.
     * @notice This protected function which can only be called by the owner of the contract
     * to set the holder address for the token (ERC1155/ERC721) address which can be redeemed
     *
     * @dev {SetNewHolderToNFT} event.
     *
     * Requirements:
     * - `_contractAddress` cannot be the zero address.
     * - `_holder` cannot be the zero address.
     */
    function setHolderToNFT(address _contractAddress, address _holder) external onlyOwner {
        require(_contractAddress != address(0), "HeroPointsRedemption: Invalid contract address");
        require(_holder != address(0), "HeroPointsRedemption: Invalid holder");
        emit SetNewHolderToNFT(_contractAddress, tokenHolder[_contractAddress], _holder);
        tokenHolder[_contractAddress] = _holder;
    }

    /**
     * @dev Sets `signer` that will be used for signing message from backend .
     * @notice This protected function which can only be called by the owner of the contract
     * to set the new signer
     * @dev {SetNewMessageSigner} event.
     *
     * Requirements:
     * - `_newSigner` cannot be the zero address.
     */
    function setMessageSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "HeroPointsRedemption: Invalid signer");
        emit SetNewMessageSigner(messageSigner, _newSigner);
        messageSigner = _newSigner;
    }

    /**
     * @dev Verifies the signature that is signed by user
     * @notice This internal function is equivalent to check the signature verification.
     * @param _contractAddress Contract address to redeem NFT Token of
     * @param _nftId Token ID of contract address to redeem
     * @param _eventId Event ID/Name of the running event
     * @param _quantity Number of hero points to use
     * @param _signature Server generated signature for redemption of NFT token
     */
    function verifySignature(address _contractAddress, uint256 _nftId, uint256 _eventId, uint256 _quantity, bytes memory _signature) internal {
        uint256 nonce = seedNonce[msg.sender];
        bytes32 hash = keccak256(abi.encodePacked(msg.sender, _contractAddress, _nftId, _eventId, _quantity, nonce));
        require(hash.toEthSignedMessageHash().recover(_signature) == messageSigner, "HeroPointsRedemption: Signature verification failed");
        _updateNonce(msg.sender);
    }

    /**
     * @dev Function to redeem hero points.
     * @notice This function will be executed if the signature is verified after the signature verification token will be
     *  redeemed from tokenHolder address to redeemer address.
     * @param _contractAddress Contract address to redeem NFT Token of
     * @param _nftId Token ID of contract address to redeem
     * @param _eventId Event ID/Name of the running event
     * @param _quantity Number of hero points to use
     * @param _signature Server generated signature for redemption of NFT token
     * @dev {NFTReedemed} event.
     *
     * Requirements:
     * - `_contractAddress` cannot be the zero address.
     */
    function redeemHeroPoints(
        address _contractAddress,
        uint256 _nftId,
        uint256 _eventId,
        uint256 _quantity,
        bytes memory _signature
    ) external whenNotPaused nonReentrant {
        require(_contractAddress != address(0), "HeroPointsRedemption: Invalid contract address");
        verifySignature(_contractAddress, _nftId, _eventId, _quantity, _signature);

        address redeemer = msg.sender;
        address _tokenHolder = tokenHolder[_contractAddress];
        if (IERC721(_contractAddress).supportsInterface(0x80ac58cd)) {
            require(IERC721(_contractAddress).ownerOf(_nftId) == _tokenHolder, "HeroPointsRedemption: holder not the owner of token");
            IERC721(_contractAddress).safeTransferFrom(_tokenHolder, redeemer, _nftId);
        } else if (IERC1155(_contractAddress).supportsInterface(0xd9b67a26)) {
            require(
                IERC1155(_contractAddress).balanceOf(_tokenHolder, _nftId) >= _quantity,
                "HeroPointsRedemption: holder doesn't have enough token"
            );
            IERC1155(_contractAddress).safeTransferFrom(_tokenHolder, redeemer, _nftId, _quantity, "0x00");
        }
        emit NFTReedemed(_contractAddress, _nftId, _eventId, _quantity, redeemer);
    }

    /**
     * @dev Pauses contract for actions.
     *
     * Requirements:
     * - The caller of this function can only be owner.
     * - The contract must not be paused
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract for normal activity.
     *
     * Requirements:
     * - The caller of this function can only be owner.
     * - The contract must be paused
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
