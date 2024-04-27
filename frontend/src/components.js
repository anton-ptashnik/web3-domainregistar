import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';


function DomainRegistration() {
    const [currency, setCurrency] = React.useState('ETH');
    const [domainName, setDomainName] = React.useState('new.domain');

    function handleDomainNameChange(e) {
        setDomainName(e.target.value);
    }
    function handleCurrencyChange(_event, newValue) {
        setCurrency(newValue);
    };

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
            <Button variant='contained'>Register</Button>
        </Stack>
    );
}

function DomainOwnerResolution() {
    const [domainName, setDomainName] = React.useState('existing.domain');

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="findOwner" value={domainName} label="Domain name" variant="outlined" required />
            <Button variant='contained'>Find</Button>
        </Stack>
    );
}

function ControllerEarningsCheck() {
    const [controllerAddress, setControllerAddress] = React.useState('0x1111111111111111');

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="controllerAddress" value={controllerAddress} label="Controller address" variant="outlined" required />
            <Button variant='contained'>Check</Button>
        </Stack>
    );
}

function EarningsWithdrawal() {
    return (
        <Stack direction="row" spacing={4}>
            <Button variant='contained'>Withdraw ETH</Button>
            <Button variant='contained'>Withdraw USDC</Button>
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

export { DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck, EarningsWithdrawal, RegistrationHistory };
