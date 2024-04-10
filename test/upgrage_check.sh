set -em

echo "Start Hardhat network"
npx hardhat node > network.log &
HH_NETWORK_PID=$!
trap "kill -- -$HH_NETWORK_PID" EXIT # teardown network on finish

export HARDHAT_NETWORK=localhost
TESTPATH="test/ContractUpgrade.js"
DATADIR="test/datasets"

echo "Test contract v1 separately before deploy"
git checkout hw2p1-make-contract-upgradable
npx hardhat test ./test/DomainRegistar.js --network hardhat

echo "Deploy a contract v1 to a local network"
npx hardhat run scripts/deployDomainRegistar.js | tee out.log
CONTRACT_ADDR=`cat out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$CONTRACT_ADDR" ]; then echo "Could not parse contract address"; exit 1; fi
export CONTRACT_ADDR

echo "Populate data for a contract"
git checkout hw2p2-support-subdomains
DATAFILE=$DATADIR/preupgrade.json npx hardhat test $TESTPATH --grep "support top-level domain registration"

echo "Test v2 contract separately before deploy"
npx hardhat test ./test/DomainRegistar.js --network hardhat

echo "Upgrade a contract in a local network"
npx hardhat run scripts/upgradeDomainRegistar.js

echo "Verify data populated to v1 accessible from v2"
DATAFILE=$DATADIR/preupgrade.json npx hardhat test $TESTPATH --grep "access domains created by v1"

echo "Verify v2 preserved top-level domain creation"
DATAFILE=$DATADIR/postupgrade.json npx hardhat test $TESTPATH --grep "support top-level domain registration"

echo "Verify v2 supports subdomain creation"
DATAFILE=$DATADIR/postupgrade_subdomains.json npx hardhat test $TESTPATH --grep "support subdomain registration"

echo "Verify v2 supports coin withdrawals for all owners"
DATAFILE=$DATADIR/postupgrade_balances.json npx hardhat test $TESTPATH --grep "allow withdrawals for all owners - post upgrade"

echo "All tests pass!"
