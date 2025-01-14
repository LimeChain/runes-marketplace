// @ts-check
import { DatabaseSync, StatementSync } from 'node:sqlite'

const database = new DatabaseSync('marketplace.db')

let 
  /** @type {StatementSync} */ getListingsQuery,
  /** @type {StatementSync} */ createListingQuery,
  /** @type {StatementSync} */ closeListingQuery,
  /** @type {StatementSync} */ getTokensQuery,
  /** @type {StatementSync} */ getListingsForTokenQuery

export function initDb() {
  // TODO: remove
  database.exec(`DROP TABLE IF EXISTS listing`)
  database.exec(`
    CREATE TABLE IF NOT EXISTS listing(
      id TEXT PRIMARY KEY,
      prevOut TEXT,
      rune_id TEXT,
      seller_pub_key TEXT,
      exchange_rate INTEGER,
      token_amount INTEGER,
      min_token_threshold INTEGER,
      status TEXT CHECK( status IN ('not_broadcasted', 'open', 'closed') )
    );
    CREATE INDEX IF NOT EXISTS idx_listing_rune_id ON listing(rune_id);
  `)
  getListingsQuery = database.prepare('SELECT * from listing')
  createListingQuery = database.prepare(`INSERT INTO listing (
    id, prevOut, rune_id, seller_pub_key, exchange_rate, token_amount, min_token_threshold, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  closeListingQuery = database.prepare(`UPDATE listing SET status='closed' WHERE id = ?`)
  getTokensQuery = database.prepare(`SELECT DISTINCT rune_id from listing WHERE status is not 'closed'`) // TODO: group and order by volume? (and display it)
  getListingsForTokenQuery = database.prepare(`SELECT * FROM listing WHERE rune_id = ? AND status is not 'closed'`)
}

/**
 * 
 * @returns {Listing[]}
 */
export function getListings() {
  return /** @type {Listing[]} */ (getListingsQuery.all())
}

// TODO: runeID should in another table?
/**
 * Creates a new listing
 * 
 * @param {string} id 
 * @param {string} prevOut 
 * @param {string} runeId 
 * @param {string} sellerPubKey 
 * @param {number} exchangeRate 
 * @param {number} tokenAmount 
 * @param {number} minTokenThreshold 
 * @param {ListingStatus} status 
 * 
 * @returns {boolean} if the insert was successful
 */
export function createListing(id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold, status) {
  const result = createListingQuery.run(id, prevOut, runeId, sellerPubKey, exchangeRate, tokenAmount, minTokenThreshold, status)
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