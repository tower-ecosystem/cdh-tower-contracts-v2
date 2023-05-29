const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {GameConfig} = require('../constants/game/wbb');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy} = deployments;
  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();

  let preprod = true;
  if (preprod) {
    networkChainId = '137-preprod';
  }
  let {_cdhNft, _towerToken, _maxStakeCount} = GameConfig[networkChainId];

  const gameAccessControls = await ethers.getContract('GameAccessControls');
  const gameActions = await ethers.getContract('WBBActions');

  console.log(`getChainId: ${networkChainId}`);

  await deploy('WorldBossBattle', {
    from: WBB_Wallet,
    args: [],
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [_cdhNft, _towerToken, _maxStakeCount, gameActions.address, gameAccessControls.address],
        },
      },
    },
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('WorldBossBattle'), // contract guard
]);

module.exports.tags = ['WorldBossBattle'];
