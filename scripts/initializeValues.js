const ethers = require("ethers");
const hardhat = require("hardhat");

async function runTests() {
    let PayableContract;
    let payable;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    async function setup() {
        PayableContract = await hardhat.ethers.getContractFactory("Payable");
        [owner, addr1, addr2, ...addrs] = await hardhat.ethers.getSigners();
        payable = await hardhat.upgrades.deployProxy(PayableContract, [], { initializer: 'initialize' });
        await payable.waitForDeployment();
    }

    async function testDeployment() {
        await setup();

        const contractOwner = await payable.getContractOwner();
        if (contractOwner !== owner.address) {
            throw new Error("Owner should be set correctly");
        }
        console.log("Owner Test Passing")
        await payable.receiveEther({value: ethers.parseEther("1.0")});
        const balance = await payable.balance();
        if (balance.toString() !== ethers.parseEther("1.0").toString()) {
            throw new Error("Contract should receive ethers");
        }
        console.log("contract is receiving ethers")
    }

    async function testTransactions() {
        await setup();
        await payable.receiveEther({value: ethers.parseEther("1.0")});

        await payable.createTransaction(addr1.address, 100);
        const transaction = await payable.getTransactionDetails(0);
        if (transaction.to !== addr1.address) {
            throw new Error("Transaction recipient should be correct");
        }
        if (transaction.amount.toString() !== "100") {
            throw new Error("Transaction amount should be correct");
        }

        try {
            await payable.receiveEther({value: ethers.parseEther("2.0")})
            await payable.createTransaction(addr1.address, ethers.parseEther("1.0"));
            var temptransaction =await  payable.getAllTransactions()
            if(temptransaction[temptransaction.length-1].amount){
                console.log("Transaction Craeted Successfully")
            }

        } catch (error) {
            throw new Error(error)
        }

        console.log("Transactions test completed successfully.");
    }

    async function testApprovers() {
        await setup();

        await payable.addApprovers([addr1.address, addr2.address]);
        const approversList = await payable.approversList();

        if (!approversList.includes(addr1.address) || !approversList.includes(addr2.address)) {
            throw new Error("Approvers should be added correctly");
        }
        console.log("approver adding test pasing ")
        const appliedApproversList = await payable.approversList();
        if (!appliedApproversList.includes(addr1.address)) {
            throw new Error("User should be able to apply for approver role");
        }

        console.log("Approvers test completed successfully.");
    }

    async function testTransactionApproval() {
        await setup();
        await payable.addApprovers([addr1.address, addr2.address]);
        await payable.receiveEther({ value: ethers.parseEther("1") });
        await payable.createTransaction(addrs[0].address, ethers.parseEther("0.5"))
        await payable.connect(addr1).approveTransaction(0);
        let transaction = await payable.getTransactionDetails(0);
        
        if (transaction.approvalCount.toString() !== "1") {
            throw new Error("Approver should be able to approve a transaction");
        }
        console.log("approver approving transaction passing")
        await payable.connect(addr2).disapproveTransaction(0);
        transaction = await payable.getTransactionDetails(0);
        if (transaction.disapprovalCount.toString() !== "1") {
            throw new Error("Approver should be able to disapprove a transaction");
        }
        
        // Add more approvers
        for (let i = 2; i < 7; i++) {
            await payable.addApprovers([addrs[i].address]);
        }
        

        for (let i = 2; i < 6; i++) {
            await payable.connect(addrs[i]).approveTransaction(0);
        }

        transaction = await payable.getTransactionDetails(0);
        if (!transaction.executed) {
            throw new Error("Transaction should be executed when minimum approvals are met");
        }

        console.log("Transaction approval test completed successfully.");
    }

    try {
        await testDeployment();
        await testTransactions();
        await testApprovers();
        await testTransactionApproval();
        console.log("All tests completed successfully.");
    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

runTests().catch(console.error);