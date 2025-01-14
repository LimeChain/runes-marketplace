import { SmartContract, method, assert, ByteString, FixedArray } from "scrypt-ts"
import { SellOrder } from '../sellOrder'

export class TestSellOrder extends SmartContract {
    constructor() {
        super(...arguments)
    }

    @method()
    public testMul128(a: bigint, resExpected: bigint) {
        assert(SellOrder.mul128(a) == resExpected)
    }

    @method()
    public testRshift7(num: bigint, reminderHint: bigint, multiplierHint: bigint, resExpected: bigint) {
        assert(SellOrder.rshift7(num, reminderHint, multiplierHint) == resExpected)
    }

    @method()
    public testLeb128(num: bigint, reminderHint: FixedArray<bigint, 4>, multiplierHint: FixedArray<bigint, 4>, resExpected: ByteString) {
        assert(SellOrder.leb128(num, reminderHint, multiplierHint) == resExpected)
    }
}
