import {
    assert,
    ByteString,
    hash256,
    int2ByteString,
    OpCode,
    method,
    prop,
    sha256,
    SmartContract,
    toByteString,
    PubKey,
    Sig,
    len,
    FixedArray
} from 'scrypt-ts'
import { SHPreimage, SigHashUtils } from './sigHashUtils'
import { OpMul } from './opmul'

export type PrevTx = {
    ver: ByteString
    locktime: ByteString
    inputs: ByteString // Includes input count prefix...
    outputCount: bigint
    contractOutputSPK: ByteString // contract output scriptPubKey
    otherOutputs: ByteString
}

export class SellOrder extends SmartContract {
    @prop()
    static readonly ZEROSAT: ByteString = toByteString('0000000000000000')
    @prop()
    static readonly DUSTSAT: ByteString = toByteString('2202000000000000')

    @prop()
    sellerPubKey: PubKey

    @prop()
    sellerOutput: ByteString

    @prop()
    minTokenThreshold: bigint

    // The runeId encoded as LEB128
    @prop()
    runeId: ByteString

    /**
     *
     * @param sellerOutput - Seller's output.
     * @param minTokenThreshold - token threshold for full buy.
     * @param runeId - Runes token ID.
     */
    constructor(
        sellerPubKey: PubKey,
        sellerOutput: ByteString,
        minTokenThreshold: bigint,
        runeId: ByteString
    ) {
        super(...arguments)
        this.sellerPubKey = sellerPubKey
        this.sellerOutput = sellerOutput
        this.minTokenThreshold = minTokenThreshold
        this.runeId = runeId
    }

    @method()
    public buy(
        shPreimage: SHPreimage,
        prevTx: PrevTx,
        paymentPrevout: ByteString,
        stateAmount: bigint,
        stateExchangeRate: bigint,
        purchasedAmount: bigint,
        buyerOutput: ByteString,
        amountReminderHints: FixedArray<bigint, 4>,
        amountMultiplierHints: FixedArray<bigint, 4>
    ) {
        // Check sighash preimage.
        const s = SigHashUtils.checkSHPreimage(shPreimage)
        assert(this.checkSig(s, SigHashUtils.Gx))

        // Construct prev tx.
        const prevTxId = SellOrder.getPrevTxId(
            prevTx,
            stateAmount,
            stateExchangeRate
        )

        // Check prevouts to validate first input actually unlocks prev counter instance.
        const prevTxOutIdx = toByteString('00000000')
        const hashPrevouts = sha256(prevTxId + prevTxOutIdx + paymentPrevout)
        assert(hashPrevouts == shPreimage.hashPrevouts)

        // Check counter covenant is called via first input.
        assert(shPreimage.inputNumber == toByteString('00000000'))

        // Check the remaining tokens are more than the threshold
        assert(stateAmount - purchasedAmount > this.minTokenThreshold)

        const newAmount = stateAmount - purchasedAmount
        const stateOut = SellOrder.getStateOut(newAmount, stateExchangeRate)

        const btcAmount = OpMul.u15Mul(purchasedAmount, stateExchangeRate)
        const encodedAmount = SellOrder.encodeBtcAmount(btcAmount)

        // Enforce outputs
        const hashOutputs = sha256(
            // recurse: same scriptPubKey
            SellOrder.DUSTSAT +
                prevTx.contractOutputSPK +
                // New state
                stateOut +
                // Runes OP_RETURN
                SellOrder.runeOut(this.runeId, purchasedAmount, toByteString("03"), amountReminderHints, amountMultiplierHints) +
                // Buyer's output
                SellOrder.DUSTSAT +
                buyerOutput +
                // Seller's output
                encodedAmount +
                this.sellerOutput
        )
        assert(hashOutputs == shPreimage.hashOutputs)
    }

    @method()
    public fullBuy(
        shPreimage: SHPreimage,
        prevTx: PrevTx,
        paymentPrevout: ByteString,
        stateAmount: bigint,
        stateExchangeRate: bigint,
        buyerOutput: ByteString,
        amountReminderHints: FixedArray<bigint, 4>,
        amountMultiplierHints: FixedArray<bigint, 4>
    ) {
        // Check sighash preimage.
        const s = SigHashUtils.checkSHPreimage(shPreimage)
        assert(this.checkSig(s, SigHashUtils.Gx))

        // Construct prev tx.
        const prevTxId = SellOrder.getPrevTxId(
            prevTx,
            stateAmount,
            stateExchangeRate
        )

        // Check prevouts to validate first input actually unlocks prev counter instance.
        const prevTxOutIdx = toByteString('00000000')
        const hashPrevouts = sha256(prevTxId + prevTxOutIdx + paymentPrevout)
        assert(hashPrevouts == shPreimage.hashPrevouts)

        // Check counter covenant is called via first input.
        assert(shPreimage.inputNumber == toByteString('00000000'))

        const btcAmount = OpMul.u15Mul(stateAmount, stateExchangeRate)
        const encodedAmount = SellOrder.encodeBtcAmount(btcAmount)

        // Enforce outputs
        const hashOutputs = sha256(
                // Runes OP_RETURN
                SellOrder.runeOut(this.runeId, stateAmount, toByteString("01"), amountReminderHints, amountMultiplierHints) +
                // Buyer's output
                SellOrder.DUSTSAT +
                buyerOutput +
                // Seller's output
                encodedAmount +
                this.sellerOutput
        )
        assert(hashOutputs == shPreimage.hashOutputs)
    }

    // The seller can modify or cancel the order without restrictions
    @method()
    public updateOrCancel(shPreimage: SHPreimage, sig: Sig) {
        assert(this.checkSig(sig, this.sellerPubKey))
        const s = SigHashUtils.checkSHPreimage(shPreimage)
        assert(this.checkSig(s, SigHashUtils.Gx))
    }

    @method()
    static getPrevTxId(
        prevTx: PrevTx,
        amount: bigint,
        exchangeRate: bigint
    ): ByteString {
        return hash256(
            prevTx.ver +
                prevTx.inputs +
                int2ByteString(prevTx.outputCount) +
                SellOrder.DUSTSAT +
                prevTx.contractOutputSPK +
                SellOrder.getStateOut(amount, exchangeRate) +
                prevTx.otherOutputs +
                prevTx.locktime
        )
    }

    @method()
    static getStateOut(amount: bigint, exchangeRate: bigint): ByteString {
        const opreturnScript =
            OpCode.OP_RETURN +
            SellOrder.writeCount(int2ByteString(amount)) +
            SellOrder.writeCount(int2ByteString(exchangeRate))
        return (
            SellOrder.ZEROSAT +
            int2ByteString(len(opreturnScript)) +
            opreturnScript
        )
    }

    @method()
    static writeCount(b: ByteString): ByteString {
        const n: bigint = len(b)

        let header: ByteString = toByteString('')

        if (b == toByteString('')) {
            header = toByteString('0100')
        } else if (n < 0x4c) {
            header = int2ByteString(n)
        } else if (n < 0x100) {
            header = toByteString('4c') + int2ByteString(n)
        } else if (n < 0x10000) {
            header = toByteString('4d') + int2ByteString(n)
        } else if (n < 0x100000000) {
            header = toByteString('4e') + int2ByteString(n)
        } else {
            // shall not reach here
            assert(false)
        }

        return header + b
    }

    @method()
    static mul128(num: bigint): bigint {
        for (let i = 0; i < 7; i++) {
            num += num;
        }
        return num;
    }

    @method()
    static rshift7(num: bigint, reminderHint: bigint, multiplierHint: bigint): bigint {
        assert(reminderHint >= 0n && reminderHint < 128n)
        assert(SellOrder.mul128(multiplierHint) + reminderHint == num)
        return multiplierHint
    }
    
    @method()
    static leb128(num: bigint, reminderHints: FixedArray<bigint, 4>, multiplierHints: FixedArray<bigint, 4>) : ByteString {
        let ret: ByteString = toByteString("00")
        if (multiplierHints[0] == 0n) {
            ret = int2ByteString(num)
        } else {
            SellOrder.rshift7(num, reminderHints[0], multiplierHints[0])
            ret = int2ByteString(-reminderHints[0])
            num = multiplierHints[0]
            for (let i = 0; i < 3; i++) {
                if (num != 0n) {
                    SellOrder.rshift7(num, reminderHints[i+1], multiplierHints[i+1])
                    num = multiplierHints[i+1]
                    if (num == 0n) {
                        ret += int2ByteString(reminderHints[i+1])
                    } else {
                        ret += int2ByteString(-reminderHints[i+1])
                    }
                }
            }
        }
        return ret
    }

    @method()
    static runeOut(runeId: ByteString, purchasedAmount: bigint, buyerOutput: ByteString, reminderHint: FixedArray<bigint, 4>, multiplierHint: FixedArray<bigint, 4>): ByteString {
        const runeScript = 
            runeId +
            SellOrder.leb128(purchasedAmount, reminderHint, multiplierHint) +
            buyerOutput // Buyer's output
        const opreturnScript =
            OpCode.OP_RETURN +
            OpCode.OP_13 +
            int2ByteString(len(runeScript)) +
            runeScript

        return (
            SellOrder.ZEROSAT +
            int2ByteString(len(opreturnScript)) +
            opreturnScript
        )
    }

    @method()
    static encodeBtcAmount(amount: bigint): ByteString {
        const btcAmountByteString = int2ByteString(amount)
        const btcAmountLength = len(btcAmountByteString)
        let encodedAmount: ByteString = toByteString('')

        if (btcAmountLength == 1n) {
            encodedAmount = btcAmountByteString + toByteString('00000000000000')
        } else if (btcAmountLength == 2n) {
            encodedAmount = btcAmountByteString + toByteString('000000000000')
        } else if (btcAmountLength == 3n) {
            encodedAmount = btcAmountByteString + toByteString('0000000000')
        } else if (btcAmountLength == 4n) {
            encodedAmount = btcAmountByteString + toByteString('00000000')
        } else if (btcAmountLength == 5n) {
            encodedAmount = btcAmountByteString + toByteString('000000')
        } else if (btcAmountLength == 6n) {
            encodedAmount = btcAmountByteString + toByteString('0000')
        } else if (btcAmountLength == 7n) {
            encodedAmount = btcAmountByteString + toByteString('00')
        } else if (btcAmountLength == 8n) {
            encodedAmount = btcAmountByteString
        } else {
            assert(false)
        }

        return encodedAmount
    }
}
