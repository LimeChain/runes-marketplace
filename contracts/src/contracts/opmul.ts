import { method, SmartContractLib } from 'scrypt-ts'

export class OpMul extends SmartContractLib {
    constructor() {
        super(...arguments)
    }

    @method()
    static u15Mul(a: bigint, b: bigint): bigint {
        return a * b
    }

}
