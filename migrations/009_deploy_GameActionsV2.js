const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {GameConfig} = require('../constants/game/wbb');

module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deploy} = deployments;
  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  // await deploy('WBBActions', {
  //   from: WBB_Wallet,
  //   contract: 'WBBActionsV2',
  //   args: [],
  //   log: true,
  //   autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  //   proxy: {
  //     contract: 'WBBActions', // contract class name
  //     proxyContract: 'OpenZeppelinTransparentProxy',
  //     execute: {
  //       init: {
  //         methodName: 'reInitialize',
  //         args: [],
  //       },
  //       onUpgrade: {
  //         methodName: 'reInitialize',
  //         args: [],
  //       },
  //     },
  //   },
  // });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('GameActionsV2'), // contract guard
]);
module.exports.tags = ['GameActions'];
