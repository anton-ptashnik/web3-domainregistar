# Web3 Domain Registar

Basic service for accounting registered domain names that runs on Ethereum.

## Features

Domain Registar provides the following features:
- top-level domain registration, eg top1, top2
- subdomain registration, eg sub.top1, sub.top2, sub.sub.top1
- paying for domains with ETH or USDC
- earning from others creating subdomains under the owned domain. Subdomain price is specified in USDC
- earnings withdrawal on demand
- resolving domain owner account address by domain name
- checking earnings

## Frontend

User access to the listed features is provided by a single page frontend application built with React. Follow the steps below to start the frontend.

## Local deploy

First, install required deps by running
```shell
cd <rootDir>
npm run installDeps
```
Then one can deploy Domain Registar, frontend and backend using dedicated NPM scripts:
```shell
npm run deployContract >& logs/network.log &
npm run deployFrontend >& logs/frontend.log &
npm run deployBackend >& logs/backend.log &
```

Frontend page should be available at http://localhost:3000, backend at http://localhost:3001 

## Testing

All contract features are covered by dedicated tests one can run using the command below. The contract gets deployed into a clean network and tests are run then.

```shell
npm run test
```
