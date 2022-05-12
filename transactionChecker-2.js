const Web3 = require('web3');

class TransactionChecker {
    web3;
    web3ws;
    account;
    subscription;

    constructor(projectId, account) {
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider('wss://ropsten.infura.io/ws/v3/' + projectId));
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/' + projectId));
        this.account = account.toLowerCase();
    }

    subscribe(topic) {
        this.subscription = this.web3ws.eth.subscribe(topic, (err, res) => {
            if (err) console.error(err);
        });
    }

    watchTransactions() {
        console.log('Watching all pending transactions...');
        this.subscription.on('data', (txHash) => {

            function getStatusOfTransaction(tx, txReceipt) {
                if(tx.gas > txReceipt.gasUsed) {
                    return "Transaction Mined Successfully, Transaction Status Good";
                }else if(tx.gas == txReceipt.gasUsed) {
                    return "Transaction Mined Successfully, But Contract Execution Failed";
                }else{
                    return "Regular Transaction That Fails, Does Not Get Mined Into The Blockchain(Insufficient funds for gas * price + value)"
                }
            }

            setTimeout(async () => {
                try {
                    let tx = await this.web3.eth.getTransaction(txHash);
                    if(tx!=null) {
                        if (this.account == tx.from.toLowerCase()) {
                            console.log(tx);
                            let txReceipt = await this.web3.eth.getTransactionReceipt(txHash);
                            console.log(txReceipt);
                            console.log(getStatusOfTransaction(tx, txReceipt));
                        }
                    }

                } catch (err) {
                    console.error(err);
                }
            }, 100000)
        });
    }
}

let txChecker = new TransactionChecker('5b2813860d8245788ef890e4a0549c6d', '0x478804be62A9e28ba67eF0186F82fA3b75b1a2a3');
txChecker.subscribe('pendingTransactions');
txChecker.watchTransactions();
