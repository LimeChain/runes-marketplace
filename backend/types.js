// @ts-check

/**
 * @typedef {'open'|'closed'} ListingStatus
 */

/**
 * @typedef Listing
 * @prop {string} id tx of the listing
 * @prop {string} rawTx serialized tx
 * @prop {string} prevOut tx:out of the prev UTXO
 * @prop {string} runeId block:tx of the Rune
 * @prop {string} sellerPubKey public key of the seller
 * @prop {string} [sellerAddress] address of the seller, derived from the pubkey
 * @prop {number} divisibility token's divisibility
 * @prop {number} exchangeRate price of 1 token in sats
 * @prop {number} tokenAmount amount of tokens in the listing
 * @prop {number} minTokenThreshold minimum tokens that can be held by the listing
 * @prop {ListingStatus} [status] listing's status
 */

/**
 * @typedef {Listing &
 *  {runeName: string, runeSymbol: string}
 * } ListingDto
 */

// TODO: add more fields like volume, trades...
/**
 * @typedef Token
 * @prop {string} id RuneID
 * @prop {number} price lowest listing price
 */