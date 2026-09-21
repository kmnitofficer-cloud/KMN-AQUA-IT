import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { excelDatabasePlugin } from './server/excelDatabasePlugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    excelDatabasePlugin()
  ],
})

