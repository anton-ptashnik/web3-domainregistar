import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';

function DomainRegistration({ onRequest }) {
    const [currency, setCurrency] = React.useState("ETH");
    const [domainName, setDomainName] = React.useState("");
    const [subdomainPrice, setSubdomainPrice] = React.useState("");

    function handleDomainNameChange(e) {
        setDomainName(e.target.value);
    }
    function handleSubdomainPriceChange(e) {
        setSubdomainPrice(e.target.value);
    }
    function handleCurrencyChange(_event, newValue) {
        setCurrency(newValue);
    };
    function handleSubmit() {
        onRequest(domainName, subdomainPrice, currency);
    }

    return (
        <Stack direction="row" spacing={2}>
            <TextField id="domainName" label="New domain name" value={domainName} onChange={handleDomainNameChange} variant="outlined" required />
            <TextField id="subdomainPrice" label="Subdomain price USDC" value={subdomainPrice} onChange={handleSubdomainPriceChange} variant="outlined" required />
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
    const [domainName, setDomainName] = React.useState("");

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
    const [controllerAddress, setControllerAddress] = React.useState("");

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
    { field: 'id', headerName: 'ID' },
    { field: 'timestamp', headerName: 'Timestamp', flex: 0.15 },
    { field: 'domain', headerName: 'Domain', flex: 0.3 },
    { field: 'subdomainPrice', headerName: 'Subdomain USDC price', flex: 0.2 },
    { field: 'controller', headerName: 'Controller', flex: 0.35 },
];

function RegistrationHistory({ history }) {
    return (
        <Box height={400} sx={{ width: '70%' }}>
            <DataGrid
                disableColumnSelector
                rows={history}
                columns={columns}
                initialState={{
                    columns: {
                        columnVisibilityModel: {
                            id: false,
                        },
                    },
                    sorting: {
                        sortModel: [{ field: 'timestamp', sort: 'desc' }],
                    },
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

function UsdcAllowance({ onRequest, allowance }) {
    const [newAllowance, setNewAllowance] = React.useState("");

    function onClick() {
        onRequest(newAllowance);
    }
    function handleAllowanceChange(e) {
        setNewAllowance(e.target.value);
    }
    return (
        <Stack direction="column" spacing={2} alignItems="center">
        <Typography variant="body1" gutterBottom>
        Your current USDC allowance for DomainRegistar is {allowance}
        </Typography>
        <Stack direction="row" spacing={2}>
            <TextField id="controllerAddress" value={newAllowance} onChange={handleAllowanceChange} label="USDC allowance for DomainRegistar" variant="outlined" required />
            <Button variant='contained' onClick={onClick}>Approve</Button>
        </Stack>
        </Stack>
    );
}

export { DomainRegistration, DomainOwnerResolution, ControllerEarningsCheck, EarningsWithdrawal, RegistrationHistory, UsdcAllowance };
