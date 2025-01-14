// @ts-check
import express from 'express'
import { initDb, getListings, createListing, closeListing, getTokens, getListingsForToken } from './db.js'

initDb()

const app = express()
const port = 3000

app.use(express.json());

app.post('/listing/new', (req, res) => {
  const { id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold } = req.body
  const success = createListing(id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold, "not_broadcasted")
  res.json({success})
})

app.post('/listing/fill', (req, res) => {
  const { id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold } = req.body
  // update old listing to closed
  const successClose = closeListing(prevOut)

  if (successClose) {
    // create new listing with the same data almost
    const successCreate = createListing(id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold, "open")
    // TODO: add trades table and entry
    res.json({success: successCreate})
  } else {
    res.json({success: successClose})
  }
})

app.get('/listings', (_, res) => {
  res.json(getListings())
})

app.get('/listings/token/:id', (req, res) => {
  res.json(getListingsForToken(req.params.id))
})

app.get('/tokens', (_, res) => {
  // TODO: get inscription image from the runeID
 res.json(getTokens())
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})