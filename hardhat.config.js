const {mergeConfigs} = require('@animoca/ethereum-contracts/src/config');
require('@animoca/ethereum-migrations/hardhat-plugins');
require('hardhat-gas-reporter');
require('./tasks');

//for testing
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');

module.exports = mergeConfigs(require('@animoca/ethereum-contracts/hardhat-config'), require('./hardhat-config'));
