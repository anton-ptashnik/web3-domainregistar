set -em

echo "Start Hardhat network"
npx hardhat node > network.log &
HH_NETWORK_PID=$!
trap "kill -- -$HH_NETWORK_PID" EXIT # teardown network on finish

echo "Test contract v1 separately before deploy"
git checkout hw2p1-make-contract-upgradable
npx hardhat test ./test/DomainRegistar.js

echo "Deploy a contract v1 to a local network"
npx hardhat run scripts/deployDomainRegistar.js --network localhost | tee out.log
CONTRACT_ADDR=`cat out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$CONTRACT_ADDR" ]; then echo "Could not parse contract address"; exit 1; fi

echo "Populate data for a contract"
DATAFILE=test/datasets/preupgrade.json npx hardhat test --grep "support top-level domain registration" --network localhost

echo "Test v2 contract separately before deploy"
git checkout hw2p2-support-subdomains
npx hardhat test ./test/DomainRegistar.js

echo "Upgrade a contract in a local network"
export CONTRACT_ADDR
npx hardhat run scripts/upgradeDomainRegistar.js --network localhost

export HARDHAT_NETWORK=localhost
echo "Verify data populated to v1 accessible from v2"
DATAFILE=test/datasets/preupgrade.json npx hardhat test --grep "access domains created by v1"

echo "Verify v2 preserved top-level domain creation"
DATAFILE=test/datasets/postupgrade.json npx hardhat test --grep "support top-level domain registration"

echo "All tests pass!"
