# hardhat-deploy-migrations HardHat plugin

Provides a ready-to-use environment for running migrations:
- Safe-guard runtime executions of `hardhat deploy` on live networks via user confirmations.
- Presets `hardhat-deploy`'s `config.paths.deploy` to `migrations`.
- Creates a mirror copy of default and user-defined networks with name ending with `_qa` and tagged with `qa`.
- Provides helpers functions for migration scripts in `migrations.js`, including skip conditions and files handling.

Requires to have `hardhat-deploy` plugin loaded already.
