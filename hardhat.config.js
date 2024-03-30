require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");

const fs = require('fs')
const getSecret = (secretKey, defaultValue='') => {
    const SECRETS_FILE = "./secrets.js"
    let secret = defaultValue
    if (fs.existsSync(SECRETS_FILE)) {
        const { secrets } = require(SECRETS_FILE)
        if (secrets[secretKey]) { secret = secrets[secretKey] }
    }

    return secret
}

const bitlayerUrlTestnet = () => {
  return `https://testnet-rpc.bitlayer.org`
}

const merlinUrlTestnet = () => {
  return `https://testnet-rpc.merlinchain.io`
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    bitlayerTestnet: {
        url: bitlayerUrlTestnet(),
        gas: 30000000,  // tx gas limit
        accounts: [getSecret('BITLAYER_DEPLOYER_PRIVATEKEY', '0x0B8aFce82ccDA27Fc16FA3bCbBF9a910649E98BC')]
    },
  },
  solidity: {
    compilers: [
        {
            version: "0.6.11",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 100
                }
            }
        },
    ]
  },
};
