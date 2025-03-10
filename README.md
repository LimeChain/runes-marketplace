# Runes Marketplace using OP_CAT

Marketplace for trading Rune tokens using covenants to allow for partial filling of sell orders.

> TODO: add spec

## Requirements
- `node v22.13.0`

## Compile the contracts

```bash
cd contracts
npx scrypt-cli@latest compile -i "src/contracts/sellOrder.ts" --asm
```

### Test the contract

```bash
NETWORK=regtest npx mocha --no-config --require ts-node/register tests/sellOrder.test.ts
```

Contract files should be automatically linked in the frontend. If they aren't for whatever reason, copy `sellOrder.ts`, `sigHashUtils.ts` and `opmul.ts` from `contracts/src/contracts` and `sellOrder.json` from `contracts/artifacts` to `frontend/contracts`

## Run the backend

```bash
cd backend
npm run start
```

## Run the frontend

```bash
cd frontend
npm run dev
```