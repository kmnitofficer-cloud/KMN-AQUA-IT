/**
 * ============================================================================
 * GOOGLE DRIVE CLOUD DATABASE CONFIGURATION
 * ============================================================================
 * Define direct connection parameters for Google Apps Script Web App.
 */

export const DRIVE_CONFIG = {
  // Pre-configured Google Apps Script Web App URL fallback (if not set in .env or localStorage)
  // You can paste your URL directly here or into the .env file as VITE_GOOGLE_APPS_SCRIPT_URL
  DEFAULT_SCRIPT_URL: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',

  // Preferred mode: 'google_drive' connects directly to cloud database
  DEFAULT_STORAGE_MODE: 'google_drive',

  // Automatically seed the Google Sheet with database tables if it is newly created or empty
  AUTO_SEED_EMPTY_DRIVE: true
};
