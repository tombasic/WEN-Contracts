// Buidler-Truffle fixture for deployment to Buidler EVM

const SortedTroves = artifacts.require("./SortedTroves.sol")
const ActivePool = artifacts.require("./ActivePool.sol")
const DefaultPool = artifacts.require("./DefaultPool.sol")
const StabilityPool = artifacts.require("./StabilityPool.sol")
const TroveManager = artifacts.require("./TroveManager.sol")
const PriceFeed = artifacts.require("./PriceFeed.sol")
const LUSDToken = artifacts.require("./LUSDToken.sol")
const FunctionCaller = artifacts.require("./FunctionCaller.sol")
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol")

const deploymentHelpers = require("../utils/deploymentHelpers.js")

const getAddresses = deploymentHelpers.getAddresses
const connectContracts = deploymentHelpers.connectContracts

async function main() {
  const contracts = await await deploymentHelpers.deployLiquityCoreHardhat(false, "0x745a12D9BcDBFfb092fc38C1A24531dbb0846ad8")
  await deploymentHelpers.logContractObjects(contracts)
  // const lqtyContracts = await deploymentHelpers.deployLQTYContractsHardhat("", "", "")
  // await deploymentHelpers.logContractObjects(lqtyContracts)
  let lqtyContracts = {"lqtyStaking": {"address": "0x05Ddc595FD33D7B2AB302143c420D0e7f21B622a"},
                       "communityIssuance": {"address": contracts.communityIssuance.address}}
  await deploymentHelpers.connectCoreContracts(contracts, lqtyContracts)
}
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
// module.exports = async () => {
//   const borrowerOperations = await BorrowerOperations.new()
//   const priceFeed = await PriceFeed.new()
//   const sortedTroves = await SortedTroves.new()
//   const troveManager = await TroveManager.new()
//   const activePool = await ActivePool.new()
//   const stabilityPool = await StabilityPool.new()
//   const defaultPool = await DefaultPool.new()
//   const functionCaller = await FunctionCaller.new()
//   const lusdToken = await LUSDToken.new(
//     troveManager.address,
//     stabilityPool.address,
//     borrowerOperations.address
//   )
//   BorrowerOperations.setAsDeployed(borrowerOperations)
//   PriceFeed.setAsDeployed(priceFeed)
//   SortedTroves.setAsDeployed(sortedTroves)
//   TroveManager.setAsDeployed(troveManager)
//   ActivePool.setAsDeployed(activePool)
//   StabilityPool.setAsDeployed(stabilityPool)
//   DefaultPool.setAsDeployed(defaultPool)
//   FunctionCaller.setAsDeployed(functionCaller)
//   LUSDToken.setAsDeployed(lusdToken)

//   const contracts = {
//     borrowerOperations,
//     priceFeed,
//     lusdToken,
//     sortedTroves,
//     troveManager,
//     activePool,
//     stabilityPool,
//     defaultPool,
//     functionCaller
//   }

//   // Grab contract addresses
//   const addresses = getAddresses(contracts)
//   console.log('deploy_contracts.js - Deployhed contract addresses: \n')
//   console.log(addresses)
//   console.log('\n')

//   // Connect contracts to each other via the NameRegistry records
//   await connectContracts(contracts, addresses)
// }
