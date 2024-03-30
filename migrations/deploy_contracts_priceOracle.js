const deploymentHelpers = require("../utils/deploymentHelpers.js")

async function main() {
  const chainlinkPriceOracleAddress = "0x8535Db9e4dDb6D557Bdc45cef06F418F29420d53"
  const contracts = await deploymentHelpers.deployNewPriceOracle(true, "")
  await deploymentHelpers.logContractObjects(contracts)
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });