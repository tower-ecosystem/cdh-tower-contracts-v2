const fse = require('fs-extra');
const path = require('path');
const {extendConfig, subtask} = require('hardhat/config');
const {normalizePath} = require('../utils');
const {TASK_DEPLOY_RUN_DEPLOY} = require('../hardhat-deploy-task-names');

extendConfig((config, userConfig) => {
  config.paths.exports = normalizePath(config, userConfig.paths ? userConfig.paths.exports : undefined, 'exports');

  if (userConfig.toExport) {
    config.toExport = {
      deployments: userConfig.toExport.deployments || [],
      namedAccounts: userConfig.toExport.namedAccounts || [],
      namedGroups: userConfig.toExport.namedGroups || [],
    };
  } else {
    config.toExport = {
      deployments: [],
      namedAccounts: [],
      namedGroups: [],
    };
  }
});

subtask(TASK_DEPLOY_RUN_DEPLOY, async (taskArguments, hre, runSuper) => {
  await runSuper(taskArguments);

  const toExport = hre.config.toExport;

  const namedAccounts = await hre.getNamedAccounts();
  const namedGroups = await hre.namedGroups;

  const deployments = Object.fromEntries(
    Object.entries(await hre.deployments.all())
      .filter(([deploymentName]) => toExport.deployments.includes(deploymentName))
      .map(([deploymentName, deployment]) => {
        const deploymentData = {
          abi: deployment.abi,
          address: deployment.address,
        };
        if (deployment.args) {
          deploymentData.args = deployment.args;
        }
        if (deployment.receipt) {
          deploymentData.receipt = deployment.receipt;
        }
        return [deploymentName, deploymentData];
      })
  );

  const accounts = Object.fromEntries(Object.entries(namedAccounts).filter(([name, _]) => toExport.namedAccounts.includes(name)));

  const groups = Object.fromEntries(Object.entries(namedGroups).filter(([name, _]) => toExport.namedGroups.includes(name)));

  const chainId = await hre.getChainId();
  const name = hre.network.name;

  const environmentExport = {
    chainId,
    name,
    accounts,
    groups,
    contracts: deployments,
  };

  const exportsPath = hre.config.paths.exports;
  fse.mkdirpSync(exportsPath);
  const exportFilePath = path.join(exportsPath, `${name}.json`);
  const exportMinFilePath = path.join(exportsPath, `${name}-min.json`);
  fse.writeFileSync(exportFilePath, JSON.stringify(environmentExport, null, 2));
  fse.writeFileSync(exportMinFilePath, JSON.stringify(environmentExport));
  console.log(`Exports written: ${exportFilePath} ${exportMinFilePath}`);

  // TODO single contract .json exports and ABI exports
});
