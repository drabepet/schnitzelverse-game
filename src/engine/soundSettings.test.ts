import { describe, expect, it } from 'vitest'
import { newGame } from './state'
import { deserialize, serialize } from './save'
import { setMusicVolume, setSoundMuted, setSoundVolume } from './actions'

describe('sound settings', () => {
  it('start quiet but on, and quiet in a background tab', () => {
    const s = newGame().settings
    expect([s.soundVolume, s.musicVolume, s.soundMuted, s.muteHidden]).toEqual([0.4, 0.4, false, true])
  })

  it('keep volumes between 0 and 1', () => {
    const s = newGame()
    setSoundVolume(s, 2)
    setMusicVolume(s, -1)
    expect([s.settings.soundVolume, s.settings.musicVolume]).toEqual([1, 0])
    setSoundVolume(s, Number.NaN)
    expect(s.settings.soundVolume).toBe(0)
  })

  it('get their defaults in saves from before sound existed', () => {
    const old = JSON.parse(serialize(newGame()))
    const settings = old.settings ?? old.s?.settings
    expect(settings).toBeTruthy()
    for (const k of ['soundVolume', 'musicVolume', 'soundMuted', 'muteHidden']) delete settings[k]
    const loaded = deserialize(JSON.stringify(old)).settings
    expect([loaded.soundVolume, loaded.musicVolume, loaded.soundMuted, loaded.muteHidden]).toEqual([0.4, 0.4, false, true])
  })

  it('survive a save and load', () => {
    const s = newGame()
    setSoundMuted(s, true)
    setMusicVolume(s, 0.15)
    const loaded = deserialize(serialize(s)).settings
    expect([loaded.soundMuted, loaded.musicVolume]).toEqual([true, 0.15])
  })
})
