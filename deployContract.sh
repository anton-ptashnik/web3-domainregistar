set -em

LOGS_DIR=logs
mkdir -p $LOGS_DIR

pprint() {
    echo -e "\e[104m >> $1\e[0m"
}

pprint "Start Hardhat network"
export ETHERNAL_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJlYmFzZVVzZXJJZCI6IlE5a0pXRlhFNndhQ29PUjF6M3ZXWlBRRUs0azIiLCJhcGlLZXkiOiJOVFFLMkZRLVhNOE1aWVgtTkRLOVIyUS0xS1dOUVE2XHUwMDAxIiwiaWF0IjoxNzEzNzY3ODQ1fQ.Q8LqfFedZHK4jr8xlkUHAST6UrrZA6_JL44PCYOeKpk
npx hardhat node | tee $LOGS_DIR/network.log &
HH_NETWORK_PID=$!
trap "kill -- -$HH_NETWORK_PID" EXIT # teardown network on finish
export HARDHAT_NETWORK=localhost
sleep 5

pprint "Deploy a USDC contract to a live network"
USDC_SUPPLY=99000000 npx hardhat run scripts/deployUsdc.js | tee $LOGS_DIR/out.log
USDC_CONTRACT_ADDRESS=`cat $LOGS_DIR/out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$USDC_CONTRACT_ADDRESS" ]; then pprint "Could not parse contract address"; exit 1; fi

pprint "Deploy a UsdcEthDataFeed contract to a live network"
USDC2ETH_RATE=324046892602 npx hardhat run scripts/deployUsdcEthDataFeed.js | tee $LOGS_DIR/out.log
USDC2ETH_DATAFEED_CONTRACT_ADDRESS=`cat $LOGS_DIR/out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$USDC2ETH_DATAFEED_CONTRACT_ADDRESS" ]; then pprint "Could not parse contract address"; exit 1; fi

pprint "Deploy a domain registar contract to a live network"
USDC_CONTRACT_ADDRESS=$USDC_CONTRACT_ADDRESS USDC2ETH_CONTRACT_ADDRESS=$USDC2ETH_DATAFEED_CONTRACT_ADDRESS USDC_DOMAIN_PRICE=1000000 npx hardhat run scripts/deployDomainRegistar.js | tee $LOGS_DIR/out.log
DOMAINREGISTAR_CONTRACT_ADDRESS=`cat $LOGS_DIR/out.log | sed -n "s/Contract deployed to: \([^']\+\).*/\1/p"`
if [ -z "$DOMAINREGISTAR_CONTRACT_ADDRESS" ]; then pprint "Could not parse contract address"; exit 1; fi

echo "DOMAINREGISTAR_CONTRACT_ADDRESS=$DOMAINREGISTAR_CONTRACT_ADDRESS" > $LOGS_DIR/contractAddresses.log
echo "USDC_CONTRACT_ADDRESS=$USDC_CONTRACT_ADDRESS" >> $LOGS_DIR/contractAddresses.log
fg
