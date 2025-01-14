// @ts-check

/**
 * @typedef {'not_broadcasted'|'open'|'closed'} ListingStatus
 */

/**
 * @typedef Listing
 * @prop {string} id tx:out of the listing
 * @prop {string} prevOut tx:out of the prev UTXO
 * @prop {string} runeId block:tx of the Rune
 * @prop {string} sellerPubKey public key of the seller
 * @prop {number} exchangeRate price of 1 token in sats
 * @prop {number} tokenAmount amount of tokens in the listing
 * @prop {number} minTokenThreshold minimum tokens that can be held by the listing
 * @prop {ListingStatus} status listing's status
 */

// TODO: add more fields like volume, trades...
/**
 * @typedef Token
 * @prop {string} id RuneID
 */