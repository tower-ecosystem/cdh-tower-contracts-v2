const {expect} = require("chai");
const {ethers} = require('hardhat');
const Web3 = require('web3');
const web3 = new Web3("http://127.0.0.1:8545");
const {CONTRACTS_CONFIGURATION} = require("./scripts/genarateSig.js");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");


///onlyOnce

describe("NFT Redemption contract", async function () {
  let NFTRedemptionCFactory, cdhNftCFactory, towerInventoryCFactory, equipmentPoolCFactory, heroPoolCFactory, spellPoolCFactory, towerPoolCFactory,
    blackHoleContract, randomNumberSender;

  let NFTRedemption, cdhNft, towerInventory, equipmentPool, heroPool, spellPool, towerPool;

  let account1, account2, lastAddress, deployer, nullAddress;

  async function deployContract() {

    [owner, addr1, addr2, randomWallet, lastAddr] = await ethers.getSigners();
    deployer = owner.address;
    nullAddress = "0x0000000000000000000000000000000000000000";
    account1 = addr1.address;
    account2 = addr2.address;
    randomNumberSender = randomWallet.address;
    blackHoleContract = lastAddr.address;

    /// factories

    NFTRedemptionCFactory = await ethers.getContractFactory("NFTRedemption");
    cdhNftCFactory = await ethers.getContractFactory("CdhNFT");
    towerInventoryCFactory = await ethers.getContractFactory("TowerInventory");
    equipmentPoolCFactory = await ethers.getContractFactory("EquipmentPool");
    heroPoolCFactory = await ethers.getContractFactory("HeroPool");
    spellPoolCFactory = await ethers.getContractFactory("SpellPool");
    towerPoolCFactory = await ethers.getContractFactory("TOWERPool");

    /// nft and the token are being deployed
    cdhNft = await cdhNftCFactory.deploy('uri');
    towerInventory = await towerInventoryCFactory.deploy('abc', 'abc', randomNumberSender, 'uri');
    equipmentPool = await equipmentPoolCFactory.deploy();
    heroPool = await heroPoolCFactory.deploy();
    spellPool = await spellPoolCFactory.deploy();
    towerPool = await towerPoolCFactory.deploy();

    await cdhNft.deployed();
    await towerInventory.deployed();
    await equipmentPool.deployed();
    await heroPool.deployed();
    await spellPool.deployed();
    await towerPool.deployed();


    // we use their address as parameters for the Staking system
    NFTRedemption = await NFTRedemptionCFactory.deploy(cdhNft.address,
      towerInventory.address,
      equipmentPool.address,
      heroPool.address,
      spellPool.address,
      towerPool.address,
      blackHoleContract,
      randomNumberSender
    );

    await NFTRedemption.deployed();

    // setting approval for all in the nft contract to the staking system contract
    await towerInventory.connect(owner).setApprovalForAll(NFTRedemption.address, true);

    await cdhNft.connect(owner).setApprovalForAll(NFTRedemption.address, true);

    return {NFTRedemption, cdhNft, towerInventory, equipmentPool, heroPool, spellPool, towerPool}

  }


  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=1 in Bronze ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 1;
      let rarity = await NFTRedemption._getProbabilisticRarityBronze(rarityProb, counter);
      console.log("Bronze rarity in", rarityProb, "is", rarity, "when counter is 1");
    })
  }
  ;


  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=2 and 3 in Bronze ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 2;
      let rarity = await NFTRedemption._getProbabilisticRarityBronze(rarityProb, counter);
      console.log("Bronze rarity in", rarityProb, "is", rarity, "when counter is 2 and 3");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=1 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 1;
      let rarity = await NFTRedemption._getProbabilisticRaritySilver(rarityProb, counter);
      console.log("Silver rarity in", rarityProb, "is", rarity, "when counter is 2 and 3");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=2 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 2;
      let rarity = await NFTRedemption._getProbabilisticRaritySilver(rarityProb, counter);
      console.log("Silver rarity in", rarityProb, "is", rarity, "when counter is 2 ");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=3 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 3;
      let rarity = await NFTRedemption._getProbabilisticRaritySilver(rarityProb, counter);
      console.log("Silver rarity in", rarityProb, "is", rarity, "when counter is 3");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=4 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 4;
      let rarity = await NFTRedemption._getProbabilisticRaritySilver(rarityProb, counter);
      console.log("Silver rarity in", rarityProb, "is", rarity, "when counter is 4");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=1 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 1;
      let rarity = await NFTRedemption._getProbabilisticRarityGold(rarityProb, counter);
      console.log("Gold rarity in", rarityProb, "is", rarity, "when counter is 1 and 2");
    })
  }

  for (let rarityProb = 1; rarityProb <= 100; rarityProb++) {
    it("should return rarity for counter=2 in Silver ticket}", async function () {
      const {NFTRedemption} = await loadFixture(deployContract);
      let counter = 3;
      let rarity = await NFTRedemption._getProbabilisticRarityGold(rarityProb, counter);
      console.log("Gold rarity in", rarityProb, "is", rarity, "when counter is 3,4,5 ");
    })
  }

});
