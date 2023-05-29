const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {heroPointsRedemptionVerifier} = require("../constants/HeroPointsRedemption/heropoints");

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  console.log(`Deploying Hero Points Redemption contract....`);
  const {deploy} = deployments;
  const {HeroPointsRedemption_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  let messageSigner = heroPointsRedemptionVerifier[networkChainId].messageSigner;
  await deploy('HeroPointsERC1155Redemption', {
    from: HeroPointsRedemption_Wallet,
    args: [
      messageSigner,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['1']), // migration already done
  skipIfChainIdIs(['5']), // migration already done for goerli
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
  skipIfContractExists('HeroPointsERC1155Redemption'), // contract guard
]);

module.exports.tags = ['HeroPointsERC1155Redemption'];
