// @ts-check
import { DatabaseSync, StatementSync } from "node:sqlite";
import "./types.js";

const database = new DatabaseSync("marketplace.db");

let /** @type {StatementSync} */ getListingsQuery,
  /** @type {StatementSync} */ createListingQuery,
  /** @type {StatementSync} */ closeListingQuery,
  /** @type {StatementSync} */ getTokenIdsQuery,
  /** @type {StatementSync} */ getListingsForTokenQuery,
  /** @type {StatementSync} */ getOpenListingsForTokenQuery;

export function initDb() {
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
      openTimestamp INTEGER DEFAULT (unixepoch()),
      closeTimestamp INTEGER DEFAULT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_listing_rune_id ON listing(runeId);
  `);
  getListingsQuery = database.prepare("SELECT * from listing");
  createListingQuery = database.prepare(`INSERT INTO listing (
    id, rawTx, prevOut, runeId, sellerPubKey, sellerAddress, divisibility, exchangeRate, tokenAmount, minTokenThreshold
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  closeListingQuery = database.prepare(
    `UPDATE listing SET closeTimestamp = unixepoch() WHERE id = ?`
  );
  getTokenIdsQuery = database.prepare(
    `SELECT runeId from listing GROUP BY runeId`
  );
  getListingsForTokenQuery = database.prepare(
    `SELECT * FROM listing WHERE runeId = ? ORDER BY exchangeRate ASC`
  );
  getOpenListingsForTokenQuery = database.prepare(
    `SELECT * FROM listing WHERE runeId = ? AND closeTimestamp is NULL ORDER BY exchangeRate ASC`
  );
}

/**
 *
 * @returns {Listing[]}
 */
export function getListings() {
  return /** @type {Listing[]} */ (getListingsQuery.all());
}

/**
 * Creates a new listing
 *
 * @param {Listing} listing
 *
 * @returns {boolean} if the insert was successful
 */
export function createListing(listing) {
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
  );
  return result.changes === 1;
}

/**
 * Closes the listing
 *
 * @param {string} id
 * @returns {boolean} if the insert was successful
 */
export function closeListing(id) {
  const result = closeListingQuery.run(id);
  return result.changes === 1;
}

/**
 *
 * @returns {{runeId: string}[]}
 */
export function getTokens() {
  return /** @type {{runeId: string}[]} */ (getTokenIdsQuery.all());
}

/**
 *
 * @param {string} id runeId
 * @param {boolean=} onlyOpen return only the open listings
 * @returns {Listing[]}
 */
export function getListingsForToken(id, onlyOpen) {
  const query = onlyOpen
    ? getOpenListingsForTokenQuery
    : getListingsForTokenQuery;
  return /** @type {Listing[]} */ (query.all(id));
}
