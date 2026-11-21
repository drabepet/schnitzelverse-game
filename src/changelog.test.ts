import { describe, expect, it } from 'vitest'
import { CHANGELOG } from './changelog'
import { GAME_VERSION } from './version'
import { newGame } from './engine/state'
import { setIntroSeen } from './engine/actions'

describe('changelog', () => {
  it('starts with the current version', () => {
    expect(CHANGELOG[0].version).toBe(GAME_VERSION)
  })

  it('lists each version once, newest first', () => {
    const versions = CHANGELOG.map((e) => Number(e.version))
    expect(new Set(versions).size).toBe(versions.length)
    expect([...versions].sort((a, b) => b - a)).toEqual(versions)
  })

  it('a new player has no news waiting once the welcome page is closed', () => {
    const s = newGame()
    expect(s.newsSeen).toBe('')
    setIntroSeen(s, true)
    expect(s.newsSeen).toBe(GAME_VERSION)
  })
})
