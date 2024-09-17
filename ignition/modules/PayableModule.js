const {buildModule}= require('@nomicfoundation/hardhat-ignition/modules');
const fs =require('fs')
const proxyModule = require('./ProxyModule');

const payableModule= buildModule("Payable",(m)=>{
    const {proxy, proxyAdmin} =m.useModule(proxyModule);

    const payable =m.contractAt("Payable", proxy)

    return {payable, proxy, proxyAdmin}
})

module.exports = payableModule