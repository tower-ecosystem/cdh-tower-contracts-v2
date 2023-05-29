const {expect} = require('chai');
const {ethers} = require('hardhat');

let redemptionContract;
let erc721MockContract;
let erc1155MockContract;
let erc20MockContract;
describe('Hero Points Redemption contract', async function () {
  beforeEach(async function () {
    const [owner, addr1] = await ethers.getSigners();
    const RedemptionContractFactory = await ethers.getContractFactory('HeroPointsERC1155Redemption');
    const ERC721MockContractFactory = await ethers.getContractFactory('ERC721Mock');
    const ERC1155MockContractFactory = await ethers.getContractFactory('ERC1155Mock');
    const ERC20MockContractFactory = await ethers.getContractFactory('ERC20Mock');
    redemptionContract = await RedemptionContractFactory.connect(addr1).deploy(owner.address);
    erc721MockContract = await ERC721MockContractFactory.deploy();
    erc1155MockContract = await ERC1155MockContractFactory.deploy();
    erc20MockContract = await ERC20MockContractFactory.deploy();
    await redemptionContract.deployed();
    await erc721MockContract.deployed();
    await erc1155MockContract.deployed();
    await erc20MockContract.deployed();
  });

  it('Verification of ERC1155 token redeemption', async function () {
    const [owner, addr1] = await ethers.getSigners();
    await erc1155MockContract.mint(owner.address, 1, 5, '0x00');
    expect(await erc1155MockContract.balanceOf(owner.address, 1)).to.equal(5);
    await redemptionContract.connect(addr1).setHolderToNFT(erc1155MockContract.address, owner.address);
    await erc1155MockContract.connect(owner).setApprovalForAll(redemptionContract.address, true);

    await expect(
      redemptionContract
        .connect(owner)
        .redeemHeroPoints(
          erc1155MockContract.address,
          1,
          1,
          1,
          '0xd410b8032d7547811fadcd68e637dd68490d79f200224e0fd7fc5707e9cc6fc92d91e5de238f079370694cb07ed90fb75b8f773e390e1d1651c0969caaa2593c1b'
        )
    )
      .to.emit(redemptionContract, 'NFTReedemed')
      .withArgs(erc1155MockContract.address, 1, 1, 1, owner.address);
  });

  it('Verification of ERC721 token redeemption', async function () {
    const [owner, addr1] = await ethers.getSigners();
    await erc721MockContract.safeMint(owner.address, 1);
    expect(await erc721MockContract.balanceOf(owner.address)).to.equal(1);
    await redemptionContract.connect(addr1).setHolderToNFT(erc721MockContract.address, owner.address);
    await erc721MockContract.connect(owner).approve(redemptionContract.address, 1);

    await expect(
      redemptionContract
        .connect(owner)
        .redeemHeroPoints(
          erc721MockContract.address,
          1,
          1,
          1,
          '0x38b85e427c7992142ef8e7bca7c59f86f1ca494f03ee07a2654f7602fd07d616267e677a949d2a06d4a31ec7ae81510f09128c502045d583f43d75550a77ff961c'
        )
    )
      .to.emit(redemptionContract, 'NFTReedemed')
      .withArgs(erc721MockContract.address, 1, 1, 1, owner.address);
  });

  it('Setting new message signer', async function () {
    const [newOwner, addr1] = await ethers.getSigners();
    await expect(redemptionContract.connect(newOwner).setMessageSigner(newOwner.address)).to.be.revertedWith('Ownable: caller is not the owner');
    await redemptionContract.connect(addr1).setMessageSigner(newOwner.address);
    expect(await redemptionContract.messageSigner()).to.equal(newOwner.address);
  });

  it('Setting new token holder', async function () {
    const [newOwner, addr1, addr2] = await ethers.getSigners();
    await expect(redemptionContract.connect(newOwner).setHolderToNFT(erc721MockContract.address, newOwner.address)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
    await redemptionContract.connect(addr1).setHolderToNFT(erc721MockContract.address, addr2.address);
    let own = await redemptionContract.messageSigner;
    expect(await redemptionContract.tokenHolder(erc721MockContract.address)).to.equal(addr2.address);
  });

  it('Verify if holder has to be redeemed token 721', async function () {
    const [owner, addr1] = await ethers.getSigners();
    await erc721MockContract.safeMint(addr1.address, 1);
    await expect(
      redemptionContract
        .connect(owner)
        .redeemHeroPoints(
          erc721MockContract.address,
          1,
          1,
          1,
          '0xcca7f6485c4be9fb8ec176757b2438ccaa827ea066ebac24713de0326354ae8a1f9f8661916372cb6157adb3fe8ed2090e0e184fd7ba7ae44cb0d311391ff77c1b'
        )
    ).to.be.revertedWith('HeroPointsRedemption: holder not the owner of token');
  });

  it('Verify if holder has to be redeemed token 1155', async function () {
    const [owner, addr1] = await ethers.getSigners();
    await erc1155MockContract.mint(addr1.address, 1, 5, '0x00');
    await redemptionContract.connect(addr1).setHolderToNFT(erc1155MockContract.address, owner.address);

    await expect(
      redemptionContract
        .connect(owner)
        .redeemHeroPoints(
          erc1155MockContract.address,
          1,
          1,
          1,
          '0xcc22c93364fa3326a25ca6ec55722223a901c3c31fdeaee77d12548e9d12474629e9261d981527f900ff757806244905267be2eb3ffa679394c674e3958ccad21b'
        )
    ).to.be.revertedWith("HeroPointsRedemption: holder doesn't have enough token");
  });
});
