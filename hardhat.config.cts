import type { HardhatUserConfig } from "hardhat/config";
require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  networks: {
    sepolia: {
      url: "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.SEPOLIA_PRIVATE_KEY
        ? [process.env.SEPOLIA_PRIVATE_KEY]
        : [],
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: process.env.FUJI_PRIVATE_KEY
        ? [process.env.FUJI_PRIVATE_KEY]
        : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export = config;
