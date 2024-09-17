const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const proxyModule= buildModule("ProxyModule",(m)=>{
    const proxyAdminOwner = m.getAccount(0);

    const payable = m.contract("Payable");

    const  proxy = m.contract("TransparentUpgradeableProxy",[
        payable,
        proxyAdminOwner,
        "0x"
    ])

    const proxyAdminAddress = m.readEventArgument(
        proxy,
        "AdminChanged",
        "newAdmin"
    )

    const proxyAdmin = m.contractAt("ProxyAdmin",proxyAdminAddress);

    return {proxyAdmin , proxy}
})

module.exports= proxyModule
