// Big-number support. Everything that can grow without limit (money, stock,
// reputation, rates) is a Decimal so the late game can go far past 1e308.
import Decimal from 'break_eternity.js'

export { Decimal }
export type Num = Decimal | number | string

export const D = (x: Num): Decimal => (x instanceof Decimal ? x : new Decimal(x))
export const ZERO = new Decimal(0)

/** Clamp tiny negative values left over from floating-point subtraction. */
export const nonNeg = (x: Decimal): Decimal => (x.lt(0) ? ZERO : x)
