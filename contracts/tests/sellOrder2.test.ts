// @ts-expect-error - ignore TS errors
import btc = require('bitcore-lib-inquisition')
import { Tap } from '@cmdcode/tapscript' // Requires node >= 19

import * as dotenv from 'dotenv'
dotenv.config()

import { expect, use } from 'chai'
import { SellOrder } from '../src/contracts/sellOrder'
import chaiAsPromised from 'chai-as-promised'
import {
    DISABLE_KEYSPEND_PUBKEY,
    encodeLEB128,
    fetchP2WPKHUtxos,
    generateHints,
    getE,
    getSigHashSchnorr,
    splitSighashPreimage,
    toHex,
} from './utils/txHelper'
use(chaiAsPromised)

describe('Test SmartContract `SellOrder`', () => {
    before(async () => {
        await SellOrder.loadArtifact()
    })

    it('should pass', async () => {
        console.log(111, process.env.PRIVATE_KEY_SELLER, process.env.PRIVATE_KEY_BUYER)
        const seckeySeller = new btc.PrivateKey(
            process.env.PRIVATE_KEY_SELLER,
            btc.Networks.testnet
        )
        const pubkey = seckeySeller.toPublicKey()
        const addrP2WPKH = seckeySeller.toAddress(
            null,
            btc.Address.PayToWitnessPublicKeyHash
        )

        const seckeyBuyer = new btc.PrivateKey(
            process.env.PRIVATE_KEY_BUYER,
            btc.Networks.testnet
        )
        const pubkeyBuyer = seckeyBuyer.toPublicKey()
        const addrP2WPKHBuyer = pubkeyBuyer.toAddress(
            null,
            btc.Address.PayToWitnessPublicKeyHash
        )

        const xOnlyPub =
            pubkey.toBuffer().length > 32
                ? pubkey.toBuffer().slice(1, 33)
                : pubkey.toBuffer()

        const sellerOut = Buffer.concat([
            // Seller's output
            Buffer.from('16', 'hex'),
            new btc.Script(addrP2WPKH).toBuffer(),
        ])

        const RUNEID = '00c0a23301'
        const ORDER_THRESHOLD = 10n

        const instance = new SellOrder(
            xOnlyPub.toString('hex'),
            sellerOut.toString('hex'),
            ORDER_THRESHOLD,
            RUNEID
        )

        //////// Create fee outputs
        const feeAmtBuff = Buffer.alloc(8)
        feeAmtBuff.writeBigInt64LE(3500n)

        const utxos = await fetchP2WPKHUtxos(addrP2WPKH)

        if (utxos.length === 0) {
            throw new Error(`No UTXO's for address: ${addrP2WPKH.toString()}`)
        }

        const txFee = new btc.Transaction()
            .from(utxos.slice(0, 3))
            .to(addrP2WPKH, 546) // Initial Runes UTXO
            .to(addrP2WPKH, 10000) // Seller's init tx
            .to(addrP2WPKHBuyer, 10000) // Buyer's first purchase
            .to(addrP2WPKH, 10000) // Seller's update exchange rate tx
            .to(addrP2WPKHBuyer, 10000) // Buyer's second purchase
            .change(addrP2WPKH)
            .feePerByte(2)
            .sign(seckeySeller)

        console.log('txFee (serialized):', txFee.uncheckedSerialize())

        ///// Create Sell Order Transaction

        const tx0 = createSellOrderTx(
            txFee,
            addrP2WPKH,
            seckeySeller,
            RUNEID,
            10000n,
            2n,
            instance
        )

        console.log('tx0 (serialized):', tx0.uncheckedSerialize())

        //////// FIRST ITERATION
        // Buyer purchases 1000 tokens for 10K sats

        const [tx1, tx1Witnesses] = await createBuyTx(
            tx0,
            txFee,
            2,
            addrP2WPKH,
            addrP2WPKHBuyer,
            seckeyBuyer,
            RUNEID,
            3170n,
            10000n,
            2n,
            instance
        )

        console.log('tx1 (serialized):', tx1.uncheckedSerialize())

        // Run locally
        let interpreter = new btc.Script.Interpreter()
        let flags =
            btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
            btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
            btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
        let res = interpreter.verify(
            new btc.Script(''),
            tx0.outputs[0].script,
            tx1,
            0,
            flags,
            tx1Witnesses,
            tx0.outputs[0].satoshis
        )
        expect(res).to.be.true

        //////// UPDATE EXCHANGE RATE
        // Seller updates the exchange rate from 10 to 20

        // const [tx2, tx2Witnesses] = await createUpdateExchangeRateTx(
        //     tx1,
        //     txFee,
        //     3,
        //     addrP2WPKH,
        //     seckeySeller,
        //     RUNEID,
        //     5099n,
        //     20n,
        //     instance
        // )

        // console.log('tx2 (serialized):', tx2.uncheckedSerialize())

        // // Run locally
        // interpreter = new btc.Script.Interpreter()
        // flags =
        //     btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
        //     btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
        //     btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
        // res = interpreter.verify(
        //     new btc.Script(''),
        //     tx1.outputs[0].script,
        //     tx2,
        //     0,
        //     flags,
        //     tx2Witnesses,
        //     tx1.outputs[0].satoshis
        // )
        // expect(res).to.be.true

        //////// THIRD ITERATION
        // Buyer purchases the remaining 5099 tokens for 50_990 sats

        const [tx3, tx3Witnesses] = await createBuyTx(
            tx1, // change
            txFee,
            4,
            addrP2WPKH,
            addrP2WPKHBuyer,
            seckeyBuyer,
            RUNEID,
            1200n,
            6830n,
            2n,
            instance
        )

        console.log('tx3 (serialized):', tx3.uncheckedSerialize())

        // Run locally
        interpreter = new btc.Script.Interpreter()
        flags =
            btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
            btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
            btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
        res = interpreter.verify(
            new btc.Script(''),
            tx1.outputs[0].script,
            tx3,
            0,
            flags,
            tx3Witnesses,
            tx1.outputs[0].satoshis
        )
        expect(res).to.be.true
    })
})

function createSellOrderTx(
    feeTx,
    spender,
    spenderKey,
    runeId,
    tokenAmount,
    exchangeRate,
    instance
) {
    const [scriptSellOrderP2TR] = getInstanceParams(instance)

    const runesUtxo = {
        address: spender.toString(),
        txId: feeTx.id,
        outputIndex: 0,
        script: new btc.Script(spender),
        satoshis: feeTx.outputs[0].satoshis,
    }

    const feeUtxo = {
        address: spender.toString(),
        txId: feeTx.id,
        outputIndex: 1,
        script: new btc.Script(spender),
        satoshis: feeTx.outputs[1].satoshis,
    }

    const tokenAmountLeb128 = encodeLEB128(tokenAmount)
    const tokenAmountLE = toHex(tokenAmount)
    const exchangeRateLE = toHex(exchangeRate)

    const tokenAmountLEBytes = toHex(BigInt(tokenAmountLE.length / 2));
    const exchangeRateLEBytes = toHex(BigInt(exchangeRateLE.length / 2));

    const opRetStateScript0 = new btc.Script(
        `6a${tokenAmountLEBytes}${tokenAmountLE}${exchangeRateLEBytes}${exchangeRateLE}`
    );
    const runeBytes = toHex(
        BigInt((runeId.length + tokenAmountLeb128.length) / 2 + 1)
    );

    const opRetRuneScript0 = new btc.Script(
        `6a5d${runeBytes}${runeId}${tokenAmountLeb128}00`
    )

    return new btc.Transaction()
        .from([runesUtxo, feeUtxo])
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 546,
                script: scriptSellOrderP2TR,
            })
        )
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 0,
                script: opRetStateScript0,
            })
        )
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 0,
                script: opRetRuneScript0,
            })
        )
        .sign(spenderKey)
}

async function createBuyTx(
    prevTx,
    feeTx,
    feeTxOut,
    seller,
    spender,
    spenderKey,
    runeId,
    tokenPurchaseAmount,
    tokenAmount,
    exchangeRate,
    instance
) {
    const [
        scriptSellOrderP2TR,
        scriptSellOrder,
        tapleafSellOrder,
        cblockSellOrder,
    ] = getInstanceParams(instance)

    const isFullBuy = tokenPurchaseAmount === tokenAmount

    const utxoSellOrderP2TR = {
        txId: prevTx.id,
        outputIndex: 0,
        script: scriptSellOrderP2TR,
        satoshis: prevTx.outputs[0].satoshis,
    }

    const paymentUTXO = {
        address: spender.toString(),
        txId: feeTx.id,
        outputIndex: feeTxOut,
        script: new btc.Script(spender),
        satoshis: feeTx.outputs[feeTxOut].satoshis,
    }

    const tokenPurchaseAmountLeb128 = encodeLEB128(tokenPurchaseAmount)

    let tokenPurchaseAmountLE = toHex(tokenPurchaseAmount)
    
    // Need to add '00' if the last byte is >= 127, otherwise the vm interpets it as negative
    if (parseInt(tokenPurchaseAmountLE.slice(-2), 16) > 127) {
        tokenPurchaseAmountLE += '00'
    }

    const oldStateTokenAmountLE = toHex(tokenAmount)
    const tokenAmountLE = toHex(BigInt(tokenAmount - tokenPurchaseAmount))
    const exchangeRateLE = toHex(exchangeRate)

    const runeOutpoint = isFullBuy ? '01' : '03'

    const opRetScriptAmountSize = toHex(BigInt(tokenAmountLE.length / 2))
    const opRetScriptExchangeRateSize = toHex(BigInt(exchangeRateLE.length / 2))
    const opRetStateScript = new btc.Script(
        `6a${opRetScriptAmountSize}${tokenAmountLE}${opRetScriptExchangeRateSize}${exchangeRateLE}`
    )

    const runeScriptSize = toHex(BigInt(`${runeId}${tokenPurchaseAmountLeb128}${runeOutpoint}`.length / 2))
    const opRetRuneScript = new btc.Script(
        `6a5d${runeScriptSize}${runeId}${tokenPurchaseAmountLeb128}${runeOutpoint}`
    )

    const tx = new btc.Transaction().from([utxoSellOrderP2TR, paymentUTXO])

    if (!isFullBuy) {
        // Recursive covenant
        tx.addOutput(
            new btc.Transaction.Output({
                satoshis: 546,
                script: scriptSellOrderP2TR,
            })
        )
            // State
            .addOutput(
                new btc.Transaction.Output({
                    satoshis: 0,
                    script: opRetStateScript,
                })
            )
    }

    // Runes OP_RETURN
    tx.addOutput(
        new btc.Transaction.Output({
            satoshis: 0,
            script: opRetRuneScript,
        })
    )
        // Buyer's address
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 546,
                script: new btc.Script(spender),
            })
        )
        // Seller's address
        .addOutput(
            new btc.Transaction.Output({
                satoshis: Number(tokenPurchaseAmount * exchangeRate),
                script: new btc.Script(seller),
            })
        )

    const [_e, preimageParts, sighash, eLastByte] = await mutateTx(
        tx,
        spenderKey,
        tapleafSellOrder
    )

    const prevTxVer = Buffer.alloc(4)
    prevTxVer.writeUInt32LE(prevTx.version)

    const prevTxLocktime = Buffer.alloc(4)
    prevTxLocktime.writeUInt32LE(prevTx.nLockTime)

    // In the first iteration we can just pass the fee input as the prev tx contract input...
    const prevTxInputs = new btc.encoding.BufferWriter()
    prevTxInputs.writeVarintNum(prevTx.inputs.length)
    prevTx.inputs[0].toBufferWriter(prevTxInputs)
    prevTx.inputs[1].toBufferWriter(prevTxInputs)

    const prevTxOutputCount = Buffer.alloc(1)
    prevTxOutputCount.writeUInt8(prevTx.outputs.length)

    // Concat all outputs after the covenant and the state
    const prevTxOutputs = new btc.encoding.BufferWriter()
    // prevTx.outputs[2].toBufferWriter(prevTxOutputs)

    for (let i = 2; i < prevTx.outputs.length; i++) {
        prevTx.outputs[i].toBufferWriter(prevTxOutputs)
    }

    const paymentPrevout = new btc.encoding.BufferWriter()
    paymentPrevout.writeReverse(tx.inputs[1].prevTxId)
    paymentPrevout.writeInt32LE(tx.inputs[1].outputIndex)

    const hints = generateHints(tokenPurchaseAmount)

    const witnesses = [
        preimageParts.txVersion,
        preimageParts.nLockTime,
        preimageParts.hashPrevouts,
        preimageParts.hashSpentAmounts,
        preimageParts.hashScripts,
        preimageParts.hashSequences,
        preimageParts.hashOutputs,
        preimageParts.spendType,
        preimageParts.inputNumber,
        preimageParts.tapleafHash,
        preimageParts.keyVersion,
        preimageParts.codeseparatorPosition,
        sighash.hash,
        _e,
        Buffer.from(eLastByte.toString(16), 'hex'),

        prevTxVer,
        prevTxLocktime,
        prevTxInputs.toBuffer(),
        prevTxOutputCount,
        Buffer.concat([
            Buffer.from('22', 'hex'),
            scriptSellOrderP2TR.toBuffer(),
        ]),
        prevTxOutputs.toBuffer(),

        paymentPrevout.toBuffer(),
        Buffer.from(oldStateTokenAmountLE, 'hex'),
        Buffer.from(exchangeRateLE, 'hex'),
        isFullBuy ? [] : Buffer.from(tokenPurchaseAmountLE, 'hex'),
        Buffer.concat([
            // Buyer's output
            Buffer.from('16', 'hex'),
            paymentUTXO.script.toBuffer(),
        ]),
        // 8 hints
        hints.reminderHints[0],
        hints.reminderHints[1],
        hints.reminderHints[2],
        hints.reminderHints[3],
        hints.multiplierHints[0],
        hints.multiplierHints[1],
        hints.multiplierHints[2],
        hints.multiplierHints[3],

        isFullBuy ? Buffer.from('01', 'hex') : Buffer.from('', 'hex'),
        scriptSellOrder.toBuffer(),
        Buffer.from(cblockSellOrder, 'hex'),
    ].flat()
    tx.inputs[0].witnesses = witnesses

    return [tx, witnesses]
}

async function createUpdateExchangeRateTx(
    prevTx,
    feeTx,
    feeTxOut,
    spender,
    spenderKey,
    runeId,
    tokenAmount,
    exchangeRate,
    instance
) {
    const [
        scriptSellOrderP2TR,
        scriptSellOrder,
        tapleafSellOrder,
        cblockSellOrder,
    ] = getInstanceParams(instance)

    const utxoSellOrderP2TR = {
        txId: prevTx.id,
        outputIndex: 0,
        script: scriptSellOrderP2TR,
        satoshis: prevTx.outputs[0].satoshis,
    }

    const feeUtxo = {
        address: spender.toString(),
        txId: feeTx.id,
        outputIndex: feeTxOut,
        script: new btc.Script(spender),
        satoshis: feeTx.outputs[feeTxOut].satoshis,
    }

    const tokenAmountLeb128 = encodeLEB128(tokenAmount)
    const tokenAmountLE = toHex(tokenAmount)
    const exchangeRateLE = toHex(exchangeRate)
    // TODO: check the size
    const opRetStateScript = new btc.Script(
        `6a02${tokenAmountLE}01${exchangeRateLE}`
    ) // Amount: 5099; ExchangeRate: 20
    const opRetRuneScript = new btc.Script(
        `6a5d08${runeId}${tokenAmountLeb128}00`
    ) // RuneID: 840000:1; 5099 tokens; out: 0

    const tx = new btc.Transaction()
        .from([utxoSellOrderP2TR, feeUtxo])
        // Recursive covenant
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 546,
                script: scriptSellOrderP2TR,
            })
        )
        // State
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 0,
                script: opRetStateScript,
            })
        )
        // Runes OP_RETURN
        .addOutput(
            new btc.Transaction.Output({
                satoshis: 0,
                script: opRetRuneScript,
            })
        )

    const [_e, preimageParts, sighash, eLastByte] = await mutateTx(
        tx,
        spenderKey,
        tapleafSellOrder
    )

    const sig = btc.crypto.Schnorr.sign(spenderKey, sighash.hash)

    const witnesses = [
        preimageParts.txVersion,
        preimageParts.nLockTime,
        preimageParts.hashPrevouts,
        preimageParts.hashSpentAmounts,
        preimageParts.hashScripts,
        preimageParts.hashSequences,
        preimageParts.hashOutputs,
        preimageParts.spendType,
        preimageParts.inputNumber,
        preimageParts.tapleafHash,
        preimageParts.keyVersion,
        preimageParts.codeseparatorPosition,
        sighash.hash,
        _e,
        Buffer.from(eLastByte.toString(16), 'hex'),

        sig,

        Buffer.from('02', 'hex'), // Call the second function
        scriptSellOrder.toBuffer(),
        Buffer.from(cblockSellOrder, 'hex'),
    ]
    tx.inputs[0].witnesses = witnesses

    return [tx, witnesses]
}

function getInstanceParams(instance) {
    const scriptSellOrder = instance.lockingScript
    const tapleafSellOrder = Tap.encodeScript(scriptSellOrder.toBuffer())

    const [tpubkeySellOrder, cblockSellOrder] = Tap.getPubKey(
        DISABLE_KEYSPEND_PUBKEY,
        { target: tapleafSellOrder }
    )
    const scriptSellOrderP2TR = new btc.Script(`OP_1 32 0x${tpubkeySellOrder}}`)

    return [
        scriptSellOrderP2TR,
        scriptSellOrder,
        tapleafSellOrder,
        cblockSellOrder,
    ]
}

// Mutate tx if it ends with 0x7f (highest single byte stack value) or 0xff (lowest signle byte stack value).
async function mutateTx(tx, spenderKey, tapleaf) {
    let e, eBuff, sighash, eLastByte
    while (true) { // eslint-disable-line no-constant-condition
        sighash = getSigHashSchnorr(tx, Buffer.from(tapleaf, 'hex'), 0)
        e = await getE(sighash.hash)
        eBuff = e.toBuffer(32)
        eLastByte = eBuff[eBuff.length - 1]
        if (eLastByte != 0x7f && eLastByte != 0xff) {
            break
        }
        tx.nLockTime += 1
    }

    const _e = eBuff.slice(0, eBuff.length - 1) // e' - e without last byte
    const preimageParts = splitSighashPreimage(sighash.preimage)

    // Also sign fee input
    const hashData = btc.crypto.Hash.sha256ripemd160(
        spenderKey.publicKey.toBuffer()
    )
    const signatures = tx.inputs[1].getSignatures(
        tx,
        spenderKey,
        1,
        undefined,
        hashData,
        undefined,
        undefined
    )
    tx.inputs[1].addSignature(tx, signatures[0])

    return [_e, preimageParts, sighash, eLastByte]
}
