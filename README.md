# Web3 Domain registar

Basic service for accounting registered domain names that runs on Ethereum.

## Testing

Before running tests please install dependencies:

```shell
git submodule update --init --recursive
npm install
```
### v1->v2 contract upgrade tests

Run post-upgrade contract integrity tests using this command: 

```shell
npm run test_v1to2_upgrade
```


High-level test scenario:
1. Run all tests for contract v1 in a test network
2. Deploy contract v1 into a live network
3. Populate data for contract v1
4. Run all tests for contract v2 in a test network
5. Upgrade the deployed contract to v2
6. Verify data populated to v1 is available for v2
7. Verify v2 preserved v1 functionality - top level domain registration
8. Verify v2 supports subdomain registration

  *Note here test network means Hardhat network that auto-starts/stops when running tests, while live network means a network instance run locally by `hardhat node`.*