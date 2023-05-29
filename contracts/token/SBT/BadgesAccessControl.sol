// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract BadgesAccessControl is AccessControlUpgradeable {
    // keccak256(abi.encodePacked("MINTER_ROLE"));
    bytes32 public constant MINTER_ROLE = 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6;

    // keccak256(abi.encodePacked("MINTER_ROLE_ADMIN"));
    bytes32 public constant MINTER_ROLE_ADMIN = 0x11c2020b6b4f4e00c2410234e0c72636b4739cf7cda4d8e24ef6b881350e6704;

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "");
        _;
    }

    modifier onlyMinter() {
        require(hasRole(MINTER_ROLE, _msgSender()), "");
        _;
    }

    modifier onlyMinterAdmin() {
        require(hasRole(MINTER_ROLE_ADMIN, _msgSender()), "");
        _;
    }

    function Accessinitialize() public initializer {
        __AccessControl_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE_ADMIN, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }
}
