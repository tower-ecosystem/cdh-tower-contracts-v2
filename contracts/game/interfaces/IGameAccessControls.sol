// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/// @title A interface of CDH Tower token
/// @notice this is used to help interact with real tower token
interface IGameAccessControls {
    function hasManagerRole(address _address) external view returns (bool);

    function hasAdminRole(address _address) external view returns (bool);
}
