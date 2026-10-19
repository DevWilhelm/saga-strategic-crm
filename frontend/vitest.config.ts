import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Kept apart from vite.config.ts: Vitest 3's config types target Vite 7,
// so adding `test` there fails the Vite 8 type check in `npm run build`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
