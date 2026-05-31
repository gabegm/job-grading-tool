import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/job-grading-tool/',
  plugins: [svelte()],
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    reporters: ['verbose'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/App.svelte'],
    },
  },
})
