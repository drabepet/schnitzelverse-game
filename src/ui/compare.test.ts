import { describe, expect, it } from 'vitest'
import { compare, DISTANCES, MASSES } from './compare'

describe('silly comparisons', () => {
  it('picks the biggest thing it beats', () => {
    expect(compare(100, DISTANCES)).toBeNull()
    expect(compare(210, DISTANCES)).toEqual({ times: '2×', what: 'a football pitch' })
    expect(compare(4.0075e7 * 2.34, DISTANCES)).toEqual({ times: '2.3×', what: 'the way around the Earth' })
    expect(compare(150_000 * 12, MASSES)).toEqual({ times: '12×', what: 'a blue whale' })
  })
})
