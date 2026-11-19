import { defineConfig } from 'vitest/config'

// Separate config so balance playtests don't run with the normal tests.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tools/**/*.sim.ts'],
    testTimeout: 1_800_000,
  },
})
