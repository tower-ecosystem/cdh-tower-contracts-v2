const {ethers, upgrades} = require('hardhat');

async function main() {
  const GameAccessControls = await ethers.getContractFactory('GameAccessControls');
  const GameAccessControlsDeploy = await upgrades.deployProxy(GameAccessControls, {initializer: 'Accessinitialize'});
  console.log('Contract deployed to address:', GameAccessControlsDeploy.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
