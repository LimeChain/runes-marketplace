BTC_CORE_RPC = http://127.0.0.1:8332
BTC_ADDRESS = bcrt1qwzgluflufpe43q5g6c0l8jxjfkyqjz00t65ak0
BTC_PRIVATE_KEY = cSaejkcWwU25jMweWEewRSsrVQq2FGTij1xjXv4x1XvxVRF1ZCr3

.PHONY: start
start:
	@rm -rf bitcoin-data && rm -rf ~/Library/Application\ Support/ord && \
	docker compose up -d --build --force-recreate && \
	sleep 5 && \
	curl -s --user regtest:regtest --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"createwallet","params":["go-wallet", false, false, "", false, true, true]}' -H 'content-type:text/plain;' $(BTC_CORE_RPC) && \
	curl -s --user regtest:regtest --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"importdescriptors","params": {"requests":[{"desc":"wpkh($(BTC_PRIVATE_KEY))#ag7pgmdv","timestamp":"now"}]}}' -H 'content-type:text/plain;' $(BTC_CORE_RPC)

.PHONY: mine
mine:
	@curl -s --user regtest:regtest --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"generatetoaddress","params":[101, "$(BTC_ADDRESS)"]}' -H 'content-type:text/plain;' $(BTC_CORE_RPC)

.PHONY: keep-mining
keep-mining:
	@watch -n $(SEC) \
	"curl -s --user regtest:regtest --data-binary '{\"jsonrpc\":\"1.0\",\"id\":\"curltext\",\"method\":\"generatetoaddress\",\"params\":[1, \"$(BTC_ADDRESS)\"]}' -H 'content-type:text/plain;' $(BTC_CORE_RPC)"

.PHONY: send
send:
	@curl -s --user regtest:regtest --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"sendtoaddress","params":["$(address)", $(amount)]}' -H 'content-type:text/plain;' $(BTC_CORE_RPC)/wallet/go-wallet \
	&& curl -s --user regtest:regtest --data-binary '{"jsonrpc":"1.0","id":"curltext","method":"generatetoaddress","params":[1, "$(BTC_ADDRESS)"]}' -H 'content-type:text/plain;' $(BTC_CORE_RPC)/wallet/go-wallet
	