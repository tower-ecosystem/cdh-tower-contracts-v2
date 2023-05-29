const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy} = deployments;
  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  await deploy('GameAccessControls', {
    from: WBB_Wallet,
    args: [],
    log: true,
    autoMine: true,
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('GameAccessControls'), // contract guard
]);
module.exports.tags = ['GameAccessControls'];
