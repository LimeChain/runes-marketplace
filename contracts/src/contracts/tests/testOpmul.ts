import { SmartContract, method, assert } from "scrypt-ts"
import { OpMul } from "../opmul"

export class TestOpMul extends SmartContract {

    constructor() {
        super(...arguments)
    }

    @method()
    public testMul128(a: bigint, b: bigint, resExpected: bigint) {
        assert(OpMul.u15Mul(a, b) == resExpected)
    }
}
