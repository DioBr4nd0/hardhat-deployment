require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ignition");
require('@openzeppelin/hardhat-upgrades');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/831d9436f0ad4fecbe9e385d0eaf92da`,
      accounts: ['764b9fd664b561a8d16a09f68ccc7b46ac12c13d77291af004313d0f06eb673a'],
    },
  },
};