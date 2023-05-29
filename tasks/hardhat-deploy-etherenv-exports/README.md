# hardhat-deploy-etherenv-exports HardHat plugin

Exports selected deployments and accounts in a format which is compatible with `etherenv`, to a destination folder specified by `config.paths.exports` (defaults to `exports`) after each `deploy` task. The list of exported elements is specified in `config.toExport`.

Requires to have `hardhat-deploy` plugin loaded already.

`hardhat.config` example:

```javascript
module.exports = {
  // ...
  paths: {
    exports: 'custom_exports_path',
  }
  toExport: {
    deployments: ['MyDeployment', 'MyImportedDeployment'],
    namedAccounts: ['MyAccount'],
    namedGroups: ['MyAccountsGroup'],
  },
};
```
