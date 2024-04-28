import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';


function DomainRegistration({ onRequest }) {
    const [currency, setCurrency] = React.useState('ETH');
    const [domainName, setDomainName] = React.useState('new.domain');

    function handleDomainNameChange(e) {
        setDomainName(e.target.value);
    }
    function handleCurrencyChange(_event, newValue) {
        setCurrency(newValue);
    };
    function handleSubmit() {
        onRequest(domainName, currency);
    }

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="domainName" label="New domain name" value={domainName} onChange={handleDomainNameChange} variant="outlined" required />
            <ToggleButtonGroup
                color="primary"
                value={currency}
                exclusive
                onChange={handleCurrencyChange}
                aria-label="Platform">
                <ToggleButton value="ETH">ETH</ToggleButton>
                <ToggleButton value="USDC">USDC</ToggleButton>
            </ToggleButtonGroup>
            <Button variant='contained' onClick={handleSubmit}>Register</Button>
        </Stack>
    );
}

function DomainOwnerResolution({ onRequest }) {
    const [domainName, setDomainName] = React.useState('existing.domain');

    function handleClick() {
        onRequest(domainName);
    }
    function handleDomainNameChange(e) {
        setDomainName(e.target.value);
    }

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="findOwner" value={domainName} onChange={handleDomainNameChange} label="Domain name" variant="outlined" required />
            <Button variant='contained' onClick={handleClick}>Find</Button>
        </Stack>
    );
}

function ControllerEarningsCheck({ onRequest }) {
    const [controllerAddress, setControllerAddress] = React.useState('0x1111111111111111');

    function onClick() {
        onRequest(controllerAddress);
    }
    function handleAddressChange(e) {
        setControllerAddress(e.target.value);
    }

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="controllerAddress" value={controllerAddress} onChange={handleAddressChange} label="Controller address" variant="outlined" required />
            <Button variant='contained' onClick={onClick}>Check</Button>
        </Stack>
    );
}

function EarningsWithdrawal({ onRequest }) {
    function handleClick(e) {
        onRequest(e.target.id);
    }

    return (
        <Stack direction="row" spacing={4}>
            <Button id='ETH' onClick={handleClick} variant='contained'>Withdraw ETH</Button>
            <Button id='USDC' onClick={handleClick} variant='contained'>Withdraw USDC</Button>
        </Stack>
    );
}


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

function RegistrationHistory() {
    const [rows, setRows] = React.useState([]);
    function handleClickInsert() {
        setRows(_rows.slice(0, rows.length + 1));
    }

    return (
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
    );
}

function MetamaskConnection({ onConnect, onAccountSelected }) {
    const [accounts, setAccounts] = React.useState([])
    const [selectedAccount, setSelectedAccount] = React.useState(null)

    async function handleClick(e) {
        const accounts = await onConnect();
        if (accounts==null) {
            return;
        }
        setAccounts(accounts);
        setSelectedAccount(accounts[0]);
        onAccountSelected(accounts[0]);
    }
    function handleChange(event) {
        setSelectedAccount(event.target.value);
        onAccountSelected(event.target.value);
    };

    const selectItems = accounts.map(acc => <MenuItem value={acc}>{acc}</MenuItem>)
    const isConnected = accounts.length > 0;
    return (
        <Stack direction="row" spacing={4}>
            {isConnected
                ?
                <FormControl>
                    <Select
                        id="account-select"
                        labelId="account-select-label"
                        value={selectedAccount}
                        label="Account"
                        onChange={handleChange}
                        >
                        {selectItems}
                    </Select>
                    <FormHelperText>Select an account for countract interaction</FormHelperText>
                </FormControl>
                :
                <Button id='connect' onClick={handleClick}
                    disabled={selectedAccount != null}
                    variant='contained'>
                    Connect to Metamask
                </Button>
            }
        </Stack>
    );
}

export { DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck, EarningsWithdrawal, RegistrationHistory, MetamaskConnection };
