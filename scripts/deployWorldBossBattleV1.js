const {ethers, upgrades} = require('hardhat');

var _cdhNft = '0x432de13822e0b891748b632cd94f85ba4cbbcdfa';
var _towerToken = '0xbb2c9203c8d0c169638c6391da2828f0278231af';
var _accessControl = '0xf7e36f390db61eE705F915446686DB628F271083';
var _nftHolder = '0x479d1DaE95261b39Fb39C4477141da60fAc8d50A';

async function main() {
  WorldBossBattleFactory = await ethers.getContractFactory('WorldBossBattle');

  WorldBossBattleContract = await upgrades.deployProxy(WorldBossBattleFactory, [_cdhNft, _towerToken, _accessControl, _nftHolder], {
    initializer: 'initialize',
  });

  console.log('Contract deployed to address:', WorldBossBattleContract.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
