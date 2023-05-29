const Web3 = require("web3");
const fs = require("fs");

const readConfiguration = (configurationFile) => {
  if (!fs.existsSync(configurationFile)) {
    throw new Error(`configuration file not exists ::${configurationFile}`);
  }
  try {
    const rawKeystore = fs.readFileSync(configurationFile, "utf8");
    return JSON.parse(rawKeystore);
  } catch (e) {
    throw new Error(`configuration is invalid ::${configurationFile}`);
  }
};

const ethNetworkUrl =  "http://localhost:8545";
const CONTRACTS_CONFIGURATION = readConfiguration("../deployments/localhost/NFTRedemption.json");
const REDEMPTION_SIGNER_PRIVATE_KEY =""; //

const web3 = new Web3(ethNetworkUrl);

const redemptionContract = new web3.eth.Contract(
  CONTRACTS_CONFIGURATION.abi,
  CONTRACTS_CONFIGURATION.address
);

payload = {
  sender: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  contractAddress: CONTRACTS_CONFIGURATION.address,
  quantity: 1,
  ticketType: 1
};

const signOrderPayload = async (payload) => {
  let { sender, contractAddress, quantity, ticketType } = payload;
  const seedNonce = await redemptionContract.methods.seedNonce(sender).call();
  console.log(
    `Seed Nonce for sender - ${sender} : "${contractAddress}" in Contract: ${seedNonce}`
  );
  const hash = web3.utils.soliditySha3(
    sender,
    contractAddress,
    quantity.toString(),
    ticketType.toString(),
    seedNonce.toString(),
  );

  await console.log("Hash", hash);
  const signature = await web3.eth.accounts.sign(hash, REDEMPTION_SIGNER_PRIVATE_KEY);
  console.log("Signature", signature);
  return signature;
};

(async () => {
  try {
    let redemptionSign = await signOrderPayload(payload);
    console.log("redemption Signature: ", redemptionSign);
  } catch (e) {
    console.log(e);
  }
})();

module.exports= {CONTRACTS_CONFIGURATION}
