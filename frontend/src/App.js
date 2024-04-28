// import './App.css';

import * as React from 'react';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import {DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck, EarningsWithdrawal, RegistrationHistory} from './components';


function App() {
  function handleClick() {
    // alert(`${currency} : ${domain}`);
  }

  function handleDomainRegistration(domainName, currency) {
    alert(`buying ${domainName} for ${currency}`)
  }

  function handleOwnerResolution(domainName) {
    alert(`resolving owner of ${domainName}`)
  }
  function handleEarningsCheck(ownerAddress) {
    alert(`reading earnings of ${ownerAddress}`);
  }
  function handleEarningsWithdrawal(currency) {
    alert(`withdrawing ${currency}`);
  }

  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
      <Divider flexItem>Register a new domain</Divider>
      <DomainRegistration onRequest={handleDomainRegistration}/>

      <Divider flexItem>Find domain owner</Divider>
      <DomainOwnerResolution onRequest={handleOwnerResolution}/>

      <Divider flexItem>Check controller earnings</Divider>
      <ControllerEarningsCheck onRequest={handleEarningsCheck}/>

      <Divider flexItem>Withdraw earnings</Divider>
      <EarningsWithdrawal onRequest={handleEarningsWithdrawal}/>

      <Divider flexItem>Realtime registration events</Divider>
      <RegistrationHistory/>
    </Stack>
  );
}

export default App;
