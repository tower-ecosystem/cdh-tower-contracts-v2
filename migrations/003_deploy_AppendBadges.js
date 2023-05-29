const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {badgesSBTMetadataUrl, BadgesDetailsMap} = require('../constants/CDHBadges/badges');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy, execute} = deployments;
  const {Badges_Wallet} = await getNamedAccounts();
  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  for (const badgeDetail of BadgesDetailsMap) {
    const {tokenId, tokenName, isSoulBound} = badgeDetail;
    console.log(`badgeDetail: ${JSON.stringify(badgeDetail)}`);

    await execute(
      'CDHBadges',
      {
        from: Badges_Wallet,
        log: true,
      },
      'appendBadgeType',
      tokenId,
      tokenName,
      isSoulBound
    );
  }
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // migration already done
  skipIfChainIdIs(['137']), // migration already done
  skipIfChainIdIs(['1']),
  skipIfChainIdIs(['5']),
]);
module.exports.tags = ['CDHBadges_append_type'];
