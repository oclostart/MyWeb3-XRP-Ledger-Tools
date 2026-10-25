import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /**
   * Pin the dependency graph so Vite optimises everything in one pass.
   *
   * Installing packages mid-session triggered a second optimise pass that gave
   * react-dom/client its own copy of React — two Reacts, so every hook threw
   * "Invalid hook call" and the app silently stopped mounting parts of itself.
   * Listing them up front makes discovery deterministic.
   */
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
