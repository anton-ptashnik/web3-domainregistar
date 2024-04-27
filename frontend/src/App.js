// import './App.css';

import * as React from 'react';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import {DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck, EarningsWithdrawal, RegistrationHistory} from './components';


function App() {
  function handleClick() {
    // alert(`${currency} : ${domain}`);
  }

  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
      <Divider flexItem>Register a new domain</Divider>
      <DomainRegistration/>

      <Divider flexItem>Find domain owner</Divider>
      <DomainOwnerResolution/>

      <Divider flexItem>Check controller earnings</Divider>
      <ControllerEarningsCheck/>

      <Divider flexItem>Withdraw earnings</Divider>
      <EarningsWithdrawal/>

      <Divider flexItem>Realtime registration events</Divider>
      <RegistrationHistory/>
    </Stack>
  );
}

export default App;
