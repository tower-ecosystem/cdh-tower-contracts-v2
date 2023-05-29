// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./BadgesAccessControl.sol";

interface IERCSBT {
    event Bound(address indexed _account, uint256 indexed _tokenId, uint256 _amount, bool _isSoulBound);

    function isSoulBound(uint256 _tokenId) external view returns (bool);
}

contract CDHBadges is Initializable, ERC1155Upgradeable, PausableUpgradeable, OwnableUpgradeable, BadgesAccessControl, IERCSBT {
    using ECDSA for bytes32;

    event BoundBatch(address indexed _account, uint256[] _ids, uint256[] _amounts);
    event AddBadgeType(uint256 _tokenId, string _name, bool _isSoulBound);

    struct BadgeInfo {
        string badgeName;
        bool isSoulBoundFlag;
    }

    mapping(uint256 => BadgeInfo) public badgeIds;
    mapping(address => uint256) public seedNonce;

    address private _verifier;

    function initialize(string memory _metadataUri) public initializer {
        __ERC1155_init("");
        __Pausable_init();
        __Ownable_init();
        _setURI(_metadataUri);
        BadgesAccessControl.Accessinitialize();
    }

    // constructor(string memory _metadataUri) public ERC1155("")  BadgesAccessControl() {
    //     _setURI(_metadataUri);
    // }

    function appendBadgeType(uint256 _tokenId, string memory _name, bool _isSoulBound) external onlyAdmin {
        badgeIds[_tokenId] = BadgeInfo(_name, _isSoulBound);
        emit AddBadgeType(_tokenId, _name, _isSoulBound);
    }

    function isSoulBound(uint256 _tokenId) public view returns (bool) {
        return badgeIds[_tokenId].isSoulBoundFlag;
    }

    function getBadgeInfo(uint256 _tokenId) public view returns (string memory _name, bool _isSoulBound) {
        (_name, _isSoulBound) = (badgeIds[_tokenId].badgeName, badgeIds[_tokenId].isSoulBoundFlag);
        return (_name, _isSoulBound);
    }

    function mint(address _account, uint256 _id, uint256 _amount) public onlyMinterAdmin whenNotPaused {
        _mint(_account, _id, _amount, "");
        emit Bound(_account, _id, _amount, isSoulBound(_id));
    }

    function mintBatch(address to, uint256[] memory _ids, uint256[] memory _amounts) public onlyMinterAdmin whenNotPaused {
        _mintBatch(to, _ids, _amounts, "");
        emit BoundBatch(to, _ids, _amounts);
    }

    function mintBatchMultiple(
        address[] memory _to,
        uint256[][] memory _tokenIds,
        uint256[][] memory _amounts
    ) external onlyMinterAdmin whenNotPaused {
        for (uint256 i = 0; i < _to.length; i++) {
            mintBatch(_to[i], _tokenIds[i], _amounts[i]);
        }
    }

    function checkVerification(
        uint256[] memory _tokenIds,
        uint256[] memory _amounts,
        address _sender,
        bytes memory _signature
    ) public view returns (bool) {
        uint256 nonce = seedNonce[_sender];
        bytes32 hash = keccak256(abi.encodePacked(_sender, _tokenIds, _amounts, nonce));
        address decodedSigner = hash.toEthSignedMessageHash().recover(_signature);
        return isTrustedSigner(decodedSigner);
    }

    function verifyAndMint(uint256[] memory _tokenIds, uint256[] memory _amounts, address _sender, bytes memory _signature) external whenNotPaused {
        require(checkVerification(_tokenIds, _amounts, _sender, _signature), "CDHBadges: Signer not authorized.");

        seedNonce[_sender]++;
        if (_tokenIds.length > 1) {
            mintBatch(_sender, _tokenIds, _amounts);
            emit BoundBatch(_sender, _tokenIds, _amounts);
        } else {
            uint256 tokenId = _tokenIds[0];
            uint256 tokenAmount = _amounts[0];

            mint(_sender, tokenId, tokenAmount);
            emit Bound(_sender, tokenId, tokenAmount, isSoulBound(tokenId));
        }
    }

    function setBaseUri(string memory _uri) external onlyAdmin {
        _setURI(_uri);
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        string memory tokenUri = super.uri(tokenId);
        return string(abi.encodePacked(tokenUri, Strings.toString(tokenId), ".json"));
    }

    function pause() external onlyAdmin whenNotPaused {
        _pause();
    }

    function unpause() external onlyAdmin whenPaused {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setVerifier(address verifier_) external virtual onlyAdmin {
        _verifier = verifier_;
    }

    function verifier() public view virtual returns (address) {
        return _verifier;
    }

    function isTrustedSigner(address signer) public view virtual returns (bool) {
        return _verifier == signer;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        for (uint i = 0; i < ids.length; i++) {
            if (isSoulBound(ids[i]) == false) {} else {
                require(from == address(0), "CDHBadges: Soul Bound Token can't be transferred");
            }
        }
        // require(from == address(0), "CDHBadges: Soul Bound Token can't be transferred");
    }
}
