let num = BigInt("10")
let m = BigInt(Math.pow(2, 8) - 1)
let p = BigInt(13)
let b8 = BigInt(8)
let b1 = BigInt(1)

export function decodeNum(num) { 
    const num_a = BigInt(String(num));
    return {
        value: num_a % p + b1,
        value_unit:num_a
    } 

}

export function decode(a) {
    let num = BigInt(a);
    let result = [];
    let calcResult = [];
    for (let i = 0; i < 16; i++) {
        result[i] = (num & m)
        calcResult[i] = result[i] % p 
        num >>= b8
    }
    console.log(result);
    return result
}