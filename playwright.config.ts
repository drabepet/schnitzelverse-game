// Browser smoke test: build, serve, click through every tab, fail on any console error.
// Locally it can use the installed Chrome: PW_CHANNEL=chrome npm run smoke
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    channel: process.env.PW_CHANNEL,
  },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})
