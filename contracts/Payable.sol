// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Payable  is Initializable {
    address public Contarctowner;
    mapping(address => bool) approvedApprovers; 
    mapping(address => bool) appliedForApprovers;
    address[] allApprovedAddresses;
    address[] allAppliedAddresses;
    Transaction[] transactions;
    uint approverCount;
    uint minimumApprovals;
    // Removed transferLogicContract as it's no longer needed

    event TransactionCreated(uint id, address to, uint amount);
    event FundsTransferred(uint id, address to, uint amount);
    event TransactionApproved(uint id, address approver);
    event TransactionDisapproved(uint id, address disapprover);
    event AppliedForApprovers(address _approver);
    event ApproverApproved(address approved);
    event TransactionFailed(uint id, address to, uint amount);

    struct Transaction {
        address to;
        uint amount;
        address[] approvals;
        address[] disapprovals;
        bool executed;
        uint timestamp;
        uint approvalCount;
        uint disapprovalCount;
    }

    

    modifier onlyApprover() {
        require(approvedApprovers[msg.sender], "This function can only be called by an Approver");
        _;
    }
    modifier onlyOwner(){
        require(msg.sender==Contarctowner,"You are not the owner hence can't change this ");
        _;
    }
    
    function initialize() public initializer {
        Contarctowner = msg.sender;
        minimumApprovals = 5;
    }

    function getContractOwner() public view returns (address){
        return Contarctowner;
    }

    function getMax(uint a, uint b) internal pure returns (uint) {
        return a > b ? a : b;
    }

    function createTransaction(address to, uint _amount) external returns (uint) {
        require(address(this).balance >= _amount, "Insufficient balance in the contract");
        uint256 transactionId = transactions.length;
        Transaction storage newTransaction = transactions.push();

        newTransaction.to = to;
        newTransaction.amount = _amount;
        newTransaction.executed = false;
        newTransaction.timestamp = block.timestamp;
        newTransaction.approvalCount = 0;
        newTransaction.disapprovalCount = 0;
        

        emit TransactionCreated(transactionId, to, _amount);
        return transactionId;
    }
    
    function approveTransaction(uint256 transactionId) public onlyApprover {
        Transaction storage transaction = transactions[transactionId];
        require(!transaction.executed, "The Transaction is already executed");
        transaction.approvals.push(msg.sender);
        transaction.approvalCount++;

        if(transaction.approvalCount >= getMax(minimumApprovals, approverCount/2)) {
            if(executeTransaction(transactionId)) {
                emit FundsTransferred(transactionId, transaction.to, transaction.amount);
            } else {
                emit TransactionFailed(transactionId, transaction.to, transaction.amount);
            }
        } else {
            emit TransactionApproved(transactionId, msg.sender);
        }
    }

    function disapproveTransaction(uint256 transactionId) public onlyApprover {
        Transaction storage transaction = transactions[transactionId];
        transaction.disapprovals.push(msg.sender);
        transaction.disapprovalCount++;
        emit TransactionDisapproved(transactionId, msg.sender);
    }
    
    function getTransactionDetails(uint transactionId) public view returns (Transaction memory) {
        return transactions[transactionId];
    }

    function getAllTransactions() public view returns (Transaction[] memory) {
        return transactions;
    }

    function approversList() public view returns (address[] memory) {
        return allApprovedAddresses;
    }

    function appliedApproversList() public view returns (address[] memory) {
        return allAppliedAddresses;
    }

    function executeTransaction(uint256 transactionId) internal returns (bool) {
        Transaction storage transaction = transactions[transactionId];
        
        // Direct transfer from contract to recipient
        (bool success, ) = payable(transaction.to).call{value: transaction.amount}("");
        if (success) {
            transaction.executed = true;
        }
        return success;

        // Commented out delegate call logic
        /*
        (bool success, ) = transferLogicContract.delegatecall(
            abi.encodeWithSignature("transfer(address,address,uint256)", transaction.from, transaction.to, transaction.amount)
        );
        if(success){
            transaction.executed = true;
        }
        return success;
        */
    }

    function addApprovers(address[] memory addresses) public onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
            if (!approvedApprovers[addresses[i]]) {
                approvedApprovers[addresses[i]] = true;
                allApprovedAddresses.push(addresses[i]);
                emit ApproverApproved(addresses[i]);
            }
        }
    }

    function applyForApprover(address adress) public {
        require(!approvedApprovers[adress], "You are already an approver");
        require(!appliedForApprovers[adress], "You Have already applied");
        allAppliedAddresses.push(adress);
        appliedForApprovers[adress] = true;
        emit AppliedForApprovers(adress);
    }

    function approveApprover(address adres) public onlyOwner {
        require(!approvedApprovers[adres], "You are already approved");
        delete appliedForApprovers[adres];
        for (uint i = 0; i < allAppliedAddresses.length; i++) {
            if (allAppliedAddresses[i] == adres) {
                allAppliedAddresses[i] = allAppliedAddresses[allAppliedAddresses.length - 1];
                allAppliedAddresses.pop();
                break;
            }
        }
        approvedApprovers[adres] = true;
        allApprovedAddresses.push(adres);
        approverCount++;

        emit ApproverApproved(adres);
    }

    function getBalance(address ad) public view returns (uint) {
        return address(ad).balance;
    }
    
    function balance() public view returns (uint) {
        return address(this).balance;
    }

    function receiveEther() external payable {}
}

//0xDd818FdD3c5b7B52a055767403aA7a62943AeeeD