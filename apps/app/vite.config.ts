import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tether.io/wdk': path.resolve(__dirname, './src/lib/wdk-mock.ts')
    }
  }
})
