/**
 * ============================================================================
 * GOOGLE DRIVE CLOUD DATABASE CONFIGURATION
 * ============================================================================
 * Define direct connection parameters for Google Apps Script Web App.
 */

export const DRIVE_CONFIG = {
  DEFAULT_SCRIPT_URL: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbw5aKkqbVd-O10MGlWimVDMtToFbAXPZ6zGtPX8aLdBXF-x3KVH-Gn07CAPp25sNmw/exec',

  // Preferred mode: 'google_drive' connects directly to cloud database
  DEFAULT_STORAGE_MODE: 'google_drive',

  // Automatically seed the Google Sheet with database tables if it is newly created or empty
  AUTO_SEED_EMPTY_DRIVE: true
};
