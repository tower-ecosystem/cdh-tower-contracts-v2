const Web3 = require('web3');
const fs = require('fs');
const dotEnv = require('dotenv');
dotEnv.config();
const badgesSignArgs = process.argv.slice(2);

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

const networkName = badgesSignArgs[0] || 'localhost';
console.log(`badges args: ${badgesSignArgs}`);

const getNetworkUrl = (network) => {
  if (network === 'localhost') {
    return 'http://localhost:8545';
  } else if (network === 'polygonMumbai') {
    return 'https://rpc-mumbai.matic.today';
  } else if (network === 'polygon') {
    return 'https://polygon.llamarpc.com';
  }
}

const ethNetworkUrl = getNetworkUrl(networkName);
const CONTRACTS_CONFIGURATION = readConfiguration(`./deployments/${networkName}/CDHBadges.json`);
const BADGE_VERIFIER_PRIVATE_KEY = process.env.BADGES_VERIFIER; // 0x6036Ab472708F025d5DABAC89E8A152E12342125

const web3 = new Web3(ethNetworkUrl);

const contractInstance = new web3.eth.Contract(CONTRACTS_CONFIGURATION.abi, CONTRACTS_CONFIGURATION.address);

payload = {
  sender: '0x59b9A1bF9FF157015c40934B1E4AC4fA2e6feBee',
  tokenIds: [13],
  amounts: [1],
};

const signOrderPayload = async (payload) => {
  let {sender, tokenIds, amounts} = payload;
  const seedNonce = await contractInstance.methods.seedNonce(sender).call();
  console.log(`Seed Nonce for sender - ${sender} : "${contractInstance.options.address}" in Contract: ${seedNonce}`)
  const hash = web3.utils.soliditySha3(sender, tokenIds.toString(), amounts.toString(), seedNonce);
  await console.log('Hash', hash);

  const signature = await web3.eth.accounts.sign(hash.toString(), BADGE_VERIFIER_PRIVATE_KEY);
  console.log('Signature', signature);
  return signature;
};

(async () => {
  let badgesSign;
  try {
    badgesSign = await signOrderPayload(payload);
    console.log(badgesSign);
  } catch (e) {
    console.log(e);
  }
})();
