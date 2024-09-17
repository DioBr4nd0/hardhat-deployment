const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Payable Contract", function () {
  let PayableContract;
  let payable;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    PayableContract = await ethers.getContractFactory("Payable");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    payable = await upgrades.deployProxy(PayableContract, [], { initializer: 'initialize' });
    await payable.waitForDeployment();

  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await payable.getContractOwner()).to.equal(owner.address);
    });
  
    it("should be able to recieve ethers",async function (){
      await payable.receiveEther({value:ethers.parseEther("1.0")})
      expect(await payable.balance()).to.equal(ethers.parseEther("1.0"))
    })
  });

  describe("Transactions", function () {
    it("Should create a transaction", async function () {
      await payable.receiveEther({value:ethers.parseEther("1.0")})
      await payable.createTransaction(addr1.address, 100);
      const transaction = await payable.getTransactionDetails(0);
      expect(transaction.to).to.equal(addr1.address);
      expect(transaction.amount).to.equal(100);
    });

    it("Should fail to create a transaction with insufficient balance", async function () {
      await expect(payable.createTransaction(addr1.address, ethers.parseEther("1"))).to.be.revertedWith("Insufficient balance in the contract");
    });
  });

  describe("Approvers", function () {
    it("Should allow owner to add approvers", async function () {
      await payable.addApprovers([addr1.address, addr2.address]);
      expect(await payable.approversList()).to.include(addr1.address);
      expect(await payable.approversList()).to.include(addr2.address);
    });

    it("Should allow users to apply for approver role", async function () {
      await payable.connect(addr1).applyForApprover(addr1.address);
      expect(await payable.appliedApproversList()).to.include(addr1.address);
    });

    it("Should allow owner to approve an applied approver", async function () {
      await payable.connect(addr1).applyForApprover(addr1.address);
      await payable.approveApprover(addr1.address);
      expect(await payable.approversList()).to.include(addr1.address);
    });
  });

  describe("Transaction Approval", function () {
    beforeEach(async function () {
      await payable.addApprovers([addr1.address, addr2.address]);
      await payable.receiveEther({ value: ethers.parseEther("1") });
      await payable.createTransaction(addrs[0].address, ethers.parseEther("0.5"));
    });

    it("Should allow approvers to approve a transaction", async function () {
      await payable.connect(addr1).approveTransaction(0);
      const transaction = await payable.getTransactionDetails(0);
      expect(transaction.approvalCount).to.equal(1);
    });

    it("Should allow approvers to disapprove a transaction", async function () {
      await payable.connect(addr1).disapproveTransaction(0);
      const transaction = await payable.getTransactionDetails(0);
      expect(transaction.disapprovalCount).to.equal(1);
    });

    it("Should execute transaction when minimum approvals are met", async function () {
      // Assuming minimumApprovals is 5, we need to add more approvers
      
      for (let i = 2; i < 7; i++) {
        await payable.addApprovers([addrs[i].address]);
      }
      
      for (let i = 2; i < 7; i++) {
        await payable.connect(addrs[i]).approveTransaction(0);
      }

      const transaction = await payable.getTransactionDetails(0);
      expect(transaction.executed).to.be.true;
    });
  });

});