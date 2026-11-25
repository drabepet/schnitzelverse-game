import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works from any folder (e.g. GitHub Pages).
  base: './',
  build: {
    rolldownOptions: {
      output: {
        // React and the big-number library change far less often than the
        // game: in their own files, browsers keep them cached across updates.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'numbers', test: /node_modules[\\/]break_eternity\.js[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
