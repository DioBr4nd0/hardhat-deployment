const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const proxyModule = require("./ProxyModule");
    const upgradeModule = buildModule("UpgradeModule", (m) => {
        const proxyAdminOwner = m.getAccount(0);
    
        const { proxyAdmin, proxy } = m.useModule(proxyModule);
    
        const payableV2 = m.contract("PayableV2");
        //check this for error
        const encodedFunctionCall = m.encodeFunctionCall(payableV2,"balance",[
            
        ]);
    
        m.call(proxyAdmin, "upgradeAndCall", [proxy, payableV2 , encodedFunctionCall], {
        from: proxyAdminOwner,
        });
    
        return { proxyAdmin, proxy };
    });
    module.exports=upgradeModule