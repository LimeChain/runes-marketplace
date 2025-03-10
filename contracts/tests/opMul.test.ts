// @ts-ignore
import btc = require('bitcore-lib-inquisition')
import { Tap } from '@cmdcode/tapscript' // Requires node >= 19

import * as dotenv from 'dotenv'
dotenv.config()

import { expect, use } from 'chai'
import { TestOpMul } from '../src/contracts/tests/testOpmul'
import chaiAsPromised from 'chai-as-promised'
import { DISABLE_KEYSPEND_PUBKEY, fetchP2WPKHUtxos } from './utils/txHelper'
use(chaiAsPromised)

describe('Test helper functions of `SellOrder`', () => {
    let tx0, tx1, cblock, scriptTestSellOrder

    before(async () => {
        await TestOpMul.loadArtifact()

        const seckey = new btc.PrivateKey(
            process.env.PRIVATE_KEY,
            btc.Networks.testnet
        )
        const addrP2WPKH = seckey.toAddress(
            null,
            btc.Address.PayToWitnessPublicKeyHash
        )

        const instance = new TestOpMul()
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
                    a: Buffer.from('10', 'hex'), // 16
                    b: Buffer.from('10', 'hex'), // 16
                    res: Buffer.from('0001', 'hex'), // 256
                },
                {
                    a: Buffer.from('e803', 'hex'), // 1000
                    b: Buffer.from('14', 'hex'), // 20
                    res: Buffer.from('204e', 'hex'), // 20000
                },
                {
                    a: Buffer.from('1027', 'hex'), // 10000
                    b: Buffer.from('02', 'hex'), // 2
                    res: Buffer.from('204e', 'hex'), // 20000
                },
            ]

            for (const addTestVector of addTestVectors) {
                const witnesses = [
                    addTestVector.a,
                    addTestVector.b,
                    addTestVector.res,
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

})
