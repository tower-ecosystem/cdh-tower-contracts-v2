// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title A contract for giving role for address
/// @dev this is an upgradable function
contract GameAccessControls is AccessControl {
    // keccak256(abi.encodePacked("MANAGER_ROLE"));
    bytes32 public constant MANAGER_ROLE = 0x241ecf16d79d0f8dbfb92cbc07fe17840425976cf0667f022fe9877caa831b08;

    /// @notice Constructor for setting up default roles
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
    }

    /// @notice function to give an address Admin role
    /// @param _address address that will be getting role
    function addAdminRole(address _address) external {
        grantRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /// @notice function to give an address Admin role
    /// @param _address address that will be getting role
    function removeAdminRole(address _address) external {
        revokeRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /// @notice function to check an address has Admin role
    /// @param _address address that has admin role
    /// @return bool true if address is admmin
    function hasAdminRole(address _address) public view returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, _address);
    }

    /// @notice function to check an address has Manager role
    /// @param _address address that has admin role
    /// @return bool true if address is game manager manager
    function hasManagerRole(address _address) public view returns (bool) {
        return hasRole(MANAGER_ROLE, _address);
    }
}
