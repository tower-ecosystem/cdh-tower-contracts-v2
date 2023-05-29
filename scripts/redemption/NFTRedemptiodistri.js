const {expect} = require('chai');
const {ethers, artifacts} = require('hardhat');
var fs = require('fs');
const {loadFixture} = require('@nomicfoundation/hardhat-network-helpers');
const fsPromises = fs.promises;

describe('NFT Redemption contract', function () {
  async function deployContract() {
    //making signers ready
    const [owner, addr1, addr2, addr3, lastAddr] = await ethers.getSigners();

    let privateKey = '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';
    let randomWallet = new ethers.Wallet(privateKey);
    let silver_deployer = addr1.address;
    let bronze_deployer = addr2.address;
    const deployer = owner.address;

    // using locally deployed contract address to use in constructor of NFTRedemption contract
    const cdhNft = '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9';
    const cdhNft_path = 'abi/CDHInventory.json';
    const towerInventory = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318';
    const towerInventory_path = 'abi/TowerInventory.json';
    const equipmentPool = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const heroPool = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    const spellPool = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
    const towerPool = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
    const blackHoleContract = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';
    const randomNumberSender = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

    /// getting contract factory of NFTRedemption
    const NFTRedemptionCFactory = await ethers.getContractFactory('NFTRedemption');
    // we use their address as parameters for the NFTRedemption
    const NFTRedemption = await NFTRedemptionCFactory.deploy(
      cdhNft,
      towerInventory,
      equipmentPool,
      heroPool,
      spellPool,
      towerPool,
      blackHoleContract,
      randomNumberSender
    );
    await NFTRedemption.deployed();

    const towerInventoryData = await fsPromises.readFile(towerInventory_path, 'utf8');
    const towerInventoryabi = JSON.parse(towerInventoryData)['abi'];
    const towerInventoryInteraction = new ethers.Contract(towerInventory, towerInventoryabi, owner);
    // setting approval for all in the TOwerTreasury contract to the NFTRedemption
    let tx1 = await towerInventoryInteraction.setApprovalForAll(NFTRedemption.address, true);

    //minting tickets for NFTRedemptio
    await towerInventoryInteraction.batchMint([1], [10], deployer);
    await towerInventoryInteraction.batchMint([2], [10], silver_deployer);
    await towerInventoryInteraction.batchMint([3], [10], bronze_deployer);

    // setting approval for all in the TOwerTreasury contract to the NFTRedemption from another address
    const towerInventoryInteraction_Silver = new ethers.Contract(towerInventory, towerInventoryabi, addr1);
    let tx2 = await towerInventoryInteraction_Silver.setApprovalForAll(NFTRedemption.address, true);

    // setting approval for all in the TOwerTreasury contract to the NFTRedemption from another address
    const towerInventoryInteraction_Bronze = new ethers.Contract(towerInventory, towerInventoryabi, addr2);
    let tx3 = await towerInventoryInteraction_Bronze.setApprovalForAll(NFTRedemption.address, true);

    const cdhNftData = await fsPromises.readFile(cdhNft_path, 'utf8');
    const cdhNftabi = JSON.parse(cdhNftData)['abi'];
    const cdhNftInteraction = new ethers.Contract(cdhNft, cdhNftabi, owner);

    //giving minter role to NFTRedemption from cdhInventory contract
    const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6';
    let tx4 = await cdhNftInteraction.grantRole(MINTER_ROLE, NFTRedemption.address);

    return {
      NFTRedemption,
      cdhNft,
      towerInventory,
      deployer,
      owner,
      randomWallet,
      cdhNftInteraction,
      addr1,
      addr2,
      silver_deployer,
      bronze_deployer,
      addr3,
    };
  }

  it('should redeem a gold ticket', async function () {
    const {NFTRedemption, deployer, owner, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

    //creating payload
    const payload = {
      sender: deployer,
      contractAddress: NFTRedemption.address,
      quantity: 1,
      ticket_type: 1,
    };

    //redeeming 1000 tickets
    for (i = 0; i < 10000; i++) {
      const signOrderPayload = async (payload) => {
        let {sender, contractAddress, quantity, ticket_type} = payload;
        const seedNonce = i;
        console.log('seedNonce:', seedNonce);
        const hash = ethers.utils.solidityKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'uint256'],
          [sender, contractAddress, quantity, ticket_type, seedNonce]
        );
        const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
        return signature;
      };

      const fuseSig = await signOrderPayload(payload);

      const txn_LAST = await NFTRedemption.connect(owner).redeemTicket(1, 1, fuseSig);
      const receipt = await txn_LAST.wait();
    }

    //getting tokens that are minted after redeeming ticket in user wallet
    const tokenList = await cdhNftInteraction.getAllTokens(owner.address);

    //writing into json file
    const tokenInfoMapping = [];
    for (let tokenId of tokenList) {
      tokenId = tokenId.toString();
      const {rarity} = await cdhNftInteraction.info(tokenId);
      const rarityMapping = {'0x01': 'Common', '0x02': 'Rare', '0x03': 'Epic', '0x04': 'Legendary'};
      const poolMapping = {
        '0x3cfBdd70FA500e9CB7Ef8dFB1c0407032BbA9d21': 'Equipemnt',
        '0x548f55A4dbDC965BB7107827A2ab04F444502bCc': 'Hero',
        '0x329dcF128fDd22C1aD2397f4Ccd6CdC25E098CA6': 'Spell',
        '0xdd77AcD78d5847c78D05289aD8cB40ddCF04C458': 'Tower',
      };
      const pool = await cdhNftInteraction['pool(uint256)'](tokenId);
      tokenInfoMapping.push({tokenId, rarity: rarityMapping[rarity], pool: poolMapping[pool]});
    }
    fs.writeFileSync('tokenInfoGold.json', JSON.stringify(tokenInfoMapping));
  });

  it('should redeem a silver ticket', async function () {
    const {NFTRedemption, addr1, silver_deployer, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

    //creating payload
    const payload = {
      sender: silver_deployer,
      contractAddress: NFTRedemption.address,
      quantity: 1,
      ticket_type: 2,
    };

    //redeeming 1000 tickets
    for (i = 0; i < 1000; i++) {
      const signOrderPayload = async (payload) => {
        let {sender, contractAddress, quantity, ticket_type} = payload;
        const seedNonce = i;
        console.log('seedNonce:', seedNonce);
        const hash = ethers.utils.solidityKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'uint256'],
          [sender, contractAddress, quantity, ticket_type, seedNonce]
        );
        const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
        return signature;
      };

      const fuseSig = await signOrderPayload(payload);
      const txn_LAST = await NFTRedemption.connect(addr1).redeemTicket(2, 1, fuseSig);
      const receipt = await txn_LAST.wait();
    }

    //getting tokens that are minted after redeeming ticket in user wallet
    const tokenList = await cdhNftInteraction.getAllTokens(addr1.address);

    //writing into json file
    const tokenInfoMapping = [];
    for (let tokenId of tokenList) {
      tokenId = tokenId.toString();
      const {rarity} = await cdhNftInteraction.info(tokenId);
      const rarityMapping = {'0x01': 'Common', '0x02': 'Rare', '0x03': 'Epic', '0x04': 'Legendary'};
      const poolMapping = {
        '0x3cfBdd70FA500e9CB7Ef8dFB1c0407032BbA9d21': 'Equipemnt',
        '0x548f55A4dbDC965BB7107827A2ab04F444502bCc': 'Hero',
        '0x329dcF128fDd22C1aD2397f4Ccd6CdC25E098CA6': 'Spell',
        '0xdd77AcD78d5847c78D05289aD8cB40ddCF04C458': 'Tower',
      };

      const pool = await cdhNftInteraction['pool(uint256)'](tokenId);
      tokenInfoMapping.push({tokenId, rarity: rarityMapping[rarity], pool: poolMapping[pool]});
    }
    fs.writeFileSync('tokenInfoSilver.json', JSON.stringify(tokenInfoMapping));
  });

  it('should redeem a bronze ticket', async function () {
    const {NFTRedemption, addr2, bronze_deployer, randomWallet, cdhNftInteraction} = await loadFixture(deployContract);

    //creating payload
    const payload = {
      sender: bronze_deployer,
      contractAddress: NFTRedemption.address,
      quantity: 1,
      ticket_type: 3,
    };

    //redeeming 1000 tickets
    for (i = 0; i < 1000; i++) {
      const signOrderPayload = async (payload) => {
        let {sender, contractAddress, quantity, ticket_type} = payload;
        const seedNonce = i;
        console.log('seedNonce:', seedNonce);
        const hash = ethers.utils.solidityKeccak256(
          ['address', 'address', 'uint256', 'uint256', 'uint256'],
          [sender, contractAddress, quantity, ticket_type, seedNonce]
        );
        const signature = await randomWallet.signMessage(ethers.utils.arrayify(hash));
        return signature;
      };

      const fuseSig = await signOrderPayload(payload);

      const txn_LAST = await NFTRedemption.connect(addr2).redeemTicket(3, 1, fuseSig);
      const receipt = await txn_LAST.wait();
    }

    //getting tokens that are minted after redeeming ticket in user wallet
    const tokenList = await cdhNftInteraction.getAllTokens(addr2.address);

    //writing into json file
    const tokenInfoMapping = [];
    for (let tokenId of tokenList) {
      tokenId = tokenId.toString();
      const {rarity} = await cdhNftInteraction.info(tokenId);
      const rarityMapping = {'0x01': 'Common', '0x02': 'Rare', '0x03': 'Epic', '0x04': 'Legendary'};
      const poolMapping = {
        '0x3cfBdd70FA500e9CB7Ef8dFB1c0407032BbA9d21': 'Equipemnt',
        '0x548f55A4dbDC965BB7107827A2ab04F444502bCc': 'Hero',
        '0x329dcF128fDd22C1aD2397f4Ccd6CdC25E098CA6': 'Spell',
        '0xdd77AcD78d5847c78D05289aD8cB40ddCF04C458': 'Tower',
      };

      const pool = await cdhNftInteraction['pool(uint256)'](tokenId);
      tokenInfoMapping.push({tokenId, rarity: rarityMapping[rarity], pool: poolMapping[pool]});
    }
    fs.writeFileSync('tokenInfoBronze.json', JSON.stringify(tokenInfoMapping));
  });
});
