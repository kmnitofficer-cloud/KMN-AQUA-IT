import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { excelDatabasePlugin } from './server/excelDatabasePlugin.js'
import crypto from 'node:crypto'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const salt = 'KMN_AQUA_SECURE_AUTH_2026';
  const computeHash = (val) => crypto.createHash('sha256').update(String(val || '').trim() + salt).digest('hex');

  const adminUser = (env.VITE_ADMIN_USERNAME || 'admin').trim();
  const adminPass = (env.VITE_ADMIN_PASSWORD || 'admin123').trim();
  const userUser = (env.VITE_USER_USERNAME || 'user').trim();
  const userPass = (env.VITE_USER_PASSWORD || 'user123').trim();

  return {
    base: './',
    define: {
      __AUTH_CONFIG__: JSON.stringify({
        adminUser: adminUser,
        adminHash: computeHash(adminPass),
        userUser: userUser,
        userHash: computeHash(userPass),
        salt: salt
      })
    },
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
  };
})


