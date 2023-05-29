const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy} = deployments;
  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();

  console.log(`getChainId: ${networkChainId}`);

  // await deploy('WorldBossBattle', {
  //   from: WBB_Wallet,
  //   contract: 'WorldBossBattleV2',
  //   args: [],
  //   proxy: {
  //     proxyContract: 'OpenZeppelinTransparentProxy',
  //     execute: {
  //       init: {
  //         methodName: 'reInitialize',
  //         args: [],
  //       },
  //       onUpgrade: {
  //         methodName: 'reInitialize',
  //
  //         args: [],
  //       },
  //     },
  //   },
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  // });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('WorldBossBattleV2'), // contract guard
]);
module.exports.tags = ['WorldBossBattleV2'];
