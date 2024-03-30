const SortedTroves = artifacts.require("./SortedTroves.sol")
const TroveManager = artifacts.require("./TroveManager.sol")
const PriceFeed = artifacts.require("./PriceFeed.sol")
const TellorAssetPriceOracle = artifacts.require("./TellorAssetPriceOracle.sol")
const TellorCaller = artifacts.require("./Dependencies/TellorCaller.sol")
const ChainlinkAssetPriceOracle = artifacts.require("./ChainlinkAssetPriceOracle.sol")
const LUSDToken = artifacts.require("./LUSDToken.sol")
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const StabilityPool = artifacts.require("./StabilityPool.sol")
const GasPool = artifacts.require("./GasPool.sol")
const CollSurplusPool = artifacts.require("./CollSurplusPool.sol")
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol")
const HintHelpers = artifacts.require("./HintHelpers.sol")

// const LQTYStaking = artifacts.require("./LQTYStaking.sol")
// const LQTYToken = artifacts.require("./LQTYToken.sol")
// const LockupContractFactory = artifacts.require("./LockupContractFactory.sol")
const CommunityIssuance = artifacts.require("./CommunityIssuance.sol")
const CommunityToken = artifacts.require("./CommunityToken.sol")


const CommonProxyAdmin = artifacts.require('CommonProxyAdmin')
const CommonUpgradeableProxy = artifacts.require('CommonUpgradeableProxy')

/* "Liquity core" consists of all contracts in the core Liquity system.

LQTY contracts consist of only those contracts related to the LQTY Token:

-the LQTY token
-the Lockup factory and lockup contracts
-the LQTYStaking contract
-the CommunityIssuance contract 
*/

const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const maxBytes32 = '0x' + 'f'.repeat(64)

class DeploymentHelper {

  // static async deployLiquityCore() {
  //   const cmdLineArgs = process.argv
  //   const frameworkPath = cmdLineArgs[1]
  //   // console.log(`Framework used:  ${frameworkPath}`)

  //   if (frameworkPath.includes("hardhat")) {
  //     return this.deployLiquityCoreHardhat()
  //   } else if (frameworkPath.includes("truffle")) {
  //     return this.deployLiquityCoreTruffle()
  //   }
  // }

  // static async deployLQTYContracts(bountyAddress, lpRewardsAddress, multisigAddress) {
  //   const cmdLineArgs = process.argv
  //   const frameworkPath = cmdLineArgs[1]
  //   // console.log(`Framework used:  ${frameworkPath}`)

  //   if (frameworkPath.includes("hardhat")) {
  //     return this.deployLQTYContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress)
  //   } else if (frameworkPath.includes("truffle")) {
  //     return this.deployLQTYContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress)
  //   }
  // }

  static async upgradeLiquityCoreHardhat() {
    // const addr = "0x0571B9C4ee4887e7d84E55a2dD92E97872437f74"
    const proxyAdmin = await ethers.getContractAt("CommonProxyAdmin", "0x6d47e21D3899d1f361F90F3176CC9E5B04B3FA3E")
    const upgradeableProxy = await ethers.getContractAt("CommonUpgradeableProxy", "0x4529E0775ABba89E3d9E160856d565944e147c6F")
    console.log("=====", await proxyAdmin.getProxyImplementation(upgradeableProxy.address))

    // const stabilityPool = await StabilityPool.new()
    // await proxyAdmin.upgrade(upgradeableProxy.address, stabilityPool.address)
    // const proxiedTroveManager = await ethers.getContractAt("StabilityPool", upgradeableProxy.address)
    // const borrowerOperations = await BorrowerOperations.new()
    // await proxyAdmin.upgrade(upgradeableProxy.address, borrowerOperations.address)
    // const proxiedTroveManager = await ethers.getContractAt("BorrowerOperations", upgradeableProxy.address)
    // console.log("owner after upgrade:", await proxiedTroveManager.owner())

    const communityIssuance = await CommunityIssuance.new()
    await proxyAdmin.upgrade(upgradeableProxy.address, communityIssuance.address)
    const proxiedCommunityIssuance = await ethers.getContractAt("CommunityIssuance", upgradeableProxy.address)
    console.log("owner after upgrade:", await proxiedCommunityIssuance.owner())
  }

  static async deployNewPriceOracle(isMainnet = true, chainlinkPriceOracleAddress) {
    const baseOracle = "0xA07E498316597e22f1C1D19B96dDFD991e94A1e0"
    const wrappedNativeToken = "0x3e57d6946f893314324C975AA9CEBBdF3232967E"
    // const timeLock = "0xd095534b6A8FaE2FA67BB081Dd088F6821341AFa"
    const tellorAssetPriceOracle = await TellorAssetPriceOracle.new(baseOracle, wrappedNativeToken)
    // await tellorAssetPriceOracle.transferOwnership(timeLock)
    console.log("tellorAssetPriceOracle: ", tellorAssetPriceOracle.address)
    console.log("tellorAssetPriceOracle pendingAdmin: ", await tellorAssetPriceOracle.pendingOwner())

    const tellorCaller = await TellorCaller.new(tellorAssetPriceOracle.address)
    console.log("tellorCaller: ", tellorCaller.address)

    let chainlinkAssetPriceOracle;
    if (!chainlinkPriceOracleAddress) {
      chainlinkAssetPriceOracle = await ChainlinkAssetPriceOracle.new(8, "BTC Price", baseOracle, wrappedNativeToken)
      chainlinkPriceOracleAddress = chainlinkAssetPriceOracle.address
      // await chainlinkAssetPriceOracle.transferOwnership(timeLock)
      console.log("chainlinkAssetPriceOracle: ", chainlinkPriceOracleAddress)
      console.log("chainlinkAssetPriceOracle pendingAdmin: ", await chainlinkAssetPriceOracle.pendingOwner())
    }

    let priceFeed
    if (chainlinkPriceOracleAddress) {
      priceFeed = await PriceFeed.new()
      console.log("priceFeed: ", priceFeed.address)
      await priceFeed.setAddresses(chainlinkPriceOracleAddress, tellorCaller.address)
      console.log("Done to set addresses for price feed contract ", priceFeed.address)
      // await priceFeed.transferOwnership(timeLock)
      console.log("priceFeed pendingAdmin: ", await priceFeed.pendingOwner())
    }

    const contracts = {
      tellorAssetPriceOracle,
      tellorCaller,
      chainlinkAssetPriceOracle,
      priceFeed
    }
    return contracts
  }

  static async deployLiquityCoreHardhat(isMainnet, priceFeedAddress) {
    const commonProxyAdmin = await CommonProxyAdmin.new()
    let priceFeed
    if (priceFeedAddress) {
      priceFeed = await ethers.getContractAt("PriceFeed", priceFeedAddress)
    } else {
      priceFeed = await PriceFeedTestnet.new()
    }
    const timeLock = "0xd095534b6A8FaE2FA67BB081Dd088F6821341AFa"
    const sortedTroves = await SortedTroves.new()
    // await sortedTroves.transferOwnership(timeLock)
    console.log("sortedTroves: ", sortedTroves.address)
    console.log("sortedTroves pendingAdmin: ", await sortedTroves.pendingOwner())

    const troveManager = await TroveManager.new()
    const troveManagerProxy = await CommonUpgradeableProxy.new(troveManager.address, commonProxyAdmin.address, '0x8129fc1c')
    const proxiedTroveManager = await ethers.getContractAt("TroveManager", troveManagerProxy.address)
    console.log("proxiedTroveManager: ", proxiedTroveManager.address, "troveManager: ", troveManager.address)
    // await proxiedTroveManager.transferOwnership(timeLock)
    console.log("proxiedTroveManager pendingAdmin: ", await proxiedTroveManager.pendingOwner())

    const activePool = await ActivePool.new()
    const activePoolProxy = await CommonUpgradeableProxy.new(activePool.address, commonProxyAdmin.address, '0x8129fc1c')
    const proxiedActivePool = await ethers.getContractAt("ActivePool", activePoolProxy.address)
    console.log("proxiedActivePool: ", proxiedActivePool.address, "activePool: ", activePool.address)
    // await proxiedActivePool.transferOwnership(timeLock)
    console.log("proxiedActivePool pendingAdmin: ", await proxiedActivePool.pendingOwner())

    const stabilityPool = await StabilityPool.new()
    const stabilityPoolProxy = await CommonUpgradeableProxy.new(stabilityPool.address, commonProxyAdmin.address, '0x8129fc1c')
    const proxiedStabilityPool = await ethers.getContractAt("StabilityPool", stabilityPoolProxy.address)
    console.log("proxiedStabilityPool: ", proxiedStabilityPool.address, "stabilityPool: ", stabilityPool.address)
    // await proxiedStabilityPool.transferOwnership(timeLock)
    console.log("proxiedStabilityPool pendingAdmin: ", await proxiedStabilityPool.pendingOwner())

    const communityIssuance = await CommunityIssuance.new()
    const communityIssuanceProxy = await CommonUpgradeableProxy.new(communityIssuance.address, commonProxyAdmin.address, '0x8129fc1c')
    const proxiedCommunityIssuance = await ethers.getContractAt("CommunityIssuance", communityIssuanceProxy.address)
    console.log("proxiedCommunityIssuance: ", proxiedCommunityIssuance.address, "communityIssuance: ", communityIssuance.address)
    // await proxiedCommunityIssuance.transferOwnership(timeLock)
    console.log("proxiedCommunityIssuance pendingAdmin: ", await proxiedCommunityIssuance.pendingOwner())

    const gasPool = await GasPool.new()
    const defaultPool = await DefaultPool.new()
    // await defaultPool.transferOwnership(timeLock)
    console.log("defaultPool pendingAdmin: ", await defaultPool.pendingOwner())

    const collSurplusPool = await CollSurplusPool.new()
    // await collSurplusPool.transferOwnership(timeLock)
    console.log("collSurplusPool pendingAdmin: ", await collSurplusPool.pendingOwner())

    const functionCaller = await FunctionCaller.new()
    const borrowerOperations = await BorrowerOperations.new()
    const borrowerOperationsProxy = await CommonUpgradeableProxy.new(borrowerOperations.address, commonProxyAdmin.address, '0x8129fc1c')
    const proxiedBorrowerOperations = await ethers.getContractAt("BorrowerOperations", borrowerOperationsProxy.address)
    console.log("proxiedBorrowerOperations: ", proxiedBorrowerOperations.address, "borrowerOperations: ", borrowerOperations.address)
    // await proxiedBorrowerOperations.transferOwnership(timeLock)
    console.log("proxiedBorrowerOperations pendingAdmin: ", await proxiedBorrowerOperations.pendingOwner())

    const hintHelpers = await HintHelpers.new()
    // await hintHelpers.transferOwnership(timeLock)
    console.log("hintHelpers pendingAdmin: ", await hintHelpers.pendingOwner())

    const usdToken = await LUSDToken.new()
    const usdTokenProxy = await CommonUpgradeableProxy.new(troveManagerProxy.address, stabilityPoolProxy.address, borrowerOperationsProxy.address, '0x8129fc1c')

    // const lusdToken = await LUSDToken.new(
    //   troveManagerProxy.address,
    //   stabilityPoolProxy.address,
    //   borrowerOperationsProxy.address
    // )
    const multiTroveGetter = await MultiTroveGetter.new(proxiedTroveManager.address, sortedTroves.address)

    LUSDToken.setAsDeployed(lusdToken)
    DefaultPool.setAsDeployed(defaultPool)
    if (isMainnet) {
      PriceFeed.setAsDeployed(priceFeed)
    } else {
      PriceFeedTestnet.setAsDeployed(priceFeed)
    }
    SortedTroves.setAsDeployed(sortedTroves)
    TroveManager.setAsDeployed(troveManager)
    ActivePool.setAsDeployed(activePool)
    StabilityPool.setAsDeployed(stabilityPool)
    GasPool.setAsDeployed(gasPool)
    CollSurplusPool.setAsDeployed(collSurplusPool)
    FunctionCaller.setAsDeployed(functionCaller)
    BorrowerOperations.setAsDeployed(borrowerOperations)
    HintHelpers.setAsDeployed(hintHelpers)
    CommunityIssuance.setAsDeployed(communityIssuance)

    const coreContracts = {
      commonProxyAdmin,
      priceFeed,
      lusdToken,
      sortedTroves,
      "troveManager": proxiedTroveManager,
      "activePool": proxiedActivePool,
      "stabilityPool": proxiedStabilityPool,
      gasPool,
      defaultPool,
      collSurplusPool,
      functionCaller,
      "borrowerOperations": proxiedBorrowerOperations,
      hintHelpers,
      multiTroveGetter,
      "communityIssuance": proxiedCommunityIssuance
    }
    return coreContracts
  }
  // static async deployMultiTroveGetter(liquityCore, deploymentState) {
  //   const multiTroveGetterFactory = await this.getFactory("MultiTroveGetter")
  //   const multiTroveGetterParams = [
  //     liquityCore.troveManager.address,
  //     liquityCore.sortedTroves.address
  //   ]
  //   const multiTroveGetter = await this.loadOrDeploy(
  //     multiTroveGetterFactory,
  //     'multiTroveGetter',
  //     deploymentState,
  //     multiTroveGetterParams
  //   )

  //   if (!this.configParams.ETHERSCAN_BASE_URL) {
  //     console.log('No Etherscan Url defined, skipping verification')
  //   } else {
  //     await this.verifyContract('multiTroveGetter', deploymentState, multiTroveGetterParams)
  //   }

  //   return multiTroveGetter
  // }
  // static async deployTesterContractsHardhat() {
  //   const testerContracts = {}

  //   // Contract without testers (yet)
  //   testerContracts.priceFeedTestnet = await PriceFeedTestnet.new()
  //   testerContracts.sortedTroves = await SortedTroves.new()
  //   // Actual tester contracts
  //   testerContracts.communityIssuance = await CommunityIssuanceTester.new()
  //   testerContracts.activePool = await ActivePoolTester.new()
  //   testerContracts.defaultPool = await DefaultPoolTester.new()
  //   testerContracts.stabilityPool = await StabilityPoolTester.new()
  //   testerContracts.gasPool = await GasPool.new()
  //   testerContracts.collSurplusPool = await CollSurplusPool.new()
  //   testerContracts.math = await LiquityMathTester.new()
  //   testerContracts.borrowerOperations = await BorrowerOperationsTester.new()
  //   testerContracts.troveManager = await TroveManagerTester.new()
  //   testerContracts.functionCaller = await FunctionCaller.new()
  //   testerContracts.hintHelpers = await HintHelpers.new()
  //   testerContracts.lusdToken =  await LUSDTokenTester.new(
  //     testerContracts.troveManager.address,
  //     testerContracts.stabilityPool.address,
  //     testerContracts.borrowerOperations.address
  //   )
  //   return testerContracts
  // }

  // static async deployLQTYContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
  //   const lqtyStaking = await LQTYStaking.new()
  //   const lockupContractFactory = await LockupContractFactory.new()
  //   const communityIssuance = await CommunityIssuance.new()

  //   LQTYStaking.setAsDeployed(lqtyStaking)
  //   LockupContractFactory.setAsDeployed(lockupContractFactory)
  //   CommunityIssuance.setAsDeployed(communityIssuance)

  //   // Deploy LQTY Token, passing Community Issuance and Factory addresses to the constructor 
  //   // const lqtyToken = await LQTYToken.new(
  //   //   communityIssuance.address, 
  //   //   lqtyStaking.address,
  //   //   lockupContractFactory.address,
  //   //   bountyAddress,
  //   //   lpRewardsAddress,
  //   //   multisigAddress
  //   // )
  //   // LQTYToken.setAsDeployed(lqtyToken)

  //   const LQTYContracts = {
  //     lqtyStaking,
  //     lockupContractFactory,
  //     communityIssuance,
  //     // lqtyToken
  //   }
  //   return LQTYContracts
  // }

  // static async deployLQTYTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
  //   const lqtyStaking = await LQTYStaking.new()
  //   const lockupContractFactory = await LockupContractFactory.new()
  //   const communityIssuance = await CommunityIssuanceTester.new()

  //   LQTYStaking.setAsDeployed(lqtyStaking)
  //   LockupContractFactory.setAsDeployed(lockupContractFactory)
  //   CommunityIssuanceTester.setAsDeployed(communityIssuance)

  //   // Deploy LQTY Token, passing Community Issuance and Factory addresses to the constructor 
  //   const lqtyToken = await LQTYTokenTester.new(
  //     communityIssuance.address, 
  //     lqtyStaking.address,
  //     lockupContractFactory.address,
  //     bountyAddress,
  //     lpRewardsAddress,
  //     multisigAddress
  //   )
  //   LQTYTokenTester.setAsDeployed(lqtyToken)

  //   const LQTYContracts = {
  //     lqtyStaking,
  //     lockupContractFactory,
  //     communityIssuance,
  //     lqtyToken
  //   }
  //   return LQTYContracts
  // }

  // static async deployLiquityCoreTruffle() {
  //   const priceFeedTestnet = await PriceFeedTestnet.new()
  //   const sortedTroves = await SortedTroves.new()
  //   const troveManager = await TroveManager.new()
  //   const activePool = await ActivePool.new()
  //   const stabilityPool = await StabilityPool.new()
  //   const gasPool = await GasPool.new()
  //   const defaultPool = await DefaultPool.new()
  //   const collSurplusPool = await CollSurplusPool.new()
  //   const functionCaller = await FunctionCaller.new()
  //   const borrowerOperations = await BorrowerOperations.new()
  //   const hintHelpers = await HintHelpers.new()
  //   const lusdToken = await LUSDToken.new(
  //     troveManager.address,
  //     stabilityPool.address,
  //     borrowerOperations.address
  //   )
  //   const coreContracts = {
  //     priceFeedTestnet,
  //     lusdToken,
  //     sortedTroves,
  //     troveManager,
  //     activePool,
  //     stabilityPool,
  //     gasPool,
  //     defaultPool,
  //     collSurplusPool,
  //     functionCaller,
  //     borrowerOperations,
  //     hintHelpers
  //   }
  //   return coreContracts
  // }

  // static async deployLQTYContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress) {
  //   const lqtyStaking = await lqtyStaking.new()
  //   const lockupContractFactory = await LockupContractFactory.new()
  //   const communityIssuance = await CommunityIssuance.new()

  //   /* Deploy LQTY Token, passing Community Issuance,  LQTYStaking, and Factory addresses 
  //   to the constructor  */
  //   const lqtyToken = await LQTYToken.new(
  //     communityIssuance.address, 
  //     lqtyStaking.address,
  //     lockupContractFactory.address,
  //     bountyAddress,
  //     lpRewardsAddress, 
  //     multisigAddress
  //   )

  //   const LQTYContracts = {
  //     lqtyStaking,
  //     lockupContractFactory,
  //     communityIssuance,
  //     lqtyToken
  //   }
  //   return LQTYContracts
  // }

  static async deployLUSDToken(contracts) {
    contracts.lusdToken = await LUSDToken.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async deployLUSDTokenTester(contracts) {
    contracts.lusdToken = await LUSDTokenTester.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async logContractObjects (contracts) {
    console.log(`Contract objects addresses:`)
    for ( const contractName of Object.keys(contracts)) {
      console.log(`${contractName}: ${contracts[contractName].address}`);
    }
  }

  // static async deployProxyScripts(contracts, LQTYContracts, owner, users) {
  //   const proxies = await buildUserProxies(users)

  //   const borrowerWrappersScript = await BorrowerWrappersScript.new(
  //     contracts.borrowerOperations.address,
  //     contracts.troveManager.address,
  //     LQTYContracts.lqtyStaking.address
  //   )
  //   contracts.borrowerWrappers = new BorrowerWrappersProxy(owner, proxies, borrowerWrappersScript.address)

  //   const borrowerOperationsScript = await BorrowerOperationsScript.new(contracts.borrowerOperations.address)
  //   contracts.borrowerOperations = new BorrowerOperationsProxy(owner, proxies, borrowerOperationsScript.address, contracts.borrowerOperations)

  //   const troveManagerScript = await TroveManagerScript.new(contracts.troveManager.address)
  //   contracts.troveManager = new TroveManagerProxy(owner, proxies, troveManagerScript.address, contracts.troveManager)

  //   const stabilityPoolScript = await StabilityPoolScript.new(contracts.stabilityPool.address)
  //   contracts.stabilityPool = new StabilityPoolProxy(owner, proxies, stabilityPoolScript.address, contracts.stabilityPool)

  //   contracts.sortedTroves = new SortedTrovesProxy(owner, proxies, contracts.sortedTroves)

  //   const lusdTokenScript = await TokenScript.new(contracts.lusdToken.address)
  //   contracts.lusdToken = new TokenProxy(owner, proxies, lusdTokenScript.address, contracts.lusdToken)

  //   const lqtyTokenScript = await TokenScript.new(LQTYContracts.lqtyToken.address)
  //   LQTYContracts.lqtyToken = new TokenProxy(owner, proxies, lqtyTokenScript.address, LQTYContracts.lqtyToken)

  //   const lqtyStakingScript = await LQTYStakingScript.new(LQTYContracts.lqtyStaking.address)
  //   LQTYContracts.lqtyStaking = new LQTYStakingProxy(owner, proxies, lqtyStakingScript.address, LQTYContracts.lqtyStaking)
  // }

  // Connect contracts to their dependencies
  static async connectCoreContracts(contracts, LQTYContracts) {

    // set TroveManager addr in SortedTroves
    await contracts.sortedTroves.setParams(
      maxBytes32,
      contracts.troveManager.address,
      contracts.borrowerOperations.address
    )

    // set contract addresses in the FunctionCaller 
    await contracts.functionCaller.setTroveManagerAddress(contracts.troveManager.address)
    await contracts.functionCaller.setSortedTrovesAddress(contracts.sortedTroves.address)

    // set contracts in the Trove Manager
    await contracts.troveManager.setAddresses(
      contracts.borrowerOperations.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeed.address,
      contracts.lusdToken.address,
      contracts.sortedTroves.address,
      // LQTYContracts.lqtyToken.address,
      "0x0000000000000000000000000000000000000000",
      LQTYContracts.lqtyStaking.address
    )

    // set contracts in BorrowerOperations 
    await contracts.borrowerOperations.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeed.address,
      contracts.sortedTroves.address,
      contracts.lusdToken.address,
      LQTYContracts.lqtyStaking.address
    )

    // set contracts in the Pools
    await contracts.stabilityPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.lusdToken.address,
      contracts.sortedTroves.address,
      contracts.priceFeed.address,
      LQTYContracts.communityIssuance.address
    )

    await contracts.activePool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.defaultPool.address
    )

    await contracts.defaultPool.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
    )

    await contracts.collSurplusPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
    )

    // set contracts in HintHelpers
    await contracts.hintHelpers.setAddresses(
      contracts.sortedTroves.address,
      contracts.troveManager.address
    )
  }

  // static async connectLQTYContracts(LQTYContracts) {
  //   // Set LQTYToken address in LCF
  //   await LQTYContracts.lockupContractFactory.setLQTYTokenAddress(LQTYContracts.lqtyToken.address)
  // }

  // static async connectLQTYContractsToCore(LQTYContracts, coreContracts) {
  //   await LQTYContracts.lqtyStaking.setAddresses(
  //     LQTYContracts.lqtyToken.address,
  //     coreContracts.lusdToken.address,
  //     coreContracts.troveManager.address, 
  //     coreContracts.borrowerOperations.address,
  //     coreContracts.activePool.address
  //   )
  
  //   await LQTYContracts.communityIssuance.setAddresses(
  //     LQTYContracts.lqtyToken.address,
  //     coreContracts.stabilityPool.address
  //   )
  // }

  // static async connectUnipool(uniPool, LQTYContracts, uniswapPairAddr, duration) {
  //   await uniPool.setParams(LQTYContracts.lqtyToken.address, uniswapPairAddr, duration)
  // }
}
module.exports = DeploymentHelper
