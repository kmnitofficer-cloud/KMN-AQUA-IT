/**
 * ============================================================================
 * GOOGLE DRIVE CLOUD DATABASE CONFIGURATION
 * ============================================================================
 * Define direct connection parameters for Google Apps Script Web App.
 */

export const DRIVE_CONFIG = {
  DEFAULT_SCRIPT_URL: '',

  // Preferred mode: 'google_drive' connects directly to cloud database
  DEFAULT_STORAGE_MODE: 'google_drive',

  // Automatically seed the Google Sheet with database tables if it is newly created or empty
  AUTO_SEED_EMPTY_DRIVE: true,

  // Google Drive Dedicated Invoices Vault Folder
  INVOICES_FOLDER_ID: '1vgrHwewH0tTGwG0NMLzHRQioazXiAamD',
  INVOICES_FOLDER_URL: 'https://drive.google.com/drive/folders/1vgrHwewH0tTGwG0NMLzHRQioazXiAamD?usp=sharing'
};

/**
 * Permanent mapping of all verified invoice documents in Google Drive
 */
export const KNOWN_INVOICE_MAP = {
  '10.09.2026..pdf': { driveId: '1srgIhv2T0P-4gDAtX5U54To3WCE5mgrr', invoiceId: 'INV-0002', number: '10_09_2026_' },
  '05.09.2026..pdf': { driveId: '18EDDtd6dilwD7VAH8bPp5eKClkeYNqLq', invoiceId: 'INV-0001', number: '05_09_2026_' },
  '07.09.2026..pdf': { driveId: '16DpZMitoOtCj4Z1GESGrX5fYBibDg1GW', invoiceId: 'INV-0003', number: '07_09_2026_' },
  '01.07.2026..pdf': { driveId: '1ZlYfZw8rS6UeG7tawyi1iXaVqP45sZ65', invoiceId: 'INV-0004', number: '01.07.2026.' },
  '14.08.2026..pdf': { driveId: '1HwtxsFNsC9Mylrin8fHvCYQ3aaKAT7YC', invoiceId: 'INV-0005', number: '14.08.2026.' },
  '23.07.2026..pdf': { driveId: '1sYoqSMyvUDhH42Btf66Ud5jMVobnV3EE', invoiceId: 'INV-0006', number: '23_07_2026_' },
  '17.09.26.pdf':   { driveId: '1Ne2obrQs0CNG-EJJ2Irwtdey0lH8anmv', invoiceId: 'INV-0007', number: 'kmn_aqua' },
  '04.08.2026..pdf': { driveId: '1UyHbLW6jLKEAXDmG7BnB_ePCw45vEUxn', invoiceId: 'INV-0008', number: '04_08_2026_' },
  '09.09.2026..pdf': { driveId: '1HdqtgQJCcyCvC66_xLP7dN8iHJHbrTx-', invoiceId: 'INV-0009', number: '09.09.2026.' },
  'DI61042.pdf':     { driveId: '17Ra4QDpylu3rYk8TR5IEQhP3NeY21urG', invoiceId: 'INV-0010', number: 'DI61042' },
  'DI61077.pdf':     { driveId: '1dNcxN2ulMibN2iSU5SnA9C04DJNPq3VF', invoiceId: 'INV-0011', number: 'DI61077' }
};
