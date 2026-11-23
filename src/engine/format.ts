import { D, type Num } from './decimal'
import type { Notation } from './state'

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg']

/** Names for “1.23 million” and up (each a thousand times the one before). */
const NAMES = [
  'million', 'billion', 'trillion', 'quadrillion', 'quintillion', 'sextillion', 'septillion', 'octillion', 'nonillion',
  'decillion', 'undecillion', 'duodecillion', 'tredecillion', 'quattuordecillion', 'quindecillion', 'sexdecillion',
  'septendecillion', 'octodecillion', 'novemdecillion', 'vigintillion',
]

/**
 * 'short' = 1.23M; 'named' = 1.23 million (full-size numbers only: compact
 * ones in the sidebar, tiles and buttons stay short); 'scientific' = 1.23e6.
 * Set from the player's settings.
 */
let notation: Notation = 'short'
export function setNotation(n: Notation): void {
  notation = n
}

/** Human-friendly number: 12.3, 4.56K, 7.89M (or 7.89 million) … then scientific (1.23e45). */
export function fmt(value: Num, decimals = 2): string {
  return format(value, decimals, notation)
}

/** Like fmt, but never named: for small spaces (buttons), where “1.23 quadrillion” won't fit. */
export function fmtShort(value: Num, decimals = 2): string {
  return format(value, decimals, notation === 'named' ? 'short' : notation)
}

/** Money on a button: $1.23M even when numbers are named. */
export const fmtMoneyShort = (value: Num): string => '$' + fmtShort(value)

function format(value: Num, decimals: number, notation: Notation): string {
  const d = D(value)
  if (d.isNan()) return 'NaN'
  if (d.lt(0)) return '-' + format(d.neg(), decimals, notation)
  if (d.lt(1000)) {
    const n = d.toNumber()
    if (Number.isInteger(n) || decimals === 0) return Math.floor(n).toString()
    return n.toFixed(n < 10 ? decimals : Math.min(decimals, 1))
  }
  const exp = d.log10().floor().toNumber()
  if (!Number.isFinite(exp) || exp > 1e15) return d.toString()
  const group = Math.floor(exp / 3)
  if (notation === 'named' && group >= 2 && group - 2 < NAMES.length) {
    return D(d).div(D(10).pow(group * 3)).toNumber().toFixed(2) + ' ' + NAMES[group - 2]
  }
  if (notation !== 'scientific' && group < SUFFIXES.length) {
    return D(d).div(D(10).pow(group * 3)).toNumber().toFixed(2) + SUFFIXES[group]
  }
  return D(d).div(D(10).pow(exp)).toNumber().toFixed(2) + 'e' + exp
}

/**
 * Three significant digits, for the headline numbers that must stay short:
 * 7.42, 74.2, 742, 7.42K, 74.2K, 742K, 7.42M … (or 7.42e45 in scientific).
 * `fixed` keeps trailing zeros from 1K up (24.0M, not 24M), for live rates.
 */
export function fmtCompact(value: Num, fixed = false): string {
  const d = D(value)
  if (d.isNan()) return 'NaN'
  if (d.lt(0)) return '-' + fmtCompact(d.neg(), fixed)
  // Rounded to three significant digits (as a number, so "7.50" shows as 7.5).
  const round3 = (m: number) => Number(m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0))
  // Fixed: keep the trailing zeros of big numbers ("24.0M"), so a live rate keeps its width.
  const show = (m: number) => (fixed ? m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0) : m.toString())
  if (d.lt(1000)) {
    const n = round3(d.toNumber())
    // 999.96 would round up to "1000": show it as 1K instead.
    return n >= 1000 ? fmtCompact(1000, fixed) : n.toString()
  }
  let exp = d.log10().floor().toNumber()
  if (!Number.isFinite(exp) || exp > 1e15) return d.toString()
  if (notation !== 'scientific' && Math.floor(exp / 3) < SUFFIXES.length) {
    let group = Math.floor(exp / 3)
    let m = D(d).div(D(10).pow(group * 3)).toNumber()
    if (round3(m) >= 1000) {
      group += 1
      m /= 1000
    }
    if (group < SUFFIXES.length) return show(round3(m)) + SUFFIXES[group]
    exp = group * 3
  }
  let m = D(d).div(D(10).pow(exp)).toNumber()
  if (Number(m.toFixed(2)) >= 10) {
    exp += 1
    m /= 10
  }
  return m.toFixed(2) + 'e' + exp
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

/** A light year in km. */
export const LIGHT_YEAR_KM = 9.461e12

/** Distances: 20 m, 6 km, 2,500 km, then 4.2 light years, 2.5 million light years, everywhere. */
export function fmtKm(km: number): string {
  if (!Number.isFinite(km) || km >= 1e29) return 'everywhere at once'
  if (km >= LIGHT_YEAR_KM / 10) {
    const ly = km / LIGHT_YEAR_KM
    const n = ly < 10 ? Number(ly.toFixed(1)).toString() : ly < 1e6 ? Math.round(ly).toLocaleString('en-US') : fmtCompact(ly)
    return `${n} light year${ly === 1 ? '' : 's'}`
  }
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${Math.round(km).toLocaleString('en-US')} km`
}
