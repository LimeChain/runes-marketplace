// @ts-check
import express from 'express'
// @ts-ignore
import btc from 'bitcore-lib-inquisition'
import { initDb, getListings, createListing, closeListing, getTokens, getListingsForToken } from './db.js'

initDb()

const app = express()

const PORT = 3030

const ORD_URL = "http://localhost:1234"

const BITCOIND_USER = "regtest"
const BITCOIND_PASS = "regtest"
const BITCOIND_URL = `http://localhost:8332`

app.use(express.json());

app.post('/listing/new', async (req, res) => {
  /** @type {Listing} */ const listing = req.body

  // Compute the address from the public key
  const pubkey = new btc.PublicKey.fromTaproot(listing.sellerPubKey)
  listing.sellerAddress = pubkey.toAddress(
    btc.Networks.regtest,
    btc.Address.PayToWitnessPublicKeyHash
  ).toString()

  const broadcastStatus = await fetch (`${BITCOIND_URL}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(BITCOIND_USER + ':' + BITCOIND_PASS)}`,
      "content-type": "text/plain;"
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      method: 'sendrawtransaction',
      params: [listing.rawTx]
    })
  })

  const data = await broadcastStatus.json()
  console.log(data)

  if (data.error) {
    res.json({success: false, error: data.error})
  } else {
    const success = createListing(listing, "open")
    res.json({success})
  }
})

app.post('/listing/fill', (req, res) => {
  /** @type {Listing} */ const listing = req.body
  // update old listing to closed
  const successClose = closeListing(listing.prevOut)

  if (successClose) {
    // create new listing with the same data almost
    const successCreate = createListing(listing, "open")
    // TODO: add trades table and entry
    res.json({success: successCreate})
  } else {
    res.json({success: successClose})
  }
})

app.get('/listings', async (_, res) => {
  const listings = getListings()
  /** @type {ListingDto[]} */ const listingDtos = await Promise.all(listings.map(async (listing) => {
    const response = await fetch(`${ORD_URL}/rune/${listing.runeId}`, {
      headers: { "Accept": "application/json"}
    })
    const tokenData = await response.json()

    return {
      ...listing,
      runeName: tokenData.entry.spaced_rune,
      runeSymbol: tokenData.entry.symbol,
    }
  }))
  
  res.json(listingDtos)
})

app.get('/listings/token/:id', async (req, res) => {
  const response = await fetch(`${ORD_URL}/rune/${req.params.id}`, {
    headers: { "Accept": "application/json"}
  })
  const tokenData = await response.json()

  /** @type {ListingDto[]} */ const listings = getListingsForToken(req.params.id).map(listing => {
    return {
      ...listing,
      runeName: tokenData.entry.spaced_rune,
      runeSymbol: tokenData.entry.symbol,
    }
  })
  res.json(listings)
})

app.get('/tokens', async (_, res) => {
  const dbTokens = getTokens()

  const tokens = await Promise.all(dbTokens.map(async (rune) => {
    const runeIdParams = rune.id.toString().split(':').map(e => BigInt(e))
    const runeId = `00${encodeLEB128(runeIdParams[0])}${encodeLEB128(runeIdParams[1])}`

    const runeResponse = await fetch(`${ORD_URL}/rune/${rune.id}`, {
      headers: { "Accept": "application/json"}
    })
    const runeData = await runeResponse.json()

    return {
      id: runeData.id,
      imageUrl: `/api/content/${runeData.parent}`,
      name: runeData.entry.spaced_rune,
      symbol: runeData.entry.symbol,
      divisibility: runeData.entry.divisibility,
      verified: true,
      price: rune.price,
      priceUSD: "?",
      priceChange: "?",
      volume: "?",
      volumeUSD: "?",
      marketCap: "?",
      marketCapBTC: "?",
      trades: -1
    }
  }))

 res.json(tokens)
})

app.get('/address/:address', async (req, res) => {
  const response = await fetch(`${ORD_URL}/address/${req.params.address}`, {
    headers: { "Accept": "application/json"}
  })
  const data = await response.json()
  res.json(data)
})

app.get('/address/:address/tokens', async (req, res) => {
  const addressResponse = await fetch(`${ORD_URL}/address/${req.params.address}`, {
    headers: { "Accept": "application/json"}
  })
  const addressData = await addressResponse.json()

  const tokens = await Promise.all(addressData['runes_balances'].map(async (rune) => {
    const name = rune[0]
    const amount = rune[1]
    const runeResponse = await fetch(`${ORD_URL}/rune/${name}`, {
      headers: { "Accept": "application/json"}
    })
    const runeData = await runeResponse.json()

    const token = {
      id: runeData.id,
      imageUrl: `/api/content/${runeData.parent}`,
      name: runeData.entry.spaced_rune,
      symbol: runeData.entry.symbol,
      divisibility: runeData.entry.divisibility,
      verified: true,
      amount: amount,
      price: "?",
      priceUSD: "?",
      priceChange: "?",
      volume: "?",
      volumeUSD: "?",
      marketCap: "?",
      marketCapBTC: "?",
      trades: -1
    }
    return token
  }))

  res.json(tokens)
})

app.get('/outputs/:address', async (req, res) => {
  const outputsResponse = await fetch(`${ORD_URL}/outputs/${req.params.address}`, {
    headers: { "Accept": "application/json"}
  })
  const outputsData = await outputsResponse.json()
  res.json(outputsData)
})

app.get('/rune/:rune', async (req, res) => {
  const response = await fetch(`${ORD_URL}/rune/${req.params.rune}`, {
    headers: { "Accept": "application/json"}
  })
  const data = await response.json()

  const token = {
    id: data.id,
    imageUrl: `/api/content/${data.parent}`,
    name: data.entry.spaced_rune,
    symbol: data.entry.symbol,
    divisibility: data.entry.divisibility,
    verified: true,
    price: "?",
    priceUSD: "?",
    priceChange: "?",
    volume: "?",
    volumeUSD: "?",
    marketCap: "?",
    marketCapBTC: "?",
    trades: -1
  }

  res.json(token)
})

app.get('/content/:inscription', async (req, res) => {
  const response = await fetch(`${ORD_URL}/content/${req.params.inscription}`)
  const image = await response.blob()
  const arrayBuffer = await image.arrayBuffer()
  res.setHeader("Content-Type", image.type);
  res.send(Buffer.from(arrayBuffer))
})

app.get('/tx/:txid', async (req, res) => {
  const response = await fetch(`${ORD_URL}/tx/${req.params.txid}`, {
    headers: { "Accept": "application/json"}
  })
  const tx = await response.json()
  res.json(tx)
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

function toHexString(byteArray) {
  const bytes = Array.from(byteArray, (byte) => {
      return ('0' + (byte & 0xff).toString(16)).slice(-2)
  })

  return bytes.join('')
}

function encodeLEB128(value) {
  const bytes = []
  let more = true

  while (more) {
      let byte = Number(value & BigInt(0x7f))
      value >>= BigInt(7)
      if (value === BigInt(0)) {
          more = false
      } else {
          byte |= 0x80
      }
      bytes.push(byte)
  }
  return toHexString(bytes)
}