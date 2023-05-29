// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    function transfer(address to, uint256 amount) external returns (bool);
}

interface IERC1155 {
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}

contract NFTFusion is Initializable, PausableUpgradeable, OwnableUpgradeable {
    using ECDSA for bytes32;

    event NFTFused(
        address indexed _sender,
        uint256 assetQuantity,
        string _assetsId,
        uint256[] _tokenIds,
        uint256[] _tokenAmounts,
        uint256 rERC20TokenAmount
    );
    event FundReceiverChanged(address _oldReceiver, address _newReceiver);

    event VerifierChanged(address _owner, address indexed _oldSigner, address indexed _newSigner);
    event ERC20AddressChanged(address _owner, address indexed _oldAddress, address indexed _newAddress);
    event ERC1155AddressChanged(address _owner, address indexed _oldAddress, address indexed _newAddress);
    event TokenReceiverChanged(address _owner, address indexed _oldAddress, address indexed _newAddress);

    IERC20 public erc20Token;
    IERC1155 public erc1155Token;
    address public verifier;
    address private tokenReceiver;
    address private burner;

    uint256 public fusionCounter;

    struct NFTFusionAsset {
        string assetsId;
        uint256 assetQuantity;
        uint256[] tokenIds;
        uint256[] amounts;
        address sender;
        uint256 blockNumber;
    }

    mapping(address => uint256) public fusionNonces;
    mapping(address => NFTFusionAsset[]) public fusionAssetsPerAddress;

    // constructor(address _receiverToken, address _inventoryAddress, address _verifier, address _tokenReceiver) {
    //     erc20Token = IERC20(_receiverToken);
    //     erc1155Token = IERC1155(_inventoryAddress);
    //     verifier = _verifier;
    //     tokenReceiver = _tokenReceiver;
    // }

    function initialize(address _receiverToken, address _inventoryAddress, address _verifier, address _tokenReceiver) public initializer {
        erc20Token = IERC20(_receiverToken);
        erc1155Token = IERC1155(_inventoryAddress);
        verifier = _verifier;
        tokenReceiver = _tokenReceiver;

        // total number of items purchased
        fusionCounter = 0;

        //defining burner address
        burner = 0x000000000000000000000000000000000000dEaD;

        ///@dev as there is no constructor, we need to initialise the OwnableUpgradeable, PausableUpgradeable explicitly
        __Pausable_init();
        __Ownable_init();
    }

    function setVerifier(address _newVerifier) external onlyOwner {
        emit VerifierChanged(msg.sender, verifier, _newVerifier);
        verifier = _newVerifier;
    }

    function setERC20TokenAddress(address _newErc20Token) external onlyOwner {
        emit ERC20AddressChanged(msg.sender, address(erc20Token), _newErc20Token);
        erc20Token = IERC20(_newErc20Token);
    }

    function setERC1155TokenAddress(address _newErc1155Token) external onlyOwner {
        emit ERC1155AddressChanged(msg.sender, address(erc1155Token), _newErc1155Token);
        erc1155Token = IERC1155(_newErc1155Token);
    }

    function setTokenReceiver(address _newTokenReceiver) external onlyOwner {
        emit TokenReceiverChanged(msg.sender, tokenReceiver, _newTokenReceiver);
        tokenReceiver = _newTokenReceiver;
    }

    function sigVerify(
        address _sender,
        string memory _assetsId,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        uint256 rTokenAmount, // receiver ERC20 Token Amount
        bytes memory _sig
    ) internal returns (bool) {
        uint256 nonce = fusionNonces[_sender];

        bytes32 hash = keccak256(abi.encodePacked(_sender, address(this), _assetsId, tokenIds, amounts, rTokenAmount, nonce));
        require(hash.toEthSignedMessageHash().recover(_sig) == verifier, "NFTFusion: invalid signature");
        fusionNonces[_sender]++;
        return true;
    }

    function fuse(
        string memory _assetsId,
        uint256 assetQuantity,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts,
        uint256 rTokenAmount,
        bytes memory _sig
    ) external whenNotPaused {
        require(bytes(_assetsId).length > 0, "NFTFusion: invalid fusion asset");
        require(tokenIds.length == amounts.length, "NFTFusion: tokenIds and amounts mismatch");
        require(assetQuantity > 0, "NFTFusion: asset quantity less than 0");

        address _sender = msg.sender;
        require(sigVerify(_sender, _assetsId, tokenIds, amounts, rTokenAmount, _sig));

        NFTFusionAsset memory fusionAsset = NFTFusionAsset(_assetsId, assetQuantity, tokenIds, amounts, _sender, block.number);
        fusionAssetsPerAddress[_sender].push(fusionAsset);
        fusionCounter += 1;

        IERC20(erc20Token).transferFrom(_sender, tokenReceiver, rTokenAmount);
        IERC1155(erc1155Token).safeBatchTransferFrom(_sender, burner, tokenIds, amounts, "0x0");

        emit NFTFused(_sender, assetQuantity, _assetsId, tokenIds, amounts, rTokenAmount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
