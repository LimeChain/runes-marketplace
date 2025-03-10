// @ts-check
import express from "express";
// @ts-ignore
import btc from "bitcore-lib-inquisition";
import {
  initDb,
  getListings,
  createListing,
  closeListing,
  getTokens,
  getListingsForToken,
} from "./db.js";

initDb();

const app = express();

const PORT = 3030;

const ORD_URL = "http://localhost:1234";

const BITCOIND_USER = "regtest";
const BITCOIND_PASS = "regtest";
const BITCOIND_URL = `http://localhost:8332`;

app.use(express.json());

app.post("/listing/new", async (req, res) => {
  /** @type {Listing} */ const listing = req.body;
  const data = await broadcastTx(listing.rawTx);
  console.log(data);

  if (data.error) {
    res.json({ success: false, error: data.error });
    return
  }

  // TODO: combine close and open in one TX?
  if (listing.prevOut) {
    const successClose = closeListing(listing.prevOut);

    if (!successClose) {
      res.json({ success: false, error: "Offer is closed or doesn't exist" })
      return
    }
  }

  console.log(listing.tokenAmount)
  if (Number(listing.tokenAmount) !== 0) {
    const success = createListing(listing);
    res.json({ success });
    return
  }

  res.json({ success: true })
});

app.get("/listings", async (_, res) => {
  const listings = getListings();
  /** @type {ListingDto[]} */ const listingDtos = await Promise.all(
    listings.map(async (listing) => {
      const response = await fetch(`${ORD_URL}/rune/${listing.runeId}`, {
        headers: { Accept: "application/json" },
      });
      const tokenData = await response.json();

      return {
        ...listing,
        runeName: tokenData.entry.spaced_rune,
        runeSymbol: tokenData.entry.symbol,
      };
    })
  );

  res.json(listingDtos);
});

app.get("/listings/token/:id", async (req, res) => {
  const response = await fetch(`${ORD_URL}/rune/${req.params.id}`, {
    headers: { Accept: "application/json" },
  });
  const tokenData = await response.json();

  /** @type {ListingDto[]} */ const listings = getListingsForToken(
    req.params.id,
    true
  ).map((listing) => {
    return {
      ...listing,
      runeName: tokenData.entry.spaced_rune,
      runeSymbol: tokenData.entry.symbol,
    };
  });
  res.json(listings);
});

app.get("/tokens", async (_, res) => {
  const dbTokens = getTokens();

  const tokens = await Promise.all(
    dbTokens.map(async (token) => getTokenData(token.runeId))
  );

  res.json(tokens);
});

app.get("/address/:address", async (req, res) => {
  const response = await fetch(`${ORD_URL}/address/${req.params.address}`, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  res.json(data);
});

app.get("/address/:address/tokens", async (req, res) => {
  const addressResponse = await fetch(
    `${ORD_URL}/address/${req.params.address}`,
    {
      headers: { Accept: "application/json" },
    }
  );
  /**  @type {{runes_balances: [id: string, balance: string][]}} */
  const addressData = await addressResponse.json();

  const tokens = await Promise.all(
    addressData["runes_balances"].map(async (rune) => {
      const token = await getTokenData(rune[0])

      /** @type {UserTokenDto} */ return {
        ...token,
        amount: rune[1]
      }
    })
  );

  res.json(tokens);
});

app.get("/outputs/:address", async (req, res) => {
  const outputsResponse = await fetch(
    `${ORD_URL}/outputs/${req.params.address}`,
    {
      headers: { Accept: "application/json" },
    }
  );
  const outputsData = await outputsResponse.json();
  res.json(outputsData);
});

app.get("/rune/:rune", async (req, res) => {
  const token = await getTokenData(req.params.rune)

  res.json(token);
});

app.get("/content/:inscription", async (req, res) => {
  const response = await fetch(`${ORD_URL}/content/${req.params.inscription}`);
  const image = await response.blob();
  const arrayBuffer = await image.arrayBuffer();
  res.setHeader("Content-Type", image.type);
  res.send(Buffer.from(arrayBuffer));
});

app.get("/tx/:txid", async (req, res) => {
  const response = await fetch(`${ORD_URL}/tx/${req.params.txid}`, {
    headers: { Accept: "application/json" },
  });
  const tx = await response.json();
  res.json(tx);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

/**
 *
 * @param {*} runeId
 * @returns {Promise<Token>}
 */
async function getTokenData(runeId) {
  // Get ORD data
  const runeResponse = await fetch(`${ORD_URL}/rune/${runeId}`, {
    headers: { Accept: "application/json" },
  });
  const runeData = await runeResponse.json();

  // Get token listings
  /** @type {Listing[]} */ const listings = getListingsForToken(runeId);

  const supply =
    runeData.entry.premine + runeData.entry.mints * (runeData.entry.terms?.amount || 0);
  const price = listings.filter((l) => l.closeTimestamp === null)[0]?.exchangeRate || 0;
  const marketCap = price * supply / runeData.entry.divisibility;

  // TODO: calculate only the bought tokens by substracting the amount from prevtx
  const ONE_DAY = 60 * 60 * 24;
  const currentTimestamp = Date.now() / 1000;
  const volume = listings
    .filter((l) => 
        l.closeTimestamp !== null &&
        l.closeTimestamp - currentTimestamp < ONE_DAY
    )
    .map((l) => {
      const buyer = listings.find(buyer => buyer.prevOut === l.id)

      // Calculate purchased amount based on the new listing, if exists
      const purchasedAmount = l.tokenAmount - (buyer?.tokenAmount || 0)
      return purchasedAmount * l.exchangeRate
    })
    .reduce((a, b) => a + b, 0);

  const trades = listings.filter((l) => l.closeTimestamp !== null).length;

  /** @type {Token} */ return {
    id: runeData.id,
    imageUrl: `/api/content/${runeData.parent}`,
    name: runeData.entry.spaced_rune,
    symbol: runeData.entry.symbol,
    divisibility: runeData.entry.divisibility,
    price,
    volume: volume,
    marketCap,
    trades,
  };
}

/**
 * 
 * @param {string} rawTx 
 * @returns {Promise<{error: string}>}
 */
async function broadcastTx(rawTx) {
  const response = await fetch(`${BITCOIND_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(BITCOIND_USER + ":" + BITCOIND_PASS)}`,
      "content-type": "text/plain;",
    },
    body: JSON.stringify({
      jsonrpc: "1.0",
      method: "sendrawtransaction",
      params: [rawTx],
    }),
  });

  return response.json()
}
