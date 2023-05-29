const {ethers} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {redemptionConstructor} = require('../constants/CDHRedemption/redemption');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  console.log(`Deploying Ticket NFT Redemption contract....`);
  const {deploy} = deployments;
  const {TicketRedemption_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  const redemptionConstructorValues = redemptionConstructor[networkChainId];

  await deploy('NFTRedemption', {
    from: TicketRedemption_Wallet,
    args: [
      redemptionConstructorValues._cdhNft,
      redemptionConstructorValues._towerInventory,
      redemptionConstructorValues._equipmentPool,
      redemptionConstructorValues._heroPool,
      redemptionConstructorValues._spellPool,
      redemptionConstructorValues._towerPool,
      redemptionConstructorValues._blackHoleAddress,
      redemptionConstructorValues._randomNumberSigner,
    ],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['1']), // migration already done
  // skipIfChainIdIs(['80001']), // migration already done
  skipIfChainIdIs(['5']), // migration already done for goerli
  // skipIfChainIdIs(['137']), // migration already done
  skipIfChainIdIs(['97']), // bsctest
  skipIfChainIdIs(['56']), // bsc mainnet
  skipIfContractExists('NFTRedemption'), // contract guard
]);
module.exports.tags = ['NFTRedemption'];
