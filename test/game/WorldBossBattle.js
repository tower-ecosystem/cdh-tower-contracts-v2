const {expect} = require('chai');
const {ethers, upgrades} = require('hardhat');
const {ConfigMissingError} = require('solhint/lib/common/errors');

describe('WorldBattleBoss contract', function () {
  let cdhInventoryFactory, towerTokenFactory, WorldBossBattleFactory, GameAccessControlsFactory, WBBActionsFactory;

  let cdhInventory, towerToken, GameAccessControlsContract, WBBActionsContract;

  let WorldBossBattleContract;

  let account1, account2, nftHolder, deployer, nullAddress;
  const timestampStartDate = Math.floor(Date.now() / 1000);
  const timestampEndDate = Math.floor(Date.now() / 1000 + 60 * 60 * 5);

  beforeEach(async function () {
    [owner, addr1, addr2, steal, lastAddr, newTokenAddress] = await ethers.getSigners();
    deployer = owner.address;
    nullAddress = '0x0000000000000000000000000000000000000000';
    account1 = addr1.address;
    account2 = addr2.address;
    stealAddress = steal.address;

    /*;
     * step1 : getting artifacts of cdhInventory, ERC20Mock, GameAccessControls, WBBActions, WorldBossBatlle
     * step2: deploy cdhInventory, ERC20Mock, GameAccessControls contracts
     * step3: use GameAccessControls to deploy upgradable WBBActions
     * step4: use cdhInventory, ERC20Mock, nftHolder address, signer address, maxStakeCount, WBBActions address, 
     *          GameAccessControls address to deploy upgradable WBB
     * step5: set Approval for cdhInventory Contract
     * step6: minting NFT from cdhInventory
     * step7: minting towerToken
     * step8: create new Boss //migration scripts
     * step9: create new Battle //migration scripts
     * step10: stake
     * step11: unstake

     */
    /// factories

    cdhInventoryFactory = await ethers.getContractFactory('ERC1155Mock');
    towerTokenFactory = await ethers.getContractFactory('ERC20Mock');
    GameAccessControlsFactory = await ethers.getContractFactory('GameAccessControls');
    WBBActionsFactory = await ethers.getContractFactory('WBBActions');
    WorldBossBattleFactory = await ethers.getContractFactory('WorldBossBattle');

    /// nft and the token are being deployed
    cdhInventory = await cdhInventoryFactory.deploy();
    towerToken = await towerTokenFactory.deploy();
    GameAccessControlsContract = await GameAccessControlsFactory.deploy();
    WBBActionsContract = await upgrades.deployProxy(WBBActionsFactory, [GameAccessControlsContract.address], {initializer: 'initialize'});

    await cdhInventory.deployed();
    await towerToken.deployed();
    await GameAccessControlsContract.deployed();
    await WBBActionsContract.deployed();

    // we use their address as parameters for the Staking system
    WorldBossBattleContract = await upgrades.deployProxy(
      WorldBossBattleFactory,
      [cdhInventory.address, towerToken.address, 100, WBBActionsContract.address, GameAccessControlsContract.address],
      {initializer: 'initialize'}
    );

    await WorldBossBattleContract.deployed();
    nftHolder = WorldBossBattleContract.address;

    // setting approval for all in the nft contract to the staking system contract
    await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);
  });

  describe('Pause/Unpause contract', function () {
    it('should pause contract by owner', async function () {
      await WorldBossBattleContract.connect(owner).pause();
      await expect(await WorldBossBattleContract.connect(owner).paused()).to.equal(true);
    });
    it('should NOT pause contract by other', async function () {
      await expect(WorldBossBattleContract.connect(addr1).pause()).to.be.revertedWith('WBB: Unauthorized');
    });
  });

  describe('Set Token', function () {
    it('should set token', async function () {
      await WorldBossBattleContract.connect(owner).setToken(towerToken.address);
      expect(await WorldBossBattleContract.tokenAddress()).to.equal(towerToken.address);
    });
    it('should not set 0 Address', async function () {
      await expect(WorldBossBattleContract.connect(owner).setToken(nullAddress)).to.be.revertedWith('WBB: Invalid token address');
    });

    it('other address should not set token', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setToken(towerToken.address)).to.be.revertedWith('WBB: Unauthorized');
    });

    it('should emit SetTokenContract event', async function () {
      [newTokenAddress] = await ethers.getSigners();
      await expect(WorldBossBattleContract.connect(owner).setToken(newTokenAddress.address))
        .to.emit(WorldBossBattleContract, 'SetTokenContract')
        .withArgs(towerToken.address, newTokenAddress.address, owner.address);
    });
  });

  describe('Set CDH Inventory Address', function () {
    it('should CDH Inventory address', async function () {
      await WorldBossBattleContract.connect(owner).setCDHNFTContractAddress(cdhInventory.address);
      expect(await WorldBossBattleContract.cdhNFT()).to.equal(cdhInventory.address);
    });

    it('other address should not set cdh inventory address', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setCDHNFTContractAddress(cdhInventory.address)).to.be.revertedWith('WBB: Unauthorized');
    });

    it('should not set 0 Address', async function () {
      await expect(WorldBossBattleContract.connect(owner).setCDHNFTContractAddress(nullAddress)).to.be.revertedWith('WBB: Invalid NFT contract');
    });

    it('should emit SetNFTContract event', async function () {
      [newCDHInventoryAddress] = await ethers.getSigners();
      await expect(WorldBossBattleContract.connect(owner).setCDHNFTContractAddress(newCDHInventoryAddress.address))
        .to.emit(WorldBossBattleContract, 'SetNFTContract')
        .withArgs(cdhInventory.address, newCDHInventoryAddress.address, owner.address);
    });
  });

  describe('Set WBB Actions Address', function () {
    it('should WBB Actions address', async function () {
      await WorldBossBattleContract.connect(owner).setWBBActionsContract(WBBActionsContract.address);
      expect(await WorldBossBattleContract.wbbActions()).to.equal(WBBActionsContract.address);
    });

    it('other address should not set WBB Actions address', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setWBBActionsContract(WBBActionsContract.address)).to.be.revertedWith('WBB: Unauthorized');
    });

    it('should not set 0 Address', async function () {
      await expect(WorldBossBattleContract.connect(owner).setWBBActionsContract(nullAddress)).to.be.revertedWith('WBB: Invalid Actions contract');
    });

    it('should emit SetWBBActionsAddress event', async function () {
      [newWBBActionsAddress] = await ethers.getSigners();
      await expect(WorldBossBattleContract.connect(owner).setWBBActionsContract(newWBBActionsAddress.address))
        .to.emit(WorldBossBattleContract, 'SetWBBActionsAddress')
        .withArgs(WBBActionsContract.address, newWBBActionsAddress.address, owner.address);
    });
  });
  describe('Set max stake count', function () {
    it('should set max state count', async function () {
      await WorldBossBattleContract.connect(owner).setMaxStakeCount(100);
      expect(await WorldBossBattleContract.maxStakeCount()).to.equal(100);
    });

    it('other address should not set WBB Actions address', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setMaxStakeCount(100)).to.be.revertedWith('WBB: Unauthorized');
    });

    it('should emit SetMaxStakeCount event', async function () {
      let newMaxStakeCount = 10;
      await expect(WorldBossBattleContract.connect(owner).setMaxStakeCount(newMaxStakeCount))
        .to.emit(WorldBossBattleContract, 'SetMaxStakeCount')
        .withArgs(100, newMaxStakeCount, owner.address);
    });
  });
  describe('Set cool down period ', function () {
    it('should set cool down period', async function () {
      await WorldBossBattleContract.connect(owner).setCoolDownPeriod(3600);
      expect(await WorldBossBattleContract.cooldownPeriod()).to.equal(3600);
    });

    it('other address should not set WBB Actions address', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setCoolDownPeriod(3600)).to.be.revertedWith('WBB: Unauthorized');
    });

    it('should emit SetCoolDownPeriod event', async function () {
      let newMaxStakePeriod = 600;
      await expect(WorldBossBattleContract.connect(owner).setCoolDownPeriod(newMaxStakePeriod))
        .to.emit(WorldBossBattleContract, 'SetCoolDownPeriod')
        .withArgs(0, newMaxStakePeriod, owner.address);
    });
  });

  describe('Set battle period stake status ', function () {
    it('should set battle period stake status', async function () {
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      expect(await WorldBossBattleContract.enableBattlePeriodUnstake()).to.equal(true);
    });

    it('other address should not set battle period stake status', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setBattlePeriodUnstakeStatus(true)).to.be.revertedWith('WBB: Unauthorized');
    });
  });
  describe('Set minimum tokens required to stake', function () {
    it('should set minimum tokens required to stake', async function () {
      await WorldBossBattleContract.connect(owner).setMinTokensRequired(1000);
      expect(await WorldBossBattleContract.minTokensRequired()).to.equal(1000);
    });

    it('other address should not set minimum tokens required to stake', async function () {
      await expect(WorldBossBattleContract.connect(addr1).setMinTokensRequired(1000)).to.be.revertedWith('WBB: Unauthorized');
    });
  });
  describe('Others', function () {
    it('get latest battle', async function () {
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], 1672720942, 1675378612);

      let latestBattle = await WorldBossBattleContract.latestBattle();
      await expect(latestBattle).to.equal('1');
    });
    it('check required tokens is valid', async function () {
      let nftCount = 4;
      let balanceAvailable = nftCount * 100 * 10 ** 18;

      let validTokenBalanceToStake = await WorldBossBattleContract.checkRequiredTokenBalance(nftCount, balanceAvailable.toString());
      await expect(validTokenBalanceToStake).to.equal(true);
    });
  });
  ``;

  describe('Stake NFT', function () {
    it('Should stake an nft', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking token in battle
      await WorldBossBattleContract.connect(owner).stake(1, '1');

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      // expect(await cdhInventory.balanceOf(lastAddress, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));
    });

    it('Should stake array of nft', async function () {
      //mint 3 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);
      await cdhInventory.mint(deployer, 2, 1, 0x00);
      await cdhInventory.mint(deployer, 3, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(owner).stakeTokens([1, 2, 3], '1');

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(1);
    });

    it('cannot stake more than owning', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      await expect(WorldBossBattleContract.connect(owner).stake(2, '1')).to.be.revertedWith('ERC1155: insufficient balance for transfer');
    });

    describe('check if player is eligible to Stake', function () {
      it('eligible', async function () {
        await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
        await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);
        await WBBActionsContract.connect(owner).createBattle('2', ['0'], timestampEndDate + 3000, timestampEndDate + 8000);

        let latestBattle = await WorldBossBattleContract.latestBattle();
        await expect(latestBattle).to.equal('2');

        await cdhInventory.mint(deployer, 1, 1, 0x00);
        await towerToken.mint(deployer, '1000000000000000000000');
        await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);
        await WorldBossBattleContract.connect(owner).stake(1, '1');

        expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
        expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

        let isEligibleInContract = await WorldBossBattleContract.isEligibleToStake('1', owner.address);
        // TODO
        // expect(isEligibleInContract).to.equal(true);

        // overall eligibility to stake

        // eligibility to stake with other address
      });
    });

    describe('Stake : Paused contract', function () {
      it('should not stake when it is paused', async function () {
        //mint 1 nfts
        await cdhInventory.mint(deployer, 1, 1, 0x00);

        //minting Tower Tokens from NormalERC20
        await towerToken.mint(deployer, '1000000000000000000000');

        //creating boss
        await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
        //creating battle
        await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

        await WorldBossBattleContract.connect(owner).pause();
        //staking token in battle
        await expect(WorldBossBattleContract.connect(owner).stake(1, '1')).to.be.revertedWith('Pausable: paused');
      });
    });
  });

  // describe('Restake NFT', async function () {
  //   it('should not be re-staked with wrong address', async function () {
  //     //mint 1 nfts
  //     await cdhInventory.mint(deployer, 1, 1, 0x00);

  //     //minting Tower Tokens from NormalERC20
  //     await towerToken.mint(deployer, '1000000000000000000000');

  //     // we need the staker to setApproval for all to the staking system contract
  //     await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

  //     //creating boss
  //     await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
  //     //creating battle
  //     await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

  //     //staking token with BattleID
  //     await WorldBossBattleContract.connect(owner).stake(1, '1');

  //     expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
  //     expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

  //     //restaking with wrong address
  //     await expect(WorldBossBattleContract.connect(addr1).restake(3, '1')).to.be.revertedWith('WBB: Unauthorized.');
  //   });
  //   it('Should restake an nft', async function () {
  //     //mint 1 nfts
  //     await cdhInventory.mint(deployer, 1, 1, 0x00);

  //     //minting Tower Tokens from NormalERC20
  //     await towerToken.mint(deployer, '1000000000000000000000');

  //     //creating boss
  //     await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
  //     //creating battle
  //     await WBBActionsContract.connect(owner).createBattle('BATTLE99', ['0'], timestampStartDate, timestampEndDate);

  //     //staking token in battle
  //     await WorldBossBattleContract.connect(owner).stake(1, 'BATTLE99');

  //     await WorldBossBattleContract.connect(owner).restake(1, 'BATTLE99');

  //     expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
  //     expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
  //   });
  // });

  describe('WB Battle Operations ', function () {
    it('Should not create battle if boss is not created', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      //stake 1 token
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      await expect(WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate)).to.be.revertedWith(
        'WBB: boss not created'
      );
    });
    it('Should create a boss from another wallet which has admin access', async function () {
      //mint 1 nfts

      await cdhInventory.mint(account2, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(account2, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr2).setApprovalForAll(WorldBossBattleContract.address, true);

      await GameAccessControlsContract.connect(owner).addAdminRole(account1);

      // get manager role
      const manager_role = await GameAccessControlsContract.MANAGER_ROLE();

      // grant manager role
      await GameAccessControlsContract.connect(owner).grantRole(manager_role, addr1.address);

      // creating boss
      await WBBActionsContract.connect(addr1).createBoss('0', 'abc', 100, 'abc');

      // creating battle
      await WBBActionsContract.connect(addr1).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      await WorldBossBattleContract.connect(addr2).stake(1, '1');

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await WorldBossBattleContract.connect(addr2).unstake(1, '1');
    });
    it('Should upgrade contract and do previous work', async function () {
      const WorldbattlebossV2 = await ethers.getContractFactory('WorldBossBattleV2');
      upgradedContract = await upgrades.upgradeProxy(WorldBossBattleContract, WorldbattlebossV2, {call: {fn: 'reInitialize'}});

      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //setting the mimimum token required
      await upgradedContract.connect(owner).setMinTokensRequired(10);
      // console.log('minimum token required: ', await upgradedContract.minTokensRequired());

      //staking token
      await upgradedContract.connect(owner).stake(1, '1');
      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking token
      await upgradedContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      expect(await upgradedContract.connect(owner).unstake(1, '1'));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(0);
    });
  });

  describe('Unstake NFT ', function () {
    it('Should unstake an nft', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking token
      await WorldBossBattleContract.connect(owner).stake(1, '1');
      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking token
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      expect(await WorldBossBattleContract.connect(owner).unstake(1, '1'));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(0);
    });

    it('Should unstake array of nft', async function () {
      //mint 3 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);
      await cdhInventory.mint(deployer, 2, 1, 0x00);
      await cdhInventory.mint(deployer, 3, 1, 0x00);
      await cdhInventory.mint(deployer, 4, 1, 0x00);
      await cdhInventory.mint(deployer, 5, 1, 0x00);
      await cdhInventory.mint(deployer, 6, 1, 0x00);
      await cdhInventory.mint(deployer, 7, 1, 0x00);
      await cdhInventory.mint(deployer, 8, 1, 0x00);
      await cdhInventory.mint(deployer, 9, 1, 0x00);
      await cdhInventory.mint(deployer, 10, 1, 0x00);
      await cdhInventory.mint(deployer, 11, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(owner).stakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], '1');
      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      expect(await WorldBossBattleContract.connect(owner).unstakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], '1'));
      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(deployer, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(deployer, 3)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(0);
    });

    it('Should verify the address while unstaking an nft', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking tokenID with battleID
      await WorldBossBattleContract.connect(owner).stake(1, '1');

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking with wrong tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await expect(WorldBossBattleContract.connect(addr2).unstake(1, '1')).to.be.revertedWith('WBB: Unauthorized.');
      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
    });

    it('Should verify the token while unstaking an nft', async function () {
      //mint 1 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking with tokenID with battleID
      await WorldBossBattleContract.connect(owner).stake(1, '1');

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking with wrong tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await expect(WorldBossBattleContract.connect(addr1).unstake(2, '1')).to.be.revertedWith('WBB: Unauthorized.');
      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
    });

    it('Should not unstake if cooldown period not over', async function () {
      //mint 1 nfts

      await cdhInventory.mint(deployer, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      await WorldBossBattleContract.connect(owner).setCoolDownPeriod(3500);

      await WorldBossBattleContract.connect(owner).stake(1, '1');

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);

      await ethers.provider.send('evm_increaseTime', [3600]);
      await ethers.provider.send('evm_mine');

      await WorldBossBattleContract.connect(owner).unstake(1, '1');
    });

    it('Should stake and unstake array of nft again stake then unstake', async function () {
      //mint 3 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);
      await cdhInventory.mint(deployer, 2, 1, 0x00);
      await cdhInventory.mint(deployer, 3, 1, 0x00);
      await cdhInventory.mint(deployer, 4, 1, 0x00);
      await cdhInventory.mint(deployer, 5, 1, 0x00);
      await cdhInventory.mint(deployer, 6, 1, 0x00);
      await cdhInventory.mint(deployer, 7, 1, 0x00);
      await cdhInventory.mint(deployer, 8, 1, 0x00);
      await cdhInventory.mint(deployer, 9, 1, 0x00);
      await cdhInventory.mint(deployer, 10, 1, 0x00);
      await cdhInventory.mint(deployer, 11, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('BOSS1', 'abc', 100, 'abc');

      //creating battle
      await WBBActionsContract.connect(owner).createBattle('BATTLE1', ['BOSS1'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(owner).stakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'BATTLE1');

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await WorldBossBattleContract.connect(owner).unstakeTokens([7, 8, 9, 10, 11], 'BATTLE1');

      await WorldBossBattleContract.connect(owner).stake(7, 'BATTLE1');

      await WorldBossBattleContract.connect(owner).stakeTokens([8, 9, 10, 11], 'BATTLE1');

      await WorldBossBattleContract.connect(owner).unstakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'BATTLE1');
    });

    it('Should unstakeAllInternal nft', async function () {
      //mint 3 nfts
      await cdhInventory.mint(account1, 1, 1, 0x00);
      await cdhInventory.mint(account1, 2, 1, 0x00);
      await cdhInventory.mint(account1, 3, 1, 0x00);
      await cdhInventory.mint(account1, 4, 1, 0x00);
      await cdhInventory.mint(account1, 5, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(account1, '1000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(addr1).stakeTokens([1, 2, 3, 4, 5], '1');

      expect(await cdhInventory.balanceOf(account1, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 4)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 5)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 4)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 5)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await WorldBossBattleContract.connect(owner).unstakeAllInternal(account1, '1');

      expect(await cdhInventory.balanceOf(account1, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 3)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 4)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 5)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 4)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 5)).to.equal(0);
    });

    it('Should unstakeAllInternal 50 nft', async function () {
      //mint 3 nfts
      const tokenIds = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38,
        39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
      ];
      const amounts = [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1,
      ];
      await cdhInventory.mintBatch(account1, tokenIds, amounts, '0x00');

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(account1, '100000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('boss1', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('battle1', ['boss1'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(addr1).stakeTokens(tokenIds, 'battle1');

      expect(await cdhInventory.balanceOf(account1, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 4)).to.equal(0);
      expect(await cdhInventory.balanceOf(account1, 5)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 4)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 5)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await WorldBossBattleContract.connect(owner).unstakeAllInternal(account1, 'battle1');

      expect(await cdhInventory.balanceOf(account1, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 3)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 4)).to.equal(1);
      expect(await cdhInventory.balanceOf(account1, 5)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 4)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 5)).to.equal(0);
    });

    it('Should not unstake an nft with wrong address', async function () {
      //mint 1 nfts
      await cdhInventory.mint(account1, 1, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(account1, '1000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('boss1', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('BATTLE1', ['boss1'], timestampStartDate, timestampEndDate);

      //staking token
      await WorldBossBattleContract.connect(addr1).stake(1, 'BATTLE1');
      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));

      expect(await cdhInventory.balanceOf(account1, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking token
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await expect(WorldBossBattleContract.connect(steal).unstakeAll('BATTLE1')).to.be.revertedWith("WBB: NFTs aren't staked");
    });

    it('Should not unstake array of nft by other address', async function () {
      //mint 3 nfts
      await cdhInventory.mint(deployer, 1, 1, 0x00);
      await cdhInventory.mint(deployer, 2, 1, 0x00);
      await cdhInventory.mint(deployer, 3, 1, 0x00);
      await cdhInventory.mint(deployer, 4, 1, 0x00);
      await cdhInventory.mint(deployer, 5, 1, 0x00);
      await cdhInventory.mint(deployer, 6, 1, 0x00);
      await cdhInventory.mint(deployer, 7, 1, 0x00);
      await cdhInventory.mint(deployer, 8, 1, 0x00);
      await cdhInventory.mint(deployer, 9, 1, 0x00);
      await cdhInventory.mint(deployer, 10, 1, 0x00);
      await cdhInventory.mint(deployer, 11, 1, 0x00);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(deployer, '1000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(owner).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('1', ['0'], timestampStartDate, timestampEndDate);

      //staking an array of tokenID
      await WorldBossBattleContract.connect(owner).stakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], '1');
      // console.log('list of stakerAddress:', await WorldBossBattleContract.stakersAddress(0));
      // console.log('token Owner:', await WorldBossBattleContract.tokenOwner(1));
      // console.log('tokenToBattleId: ', await WorldBossBattleContract.tokenToBattleId(1));

      expect(await cdhInventory.balanceOf(deployer, 1)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 2)).to.equal(0);
      expect(await cdhInventory.balanceOf(deployer, 3)).to.equal(0);
      expect(await cdhInventory.balanceOf(nftHolder, 1)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 2)).to.equal(1);
      expect(await cdhInventory.balanceOf(nftHolder, 3)).to.equal(1);

      //giving permisson for worldbossbattlecontract from lastaddr
      await cdhInventory.connect(lastAddr).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await expect(WorldBossBattleContract.connect(steal).unstakeTokens([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], '1')).to.be.revertedWith(
        'WBB: Unauthorized.'
      );
    });

    it('Should unstake nft of other user by manager', async function () {
      //mint 3 nfts
      await cdhInventory.mint(account1, 1, 1, 0x00);
      expect(await cdhInventory.balanceOf(addr1.address, 1)).to.equal(1);

      //minting Tower Tokens from NormalERC20
      await towerToken.mint(account1, '1000000000000000000000000');

      // we need the staker to setApproval for all to the staking system contract
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //creating boss
      await WBBActionsContract.connect(owner).createBoss('0', 'abc', 100, 'abc');
      //creating battle
      await WBBActionsContract.connect(owner).createBattle('BATTLE1', ['0'], timestampStartDate, timestampEndDate);

      //staking token
      await WorldBossBattleContract.connect(addr1).stake(1, 'BATTLE1');

      expect(await cdhInventory.balanceOf(addr1.address, 1)).to.equal(0);
      await cdhInventory.connect(addr1).setApprovalForAll(WorldBossBattleContract.address, true);

      //unstaking an array of tokenID
      await WorldBossBattleContract.connect(owner).setBattlePeriodUnstakeStatus(true);
      await WorldBossBattleContract.connect(owner).unstakeTokensInternal(addr1.address, [1], 'BATTLE1');
      expect(await cdhInventory.balanceOf(addr1.address, 1)).to.equal(1);
    });
  });
});
