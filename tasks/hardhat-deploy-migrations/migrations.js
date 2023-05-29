// const {BigNumber} = require('ethers');
const path = require('path');
const fse = require('fs-extra');
const progress = require('cli-progress');

//  Files management

const makeLocalFolderPath = async (hre) => {
  return path.join(hre.config.paths.generated, hre.network.name);
};

const readFile = async (hre, fileName) => {
  const {log} = hre.deployments;
  const filePath = path.join(await makeLocalFolderPath(hre), fileName);
  const data = fse.readFileSync(filePath);
  log('File read:', filePath);
  return data;
};

const writeFile = async (hre, fileName, data) => {
  const {log} = hre.deployments;
  const filePath = path.join(await makeLocalFolderPath(hre), fileName);
  fse.mkdirpSync(path.dirname(filePath));
  fse.writeFileSync(filePath, data);
  log('File written:', filePath);
};

//  Skip functions

const multiSkip = (conditionFunctions) => {
  return async (hre) => {
    for (const condition of conditionFunctions) {
      if (await condition(hre)) {
        return true;
      }
    }
    return false;
  };
};

const skipIfFileExists = (fileName) => {
  return async (hre) => {
    const {log} = hre.deployments;
    const filePath = path.join(await makeLocalFolderPath(hre), fileName);
    if (fse.existsSync(filePath)) {
      log(`${filePath}: already exists, skipping...`);
      return true;
    }
    return false;
  };
};

const skipIfContractExists = (contractName) => {
  return async ({deployments}) => {
    const {log} = deployments;
    const contract = await deployments.getOrNull(contractName);
    if (contract) {
      log(`${contractName}: already deployed at ${contract.address}, skipping...`);
      return true;
    }
    // log(`Contract ${contractName} not found, proceeding...`);
    return false;
  };
};

const skipIfChainIdIs = (chainIds) => {
  return async ({getChainId, deployments}) => {
    const {log} = deployments;
    const chainId = await getChainId();
    const matchChainId = chainIds === chainId || chainIds.indexOf(chainId) >= 0;
    if (matchChainId) {
      log(`${chainId}: restricted chainId, skipping...`);
      return true;
    }
    // log(`Chain id ${chainId} is not part of ${chainIds}, proceeding...`);
    return false;
  };
};

const skipIfChainIdIsNot = (chainIds) => {
  return async ({getChainId, deployments}) => {
    const {log} = deployments;
    const chainId = await getChainId();
    const matchChainId = chainIds === chainId || chainIds.indexOf(chainId) >= 0;
    if (matchChainId) {
      // log(`Chain id ${chainId} is part of ${chainIds}, proceeding...`);
      return false;
    }
    log(`${chainId}: not part of chainIds ${chainIds}, skipping...`);
    return true;
  };
};

const skipIfNetworkIs = (networks) => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    const matchNetwork = network.name === networks || networks.indexOf(network.name) >= 0;
    if (matchNetwork) {
      log(`Network ${network.name} is part of ${networks}, skipping...`);
      return true;
    }
    // log(`Network ${network.name} is not part of ${networks}, proceeding...`);
    return false;
  };
};

const skipIfNetworkIsNot = (networks) => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    const matchNetwork = network.name === networks || networks.indexOf(network.name) >= 0;
    if (matchNetwork) {
      // log(`Network ${network.name} is part of ${networks}, proceeding...`);
      return false;
    }
    log(`Network ${network.name} is not part of ${networks}, skipping...`);
    return true;
  };
};

const skipIfNetworkIsTagged = (tag) => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    if (network.tags[tag]) {
      log(`Network ${network.name} is tagged '${tag}', skipping...`);
      return true;
    }
    // log(`Network ${network.name} is not tagged ${tag}, proceeding...`);
    return false;
  };
};

const skipIfNetworkIsNotTagged = (tag) => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    if (network.tags[tag]) {
      // log(`Network ${network.name} is tagged '${tag}', proceeding...`);
      return false;
    }
    log(`Network ${network.name} is not tagged ${tag}, skipping...`);
    return true;
  };
};

const skipIfNetworkIsLive = () => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    if (network.live) {
      log(`Network ${network.name} is a live network, skipping...`);
      return true;
    }
    // log(`Network ${network.name} is not live, proceeding...`);
    return false;
  };
};

const skipIfChainTypeIsNot = (chainType) => {
  return async ({network, deployments}) => {
    const {log} = deployments;
    if (network.name.startsWith('hardhat') || network.name.startsWith('localhost')) {
      // dev networks never skip
      return false;
    }
    if (network.tags[chainType]) {
      return false;
    }
    log(`Network is not of chain type '${chainType}', skipping...`);
    return true;
  };
};

// Batch actions

const batchDoWhile = async (doFunction, doArgss, message, conditionFunction, acceptRevert = false) => {
  const format = `${message} [{bar}] {percentage}% | {value}/{total}...`;
  const bar = new progress.SingleBar({format}, progress.Presets.shades_classic);
  bar.start(doArgss.length, 0);

  const results = [];
  let index = 0;
  for (const doArgs of doArgss) {
    let result;
    if (acceptRevert) {
      try {
        result = await doFunction(...doArgs);
      } catch (err) {
        result = null;
      }
    } else {
      result = await doFunction(...doArgs);
    }

    if (conditionFunction(result, index)) {
      results.push(result);
      bar.increment();
    } else {
      break;
    }
    index++;
  }
  bar.stop();
  return results;
};

const batchDo = async (doFunction, doArgss, message, acceptRevert = false) => {
  return batchDoWhile(doFunction, doArgss, message, async () => true, acceptRevert);
};

module.exports = {
  readFile,
  writeFile,
  multiSkip,
  skipIfFileExists,
  skipIfContractExists,
  skipIfChainIdIs,
  skipIfChainIdIsNot,
  skipIfNetworkIs,
  skipIfNetworkIsNot,
  skipIfNetworkIsTagged,
  skipIfNetworkIsNotTagged,
  skipIfNetworkIsLive,
  skipIfChainTypeIsNot,
  batchDoWhile,
  batchDo,
};
