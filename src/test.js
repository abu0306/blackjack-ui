let num = BigInt("10")
let m = BigInt(Math.pow(2, 8) - 1)
let p = BigInt(13)
let b8 = BigInt(8)


export function decodeNum(num) { 
    const num_a = BigInt(String(num));
    return {
        value: num_a % p,
        value_unit:num_a
    } 

}

function decode_1(num) {
    console.log(num, num.toString(16))
    let result = [];
    let calcResult = [];
    for (let i = 0; i < 16; i++) {
        result[i] = (num & m)
        calcResult[i] = result[i] % p
        num >>= b8
        console.log(num,num.toString(16))
    }
    console.log(result,calcResult)
}



export function decode(a) {
    const num = BigInt(String(a));
    console.log('ddd---decode',num,num.toString(16))
    let result = [];
    let calcResult = [];
    for (let i = 0; i < 16; i++) {
        result[i] = (num & m)
        calcResult[i] = result[i] % p
        num >>= b8
    }
    console.log(result, calcResult);
    return result
}

decode_1(num);

const str = '{owner:aleo1fkp5nx6y6pg7dcd6d4dzlgxfjvyp7ds2eyy8fhtggvsztf30kggq3pmt0m.public,gates:0u64.public,nonce:0u64.private,id:4298227228694641792u64.public,signer:aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px.public,_nonce:7710417049596836544472778835759925050111916711560190078132951981502404965766group.public}';

function replaceStr(str){ 
    console.log(str.replace(/\.public/g,''))
}
const str1 = '7u128'
function replaceUnit(str) { 
        console.log(str.replace(/\u128/g,''))
}
replaceUnit(str1)

replaceStr(str)