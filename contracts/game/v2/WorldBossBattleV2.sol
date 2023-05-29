// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../WorldBossBattle.sol";

contract WorldBossBattleV2 is WorldBossBattle {
    function reInitialize() public reinitializer(2) {}

    function versionInfo() public pure returns (string memory) {
        return "this is version 2";
    }
}
