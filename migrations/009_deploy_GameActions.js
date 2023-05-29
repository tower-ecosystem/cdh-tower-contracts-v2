const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {GameConfig} = require('../constants/game/wbb');

module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {deploy} = deployments;
  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  const gameAccessControls = await ethers.getContract('GameAccessControls');

  await deploy('WBBActions', {
    from: WBB_Wallet,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    proxy: {
      contract: 'WBBActions', // contract class name
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [gameAccessControls.address],
        },
      },
    },
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('GameActions'), // contract guard
]);
module.exports.tags = ['GameActions'];
