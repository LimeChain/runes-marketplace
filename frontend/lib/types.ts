export interface Token {
  id: string
  imageUrl: string
  name: string
  symbol: string
  divisibility: number
  verified: boolean
  amount: number | null
  price: number
  volume: number
  marketCap: number
  trades: number
}

export interface TxIn {
  previous_output: string
  script_sig: string
  sequence: number
  witness: string[]
}

export interface TxOut {
  outpoint: string
  value: number
  address: string
  script_pubkey: string
}

export interface Tx {
  version: number
  lock_time: number
  input: TxIn[]
  output: TxOut[]
}

export interface Listing {
  id: string,
  runeId: string,
  runeName: string,
  runeSymbol: string,
  sellerPubKey: string,
  sellerAddress: string,
  divisibility: number,
  exchangeRate: number,
  tokenAmount: number,
  minTokenThreshold: number
}