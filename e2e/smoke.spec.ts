import { expect, test, type Page } from '@playwright/test'
import { D } from '../src/engine/decimal'
import { REGIONS } from '../src/engine/content'
import { serialize } from '../src/engine/save'
import { newGame } from '../src/engine/state'

const SAVE_KEY = 'schnitzelverse-save'

/** Collect console errors and uncaught exceptions; the test fails on any. */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

async function visitEveryTab(page: Page) {
  const tabs = page.getByRole('tab')
  const count = await tabs.count()
  expect(count).toBeGreaterThanOrEqual(4)
  for (let i = 0; i < count; i++) {
    await tabs.nth(i).click()
    await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true')
  }
}

test('a fresh game: cook, deliver, browse every tab', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Schnitzelverse', exact: true })).toBeVisible()
  // A new game opens with the welcome screen.
  await expect(page.getByRole('heading', { name: /Welcome to Schnitzelverse/ })).toBeVisible()
  await page.getByRole('button', { name: /Fire up the pan/ }).click()

  // Cook one schnitzel all the way (kitchen), then deliver it (distribution tab).
  await page.getByRole('button', { name: /Cook all three/ }).click()
  await page.getByRole('tab').nth(2).click()
  await page.getByRole('button', { name: /Knock/ }).click()
  await page.getByRole('button', { name: 'Deliver', exact: true }).first().click()
  await expect(page.getByText('Served').first()).toBeVisible()

  await visitEveryTab(page)

  await page.getByRole('button', { name: /Game/ }).click()
  await page.getByRole('button', { name: /Settings/ }).click()
  await page.getByRole('radio', { name: 'Scientific' }).click()
  await page.getByRole('button', { name: 'Done' }).click()

  expect(errors).toEqual([])
})

test('a late game (every chapter) renders every tab', async ({ page }) => {
  const s = newGame()
  s.prestige.franchises = 20
  s.prestige.unlocked = true
  s.prestige.crumbs = D(1000)
  s.reputation = D(1e12)
  s.money = D(1e15)
  s.crisp.unlocked = true
  s.milestones.planet = true
  for (const r of REGIONS) if (!r.space || r.id === 'orbit') s.regions[r.id].unlocked = true
  s.workers.uncle = 50
  s.workers.kid = 10
  s.vehicles.truck = 3
  s.vehicles.rocket = 2
  s.prestige.perks.familyManager = 1
  s.prestige.perks.dispatcher = 1
  const save = serialize(s)
  await page.addInitScript(
    ([key, data]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, data)
        sessionStorage.setItem('seeded', '1')
      }
    },
    [SAVE_KEY, save],
  )
  const errors = watchErrors(page)
  await page.goto('/')
  await expect(page.getByText(/Chapter 4/)).toBeVisible()
  await visitEveryTab(page)
  await expect(page.getByText(/Income per second|The chart starts/)).toBeVisible()
  expect(errors).toEqual([])
})
