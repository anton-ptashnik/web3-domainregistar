import * as React from 'react';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import {
  DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck,
  EarningsWithdrawal, RegistrationHistory, MetamaskConnection
} from './components';

import { ethers } from 'ethers'
import abiFile from './DomainRegistar.json'

const { ethereum } = window;
const isMetamaskFound = ethereum && ethereum.isMetaMask;
let App, provider, contract;
if (isMetamaskFound) {
  App = ContractApp;
  provider = new ethers.BrowserProvider(window.ethereum)
  contract = new ethers.Contract(
    process.env.REACT_APP_CONTRACT_ADDRESS,
    abiFile.abi,
    provider
  )
} else {
  App = MetamaskMissingApp;
}


let didInit = false;

function ContractApp() {
  async function handleConnect() {
    try {
      // await ethereum.request({
      //   method: "wallet_revokePermissions",
      //   params: [
      //     {
      //       eth_accounts: {},
      //     },
      //   ],
      // });
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      })
      return accounts;
    } catch {
      alert("Connection failed");
      return null;
    }
  }

  function handleAccountSelected(account) {
    window.selectedAccount = account;
  }

  async function handleDomainRegistration(domainName, currency) {
    const signer = await provider.getSigner(window.selectedAccount);
    const contractConn = contract.connect(signer);
    let tx;
    try {
      if (currency=="ETH") {
        const firstDot = domainName.indexOf(".");
        const parentDomain = firstDot > 0 ? domainName.substr(firstDot+1) : "";
        const priceWei = await contractConn.subdomainPriceWei(parentDomain);
        tx = await contractConn.registerDomain(domainName, {value: priceWei});
      } else {
        // tx = await contractConn.registerDomainUsdc(domainName);
        alert("Not impl");
        return;
      }
      await tx.wait();
    } catch(err) {
      alert(err.message);
    }
  }

  async function handleOwnerResolution(domainName) {
    const owner = await contract.domainOwner(domainName);
    if (owner!=0) {
      alert(`Owner of ${domainName} is ${owner}`)
    } else {
      alert(`Domain ${domainName} does not exist`)
    }
  }

  async function handleEarningsCheck(ownerAddress) {
    try {
      const ethBalance = await contract.domainOwnerEarningsEth(ownerAddress);
      const usdcBalance = await contract.domainOwnerEarningsUsdc(ownerAddress);
      alert(`Earnings of ${ownerAddress}: ETH=${ethBalance}, USDC=${usdcBalance}`);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleEarningsWithdrawal(currency) {
    alert(`withdrawing ${currency}`);
  }

  const [history, setHistory] = React.useState([]);
  React.useEffect(() => {
    if (didInit) return;
    didInit = true;
    async function updateHistory() {
      const allRegistrationsFilter = contract.filters.DomainRegistered();
      const logs = await contract.queryFilter(allRegistrationsFilter, 0, "latest");
      const timeNow = Date.now();
      const __history = logs.map((log, i) => ({
         id: log.args.domain+log.args.owner, timestamp: timeNow, domain: log.args.domain, controller: log.args.owner 
      }));
      setHistory(__history);
      contract.on("DomainRegistered", (_, owner, domain) => {
        setHistory(_history => _history.concat({ id: domain+owner, timestamp: Date.now(), domain: domain, controller: owner }))
      })
    }
    updateHistory();
  }, []);

  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
      <Divider flexItem>Connect to the Domain Registar</Divider>
      <MetamaskConnection onConnect={handleConnect} onAccountSelected={handleAccountSelected}/>

      <Divider flexItem>Register a new domain</Divider>
      <DomainRegistration onRequest={handleDomainRegistration}/>

      <Divider flexItem>Find domain owner</Divider>
      <DomainOwnerResolution onRequest={handleOwnerResolution}/>

      <Divider flexItem>Check controller earnings</Divider>
      <ControllerEarningsCheck onRequest={handleEarningsCheck}/>

      <Divider flexItem>Withdraw earnings</Divider>
      <EarningsWithdrawal onRequest={handleEarningsWithdrawal}/>

      <Divider flexItem>Realtime registration events</Divider>
      <RegistrationHistory history={history}/>
    </Stack>
  );
}

function MetamaskMissingApp() {
  return <div>Metamask extension is missing. Install and reload the page</div>
}

export default App;
