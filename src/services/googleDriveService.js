/**
 * ============================================================================
 * GOOGLE DRIVE & GOOGLE APPS SCRIPT BRIDGE SERVICE
 * ============================================================================
 * All Google Drive file uploads and Google Sheets database operations are
 * routed securely through Streamlit's Python backend. The browser never calls
 * Google Apps Script directly.
 */

import { streamlitBridge } from '../lib/streamlitBridge';

export const googleDriveService = {
  getScriptUrl() {
    return 'Managed by Streamlit Backend (Python cloud_db)';
  },

  setScriptUrl(_url) {
    // No-op: Managed by Streamlit backend
  },

  isConfigured() {
    return true;
  },

  async testConnection() {
    try {
      const res = await streamlitBridge.callAction('refresh');
      return { success: true, message: 'Connected to Google Drive via Streamlit backend', data: res };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async fetchDatabase() {
    try {
      await streamlitBridge.callAction('refresh');
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to refresh database: ${err.message}`);
    }
  },

  async saveDatabase(database) {
    try {
      for (const [table, records] of Object.entries(database || {})) {
        if (Array.isArray(records)) {
          await streamlitBridge.callAction('update_table', {
            table,
            records
          });
        }
      }
      return { success: true };
    } catch (err) {
      throw new Error(`Failed to save database: ${err.message}`);
    }
  },

  async updateTable(tableName, records) {
    try {
      return await streamlitBridge.callAction('update_table', {
        table: tableName,
        records
      });
    } catch (err) {
      throw new Error(`Failed to update table ${tableName}: ${err.message}`);
    }
  },

  async uploadInvoice(file, invoiceData = {}) {
    const base64Data = await this.readFileAsBase64(file);
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_') : `Invoice_${Date.now()}.pdf`;

    try {
      const res = await streamlitBridge.callAction('upload_file', {
        filename: safeName,
        base64Data,
        mimeType: file.type || 'application/pdf',
        invoiceData
      });

      const data = res?.data || {};
      return {
        success: true,
        fileUrl: data.fileUrl || data.previewUrl || '',
        driveUrl: data.driveUrl || '',
        downloadUrl: data.downloadUrl || '',
        invoice: data.invoice || {
          FileName: safeName,
          DriveFileID: data.fileId || '',
          ...invoiceData
        }
      };
    } catch (err) {
      console.error('[googleDriveService] Upload failed via Streamlit:', err);
      throw err;
    }
  },

  async syncInvoicesFolder() {
    try {
      return await streamlitBridge.callAction('refresh');
    } catch (err) {
      throw new Error(`Failed to sync invoices folder: ${err.message}`);
    }
  },

  readFileAsBase64(file) {
    return streamlitBridge.fileToBase64(file);
  }
};
