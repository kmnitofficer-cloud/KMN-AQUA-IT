import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { excelDatabasePlugin } from './server/excelDatabasePlugin.js'
import crypto from 'node:crypto'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const salt = 'KMN_AQUA_SECURE_AUTH_2026';
  const computeHash = (val) => crypto.createHash('sha256').update(String(val || '').trim() + salt).digest('hex');

  const stripParens = (str) => String(str || '').trim().replace(/^\((.*)\)$/, '$1').trim();

  const adminUser = (env.VITE_ADMIN_USERNAME || 'admin').trim();
  const rawAdminPass = (env.VITE_ADMIN_PASSWORD || 'admin123').trim();
  const cleanAdminPass = stripParens(rawAdminPass);

  const userUser = (env.VITE_USER_USERNAME || 'user').trim();
  const rawUserPass = (env.VITE_USER_PASSWORD || 'user123').trim();
  const cleanUserPass = stripParens(rawUserPass);

  return {
    base: './',
    define: {
      __AUTH_CONFIG__: JSON.stringify({
        adminUser: adminUser,
        adminHash: computeHash(cleanAdminPass),
        adminAltHash: computeHash(rawAdminPass),
        userUser: userUser,
        userHash: computeHash(cleanUserPass),
        userAltHash: computeHash(rawUserPass),
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


