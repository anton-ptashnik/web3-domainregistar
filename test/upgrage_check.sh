set -em

LOGS_DIR=logs
mkdir -p $LOGS_DIR

echo "Start Hardhat network"
npx hardhat node > $LOGS_DIR/network.log &
HH_NETWORK_PID=$!
trap "kill -- -$HH_NETWORK_PID" EXIT # teardown network on finish
export HARDHAT_NETWORK=localhost

UPGRADE_TESTPATH="test/ContractUpgrade.js"
TESTDATA_DIR="test/datasets"

echo "Test contract v1 separately before deploy"
git checkout hw2p1-make-contract-upgradable
npx hardhat test ./test/DomainRegistar.js --network hardhat

echo "Deploy a contract v1 to a live network"
npx hardhat run scripts/deployDomainRegistar.js | tee $LOGS_DIR/out.log
CONTRACT_ADDR=`cat $LOGS_DIR/out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$CONTRACT_ADDR" ]; then echo "Could not parse contract address"; exit 1; fi
export CONTRACT_ADDR

echo "Populate data for a contract"
git checkout hw2p2-support-subdomains
DATAFILE=$TESTDATA_DIR/preupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "support top-level domain registration"

echo "Test v2 contract separately before deploy"
npx hardhat test ./test/DomainRegistar.js --network hardhat

echo "Upgrade a contract in a live network"
npx hardhat run scripts/upgradeDomainRegistar.js

echo "Verify data populated to v1 is accessible from v2"
DATAFILE=$TESTDATA_DIR/preupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "access domains created by v1"

echo "Verify v2 preserved top-level domain creation"
DATAFILE=$TESTDATA_DIR/postupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "support top-level domain registration"

echo "Verify v2 supports subdomain creation"
DATAFILE=$TESTDATA_DIR/postupgrade_subdomains.json npx hardhat test $UPGRADE_TESTPATH --grep "support subdomain registration"

echo "Verify v2 supports coin withdrawals for all owners"
DATAFILE=$TESTDATA_DIR/postupgrade_balances.json npx hardhat test $UPGRADE_TESTPATH --grep "allow withdrawals for all owners"

echo "All tests pass!"
