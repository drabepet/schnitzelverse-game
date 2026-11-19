import { D, type Num } from './decimal'

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

/** 'short' = 1.23M; 'scientific' = 1.23e6. Set from the player's settings. */
let notation: 'short' | 'scientific' = 'short'
export function setNotation(n: 'short' | 'scientific'): void {
  notation = n
}

/** Human-friendly number: 12.3, 4.56K, 7.89M … then scientific (1.23e45). */
export function fmt(value: Num, decimals = 2): string {
  const d = D(value)
  if (d.isNan()) return 'NaN'
  if (d.lt(0)) return '-' + fmt(d.neg(), decimals)
  if (d.lt(1000)) {
    const n = d.toNumber()
    if (Number.isInteger(n) || decimals === 0) return Math.floor(n).toString()
    return n.toFixed(n < 10 ? decimals : Math.min(decimals, 1))
  }
  const exp = d.log10().floor().toNumber()
  if (!Number.isFinite(exp) || exp > 1e15) return d.toString()
  const group = Math.floor(exp / 3)
  if (notation === 'short' && group < SUFFIXES.length) {
    return D(d).div(D(10).pow(group * 3)).toNumber().toFixed(2) + SUFFIXES[group]
  }
  return D(d).div(D(10).pow(exp)).toNumber().toFixed(2) + 'e' + exp
}

/** Whole units (stock counts). */
export const fmtInt = (value: Num): string => fmt(D(value).floor(), 0)

export const fmtMoney = (value: Num): string => '$' + fmt(value)

export function fmtTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds > 1000 * 86400) return 'a very long time'
  if (seconds >= 2 * 86400) return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s % 60}s`
  return `${s}s`
}

/** Distances: 20 m, 6 km, 2,500 km. */
export function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${Math.round(km).toLocaleString('en-US')} km`
}
