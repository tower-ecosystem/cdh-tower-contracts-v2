// We import Chai to use its asserting functions here.
const {expect} = require('chai');
const {ethers, upgrades} = require('hardhat');

describe('SBT Token', function () {
  let CDHBadges;
  let CDHBadgesDeploy;
  let badgesSBTMetadataUrl = '';

  let owner, addr1, addr2, lastAddr;
  let fuseSig;
  let payload;

  beforeEach(async function () {
    [owner, addr1, addr2, lastAddr] = await ethers.getSigners();

    CDHBadges = await ethers.getContractFactory('CDHBadges');
    CDHBadgesDeploy = await upgrades.deployProxy(CDHBadges, [badgesSBTMetadataUrl], {initializer: 'initialize'});
    await CDHBadgesDeploy.deployed();
    // console.log('address of CDHBadges:', CDHBadgesDeploy.address);
    // console.log('DEFAULT_ADMIN_ROLE', CDHBadgesDeploy.DEFAULT_ADMIN_ROLE);
    // console.log('MINTER_ROLE_ADMIN', CDHBadgesDeploy.hasRole(MINTER_ROLE, owner.address));
    // console.log('MINTER_ROLE', CDHBadgesDeploy.hasRole(MINTER_ROLE_ADMIN, owner.address));

    payload = {
      sender: owner.address,
      tokenIds: [1, 2],
      amounts: [1, 1],
    };

    const signOrderPayload = async (payload) => {
      let {sender, tokenIds, amounts} = payload;
      const seedNonce = await CDHBadgesDeploy.seedNonce(sender);
      // console.log(`Seed Nonce for sender - ${sender} : "${CDHBadgesDeploy.address}" in Contract: ${seedNonce}`);
      const hash = await ethers.utils.solidityKeccak256(['address', 'uint256[]', 'uint256[]', 'uint256'], [sender, tokenIds, amounts, seedNonce]);
      // await console.log('Hash', hash);
      const signature = await owner.signMessage(ethers.utils.arrayify(hash));
      // console.log('Signature', signature);
      return signature;
    };

    (async () => {
      try {
        fuseSig = await signOrderPayload(payload);
        // console.log(fuseSig);
      } catch (e) {
        // console.log(e);
      }
    })();
  });

  it('should check verification', async function () {
    // const checkVerificationAddress = await CDHBadgesDeploy.connect(owner).checkVerification([1, 2], [1, 1], owner.address, fuseSig);
    // console.log('checkVerification: ', checkVerificationAddress);
    await CDHBadgesDeploy.connect(owner).setVerifier(owner.address);
    await CDHBadgesDeploy.connect(owner).verifyAndMint([1, 2], [1, 1], owner.address, fuseSig);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 1)).to.equal(1);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 2)).to.equal(1);
  });

  it('should mint token', async function () {
    const txn = await CDHBadgesDeploy.connect(owner).mint(owner.address, 1, 1);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 1)).to.equal(1);
  });

  it('should mintBatch token', async function () {
    const txn = await CDHBadgesDeploy.connect(owner).mintBatch(owner.address, [1, 2, 3], [3, 2, 1]);
    // console.log('balance of owner of ', await CDHBadgesDeploy.connect(owner).balanceOf(addr1.address, 1));
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 1)).to.equal(3);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 2)).to.equal(2);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 3)).to.equal(1);
  });

  it('should mintBatchMultiple token', async function () {
    const txn = await CDHBadgesDeploy.connect(owner).mintBatchMultiple(
      [owner.address, addr1.address],
      [
        [1, 2, 3],
        [1, 2, 3],
      ],
      [
        [1, 2, 3],
        [1, 2, 3],
      ]
    );
    // console.log('txn', txn);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 1)).to.equal(1);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 2)).to.equal(2);
    expect(await CDHBadgesDeploy.balanceOf(owner.address, 3)).to.equal(3);
    expect(await CDHBadgesDeploy.balanceOf(addr1.address, 1)).to.equal(1);
    expect(await CDHBadgesDeploy.balanceOf(addr1.address, 2)).to.equal(2);
    expect(await CDHBadgesDeploy.balanceOf(addr1.address, 3)).to.equal(3);
  });

  it('should mint token to another address', async function () {
    const txn = await CDHBadgesDeploy.connect(owner).mint(addr1.address, 2, 1);
    expect(await CDHBadgesDeploy.balanceOf(addr1.address, 2)).to.equal(1);
  });

  it('should not transfer into another address if SBT is enable', async function () {
    await CDHBadgesDeploy.connect(owner).appendBadgeType(2, 'abc', true);
    await CDHBadgesDeploy.connect(owner).mint(addr1.address, 2, 1);
    await expect(CDHBadgesDeploy.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 2, 1, '0x00')).to.be.revertedWith(
      "CDHBadges: Soul Bound Token can't be transferred"
    );
  });

  it('should not transfer into another address if SBT is minted without enabling SBT flag', async function () {
    await CDHBadgesDeploy.connect(owner).mint(addr1.address, 2, 1);
    await CDHBadgesDeploy.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 2, 1, '0x00');
    expect(await CDHBadgesDeploy.balanceOf(addr2.address, 2)).to.equal(1);
  });

  it('should pause', async function () {
    await CDHBadgesDeploy.connect(owner).pause();
    await expect(CDHBadgesDeploy.connect(owner).mint(addr1.address, 2, 1)).to.be.revertedWith('Pausable: paused');
  });

  it('should unpause', async function () {
    await CDHBadgesDeploy.connect(owner).pause();
    await CDHBadgesDeploy.connect(owner).unpause();
    await CDHBadgesDeploy.connect(owner).mint(addr1.address, 2, 1);
    expect(await CDHBadgesDeploy.balanceOf(addr1.address, 2)).to.equal(1);
  });
});
