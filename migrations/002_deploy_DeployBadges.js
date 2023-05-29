const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy} = deployments;
  const {Badges_Wallet} = await getNamedAccounts();
  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  let badgesSBTMetadataUrl = 'https://animocabrands.mypinata.cloud/ipfs/QmaKwf2J8XWs82WK57ggeGhzoek5qtj6NQNkXcoZ2dJCEs/';

  await deploy('CDHBadges', {
    from: Badges_Wallet,
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
    proxy: {
      contract: 'CDHBadges', // contract class name
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [badgesSBTMetadataUrl],
        },
      },
    },
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // migration already done
  skipIfChainIdIs(['137']), // migration already done
  skipIfChainIdIs(['1']),
  skipIfChainIdIs(['5']),
  skipIfContractExists('CDHBadges'), // contract guard
]);
module.exports.tags = ['CDHBadges'];
