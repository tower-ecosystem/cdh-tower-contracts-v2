const dotenv = require('dotenv');

dotenv.config({path: '.env'});

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
      gas: 135500000,
      blockGasLimit: 135521976,
      live: false,
    },
    localhost: {
      chainId: 1337,
      gas: 'auto',
      blockGasLimit: 13550000,
      url: 'http://localhost:8545',
      live: false,
    },
    goerli: {
      chainId: 5,
      gas: 'auto',
      blockGasLimit: 13550000,
      url: 'https://ethereum-goerli.publicnode.com',
      tags: ['staging', 'ethereum1', 'rewards_mumbai', 'PolygonTower'],
      live: true,
      defaultProvider: 'alchemy',
    },
    polygonMumbai: {
      url: 'https://polygon-mumbai.blockpi.network/v1/rpc/public',
      chainId: 80001,
      live: true,
      saveDeployments: true,
      tags: ['staging', 'ethereum1', 'verification', 'rewards_mumbai'],
      defaultProvider: 'alchemy',
    },
    polygon: {
      url: 'https://polygon.llamarpc.com',
      chainId: 137,
      gasPrice: 'auto',
      live: true,
      saveDeployments: true,
      tags: ['staging', 'ethereum1', 'production'],
      defaultProvider: 'alchemy',
    },
    mainnet: {
      url: 'https://eth.llamarpc.com',
      chainId: 1,
      gasPrice: 'auto',
      live: true,
      saveDeployments: true,
      tags: ['ethereum'],
      defaultProvider: 'alchemy',
    },
    bsctest: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      gasPrice: 'auto',
      live: true,
      saveDeployments: true,
      tags: ['staging', 'bsc'],
      defaultProvider: 'binance',
    },
    bsc: {
      url: 'https://bsc-dataseed.binance.org',
      chainId: 56,
      gasPrice: 'auto',
      live: true,
      saveDeployments: true,
      tags: ['staging', 'bsc'],
      defaultProvider: 'binance',
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.ETHERSCAN_API_KEY_MUMBAI,
      polygon: process.env.ETHERSCAN_API_KEY_POLYGON,
      goerli: process.env.ETHERSCAN_API_KEY_ETHMAINNET,
      mainnet: process.env.ETHERSCAN_API_KEY_ETHMAINNET,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
};
