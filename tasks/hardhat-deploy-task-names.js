// avoids multiple loadings of hardhat-deploy for importing tasks names in several plugins

const TASK_DEPLOY = 'deploy';
const TASK_DEPLOY_MAIN = 'deploy:main';
const TASK_DEPLOY_RUN_DEPLOY = 'deploy:runDeploy';

module.exports = {
  TASK_DEPLOY,
  TASK_DEPLOY_MAIN,
  TASK_DEPLOY_RUN_DEPLOY,
};
