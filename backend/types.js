// @ts-check

/**
 * @typedef Listing
 * @prop {string} id tx of the listing
 * @prop {string} rawTx serialized tx
 * @prop {string} prevOut tx:out of the prev UTXO
 * @prop {string} runeId block:tx of the Rune
 * @prop {string} sellerPubKey public key of the seller
 * @prop {string} sellerAddress address of the seller
 * @prop {number} divisibility token's divisibility
 * @prop {number} exchangeRate price of 1 token in sats
 * @prop {number} tokenAmount amount of tokens in the listing
 * @prop {number} minTokenThreshold minimum tokens that can be held by the listing
 * @prop {EpochTimeStamp} openTimestamp when the listing was opened
 * @prop {EpochTimeStamp} closeTimestamp when the listing was closed
 */

/**
 * @typedef {Listing &
 *  {runeName: string, runeSymbol: string}
 * } ListingDto
 */

/**
 * @typedef Token
 * @prop {string} id RuneID
 * @prop {string} imageUrl token's image 
 * @prop {string} name
 * @prop {string} symbol
 * @prop {number} divisibility
 * @prop {number} price lowest listing price
 * @prop {number} volume trading volume for the last 24 hours
 * @prop {number} marketCap
 * @prop {number} trades total token trades on the platform
 */

/**
 * @typedef {Token &
*  {amount: string}
* } UserTokenDto
*/