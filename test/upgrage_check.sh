set -em

LOGS_DIR=logs
mkdir -p $LOGS_DIR

pprint() {
    echo -e "\033[104m >> $1\e[0m"
}

pprint "Start Hardhat network"
npx hardhat node > $LOGS_DIR/network.log &
HH_NETWORK_PID=$!
trap "kill -- -$HH_NETWORK_PID" EXIT # teardown network on finish
export HARDHAT_NETWORK=localhost

UPGRADE_TESTPATH="test/ContractUpgrade.js"
TESTDATA_DIR="test/datasets"

pprint "Checkout contract v1 codebase"
git checkout v1.0.0
pprint "Test contract v1 separately before deploy"
npx hardhat test ./test/DomainRegistar.js --network hardhat

pprint "Deploy a contract v1 to a live network"
npx hardhat run scripts/deployDomainRegistar.js | tee $LOGS_DIR/out.log
CONTRACT_ADDR=`cat $LOGS_DIR/out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$CONTRACT_ADDR" ]; then pprint "Could not parse contract address"; exit 1; fi
export CONTRACT_ADDR

pprint "Checkout contract v2 codebase"
git checkout v2.0.0
pprint "Populate data for a live contract"
DATAFILE=$TESTDATA_DIR/preupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "support top-level domain registration"

pprint "Test v2 contract separately before deploy"
npx hardhat test ./test/DomainRegistar.js --network hardhat

pprint "Upgrade a contract in a live network"
npx hardhat run scripts/upgradeDomainRegistar.js

pprint "Verify data populated to v1 is accessible from v2"
DATAFILE=$TESTDATA_DIR/preupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "access domains created by v1"

pprint "Verify v2 preserved top-level domain creation"
DATAFILE=$TESTDATA_DIR/postupgrade.json npx hardhat test $UPGRADE_TESTPATH --grep "support top-level domain registration"

pprint "Verify v2 supports subdomain creation"
DATAFILE=$TESTDATA_DIR/postupgrade_subdomains.json npx hardhat test $UPGRADE_TESTPATH --grep "support subdomain registration"

pprint "Verify v2 supports coin withdrawals for all owners"
DATAFILE=$TESTDATA_DIR/postupgrade_balances.json npx hardhat test $UPGRADE_TESTPATH --grep "allow withdrawals for all owners"

pprint "All tests pass!"
