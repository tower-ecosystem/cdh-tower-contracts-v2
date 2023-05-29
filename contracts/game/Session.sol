// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GameSession is OwnableUpgradeable {
    using ECDSA for bytes32;

    event Synced(address indexed sender, bytes32 oldSessionId, bytes32 newSessionId);

    address private signer;

    mapping(address => bytes32) public sessions;
    mapping(address => uint256) public syncedTime;

    function setSigner(address _signer) public {
        require(_signer != address(0), "Invalid address");
        signer = _signer;
    }

    function generateSessionId(address msgSender) private view returns (bytes32) {
        return keccak256(abi.encodePacked(_msgSender(), sessions[msgSender], block.number)).toEthSignedMessageHash();
    }

    function getSessionId(address msgSender) public view returns (bytes32) {
        bytes32 id = sessions[msgSender];
        if (id == 0) {
            id = keccak256(abi.encodePacked(_msgSender(), block.number)).toEthSignedMessageHash();
        }
        return id;
    }

    function updateSession() public returns (bool) {
        address msgSender = _msgSender();

        sessions[msgSender] = generateSessionId(msgSender);
        return true;
    }

    function isRegisteredUser() public view returns (bool) {
        return sessions[_msgSender()] != 0;
    }

    modifier isRegistered() {
        require(sessions[_msgSender()] != 0, "WorldBattle: Not Registered");
        _;
    }

    //  modifier isReady(uint tokenId) {
    //     require(syncedAt'[tokenId] < block.timestamp - 60, "NftStaking: Too many requests");
    //     _;
    // }

    function verify(bytes32 hash, bytes memory signature) public view returns (bool) {
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();
        return ethSignedHash.recover(signature) == signer;
    }

    function verificationSignature(bytes32 sessionId, address user, uint256[] memory stakedTokens) private pure returns (bytes32 signature) {
        return keccak256(abi.encode(sessionId, user, stakedTokens));
    }

    // state of the game
    function sync(bytes memory signature, bytes32 sessionId, uint256[] memory stakedTokens) public returns (bool success) {
        address msgSender = _msgSender();
        bytes32 latestGameSessionId = sessions[msgSender];

        require(latestGameSessionId == sessionId, "WorldBattle: Session has changed");

        bytes32 hashToVerify = verificationSignature(sessionId, msgSender, stakedTokens);
        require(verify(hashToVerify, signature), "WorldBattle: Couldn't Verify.");

        bytes32 newSessionId = generateSessionId(msgSender);
        sessions[msgSender] = newSessionId;
        syncedTime[msgSender] = block.timestamp;

        emit Synced(msgSender, sessionId, newSessionId);

        return true;
    }
}
