const {ethers} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');
const {BossData, BattleData} = require('../constants/game/wbb');

module.exports = async ({getNamedAccounts, deployments, getChainId}) => {
  const {execute} = deployments;

  const {WBB_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  const BossConfig = {
    bossID: 'Boss1',
    bossName: 'Superior',
    maxHp: 100,
    uri: '/boss1.png',
  };
  const BattleConfig = {
    battleId: 'BATTLE1',
    bossIds: ['Boss1'],
    startTime: 1673369163,
    endTime: 1673607663,
  };

  // await execute(
  //   'WBBActions',
  //   {
  //     from: WBB_Wallet,
  //     log: true,
  //   },
  //   'createBoss',
  //   BossConfig.bossID,
  //   BossConfig.bossName,
  //   BossConfig.maxHp,
  //   BossConfig.uri
  // );
  //
  // await execute(
  //   'WBBActions',
  //   {
  //     from: WBB_Wallet,
  //     log: true,
  //   },
  //   'createBattle',
  //   BattleConfig.battleId,
  //   BattleConfig.bossIds,
  //   BattleConfig.startTime,
  //   BattleConfig.endTime
  // );
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // mumbai
  skipIfChainIdIs(['137']), // polygon
]);
module.exports.tags = ['GameActions_create_battle_boss'];
