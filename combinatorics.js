/**
 * combinatorics.js
 *
 *  Licensed under the MIT license.
 *  http://www.opensource.org/licenses/mit-license.php
 *
 * @typedef {(number|bigint)} integer
 *  
 *  @author: Dan Kogai <dankogai+github@gmail.com>
 *  References:
 *  @link: http://www.ruby-doc.org/core-2.0/Array.html#method-i-combination
 *  @link: http://www.ruby-doc.org/core-2.0/Array.html#method-i-permutation
 *  @link: http://en.wikipedia.org/wiki/Factorial_number_system
 */
export const version = '0.6.1';
/**
 * wrapper to `BigInt`.  if `BigInt` is unavailable, `Number`.
 */
const _BI = typeof BigInt == 'function' ? BigInt : Number;
/**
 * calculates `P(n, k)`.
 * 
 * @link https://en.wikipedia.org/wiki/Permutation
 * @param {integer} n 
 * @param {integer} k
 * @returns {integer}
 */
export function permutation(n, k) {
    [n, k] = [_BI(n), _BI(k)]
    let p = _BI(1);
    while (k--) p *= n--;
    return p <= Number.MAX_SAFE_INTEGER ? Number(p) : p;
}
/**
 * calculates `C(n, k)`.
 * 
 * @link https://en.wikipedia.org/wiki/Combination
 * @param {integer} n
 * @param {integer} k
 * @returns {integer}
 */
export function combination(n, k) {
    const P = permutation;
    const c = _BI(P(n, k) / P(k, k))
    return c <= Number.MAX_SAFE_INTEGER ? Number(c) : c;
}
/**
 * calculates `n!` === `P(n, n)`.
 * 
 * @link https://en.wikipedia.org/wiki/Factorial
 * @param {integer} n
 * @returns {integer}
 */
export function factorial(n) {
    return permutation(n, n);
}
/**
 * returns the factoradic representation of `n`, least significant order.
 * 
 * @link https://en.wikipedia.org/wiki/Factorial_number_system
 * @param {integer} n
 * @param {number} l the number of digits
 */
export function factoradic(n, l = 0) {
    let [bn, bf] = [_BI(n), _BI(1)];
    if (!l) {
        for (l = 1; bf < bn; bf *= _BI(++l));
        if (bn < bf) bf /= _BI(l--);
    } else {
        bf = _BI(factorial(l));
    }
    let digits = [0];
    for (; l; bf /= _BI(l--)) {
        digits[l] = Math.floor(Number(bn / bf))
        bn %= bf;
    }
    return digits;
}
/**
 * Base Class of `js-combinatorics`
 */
class _CBase {
    /**
     * does `new`
     * @param args 
     */
    static make(...args) {
        return new (Function.prototype.bind.apply(this, [null].concat(args)));
    }
    /**
     * Same as `make` but takes a single array `arg`
     * 
     * cf. https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
     */
    static vmake(arg) {
        return new (Function.prototype.bind.apply(this, [null].concat(arg)));
    }
    /**
     * Common iterator
     */
    [Symbol.iterator]() {
        return function *(length, that){
            let i = 0;
            while (i < length) yield that.nth(i++);
        }(this.length, this);
    }
    /**
     * returns `[...this]`.
     */
    toArray() {
        return [...this];
    }
}
/**
 * Permutation
 */
export class Permutation extends _CBase {
    /**
     * 
     * @param {Iterable} seed
     * @param {Number} size
     */
    constructor(seed, size=0) {
        super();
        this.seed = [...seed];
        this.size = 0 < size && size <= this.seed.length ? size : this.seed.length;
        const length = permutation(seed.length, this.size);
        if (_BI === Number && Number.MAX_SAFE_INTEGER < length) {
            throw RangeError(`${length} exceeds Number.MAX_SAFE_INTEGER`);
        };
        this.length = length;
        Object.freeze(this);
    }
    nth(n) {
        const offset = this.seed.length - this.size;
        const skip = factorial(offset);
        let digits = factoradic(_BI(n) * _BI(skip), this.seed.length)
        let source = this.seed.slice()
        let result = []
        for (let i = this.seed.length - 1; offset <= i ; i--) {
            result.push(source.splice(digits[i], 1)[0]);
        }
        return result
    }
}
/**
 * Combination
 */
export class Combination extends _CBase {
    /**
     * 
     * @param {Iterable} seed
     * @param {Number} size
     */
    constructor(seed, size=0) {
        super();
        this.perm = new Permutation([...seed], size);
        this.size = this.perm.size;
        this.length = combination(seed.length, this.size);
        Object.freeze(this);
    }
    nth(n) {
        function findIndex(n) {
            const [one, two] 
                = typeof n === 'bigint' ? [_BI(1), _BI(2)] : [1, 2];
            if (n <= two) return n;
            let p = n - one;
            let s = p & -p;
            let r = p + s;
            let t = r & -r;
            let m = ((t / s) >> one) - one;
            return r | m;
        }
        return this.perm.nth(findIndex(n));
    }
}
/**
 * Base N
 */
export class BaseN extends _CBase {
    constructor(seed, size){
        super();
        this.seed = [...seed];
        this.size = size;
        let base = this.seed.length;
        this.base = base;
        let length = Array(size).fill(_BI(base)).reduce((a,v)=>a*v);
        this.length = length <= Number.MAX_SAFE_INTEGER ? Number(length) : length;
        Object.freeze(this);
    }
    nth(n) {
        if (n < 0) throw RangeError(`${n} is too small`)
        if (this.length <= n) throw RangeError(`${n} is too large`)
        const base
            = typeof n === 'bigint' ? _BI(this.base) : this.base;
        let result = [];
        for (let i = 0; i < this.size; i++) {
            var d = n % base;
            result.push(this.seed[d])
            n -= d; n /= base;
        }
        return result;
    }
}
/**
 * Power Set
 */
export class PowerSet extends _CBase {
    /**
     * @param {Iterable} seed
     */
    constructor(seed) {
        super();
        this.seed = seed;
        const length = _BI(1) << _BI(this.seed.length)
        this.length = length <= Number.MAX_SAFE_INTEGER ? Number(length) : length;
        Object.freeze(this);
    }
    nth(n) {
        if (n < 0) throw RangeError(`${n} is too small`)
        if (this.length <= n) throw RangeError(`${n} is too large`)
        const one = typeof n === 'bigint' ? _BI(1) : 1;
        let result = [];
        for (let i = 0; n; n >>= one, i++) if (n & one) result.push(this.seed[i]);
        return result;
    }
}
/**
 * Cartesian Product
 */
export class CartesianProduct extends _CBase {
    /**
     * @param {Iterable[]} args
     */
    constructor(...args) {
        super();
        this.seed = args.map(v => [...v]);
        this.size = this.seed.length;
        const length = this.seed.reduce((a,v) => a * _BI(v.length), _BI(1))
        this.length = length <= Number.MAX_SAFE_INTEGER ? Number(length) : length;
        Object.freeze(this);
    }
    nth(n) {
        if (n < 0) throw RangeError(`${n} is too small`)
        if (this.length <= n) throw RangeError(`${n} is too large`)
        let result = [];
        for (let i = 0; i < this.size; i++) {
            const base = this.seed[i].length;
            const b = typeof n === 'bigint' ? _BI(base) : base;
            const d = n % b;
            result.push(this.seed[i][Number(d)])
            n -= d; n /= b;
        }
        return result;
    }
}