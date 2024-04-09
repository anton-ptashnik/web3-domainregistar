# Web3 Domain registar

Basic service for accounting registered domain names that runs on Ethereum.

## Testing

### v1->v2 contract upgrade tests

Run tests to verify post-upgrade contract integrity as below 

```shell
npm run test_v1to2_upgrade
```

High-level test scenario:
1. Run all tests for contract v1 to make sure it works
2. Deploy contract v1 into a local network
3. Populate data for contract v1
4. Run all tests for contract v2 to make sure it works
5. Upgrade the deployed contract to v2
6. Verify data populated to v1 is available for v2
7. Verify v2 preserved v1 functionality - top level domain registration