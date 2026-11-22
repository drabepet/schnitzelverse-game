import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { fmtCompact, setNotation } from './format'

describe('fmtCompact', () => {
  it('keeps three significant digits', () => {
    expect(fmtCompact(0)).toBe('0')
    expect(fmtCompact(7.5)).toBe('7.5')
    expect(fmtCompact(74.25)).toBe('74.3')
    expect(fmtCompact(742.4)).toBe('742')
    expect(fmtCompact(7421)).toBe('7.42K')
    expect(fmtCompact(74_210)).toBe('74.2K')
    expect(fmtCompact(742_100)).toBe('742K')
    expect(fmtCompact(D('8.1234e22'))).toBe('81.2Sx')
  })

  it('rolls over instead of showing four digits', () => {
    expect(fmtCompact(999.96)).toBe('1K')
    expect(fmtCompact(999_960)).toBe('1M')
  })

  it('never gets longer than seven characters', () => {
    for (let e = 0; e < 60; e += 0.37) expect(fmtCompact(D(10).pow(e).mul(9.99)).length, String(e)).toBeLessThanOrEqual(7)
  })

  it('goes scientific past the last suffix and when asked', () => {
    expect(fmtCompact(D('4.2e40'))).toBe('42Dd')
    expect(fmtCompact(D('4.2e70'))).toBe('4.20e70')
    setNotation('scientific')
    expect(fmtCompact(123_456)).toBe('1.23e5')
    expect(fmtCompact(9.999e5)).toBe('1.00e6')
    setNotation('short')
  })
})
