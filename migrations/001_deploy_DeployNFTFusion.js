const {ethers, upgrades} = require('hardhat');
const {skipIfContractExists, multiSkip, skipIfChainIdIs} = require('../tasks/hardhat-deploy-migrations/migrations');

module.exports = async ({getNamedAccounts, deployments, getChainId, getUnnamedAccounts}) => {
  const {deploy} = deployments;
  const {NFTFusion_Wallet} = await getNamedAccounts();

  let networkChainId = await getChainId();
  console.log(`getChainId: ${networkChainId}`);

  let ERC20MockDeployment;
  let receiverToken = '';
  if (networkChainId === '31337') {
    ERC20MockDeployment = await deploy('ERC20Mock', {
      contract: 'ERC20Mock',
      args: [],
      from: NFTFusion_Wallet,
      log: true,
    });
    receiverToken = ERC20MockDeployment.address;
  }

  let constructorAddress = {
    31337: {
      _receiverToken: receiverToken,
      _inventoryAddress: receiverToken,
      _verifier: NFTFusion_Wallet,
      _tokenReceiver: NFTFusion_Wallet,
    },
    80001: {
      _receiverToken: '0x126e03EdB6f3c70DFbc2fACc725d01d352cd2D27',
      _inventoryAddress: '0x548113963502FA7E152c5b17aB6FdEB5C4AAA0Bc',
      _verifier: NFTFusion_Wallet,
      _tokenReceiver: NFTFusion_Wallet,
    },
    137: {
      _receiverToken: '0x2bC07124D8dAc638E290f401046Ad584546BC47b',
      _inventoryAddress: '0x2B88Ce7b01E6BdBB18f9703e01286608cF77e805',
      _verifier: NFTFusion_Wallet,
      _tokenReceiver: NFTFusion_Wallet,
    },
  };

  await deploy('NFTFusion', {
    from: NFTFusion_Wallet,
    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [
            constructorAddress[networkChainId]._receiverToken,
            constructorAddress[networkChainId]._inventoryAddress,
            constructorAddress[networkChainId]._verifier,
            constructorAddress[networkChainId]._tokenReceiver,
          ],
        },
      },
    },
    args: [],
    log: true,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};

module.exports.skip = multiSkip([
  skipIfChainIdIs(['80001']), // migration already done
  skipIfChainIdIs(['137']), // migration already done
  skipIfChainIdIs(['1']),
  skipIfChainIdIs(['5']),
  skipIfContractExists('NFTFusion'), // contract guard
]);
module.exports.tags = ['NFTFusion'];
