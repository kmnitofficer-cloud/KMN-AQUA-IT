import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { excelDatabasePlugin } from './server/excelDatabasePlugin.js'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: [
        '**/database/**',
        '**/backups/**',
        '**/*.xlsx',
        '**/*.xls',
        '**/*.csv',
        '**/public/invoices/**'
      ]
    }
  },
  plugins: [
    react(),
    excelDatabasePlugin()
  ],
})

