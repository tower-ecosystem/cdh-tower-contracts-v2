const deployer = {
  default: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  1: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  4: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  5: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // goerli
  137: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // polygon-mainnet
  80001: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8', // mumbai
};

const NFTFusion_Wallet = {
  default: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  80001: '0xfD286ed92Ae5e35C197dD59b39a232038B6D63d4',
  137: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15', // polygon-mainnet
  97: '0xfD286ed92Ae5e35C197dD59b39a232038B6D63d4', // bsc testnet
  56: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15', // bsc mainnet
};

const Badges_Wallet = {
  default: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  80001: '0xfD286ed92Ae5e35C197dD59b39a232038B6D63d4',
  137: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15',
  97: '0xfD286ed92Ae5e35C197dD59b39a232038B6D63d4',
  56: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15',
};

const TicketRedemption_Wallet = {
  default: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  80001: '0xfD286ed92Ae5e35C197dD59b39a232038B6D63d4',
  137: '0x34da8f8242e6e8bda9164f906351a4a0c34d1337',
};

const HeroPointsRedemption_Wallet = {
  default: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  80001: '0xfd286ed92ae5e35c197dd59b39a232038b6d63d4',
  137: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15',
  1: '0xc6b891970FdE366E8C8b1F81e38F9CD5A9f65D15',
  5: '0xfd286ed92ae5e35c197dd59b39a232038b6d63d4',
};

module.exports = {
  namedAccounts: {
    deployer,
    NFTFusion_Wallet,
    Badges_Wallet,
    TicketRedemption_Wallet,
    HeroPointsRedemption_Wallet,
  },
};
