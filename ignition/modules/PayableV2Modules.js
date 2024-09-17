const {buildModule}= require('@nomicfoundation/hardhat-ignition/modules');
const upgradeModule = require('./UpgradableModule');
        
    const payableV2Module = buildModule("PayableV2Module", (m) => {
        const { proxy } = m.useModule(upgradeModule);
    
        const demo = m.contractAt("PayableV2", proxy);
    
        return { demo };
    });
    module.exports = payableV2Module