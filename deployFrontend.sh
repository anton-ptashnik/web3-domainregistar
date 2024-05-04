set -e

LOGS_DIR=logs
mkdir -p $LOGS_DIR

pprint() {
    echo -e "\e[104m >> $1\e[0m"
}

DOMAINREGISTAR_CONTRACT_ADDRESS=`cat $LOGS_DIR/contractAddresses.log | sed -n "s/DOMAINREGISTAR_CONTRACT_ADDRESS=\([^']\+\).*/\1/p"`
USDC_CONTRACT_ADDRESS=`cat $LOGS_DIR/contractAddresses.log | sed -n "s/USDC_CONTRACT_ADDRESS=\([^']\+\).*/\1/p"`

pprint "Copy contract ABI files to frontend"
cp artifacts/contracts/DomainRegistar.sol/DomainRegistar.json frontend/src
cp artifacts/contracts/UsdcToken.sol/UsdcToken.json frontend/src

cd frontend
REACT_APP_CONTRACT_ADDRESS=$DOMAINREGISTAR_CONTRACT_ADDRESS REACT_APP_USDC_CONTRACT_ADDRESS=$USDC_CONTRACT_ADDRESS npm start
