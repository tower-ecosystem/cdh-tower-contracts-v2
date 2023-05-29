// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../WBBActions.sol";

contract WBBActionsV2 is WBBActions {
    function reInitialize() public reinitializer(2) {}

    /// @notice return the list of all bosses
    function getAllBosses() public view override returns (string[] memory) {
        return bossList;
    }
}
