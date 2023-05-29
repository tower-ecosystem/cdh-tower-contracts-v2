const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {redemptionVerifier} = require('../constants/CDHRedemption/redemption');
const {ethers} = require('hardhat');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy, execute} = deployments;
  const {CDHInventory_Wallet} = await getNamedAccounts();
  let networkChainId = await getChainId();

  const cdhInventory = '0x0B306BF915C4d645ff596e518fAf3F9669b97016';
  const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
  const nftRedemption = await ethers.getContractFactory('NFTRedemption');

  // await execute(
  //   'CDHInventory',
  //   {
  //     from: CDHInventory_Wallet,
  //     log: true,
  //   },
  //   'grantRole',
  //   MINTER_ROLE,
  //   nftRedemption.address
  // );
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // migration already done
  skipIfChainIdIs(['137']), // migration already done
  skipIfChainIdIs(['1']),
  skipIfChainIdIs(['5']),
]);
module.exports.tags = ['NFTRedemption_setMinter'];
