require('@nomicfoundation/hardhat-chai-matchers');
require('hardhat-deploy');
require('hardhat-deploy-ethers');
require('solidity-coverage');
require('solidity-docgen');
require('./flatten-all');
require('./output-config');
require('./hardhat-deploy-migrations');
require('./hardhat-deploy-etherenv-exports');

const {extendEnvironment} = require('hardhat/config');
const {lazyFunction} = require('hardhat/plugins');

extendEnvironment(function (env) {
  env.assert = lazyFunction(() => require('chai').assert);
  env.expect = lazyFunction(() => require('chai').expect);
});
