import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { BADGES } from './badges'
import { newGame } from './state'
import { clickDeliver, clickLogo, clickStage, franchise, hireWorker, markBadgesSeen } from './actions'
import { deserialize, serialize } from './save'
import { advance } from './tick'

describe('badges', () => {
  it('have unique ids and say something funny', () => {
    const ids = new Set(BADGES.map((b) => b.id))
    expect(ids.size).toBe(BADGES.length)
    expect(BADGES.length).toBeGreaterThan(50)
    for (const b of BADGES) expect(b.flavor.length).toBeGreaterThan(10)
  })

  it('none are earned in a brand new garage', () => {
    const s = newGame(0)
    advance(s, 1)
    expect(Object.keys(s.badges)).toEqual([])
  })

  it('the first schnitzel earns Beginner’s Luck', () => {
    const s = newGame(0)
    clickStage(s, 'pound')
    clickStage(s, 'bread')
    clickStage(s, 'fry')
    s.regions.neighbours.orders = D(1)
    clickDeliver(s, 'neighbours')
    advance(s, 0.25)
    expect(s.badges.served1).toBeDefined()
    expect(s.log.some((l) => l.text.includes('Beginner’s Luck'))).toBe(true)
  })

  it('Hire the Whole Family needs every kind of helper', () => {
    const s = newGame(0)
    s.money = D(1e6)
    for (const w of ['uncle', 'grandma', 'cousin'] as const) hireWorker(s, w)
    advance(s, 0.25)
    expect(s.badges.wholeFamily).toBeUndefined()
    hireWorker(s, 'kid')
    advance(s, 0.25)
    expect(s.badges.wholeFamily).toBeDefined()
  })

  it('the secret lemon: click the logo 10 times', () => {
    const s = newGame(0)
    for (let i = 0; i < 10; i++) clickLogo(s)
    advance(s, 0.25)
    expect(s.badges.lemon).toBeDefined()
  })

  it('survive a franchise and a save', () => {
    const s = newGame(0)
    s.prestige.unlocked = true
    s.stats.earned = D(1e6)
    for (let i = 0; i < 10; i++) clickLogo(s)
    advance(s, 0.25)
    franchise(s)
    advance(s, 0.25)
    const back = deserialize(serialize(s))
    expect(back.badges.lemon).toBeDefined()
    expect(back.badges.franchise1).toBeDefined()
  })

  it('tracks which badges were already seen', () => {
    const s = newGame(0)
    for (let i = 0; i < 10; i++) clickLogo(s)
    advance(s, 0.25)
    expect(s.badgesSeen).toBe(0)
    markBadgesSeen(s)
    expect(s.badgesSeen).toBe(Object.keys(s.badges).length)
  })
})

describe('badge bonuses', () => {
  it('only name badges that exist (or Chapter 4 ones added later)', async () => {
    const { BADGE_BONUS } = await import('./badgeBonus')
    const { BADGE_BY_ID } = await import('./badges')
    for (const id of Object.keys(BADGE_BONUS)) expect(BADGE_BY_ID[id], id).toBeDefined()
  })
})

describe('made by hand', () => {
  it('counts each kitchen step you do yourself, at 1, 10 and 100', async () => {
    const { cookAll } = await import('./actions')
    const { tick } = await import('./tick')
    const { BADGE_BONUS } = await import('./badgeBonus')
    const s = newGame()
    expect(cookAll(s)).toBe(true) // pound + bread + fry
    tick(s, 0.05)
    for (const id of ['pound1', 'bread1', 'fry1']) expect(s.badges[id], id).toBeDefined()
    expect(s.badges.pound10).toBeUndefined()
    s.stats.byHand.pound = 100
    tick(s, 0.05)
    expect(s.badges.pound10).toBeDefined()
    expect(s.badges.pound100).toBeDefined()
    // Just for fun: no income bonus.
    for (const b of BADGES.filter((x) => x.category === 'byHand')) expect(BADGE_BONUS[b.id]).toBeUndefined()
  })

  it('every badge has a unique name', () => {
    const names = BADGES.map((b) => b.name)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('new badges', () => {
  it('are the newest ones since you last looked', async () => {
    const { unseenBadges } = await import('./badges')
    const s = newGame()
    s.badges = { served1: 10, served10: 50, placeFriends: 30 }
    s.badgesSeen = 1
    expect(unseenBadges(s)).toEqual(['served10', 'placeFriends'])
    markBadgesSeen(s)
    expect(unseenBadges(s)).toEqual([])
  })
})
