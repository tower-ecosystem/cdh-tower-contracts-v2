const Web3 = require('web3');
const fs = require('fs');

const readConfiguration = (configurationFile) => {
  if (!fs.existsSync(configurationFile)) {
    throw new Error(`configuration file not exists ::${configurationFile}`);
  }
  try {
    const rawKeystore = fs.readFileSync(configurationFile, 'utf8');
    return JSON.parse(rawKeystore);
  } catch (e) {
    throw new Error(`configuration is invalid ::${configurationFile}`);
  }
};

const ethNetworkUrl = 'http://localhost:8545';
const CONTRACTS_CONFIGURATION = readConfiguration('./deployments/localhost/HeroPointsERC1155Redemption.json');
HERO_POINTS_SIGNER_PRIVATE_KEY = ''; //

const web3 = new Web3(ethNetworkUrl);

const redemptionContract = new web3.eth.Contract(CONTRACTS_CONFIGURATION.abi, CONTRACTS_CONFIGURATION.address);

payload = {
  sender: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  contractAddress: '0xd9145CCE52D386f254917e481eB44e9943F39138',
  quantity: 1,
  eventId: 1,
  nftId: 1,
};

const signOrderPayload = async (payload) => {
  let {sender, contractAddress, quantity, eventId, nftId} = payload;
  const seedNonce = await redemptionContract.methods.seedNonce(sender).call();
  console.log(`Seed Nonce for sender - ${sender} : "${contractAddress}" Contaract Address, ${seedNonce} Nonce`);
  const hash = web3.utils.soliditySha3(sender, contractAddress, nftId.toString(), eventId.toString(), quantity.toString(), seedNonce.toString());

  const signature = await web3.eth.accounts.sign(hash, HERO_POINTS_SIGNER_PRIVATE_KEY);
  console.log('Signature', signature);
  return signature;
};

(async () => {
  try {
    let redemptionSign = await signOrderPayload(payload);
    console.log('redemption Signature: ', redemptionSign);
  } catch (e) {
    console.log(e);
  }
})();

module.exports = {CONTRACTS_CONFIGURATION};
