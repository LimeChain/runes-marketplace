// @ts-expect-error: not a module
import btc = require('bitcore-lib-inquisition')
import { Tap } from '@cmdcode/tapscript' // Requires node >= 19

import * as dotenv from 'dotenv'
dotenv.config()

import { expect, use } from 'chai'
import { TestSellOrder } from '../src/contracts/tests/testSellOrder'
import chaiAsPromised from 'chai-as-promised'
import { DISABLE_KEYSPEND_PUBKEY, fetchP2WPKHUtxos } from './utils/txHelper'
use(chaiAsPromised)

describe('Test helper functions of `SellOrder`', () => {
    let tx0, tx1, cblock, scriptTestSellOrder

    before(async () => {
        await TestSellOrder.loadArtifact()

        const seckey = new btc.PrivateKey(
            process.env.PRIVATE_KEY,
            btc.Networks.testnet
        )
        const addrP2WPKH = seckey.toAddress(
            null,
            btc.Address.PayToWitnessPublicKeyHash
        )

        const instance = new TestSellOrder()
        scriptTestSellOrder = instance.lockingScript
        const tapleafTestSellOrder = Tap.encodeScript(
            scriptTestSellOrder.toBuffer()
        )

        const [tpubkeyTestSellOrder, cblockTestSellOrder] = Tap.getPubKey(
            DISABLE_KEYSPEND_PUBKEY,
            { target: tapleafTestSellOrder }
        )
        cblock = cblockTestSellOrder
        const scriptTestSellOrderP2TR = new btc.Script(
            `OP_1 32 0x${tpubkeyTestSellOrder}}`
        )

        //////// Create fee outputs
        const utxos = await fetchP2WPKHUtxos(addrP2WPKH)
        if (utxos.length === 0) {
            throw new Error(`No UTXO's for address: ${addrP2WPKH.toString()}`)
        }
        console.log(utxos)

        const txFee = new btc.Transaction()
            .from(utxos)
            .to(addrP2WPKH, 3500)
            .to(addrP2WPKH, 3500)
            .change(addrP2WPKH)
            .feePerByte(2)
            .sign(seckey)

        ///// CONTRACT DEPLOY

        const feeUTXODeploy = {
            address: addrP2WPKH.toString(),
            txId: txFee.id,
            outputIndex: 0,
            script: new btc.Script(addrP2WPKH),
            satoshis: txFee.outputs[0].satoshis,
        }

        tx0 = new btc.Transaction()
            .from([feeUTXODeploy])
            .addOutput(
                new btc.Transaction.Output({
                    satoshis: 546,
                    script: scriptTestSellOrderP2TR,
                })
            )
            .sign(seckey)

        ///// UNLOCK CALL

        const utxoTestSellOrderP2TR = {
            txId: tx0.id,
            outputIndex: 0,
            script: scriptTestSellOrderP2TR,
            satoshis: tx0.outputs[0].satoshis,
        }

        const feeUTXO = {
            address: addrP2WPKH.toString(),
            txId: txFee.id,
            outputIndex: 1,
            script: new btc.Script(addrP2WPKH),
            satoshis: txFee.outputs[1].satoshis,
        }

        tx1 = new btc.Transaction()
            .from([utxoTestSellOrderP2TR, feeUTXO])
            .addOutput(tx0.outputs[0])

        // Sign fee input
        const hashData = btc.crypto.Hash.sha256ripemd160(
            seckey.publicKey.toBuffer()
        )
        const signatures = tx1.inputs[1].getSignatures(
            tx1,
            seckey,
            1,
            undefined,
            hashData,
            undefined,
            undefined
        )
        tx1.inputs[1].addSignature(tx1, signatures[0])
    })

    describe('Test mul128', () => {
        it('should multiply correctly', () => {
            const addTestVectors = [
                {
                    a: Buffer.from('0a00', 'hex'), // 10
                    res: Buffer.from('0005', 'hex'), // 1280
                },
                {
                    a: Buffer.from('1402', 'hex'), // 532
                    res: Buffer.from('000A01', 'hex'), // 68096
                },
            ]

            for (const addTestVector of addTestVectors) {
                const witnesses = [
                    addTestVector.a,
                    addTestVector.res,
                    Buffer.from('', 'hex'),
                    scriptTestSellOrder.toBuffer(),
                    Buffer.from(cblock, 'hex'),
                ]
                tx1.inputs[0].witnesses = witnesses

                // Run locally
                const interpreter = new btc.Script.Interpreter()
                const flags =
                    btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
                    btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
                    btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
                const res = interpreter.verify(
                    new btc.Script(''),
                    tx0.outputs[0].script,
                    tx1,
                    0,
                    flags,
                    witnesses,
                    tx0.outputs[0].satoshis
                )
                expect(res).to.be.true
            }
        })
    })

    describe('Test rshift7', () => {
        it('should shift correctly', () => {
            const addTestVectors = [
                {
                    num: Buffer.from('64', 'hex'), // 100
                    reminderHint: Buffer.from('64', 'hex'), // 100
                    multiplierHint: Buffer.from('0', 'hex'), // 0
                    res: Buffer.from('0', 'hex'), // 0
                },
                {
                    num: Buffer.from('e803', 'hex'), // 1000
                    reminderHint: Buffer.from('68', 'hex'), // 104
                    multiplierHint: Buffer.from('07', 'hex'), // 7
                    res: Buffer.from('07', 'hex'), // 7
                },
                {
                    num: Buffer.from('D007', 'hex'), // 2000
                    reminderHint: Buffer.from('50', 'hex'), // 80
                    multiplierHint: Buffer.from('0f', 'hex'), // 15
                    res: Buffer.from('0f', 'hex'), // 15
                },
                {
                    num: Buffer.from('40420f', 'hex'), // 1_000_000
                    reminderHint: Buffer.from('40', 'hex'), // 64
                    multiplierHint: Buffer.from('841e', 'hex'), // 7812
                    res: Buffer.from('841e', 'hex'), // 7812
                },
            ]

            for (const addTestVector of addTestVectors) {
                const witnesses = [
                    addTestVector.num,
                    addTestVector.reminderHint,
                    addTestVector.multiplierHint,
                    addTestVector.res,
                    Buffer.from('01', 'hex'),
                    scriptTestSellOrder.toBuffer(),
                    Buffer.from(cblock, 'hex'),
                ]
                tx1.inputs[0].witnesses = witnesses

                // Run locally
                const interpreter = new btc.Script.Interpreter()
                const flags =
                    btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
                    btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
                    btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
                const res = interpreter.verify(
                    new btc.Script(''),
                    tx0.outputs[0].script,
                    tx1,
                    0,
                    flags,
                    witnesses,
                    tx0.outputs[0].satoshis
                )
                expect(res).to.be.true
            }
        })
    })

    describe('Test LEB128', () => {
        it('should encode correctly', () => {
            const addTestVectors = [
                {
                    num: Buffer.from('64', 'hex'), // 100
                    reminderHint: [Buffer.from('64', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 100,0,0,0
                    multiplierHint: [Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 0,0,0,0
                    res: Buffer.from('64', 'hex'),
                },
                {
                    num: Buffer.from('e803', 'hex'), // 1000
                    reminderHint: [Buffer.from('68', 'hex'), Buffer.from('07', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 104,7,0,0
                    multiplierHint: [Buffer.from('07', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 7,0,0,0
                    res: Buffer.from('e807', 'hex'),
                },
                {
                    num: Buffer.from('d007', 'hex'), // 2000
                    reminderHint: [Buffer.from('50', 'hex'), Buffer.from('0f', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 80,15,0,0
                    multiplierHint: [Buffer.from('0f', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 15,0,0,0
                    res: Buffer.from('d00f', 'hex'),
                },
                {
                    num: Buffer.from('eb13', 'hex'), // 5099
                    reminderHint: [Buffer.from('6b', 'hex'), Buffer.from('27', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 107,39,0,0
                    multiplierHint: [Buffer.from('27', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 39,0,0,0
                    res: Buffer.from('eb27', 'hex'),
                },
                {
                    num: Buffer.from('658709', 'hex'), // 624_485
                    reminderHint: [Buffer.from('65', 'hex'), Buffer.from('0e', 'hex'), Buffer.from('26', 'hex'), Buffer.from('00', 'hex')], // 101,14,38,0
                    multiplierHint: [Buffer.from('0e13', 'hex'), Buffer.from('26', 'hex'), Buffer.from('00', 'hex'), Buffer.from('00', 'hex')], // 4878,38,0,0
                    res: Buffer.from('e58e26', 'hex'),
                },
                {
                    num: Buffer.from('c0c62d', 'hex'), // 3_000_000
                    reminderHint: [Buffer.from('40', 'hex'), Buffer.from('0d', 'hex'), Buffer.from('37', 'hex'), Buffer.from('01', 'hex')], // 64,13,55,1
                    multiplierHint: [Buffer.from('8d5b', 'hex'), Buffer.from('b700', 'hex'), Buffer.from('01', 'hex'), Buffer.from('00', 'hex')], // 23437,183,1,0
                    res: Buffer.from('c08db701', 'hex'),
                },
            ]

            for (const addTestVector of addTestVectors) {
                const witnesses = [
                    addTestVector.num,
                    addTestVector.reminderHint[0],
                    addTestVector.reminderHint[1],
                    addTestVector.reminderHint[2],
                    addTestVector.reminderHint[3],
                    addTestVector.multiplierHint[0],
                    addTestVector.multiplierHint[1],
                    addTestVector.multiplierHint[2],
                    addTestVector.multiplierHint[3],
                    addTestVector.res,
                    Buffer.from('02', 'hex'),
                    scriptTestSellOrder.toBuffer(),
                    Buffer.from(cblock, 'hex'),
                ]
                tx1.inputs[0].witnesses = witnesses

                // Run locally
                const interpreter = new btc.Script.Interpreter()
                const flags =
                    btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
                    btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
                    btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
                const res = interpreter.verify(
                    new btc.Script(''),
                    tx0.outputs[0].script,
                    tx1,
                    0,
                    flags,
                    witnesses,
                    tx0.outputs[0].satoshis
                )
                console.log(`${addTestVector.num.toString('hex')}:\t ${res}`)
                expect(res).to.be.true
            }
        })
    })
})
