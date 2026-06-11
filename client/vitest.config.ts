import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Config séparé pour Vitest — non inclus dans tsc -b (tsconfig.node.json)
// Vitest v3 bunde sa propre version de vite (rollup), incompatible avec vite 8 (rolldown)
export default defineConfig({
  // @ts-expect-error: incompatibilité de types rolldown/rollup entre vite 8 et vitest v3
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
