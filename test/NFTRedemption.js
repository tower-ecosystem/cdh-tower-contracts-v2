// const {expect} = require('chai');
// const {ethers, artifacts} = require('hardhat');
// var fs = require('fs');
// const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers');
// const fsPromises = fs.promises;

// describe('NFT Redemption contract', function () {
//   async function deployContract() {
//     //making signers ready
//     const [owner, addr1, addr2, addr3, lastAddr] = await ethers.getSigners();

//     let privateKey = '';
//     let randomWallet = new ethers.Wallet(privateKey);
//     let silver_deployer = addr1.address;
//     let bronze_deployer = addr2.address;
//     const deployer = owner.address;

//     // using locally deployed contract address to use in constructor of NFTRedemption contract
//     const cdhNft = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
//     const cdhNft_path = './abi/CDHInventory.json';
//     const towerInventory = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
//     const towerInventory_path = './abi/TowerInventory.json';
//     const equipmentPool = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
//     const heroPool = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
//     const spellPool = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
//     const towerPool = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
//     const blackHoleContract = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
//     const randomNumberSender = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

//     /// getting contract factory of NFTRedemption
//     const NFTRedemptionCFactory = await ethers.getContractFactory('NFTRedemption');
//     // we use their address as parameters for the NFTRedemption
//     const NFTRedemption = await NFTRedemptionCFactory.deploy(
//       cdhNft,
//       towerInventory,
//       equipmentPool,
//       heroPool,
//       spellPool,
//       towerPool,
//       blackHoleContract,
//       randomNumberSender
//     );
//     await NFTRedemption.deployed();

//     const towerInventoryData = await fsPromises.readFile(towerInventory_path, 'utf8');
//     const towerInventoryabi = JSON.parse(towerInventoryData)['abi'];
//     const towerInventoryInteraction = new ethers.Contract(towerInventory, towerInventoryabi, owner);
//     // setting approval for all in the TOwerTreasury contract to the NFTRedemption
//     let tx1 = await towerInventoryInteraction.setApprovalForAll(NFTRedemption.address, true);

//     //minting tickets for NFTRedemptio
//     await towerInventoryInteraction.batchMint([1], [10], deployer);
//     await towerInventoryInteraction.batchMint([2], [10], silver_deployer);
//     await towerInventoryInteraction.batchMint([3], [10], bronze_deployer);

//     // setting approval for all in the TOwerTreasury contract to the NFTRedemption from another address
//     const towerInventoryInteraction_Silver = new ethers.Contract(towerInventory, towerInventoryabi, addr1);
//     let tx2 = await towerInventoryInteraction_Silver.setApprovalForAll(NFTRedemption.address, true);

//     // setting approval for all in the TOwerTreasury contract to the NFTRedemption from another address
//     const towerInventoryInteraction_Bronze = new ethers.Contract(towerInventory, towerInventoryabi, addr2);
//     let tx3 = await towerInventoryInteraction_Bronze.setApprovalForAll(NFTRedemption.address, true);

//     const cdhNftData = await fsPromises.readFile(cdhNft_path, 'utf8');
//     const cdhNftabi = JSON.parse(cdhNftData)['abi'];
//     const cdhNftInteraction = new ethers.Contract(cdhNft, cdhNftabi, owner);

//     //giving minter role to NFTRedemption from cdhInventory contract
//     const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
//     let tx4 = await cdhNftInteraction.grantRole(MINTER_ROLE, NFTRedemption.address);

//     return {
//       NFTRedemption,
//       cdhNft,
//       towerInventory,
//       deployer,
//       owner,
//       randomWallet,
//       cdhNftInteraction,
//       addr1,
//       addr2,
//       silver_deployer,
//       bronze_deployer,
//       addr3,
//     };
//   }

//   it('should not be redeem a ticket if redeem is paused', async function () {
//     const {NFTRedemption, deployer, owner, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

//     //creating a payload for gold ticket which is ticket type 1 and of quantity 1
//     const payload = {
//       sender: deployer,
//       contractAddress: NFTRedemption.address,
//       quantity: 1,
//       ticket_type: 1,
//     };

//     //creating a signature
//     const signOrderPayload = async (payload) => {
//       let {sender, contractAddress, quantity, ticket_type} = payload;
//       const seedNonce = await NFTRedemption.seedNonce(deployer);
//       console.log('seedNonce:', seedNonce);
//       const hash = ethers.utils.solidityKeccak256(
//         ['address', 'address', 'uint256', 'uint256', 'uint256'],
//         [sender, contractAddress, quantity, ticket_type, seedNonce]
//       );
//       const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
//       return signature;
//     };
//     const fuseSig = await signOrderPayload(payload);

//     //pausing the redeem
//     await NFTRedemption.connect(owner).pause();

//     //redeeming gold ticket
//     await expect(NFTRedemption.connect(owner).redeemTicket(1, 1, fuseSig)).to.be.revertedWith('Pausable: paused');

//     //printing the list of token that got minted
//     const tokenList = await cdhNftInteraction.getAllTokens(owner.address);
//     console.log('minted token from gold ticket are: ', tokenList);
//   });

//   it('should be redeem a ticket if redeem is unpaused after paused', async function () {
//     const {NFTRedemption, deployer, owner, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

//     //creating a payload for gold ticket which is ticket type 1 and of quantity 1
//     const payload = {
//       sender: deployer,
//       contractAddress: NFTRedemption.address,
//       quantity: 1,
//       ticket_type: 1,
//     };

//     //creating a signature
//     const signOrderPayload = async (payload) => {
//       let {sender, contractAddress, quantity, ticket_type} = payload;
//       const seedNonce = await NFTRedemption.seedNonce(deployer);
//       console.log('seedNonce:', seedNonce);
//       const hash = ethers.utils.solidityKeccak256(
//         ['address', 'address', 'uint256', 'uint256', 'uint256'],
//         [sender, contractAddress, quantity, ticket_type, seedNonce]
//       );
//       const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
//       return signature;
//     };
//     const fuseSig = await signOrderPayload(payload);

//     //pausing the redeem
//     await NFTRedemption.connect(owner).pause();

//     //redeeming gold ticket
//     await expect(NFTRedemption.connect(owner).redeemTicket(1, 1, fuseSig)).to.be.revertedWith('Pausable: paused');

//     //printing the list of token that got minted
//     const tokenList = await cdhNftInteraction.getAllTokens(owner.address);
//     console.log('minted token from gold ticket are: ', tokenList);
//   });

//   it('should redeem a silver ticket', async function () {
//     const {NFTRedemption, addr1, silver_deployer, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

//     const payload = {
//       sender: silver_deployer,
//       contractAddress: NFTRedemption.address,
//       quantity: 1,
//       ticket_type: 2,
//     };

//     const signOrderPayload = async (payload) => {
//       let {sender, contractAddress, quantity, ticket_type} = payload;
//       const seedNonce = await NFTRedemption.seedNonce(silver_deployer);
//       console.log('seedNonce:', seedNonce);
//       const hash = ethers.utils.solidityKeccak256(
//         ['address', 'address', 'uint256', 'uint256', 'uint256'],
//         [sender, contractAddress, quantity, ticket_type, seedNonce]
//       );
//       const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
//       return signature;
//     };

//     const fuseSig = await signOrderPayload(payload);
//     const txn_LAST = await NFTRedemption.connect(addr1).redeemTicket(2, 1, fuseSig);
//     const receipt = await txn_LAST.wait();
//     const tokenList = await cdhNftInteraction.getAllTokens(addr1.address);
//   });

//   it('should redeem a bronze ticket', async function () {
//     const {NFTRedemption, addr2, bronze_deployer, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);
//     const payload = {
//       sender: bronze_deployer,
//       contractAddress: NFTRedemption.address,
//       quantity: 1,
//       ticket_type: 3,
//     };

//     const signOrderPayload = async (payload) => {
//       let {sender, contractAddress, quantity, ticket_type} = payload;
//       const seedNonce = await NFTRedemption.seedNonce(bronze_deployer);
//       console.log('seedNonce:', seedNonce);
//       const hash = ethers.utils.solidityKeccak256(
//         ['address', 'address', 'uint256', 'uint256', 'uint256'],
//         [sender, contractAddress, quantity, ticket_type, seedNonce]
//       );
//       const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
//       return signature;
//     };

//     const fuseSig = await signOrderPayload(payload);

//     const txn_LAST = await NFTRedemption.connect(addr2).redeemTicket(3, 1, fuseSig);
//     const receipt = await txn_LAST.wait();
//     const tokenList = await cdhNftInteraction.getAllTokens(addr2.address);
//   });

//   it('should not be redeem a ticket if ticket type is zero', async function () {
//     const {NFTRedemption, deployer, owner, randomWallet} = await loadFixture(deployContract);

//     //creating a payload for gold ticket which is ticket type 1 and of quantity 1
//     const payload = {
//       sender: deployer,
//       contractAddress: NFTRedemption.address,
//       quantity: 1,
//       ticket_type: 1,
//     };

//     //creating a signature
//     const signOrderPayload = async (payload) => {
//       let {sender, contractAddress, quantity, ticket_type} = payload;
//       const seedNonce = await NFTRedemption.seedNonce(deployer);
//       console.log('seedNonce:', seedNonce);
//       const hash = ethers.utils.solidityKeccak256(
//         ['address', 'address', 'uint256', 'uint256', 'uint256'],
//         [sender, contractAddress, quantity, ticket_type, seedNonce]
//       );
//       const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
//       return signature;
//     };
//     const fuseSig = await signOrderPayload(payload);

//     //redeeming gold ticket
//     await expect(NFTRedemption.connect(owner).redeemTicket(0, 1, fuseSig)).to.be.revertedWith('NFTRedemption: Ticket Not Found');
//   });
// });
