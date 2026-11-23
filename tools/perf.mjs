// Main-thread cost per tab on the Mars save, in headless Chrome: how busy the
// page keeps the CPU while the game runs, and the top functions.
// Needs the dev server running (it seeds the save from it).
//   node tools/perf.mjs http://localhost:5173/ perf-report.txt        # dev build
//   npm run build && node tools/perf.mjs http://localhost:5173/ perf-report.txt prod   # production build (port 4173)
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { preview } from 'vite'
const URL = process.argv[2] ?? 'http://localhost:5174/'
const OUT = process.argv[3] ?? 'perf-report.txt'
const server = process.argv[4] === 'prod' ? await preview({ preview: { port: 4173, strictPort: true } }) : null
const PROD = server ? 'http://localhost:4173/' : undefined
const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
const page = await ctx.newPage()
await page.goto(URL)
const data = await page.evaluate(async () => {
  const { fromExportString, serialize } = await import('/src/engine/save.ts')
  const text = await (await fetch('/tools/saves/mars.txt')).text()
  return serialize(fromExportString(text.trim()))
})
await ctx.addInitScript((d) => {
  localStorage.setItem('schnitzelverse-save', d)
  localStorage.setItem('schnitzelverse-intro-seen', '1')
  const orig = Storage.prototype.setItem
  Storage.prototype.setItem = function (k, v) { return orig.call(this, k, k === 'schnitzelverse-save' ? d : v) }
}, data)
const p2 = await ctx.newPage()
await page.close()
await p2.goto(PROD ?? URL)
await p2.waitForTimeout(2000)
for (let i = 0; i < 3; i++) {
  const b = p2.locator('.overlay button').last()
  if (await b.count()) await b.click()
  await p2.waitForTimeout(300)
}
const cdp = await ctx.newCDPSession(p2)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
const lines = []
for (const tab of ['Terraformed', 'Galactic', 'Interplanetary', 'Franchise', 'Records']) {
  await p2.evaluate((t) => [...document.querySelectorAll('[role=tab]')].find((x) => x.textContent.includes(t)).click(), tab)
  await p2.waitForTimeout(1500)
  await cdp.send('Profiler.start')
  await p2.waitForTimeout(5000)
  const { profile } = await cdp.send('Profiler.stop')
  const self = new Map(); let total = 0, idle = 0
  for (const n of profile.nodes) {
    const f = n.callFrame
    total += n.hitCount
    if (f.functionName === '(idle)') { idle += n.hitCount; continue }
    const file = f.url.split('/').pop().split('?')[0]
    const key = `${f.functionName || '(anon)'} ${file}`
    self.set(key, (self.get(key) ?? 0) + n.hitCount)
  }
  const busy = ((1 - idle / total) * 100).toFixed(0)
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `   ${((v / total) * 100).toFixed(1).padStart(5)}%  ${k}`)
  lines.push(`${tab}: main thread busy ${busy}% · DOM nodes ${await p2.evaluate(() => document.querySelectorAll('*').length)}\n${top.join('\n')}`)
}
writeFileSync(OUT, lines.join('\n\n') + '\n')
await browser.close()
if (server) await server.close()
