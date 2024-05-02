import { ethers } from 'ethers';
import abiFile from "../artifacts/contracts/DomainRegistar.sol/DomainRegistar.json" with { type: "json" };
import express from 'express'

const PORT = 3001;
const app = express();

const provider = new ethers.JsonRpcProvider();
const WALLETS_COUNT = 5;
const wallets = new Map();
for (let i=0; i<WALLETS_COUNT; i++) {
    const wallet = ethers.HDNodeWallet.fromPhrase(
        "test test test test test test test test test test test junk",
        null,
        `m/44'/60'/0'/0/${i}`
    )
    wallets.set(wallet.address.toLowerCase(), wallet);
}

app.post('/withdraw/:account', async (req, res) => {
  let { account } = req.params;
  account = account.toLowerCase();
  const availableCurrencies = ["eth", "usdc"];
  const requestedCurrency = req.query.currency || "";
  if (!wallets.has(account) || !availableCurrencies.includes(requestedCurrency.toLowerCase())) {
    return res.status(400).end();
  }
  const wallet = wallets.get(account).connect(provider);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abiFile.abi, wallet);
  try {
    let tx;
    if (requestedCurrency.toLowerCase()=="eth") {
        tx = await contract.withdraw();
    } else {
        tx = await contract.withdrawUsdc();
    }
    await tx.wait()
    } catch(err) {
        return res.status(500).json({error: err.message});
    }
    return res.status(200).end();
});

app.listen(PORT, () => {
    console.log("Server Listening on PORT: ", PORT);
});
