// @ts-check
import { DatabaseSync, StatementSync } from 'node:sqlite'
import "./types.js"

const database = new DatabaseSync('marketplace.db')

let 
  /** @type {StatementSync} */ getListingsQuery,
  /** @type {StatementSync} */ createListingQuery,
  /** @type {StatementSync} */ closeListingQuery,
  /** @type {StatementSync} */ getTokensQuery,
  /** @type {StatementSync} */ getListingsForTokenQuery

export function initDb() {
  // database.exec(`DROP TABLE IF EXISTS listing`)
  database.exec(`
    CREATE TABLE IF NOT EXISTS listing(
      id TEXT PRIMARY KEY,
      rawTx TEXT,
      prevOut TEXT,
      runeId TEXT,
      sellerPubKey TEXT,
      sellerAddress TEXT,
      divisibility INTEGER,
      exchangeRate INTEGER,
      tokenAmount INTEGER,
      minTokenThreshold INTEGER,
      status TEXT CHECK( status IN ('not_broadcasted', 'open', 'closed') )
    );
    CREATE INDEX IF NOT EXISTS idx_listing_rune_id ON listing(runeId);
  `)
  getListingsQuery = database.prepare('SELECT * from listing')
  createListingQuery = database.prepare(`INSERT INTO listing (
    id, rawTx, prevOut, runeId, sellerPubKey, sellerAddress, divisibility, exchangeRate, tokenAmount, minTokenThreshold, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  closeListingQuery = database.prepare(`UPDATE listing SET status='closed' WHERE id = ?`)
  getTokensQuery = database.prepare(`SELECT runeId as id, min(exchangeRate) as price from listing WHERE status is not 'closed' GROUP BY runeId`)
  getListingsForTokenQuery = database.prepare(`SELECT * FROM listing WHERE runeId = ? AND status is not 'closed'`)
}

/**
 * 
 * @returns {Listing[]}
 */
export function getListings() {
  return /** @type {Listing[]} */ (getListingsQuery.all())
}

// TODO: runeID in another table?
/**
 * Creates a new listing
 * 
 * @param {Listing} listing
 * @param {ListingStatus} status 
 * 
 * @returns {boolean} if the insert was successful
 */
export function createListing(listing, status) {
  // Check that address is computed
  if (!listing.sellerAddress) {
    return false
  }

  const result = createListingQuery.run(
    listing.id,
    listing.rawTx,
    listing.prevOut,
    listing.runeId,
    listing.sellerPubKey,
    listing.sellerAddress,
    listing.divisibility,
    listing.exchangeRate,
    listing.tokenAmount,
    listing.minTokenThreshold,
    status)
  return result.changes === 1
}

/**
 * Closes the listing
 * 
 * @param {string} id 
 * @returns {boolean} if the insert was successful
 */
export function closeListing(id) {
  const result = closeListingQuery.run(id)
  return result.changes === 1
}

/**
 * 
 * @returns {Token[]}
 */
export function getTokens() {
  return /** @type {Token[]} */ (getTokensQuery.all())
}

/**
 * 
 * @param {string} id 
 * @returns {Listing[]}
 */
export function getListingsForToken(id) {
  return /** @type {Listing[]} */ (getListingsForTokenQuery.all(id))
}