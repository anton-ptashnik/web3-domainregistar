import * as React from 'react';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import {
  DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck,
  EarningsWithdrawal, RegistrationHistory, MetamaskConnection, UsdcAllowance
} from './components';

import { ethers } from 'ethers'
import domainRegistarAbiFile from './DomainRegistar.json'
import usdcAbiFile from './UsdcToken.json'

const { ethereum } = window;
const isMetamaskFound = ethereum && ethereum.isMetaMask;
let App, provider, contract, usdcContract;
if (isMetamaskFound) {
  App = ContractApp;
  provider = new ethers.BrowserProvider(window.ethereum);
  contract = new ethers.Contract(
    process.env.REACT_APP_CONTRACT_ADDRESS,
    domainRegistarAbiFile.abi,
    provider
  );
  usdcContract = new ethers.Contract(
    process.env.REACT_APP_USDC_CONTRACT_ADDRESS,
    usdcAbiFile.abi,
    provider
  );
} else {
  App = MetamaskMissingApp;
}


let didInit = false;

function ContractApp() {
  const [history, setHistory] = React.useState([]);
  const [usdcAllowance, setUsdcAllowance] = React.useState(0);

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
    async function updUsdcAllowance() {
      const signer = await provider.getSigner(account);
      const contractConn = usdcContract.connect(signer);
      try {
        const _allowance = await contractConn.allowance(account, contract.getAddress());
        setUsdcAllowance(_allowance);
        await usdcContract.off("Approval");
        await usdcContract.on("Approval", (owner, spender, value) => {
          if (owner.toLowerCase() == account.toLowerCase()) setUsdcAllowance(value);
        });
      } catch(err) {
        alert(err.message);
      }
    }
    updUsdcAllowance();
    window.selectedAccount = account;
  }

  async function handleDomainRegistration(domainName, subdomainPriceUsdc, purchaseCurrency) {
    const signer = await provider.getSigner(window.selectedAccount);
    const contractConn = contract.connect(signer);
    let tx;
    try {
      if (purchaseCurrency=="ETH") {
        const firstDot = domainName.indexOf(".");
        const parentDomain = firstDot > 0 ? domainName.substr(firstDot+1) : "";
        const priceWei = await contractConn.subdomainPriceWei(parentDomain);
        tx = await contractConn.registerDomain(domainName, subdomainPriceUsdc, {value: priceWei});
      } else {
        tx = await contractConn.registerDomainUsdc(domainName, subdomainPriceUsdc);
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

  async function handleEarningsWithdrawal(currency) {
    const signer = await provider.getSigner(window.selectedAccount);
    const contractConn = contract.connect(signer);
    let tx;
    try {
      if (currency=="ETH") {
        tx = await contractConn.withdrawEth();
      } else {
        tx = await contractConn.withdrawUsdc();
      }
      await tx.wait();
      alert(`Your ${currency} was sent. Check your balance`);
    } catch(err) {
      alert(err.message);
    }
  }

  async function handleUsdcAllowanceChange(newAllowance) {
    const signer = await provider.getSigner(window.selectedAccount);
    const contractConn = usdcContract.connect(signer);
    try {
      const tx = await contractConn.approve(contract.getAddress(), newAllowance);
      await tx.wait();
    } catch(err) {
      alert(err.message);
    }
  }

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
      <Divider flexItem>Contract address</Divider>
      <Typography variant="body1" gutterBottom>
        <b>DomainRegistar:</b> {process.env.REACT_APP_CONTRACT_ADDRESS} <b>USDC:</b> {process.env.REACT_APP_USDC_CONTRACT_ADDRESS}
      </Typography>

      <Divider flexItem>Connect to the Domain Registar</Divider>
      <MetamaskConnection onConnect={handleConnect} onAccountSelected={handleAccountSelected}/>

      <Divider flexItem>Check/update USDC allowance for DomainRegistar</Divider>
      <UsdcAllowance onRequest={handleUsdcAllowanceChange} allowance={String(usdcAllowance)}/>

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
