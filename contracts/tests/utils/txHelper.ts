// @ts-expect-error - ignore TS errors
import btc = require('bitcore-lib-inquisition')
import axios from 'axios'
import * as ecurve from 'ecurve'
import { sha256 } from 'js-sha256'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: not a module
import BigInteger = require('bigi')
import { DummyProvider, DefaultProvider, TestWallet, bsv } from 'scrypt-ts'
import { myPrivateKey } from './privateKey'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

const wallets: Record<string, TestWallet> = {
    testnet: new TestWallet(
        myPrivateKey,
        new DefaultProvider({
            network: bsv.Networks.testnet,
        })
    ),
    local: new TestWallet(myPrivateKey, new DummyProvider()),
    mainnet: new TestWallet(
        myPrivateKey,
        new DefaultProvider({
            network: bsv.Networks.mainnet,
        })
    ),
}

export const DISABLE_KEYSPEND_PUBKEY =
    '0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0'

export function getDefaultSigner(
    privateKey?: bsv.PrivateKey | bsv.PrivateKey[]
): TestWallet {
    const network = process.env.NETWORK || 'local'

    const wallet = wallets[network]

    if (privateKey) {
        wallet.addPrivateKey(privateKey)
    }

    return wallet
}

export const sleep = async (seconds: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({})
        }, seconds * 1000)
    })
}

export function randomPrivateKey() {
    const privateKey = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
    const publicKey = bsv.PublicKey.fromPrivateKey(privateKey)
    const publicKeyHash = bsv.crypto.Hash.sha256ripemd160(publicKey.toBuffer())
    const address = publicKey.toAddress()
    return [privateKey, publicKey, publicKeyHash, address] as const
}

export async function fetchP2WPKHUtxos(address: btc.Address): Promise<unknown[]> {
    const network = process.env.NETWORK || 'local'

    if (network === 'regtest') {
        return [
            {
                address: address.toString(),
                txId: '00'.repeat(32),
                outputIndex: 0,
                script: new btc.Script(address),
                satoshis: 100000000000,
            },
        ]
    }

    const url =
        network === 'REGTEST'
            ? `https://explorer.bc-2.jp/api/address/${address.toString()}/utxo`
            : `http://127.0.0.1:18443`

    const res: unknown[] = []
    try {
        // Make a GET request to the URL using axios
        let response
        if (network === 'regtest') {
            const body = {
                jsonrpc: '1.0',
                method: 'listunspent',
                id: 'curltext',
                parameter: [
                    110,
                    9999999,
                    '["bcrt1qcgd0zrvcex93v2mlfn3rjl2w0ze72t4m6z5tk2"]',
                ],
            }
            response = await axios.post(url, body, {
                auth: {
                    username: 'user',
                    password: 'password',
                },
            })
        } else {
            response = await axios.get(url, { timeout: 10000 })
        }

        const data =
            network === 'regtest' ? response.data.result : response.data
        if (data) {
            for (let i = 0; i < data.length; i++) {
                const e = data[i]
                const utxo = {
                    address: address.toString(),
                    txId: e.txid,
                    outputIndex: e.vout,
                    script: new btc.Script(address),
                    satoshis: e.value || e.amount * 100_000_000,
                }
                res.push(utxo)
            }
        }
    } catch (error) {
        // Handle any errors that occurred during the request
        console.error('Failed to fetch data:', error)
    }
    return res
}

export const curveSECP256K1 = ecurve.getCurveByName('secp256k1')!

export function hashSHA256(buff: Buffer | string) {
    return Buffer.from(sha256.create().update(buff).array())
}

export function getSigHashSchnorr(
    transaction: btc.Transaction,
    tapleafHash: Buffer,
    inputIndex = 0,
    sigHashType = 0x00
) {
    //const sighash = btc.Transaction.Sighash.sighash(transaction, sigHashType, inputIndex, subscript);
    const execdata = {
        annexPresent: false,
        annexInit: true,
        tapleafHash: tapleafHash,
        tapleafHashInit: true,
        ////validationWeightLeft: 110,
        ////validationWeightLeftInit: true,
        codeseparatorPos: new btc.crypto.BN(4294967295),
        codeseparatorPosInit: true,
    }

    return {
        preimage: btc.Transaction.SighashSchnorr.sighashPreimage(
            transaction,
            sigHashType,
            inputIndex,
            3,
            execdata
        ),
        hash: btc.Transaction.SighashSchnorr.sighash(
            transaction,
            sigHashType,
            inputIndex,
            3,
            execdata
        ),
    }
}

export function getE(sighash: Buffer) {
    const Gx = curveSECP256K1.G.affineX.toBuffer(32)

    const tagHash = hashSHA256('BIP0340/challenge')
    const tagHashMsg = Buffer.concat([Gx, Gx, sighash])
    const taggedHash = hashSHA256(Buffer.concat([tagHash, tagHash, tagHashMsg]))

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: no fromBuffer method
    return BigInteger.fromBuffer(taggedHash).mod(curveSECP256K1?.n)
}

export function splitSighashPreimage(preimage: Buffer) {
    return {
        tapSighash1: preimage.slice(0, 32),
        tapSighash2: preimage.slice(32, 64),
        epoch: preimage.slice(64, 65),
        sighashType: preimage.slice(65, 66),
        txVersion: preimage.slice(66, 70),
        nLockTime: preimage.slice(70, 74),
        hashPrevouts: preimage.slice(74, 106),
        hashSpentAmounts: preimage.slice(106, 138),
        hashScripts: preimage.slice(138, 170),
        hashSequences: preimage.slice(170, 202),
        hashOutputs: preimage.slice(202, 234),
        spendType: preimage.slice(234, 235),
        inputNumber: preimage.slice(235, 239),
        tapleafHash: preimage.slice(239, 271),
        keyVersion: preimage.slice(271, 272),
        codeseparatorPosition: preimage.slice(272),
    }
}

export function generateHints(number: bigint) {
    const reminderHints: Buffer[] = []
    const multiplierHints: Buffer[] = []

    for (let i = 0; i < 4; i++) {
        const byte = number & BigInt(0x7f)
        number >>= BigInt(7)

        const reminder = Buffer.alloc(1)
        reminder.writeUInt8(Number(byte))
        reminderHints.push(reminder)

        const multiplier = Buffer.alloc(4)
        multiplier.writeUInt32LE(Number(number))

        // Find the last non-zero byte
        let end = multiplier.length
        while (end > 0 && multiplier[end - 1] === 0) {
            end--
        }

        // Slice up to the last non-zero byte
        const trimmedMultiplierBuffer = multiplier.slice(0, end)

        multiplierHints.push(trimmedMultiplierBuffer)
    }

    return {
        reminderHints,
        multiplierHints,
    }
}

export function toHexString(byteArray, reverse?: boolean) {
    const bytes = Array.from(byteArray, (byte: number) => {
        return ('0' + (byte & 0xff).toString(16)).slice(-2)
    })

    if (reverse) {
        bytes.reverse()
    }

    return bytes.join('')
}

export function toHex(value: bigint, reverse?: boolean) {
    const bytes: number[] = []
    let more = true

    while (more) {
        const byte = Number(value & 0xffn)
        value >>= 8n
        if (value === 0n) {
            more = false
        }
        bytes.push(byte)
    }

    return toHexString(bytes, reverse)
}

export function encodeLEB128(value: bigint) {
    const bytes: number[] = []
    let more = true

    while (more) {
        let byte = Number(value & BigInt(0x7f))
        value >>= BigInt(7)
        if (value === BigInt(0)) {
            more = false
        } else {
            byte |= 0x80
        }
        bytes.push(byte)
    }
    return toHexString(bytes)
}