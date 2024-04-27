// import './App.css';

import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';


const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'domain', headerName: 'Domain', width: 220 },
  { field: 'controller', headerName: 'Controller', width: 280 },
];

const _rows = [
  { id: 1, domain: 'Snow', controller: 'Jon' },
  { id: 2, domain: 'Lannister', controller: 'Cersei' },
  { id: 3, domain: 'Lannister', controller: 'Jaime' },
  { id: 4, domain: 'Stark', controller: 'Arya' },
  { id: 5, domain: 'Stark', controller: 'Arya' },
  { id: 6, domain: 'Stark', controller: 'Arya' },
  { id: 7, domain: 'Stark', controller: 'Arya' },
  // { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
  // { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
];


function App() {
  const [currency, setCurrency] = React.useState('ETH');
  const [domain, setDomain] = React.useState('new.domain');
  const [findDomain, setFindDomain] = React.useState('existing.domain');
  const [controllerAddress, setControllerAddress] = React.useState('0x1111111111111111');
  const [rows, setRows] = React.useState([]);

  const handleCurrencyChange = (event, newCurrency) => {
    setCurrency(newCurrency);
  };

  function handleClick() {
    alert(`${currency} : ${domain}`);
  }

  function handleClickInsert() {
    setRows(_rows.slice(0, rows.length + 1));
  }

  return (
    <Stack direction="column" spacing={2} justifyContent="center" alignItems="center" >
      <Divider flexItem>Register a new domain</Divider>
      <Stack direction="row" spacing={2}>
        <TextField id="domainName"  label="New domain name" value={domain} variant="outlined" required/>
        <ToggleButtonGroup
          color="primary"
          value={currency}
          exclusive
          onChange={handleCurrencyChange}
          aria-label="Platform">
          <ToggleButton value="ETH">ETH</ToggleButton>
          <ToggleButton value="USDC">USDC</ToggleButton>
        </ToggleButtonGroup>
        <Button variant='contained' onClick={handleClick}>Register</Button>
      </Stack>

      <Divider flexItem>Find domain owner</Divider>
      <Stack direction="row" spacing={2}>
        <TextField id="findOwner" value={findDomain} label="Domain name" variant="outlined" required />
        <Button variant='contained' onClick={handleClick}>Find</Button>
      </Stack>

      <Divider flexItem>Check controller earnings</Divider>
      <Stack direction="row" spacing={2}>
        <TextField id="controllerAddress" value={controllerAddress} label="Controller address" variant="outlined" required />
        <Button variant='contained' onClick={handleClick}>Check</Button>
      </Stack>

      <Divider flexItem>Withdraw earnings</Divider>
      <Stack direction="row" spacing={4}>
        <Button variant='contained' onClick={handleClick}>Withdraw ETH</Button>
        <Button variant='contained' onClick={handleClick}>Withdraw USDC</Button>
      </Stack>

      <Divider flexItem>Realtime registration events</Divider>
      <Box height={400} sx={{ width: '70%' }}>
        <Button variant='contained' onClick={handleClickInsert}>Insert</Button>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 5 },
            },
          }}
          pageSizeOptions={[5, 10]}
          slots={{ toolbar: GridToolbar }}
        />
      </Box>
    </Stack>
  );
}

export default App;
