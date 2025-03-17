#!/bin/sh
set -e

source ../.env

alias ord_cmd="ORD_BITCOIN_RPC_URL=$BTC_CORE_RPC ord --bitcoin-rpc-username $BTC_RPC_USER --bitcoin-rpc-password $BTC_RPC_PASS --chain regtest wallet --server-url=$ORD_URL"

start_containers () {
  rm -rf bitcoin-data && rm -rf ~/Library/Application\ Support/ord && \
	docker compose up -d --build --force-recreate && \
  sleep 1 && \
	curl -s --user regtest:regtest --data-binary '{"method":"createwallet","params":["wallet"]}' $BTC_CORE_RPC
  BTC_ADDRESS=$(curl -s --user regtest:regtest --data-binary '{"method":"getnewaddress","params":[]}' $BTC_CORE_RPC | jq -r '.result')
}

mine_blocks () {
  curl -s --user regtest:regtest --data-binary "{\"method\":\"generatetoaddress\",\"params\":[$1, \"$BTC_ADDRESS\"]}" $BTC_CORE_RPC > /dev/null
}

keep_mining () {
  watch -n $1 \
	"curl -s --user regtest:regtest --data-binary '{\"jsonrpc\":\"1.0\",\"id\":\"curltext\",\"method\":\"generatetoaddress\",\"params\":[1, \"$BTC_ADDRESS\"]}' $BTC_CORE_RPC"
}

send () {
  curl -s --user regtest:regtest --data-binary "{\"method\":\"sendtoaddress\",\"params\":[\"$1\", $2]}" $BTC_CORE_RPC/wallet/wallet
}

# Start the infrastructure
start_containers

# Mine some blocks
mine_blocks 101

# Send some coins to the buyer and seller
send $SELLER_ADDRESS 0.0001
send $SELLER_ADDRESS 0.0001
send $SELLER_ADDRESS 0.0001
send $BUYER_ADDRESS 0.0001
send $BUYER_ADDRESS 0.0001
send $BUYER_ADDRESS 0.0001

echo 'Funded seller and buyer'
mine_blocks 1

echo 'Wait for ord to catch up'
sleep 5

# Create ord wallet
echo $ORD_MNEMONIC | ord_cmd restore --from mnemonic

ORD_ADDRESS="$(ord_cmd receive | grep -Ei '[a-z0-9]{64}' -o)"
echo "ord address: $ORD_ADDRESS"

send $ORD_ADDRESS 0.1
mine_blocks 1

echo 'Wait for ord to catch up'
sleep 5

# Create the rune token
ord_cmd batch --fee-rate 1 --batch batch.yaml &

sleep 5
mine_blocks 10

echo 'Wait for ord to catch up'
sleep 5

mine_blocks 10

echo 'Wait for ord to catch up'
sleep 5

# Send tokens to the seller
ord_cmd send --fee-rate 1 $SELLER_ADDRESS 100:THEBESTRUNETOKEN

echo 'token sent'

keep_mining 10