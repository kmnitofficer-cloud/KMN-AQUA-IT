/**
 * ============================================================================
 * GOOGLE DRIVE & GOOGLE APPS SCRIPT CLIENT SERVICE
 * ============================================================================
 * Connects the static React application (hosted on GitHub Pages) directly to
 * Google Drive and Google Sheets via the Google Apps Script Web App API.
 */

import { DRIVE_CONFIG } from '../config/driveConfig';

const STORAGE_KEY_URL = 'kmn_google_script_url';

export const googleDriveService = {
  /**
   * Retrieves the configured Google Apps Script Web App URL
   */
  getScriptUrl() {
    const stored = localStorage.getItem(STORAGE_KEY_URL);
    if (stored && stored.trim()) return stored.trim();
    if (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL && import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL.trim()) {
      return import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL.trim();
    }
    return (DRIVE_CONFIG.DEFAULT_SCRIPT_URL || '').trim();
  },

  /**
   * Saves or clears the Google Apps Script Web App URL
   */
  setScriptUrl(url) {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
    }
  },

  /**
   * Checks whether Google Drive integration is configured
   */
  isConfigured() {
    return Boolean(this.getScriptUrl());
  },

  /**
   * Tests the connection to the Google Apps Script Web App
   */
  async testConnection(customUrl = null) {
    const url = customUrl || this.getScriptUrl();
    if (!url) {
      return { success: false, error: 'No Google Apps Script Web App URL provided.' };
    }

    try {
      // Test using GET action=test
      const testUrl = new URL(url);
      testUrl.searchParams.set('action', 'test');
      testUrl.searchParams.set('_t', Date.now().toString());

      const res = await fetch(testUrl.toString(), {
        method: 'GET',
        redirect: 'follow'
      });

      if (!res.ok) {
        return { success: false, error: `HTTP Error ${res.status}: ${res.statusText}` };
      }

      const json = await res.json();
      return json;
    } catch (err) {
      return {
        success: false,
        error: `Could not connect to Google Apps Script: ${err.message}. Make sure the Web App is deployed with "Who has access: Anyone".`
      };
    }
  },

  /**
   * Fetches the entire multi-table relational database from Google Sheets
   */
  async fetchDatabase() {
    const url = this.getScriptUrl();
    if (!url) throw new Error('Google Apps Script URL is not configured.');

    const fetchUrl = new URL(url);
    fetchUrl.searchParams.set('action', 'getDatabase');
    fetchUrl.searchParams.set('_t', Date.now().toString());

    const res = await fetch(fetchUrl.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch database: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to read database from Google Drive.');
    }

    return json;
  },

  /**
   * Persists the complete relational database to Google Sheets
   * NOTE: We send body as text/plain so Google Apps Script doesn't reject CORS preflight OPTIONS!
   */
  async saveDatabase(database) {
    const url = this.getScriptUrl();
    if (!url) throw new Error('Google Apps Script URL is not configured.');

    const payload = {
      action: 'saveDatabase',
      database
    };

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to save database to Google Drive: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to save database in Google Drive.');
    }

    return json;
  },

  /**
   * Updates a single sheet tab in Google Sheets
   */
  async updateTable(tableName, records) {
    const url = this.getScriptUrl();
    if (!url) throw new Error('Google Apps Script URL is not configured.');

    const payload = {
      action: 'updateTable',
      tableName,
      records
    };

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to update table ${tableName}: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || `Failed to update table ${tableName}`);
    }

    return json;
  },

  /**
   * Uploads a Bill / Invoice PDF to Google Drive's IT_System_Invoices folder
   */
  async uploadInvoice(file, invoiceData = {}) {
    const url = this.getScriptUrl();
    if (!url) throw new Error('Google Apps Script URL is not configured.');

    const base64Data = await this.readFileAsBase64(file);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const payload = {
      action: 'uploadInvoice',
      filename: safeName,
      base64Data,
      invoiceData,
      folderId: DRIVE_CONFIG.INVOICES_FOLDER_ID
    };

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to upload invoice to Google Drive: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to upload invoice to Google Drive.');
    }

    return json;
  },

  /**
   * Synchronizes all PDF invoices in Google Drive folder with the Invoices sheet
   */
  async syncInvoicesFolder() {
    const url = this.getScriptUrl();
    if (!url) throw new Error('Google Apps Script URL is not configured.');

    const payload = {
      action: 'syncFolderFiles',
      folderId: DRIVE_CONFIG.INVOICES_FOLDER_ID
    };

    const res = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Failed to sync invoices folder: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Failed to sync invoices folder.');
    }

    return json;
  },

  /**
   * Helper: Read file as Base64 Data URL
   */
  readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
