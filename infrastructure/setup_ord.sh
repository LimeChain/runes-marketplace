#!/bin/sh
set -e

source ../.env

echo $ORD_MNEMONIC

# Start the infrastructure
make start

# Mine some blocks
make mine > /dev/null

# Send some coins to the buyer and seller
make send address=$SELLER_ADDRESS amount=0.0001
make send address=$SELLER_ADDRESS amount=0.0001
make send address=$SELLER_ADDRESS amount=0.0001
make send address=$BUYER_ADDRESS amount=0.0001
make send address=$BUYER_ADDRESS amount=0.0001
make send address=$BUYER_ADDRESS amount=0.0001

echo 'Wait for ord to catch up'
sleep 5

# Create ord wallet
echo $ORD_MNEMONIC | ORD_BITCOIN_RPC_URL=http://localhost:8332 ord --bitcoin-rpc-username regtest --bitcoin-rpc-password regtest --chain regtest wallet --server-url=http://localhost:1234 restore --from mnemonic

ORD_ADDRESS="$(ORD_BITCOIN_RPC_URL=http://localhost:8332 ord --bitcoin-rpc-username regtest --bitcoin-rpc-password regtest --chain regtest wallet --server-url=http://localhost:1234 receive | grep -Ei '[a-z0-9]{64}' -o)"
echo "ord address: ${ORD_ADDRESS}"

make send address=$ORD_ADDRESS amount=0.1

echo 'Wait for ord to catch up'
sleep 5

# Create the rune token
ORD_BITCOIN_RPC_URL=http://localhost:8332 ord --bitcoin-rpc-username regtest --bitcoin-rpc-password regtest --chain regtest wallet --server-url=http://localhost:1234 batch --fee-rate 1 --batch batch.yaml &

sleep 5
make mine > /dev/null

echo 'Token etched'
echo 'Wait for ord to catch up'
sleep 5

make mine > /dev/null

echo 'Wait for ord to catch up'
sleep 5

# Send tokens to the seller
ORD_BITCOIN_RPC_URL=http://localhost:8332 ord --bitcoin-rpc-username regtest --bitcoin-rpc-password regtest --chain regtest wallet --server-url=http://localhost:1234 send --fee-rate 1 $SELLER_ADDRESS 100:THEBESTRUNETOKEN

echo 'token sent'
make mine > /dev/null