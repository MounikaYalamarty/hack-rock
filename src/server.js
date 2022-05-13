const express = require('express');
const app = express();
const Web3 = require('web3');

const port = process.env.PORT || 8000;
const baseUrl = `http://localhost:${port}`;

class TransactionChecker {
  web3;
  web3ws;
  account;
  subscription;

  constructor(projectId, account) {
    this.web3ws = new Web3(
      new Web3.providers.WebsocketProvider(
        'wss://ropsten.infura.io/ws/v3/' + projectId
      )
    );
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        'https://ropsten.infura.io/v3/' + projectId
      )
    );
    this.account = account.toLowerCase();
  }

  subscribe(topic) {
    this.subscription = this.web3ws.eth.subscribe(topic, (err, res) => {
      if (err) console.error(err);
    });
  }

  getStatusOfTransaction(tx, txReceipt) {
    if (tx.gas > txReceipt.gasUsed) {
      return 'Transaction Mined Successfully, Transaction Status Good';
    } else if (tx.gas == txReceipt.gasUsed) {
      return 'Transaction Mined Successfully, But Contract Execution Failed';
    } else {
      return 'Regular Transaction That Fails, Does Not Get Mined Into The Blockchain(Insufficient funds for gas * price + value)';
    }
  }
  watchTransactions() {
    console.log("waiting for the transaction");
    this.subscription.on('data', txHash => {
     // console.log(txHash)
      setTimeout(async () => {
        try {
          //console.log(txHash)
          let tx = await this.web3.eth.getTransaction(txHash);
         // console.log(tx);
        //  console.log(this.account);
          if (this.account == tx.from.toLowerCase()) {
           // console.log(tx);
            let txReceipt = await this.web3.eth.getTransactionReceipt(txHash);
            console.log(txReceipt);
            console.log(this.getStatusOfTransaction(tx, txReceipt))
            return this.getStatusOfTransaction(tx, txReceipt);
          }
        } catch (err) {
          console.error(err);
        }
      }, 80000);
    });
  }
}

app.get('/status', (req, res) => {
  let txChecker = new TransactionChecker(
    '5b2813860d8245788ef890e4a0549c6d',
    '0x478804be62A9e28ba67eF0186F82fA3b75b1a2a3'
  );

  txChecker.subscribe('pendingTransactions');
  let status =  txChecker.watchTransactions();
  res.status(200).send(status);
});

app.get('/', (req, res) => {
  res.status(200).send('Hellostatus');
});

// Server
app.listen(port, () => {
  console.log(`Listening on: http://localhost:${port}`);
});
