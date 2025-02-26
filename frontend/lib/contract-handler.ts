"use client";

import { Tap } from "@cmdcode/tapscript";
import * as ecurve from 'ecurve'
import BigInteger from 'bigi'
import { sha256 } from 'js-sha256'
import artifact from "@/contracts/sellOrder.json";
import { encodeLEB128, toHex, Tx, TxIn, TxOut } from "./utils";

const DISABLE_KEYSPEND_PUBKEY =
  "0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0";
let btc: any;

export async function createInstance(
  privateKeyWif: string,
  runeId: string,
  threshold: number
) {
  await importBtc();
  const { SellOrder } = await import("@/contracts/sellOrder");
  SellOrder.loadArtifact(artifact);
  const privkey = new btc.PrivateKey.fromWIF(privateKeyWif);
  const pubkey = privkey.toPublicKey();
  const addrP2WPKH = privkey.toAddress(
    null,
    btc.Address.PayToWitnessPublicKeyHash
  );
  const xOnlyPub =
    pubkey.toBuffer().length > 32
      ? pubkey.toBuffer().slice(1, 33)
      : pubkey.toBuffer();

  const sellerOut = Buffer.concat([
    Buffer.from("16", "hex"),
    new btc.Script(addrP2WPKH).toBuffer(),
  ]);

  const instance = new SellOrder(
    xOnlyPub.toString("hex"),
    sellerOut.toString("hex"),
    BigInt(threshold),
    runeId
  );

  return instance;
}

export async function getInstance(
  publicKey: string,
  threshold: number,
  runeId: string
) {
  await importBtc();
  const { SellOrder } = await import("@/contracts/sellOrder");
  SellOrder.loadArtifact(artifact);

  const pubkey = new btc.PublicKey.fromX(false, publicKey)
  const address = pubkey.toAddress(
    null,
    btc.Address.PayToWitnessPublicKeyHash
  )
  const xOnlyPub =
    pubkey.toBuffer().length > 32
      ? pubkey.toBuffer().slice(1, 33)
      : pubkey.toBuffer();

  const sellerOut = Buffer.concat([
    Buffer.from("16", "hex"),
    new btc.Script(address).toBuffer(),
  ]);

  const instance = new SellOrder(
    xOnlyPub.toString("hex"),
    sellerOut.toString("hex"),
    BigInt(threshold),
    runeId
  );

  return instance;
}

export async function createSellOrderTx(
  feeTxOut: TxOut,
  runesTxOut: TxOut,
  privateKeyWif: string,
  runeId: string,
  tokenAmount: bigint,
  exchangeRate: bigint,
  instance: any
) {
  await importBtc();

  const [feeTxID, feeTxOutpoint] = feeTxOut.outpoint.split(":");
  const [runesTxID, runesTxOutpoint] = runesTxOut.outpoint.split(":");
  const [scriptSellOrderP2TR] = await getInstanceParams(instance);

  const privkey = new btc.PrivateKey.fromWIF(privateKeyWif);

  const addrP2WPKH = privkey.toAddress(
    btc.Networks.regtest,
    btc.Address.PayToWitnessPublicKeyHash
  );

  const runesUtxo = {
    address: addrP2WPKH.toString(), //runesTxOut.address
    txId: runesTxID,
    outputIndex: Number.parseInt(runesTxOutpoint),
    script: new btc.Script(addrP2WPKH),
    satoshis: runesTxOut.value,
  };

  const feeUtxo = {
    address: addrP2WPKH.toString(), // feeTxOut.address
    txId: feeTxID,
    outputIndex: Number.parseInt(feeTxOutpoint),
    script: new btc.Script(addrP2WPKH),
    satoshis: feeTxOut.value,
  };

  const tokenAmountLeb128 = encodeLEB128(tokenAmount);
  const tokenAmountLE = toHex(tokenAmount);
  const exchangeRateLE = toHex(exchangeRate);

  const tokenAmountLEBytes = toHex(BigInt(tokenAmountLE.length / 2));
  const exchangeRateLEBytes = toHex(BigInt(tokenAmountLE.length / 2));

  const opRetStateScript0 = new btc.Script(
    `6a${tokenAmountLEBytes}${tokenAmountLE}${exchangeRateLEBytes}${exchangeRateLE}`
  );

  const runeBytes = toHex(
    BigInt((runeId.length + tokenAmountLeb128.length) / 2 + 1)
  );

  const opRetRuneScript0 = new btc.Script(
    `6a5d${runeBytes}${runeId}${tokenAmountLeb128}00`
  );

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
    .sign(privkey);
}

export async function createBuyTx(
  prevTxId: string,
  prevTx: Tx,
  feeTxOut: TxOut,
  sellerPublicKey: string,
  spenderPrivateKey: string,
  runeId: string,
  tokenPurchaseAmount: bigint,
  tokenAmount: bigint,
  exchangeRate: bigint,
  instance: any
) {
  const [
      scriptSellOrderP2TR,
      scriptSellOrder,
      tapleafSellOrder,
      cblockSellOrder,
  ] = await getInstanceParams(instance)

  const isFullBuy = tokenPurchaseAmount === tokenAmount

  const utxoSellOrderP2TR = {
      txId: prevTxId,
      outputIndex: 0,
      script: scriptSellOrderP2TR,
      satoshis: prevTx.output[0].value,
  }

  const [feeTxID, feeTxOutpoint] = feeTxOut.outpoint.split(":");

  const sellerPubkey = new btc.PublicKey.fromX(false, sellerPublicKey)
  const sellerAddress = sellerPubkey.toAddress(
    null,
    btc.Address.PayToWitnessPublicKeyHash
  )

  const spenderPrivkey = new btc.PrivateKey.fromWIF(spenderPrivateKey)
  const spenderAddress = spenderPrivkey.toAddress(
    null,
    btc.Address.PayToWitnessPublicKeyHash
  )

  const paymentUTXO = {
      address: spenderAddress.toString(),
      txId: feeTxID,
      outputIndex: Number.parseInt(feeTxOutpoint),
      script: new btc.Script(spenderAddress),
      satoshis: feeTxOut.value,
  }

  const tokenPurchaseAmountLeb128 = encodeLEB128(tokenPurchaseAmount)
  const tokenPurchaseAmountLE = toHex(tokenPurchaseAmount)
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
              script: new btc.Script(spenderAddress),
          })
      )
      // Seller's address
      .addOutput(
          new btc.Transaction.Output({
              satoshis: Number(tokenPurchaseAmount * exchangeRate),
              script: new btc.Script(sellerAddress),
          })
      )

  const [_e, preimageParts, sighash, eLastByte] = await mutateTx(
      tx,
      spenderPrivkey,
      tapleafSellOrder
  )

  const prevTxVer = Buffer.alloc(4)
  prevTxVer.writeUInt32LE(prevTx.version)

  const prevTxLocktime = Buffer.alloc(4)
  prevTxLocktime.writeUInt32LE(prevTx.lock_time)

  // In the first iteration we can just pass the fee input as the prev tx contract input...
  const prevTxInputs = new btc.encoding.BufferWriter()
  prevTxInputs.writeVarintNum(prevTx.input.length)
  txInToBufferWriter(prevTx.input[0], prevTxInputs)
  txInToBufferWriter(prevTx.input[1], prevTxInputs)

  const prevTxOutputCount = Buffer.alloc(1)
  prevTxOutputCount.writeUInt8(prevTx.output.length)

  // Concat all outputs after the covenant and the state
  const prevTxOutputs = new btc.encoding.BufferWriter()
  txOutToBufferWriter(prevTx.output[2], prevTxOutputs)

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

  // TODO: REMOVE?
  let interpreter = new btc.Script.Interpreter()
  let flags =
      btc.Script.Interpreter.SCRIPT_VERIFY_WITNESS |
      btc.Script.Interpreter.SCRIPT_VERIFY_TAPROOT |
      btc.Script.Interpreter.SCRIPT_VERIFY_DISCOURAGE_OP_SUCCESS
  let res = interpreter.verify(
      new btc.Script(''),
      new btc.Script(prevTx.output[0].script_pubkey),
      tx,
      0,
      flags,
      witnesses,
      prevTx.output[0].value
  )

  console.log(333, res)

  return [tx, witnesses]
}

async function getInstanceParams(instance: any) {
  await importBtc();
  const scriptSellOrder = instance.lockingScript;
  const tapleafSellOrder = Tap.encodeScript(scriptSellOrder.toBuffer());

  const [tpubkeySellOrder, cblockSellOrder] = Tap.getPubKey(
    DISABLE_KEYSPEND_PUBKEY,
    { target: tapleafSellOrder }
  );
  const scriptSellOrderP2TR = new btc.Script(`OP_1 32 0x${tpubkeySellOrder}}`);

  return [
    scriptSellOrderP2TR,
    scriptSellOrder,
    tapleafSellOrder,
    cblockSellOrder,
  ];
}

// Mutate tx if it ends with 0x7f (highest single byte stack value) or 0xff (lowest signle byte stack value).
async function mutateTx(tx: any, spenderKey: any, tapleaf: any) {
  let e, eBuff, sighash, eLastByte
  while (true) { // eslint-disable-line no-constant-condition
      sighash = getSigHashSchnorr(tx, Buffer.from(tapleaf, 'hex'), 0)
      e = await getE(sighash.hash)
      let hex = e.toString(16);
      if (hex.length % 2) hex = '0' + hex; // Ensure even length for valid hex representation
      // eBuff = e.toBuffer(32)
      eBuff = Buffer.from(hex, 'hex');
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

export const curveSECP256K1 = ecurve.getCurveByName('secp256k1')!

export function hashSHA256(buff: Buffer | string) {
    return Buffer.from(sha256.create().update(buff).array())
}

function getSigHashSchnorr(
  transaction: any,
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

function txInToBufferWriter(txIn: TxIn, writer: any) {
  if (!writer) {
    writer = new btc.BufferWriter();
  }
  const [prevTxId, prevTxOut] = txIn.previous_output.split(':')

  writer.writeReverse(Buffer.from(prevTxId, 'hex'));
  writer.writeUInt32LE(prevTxOut);
  const script = Buffer.from(txIn.script_sig, 'hex');
  writer.writeVarintNum(script.length);
  writer.write(script);
  writer.writeUInt32LE(txIn.sequence);
  return writer;
}

function txOutToBufferWriter(txOut: TxOut, writer: any) {
  if (!writer) {
    writer = new btc.BufferWriter();
  }
  writer.writeUInt64LEBN(new btc.crypto.BN(txOut.value));
  const script = Buffer.from(txOut.script_pubkey, 'hex')
  writer.writeVarintNum(script.length);
  writer.write(script);
  return writer;
}

async function importBtc() {
  if (!btc) {
    // @ts-ignore
    btc = await import("bitcore-lib-inquisition");
  }
}
