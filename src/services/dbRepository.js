import { relationalDatabaseSeed } from '../data/relationalDatabaseSeed';
import { parseExcelDate } from '../utils/dateUtils';
import { streamlitBridge } from '../lib/streamlitBridge';
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'kmn_relational_excel_db';
const TABLE_NAMES = [
  'Users',
  'Departments',
  'Locations',
  'Assets',
  'AssetComponents',
  'Assignments',
  'Printers',
  'Consumables',
  'Repairs',
  'Parts',
  'Expenses',
  'Invoices',
  'Suppliers',
  'CCTVBills',
  'ACUnits',
  'ACServices',
  'ACRepairs',
  'ACReplacements',
  'LegacyRawImport'
];

class DBRepository {
  constructor() {
    this.database = null;
    this.listeners = new Set();
    this.isServerConnected = false;
    this.isSaving = false;
    this.lastSaved = null;
    this.storageSource = 'streamlit_python';
    this.spreadsheetName = 'Google Drive Cloud Sheets';
    this.lastResult = null;
    this.pendingActionsCount = 0;
    this.initialized = false;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    if (this._notifyScheduled) return;
    this._notifyScheduled = true;
    queueMicrotask(() => {
      this._notifyScheduled = false;
      for (const cb of this.listeners) {
        try {
          cb(this.database);
        } catch (e) {
          console.error('[dbRepository] Error notifying DB listener:', e);
        }
      }
    });
  }

  /**
   * Initializes data layer with Streamlit Two-Way Bridge.
   * Reads come directly from the tables object passed by Python.
   */
  async init() {
    if (this.initialized) return this.database;
    this.initialized = true;

    // Listen to Streamlit render events
    streamlitBridge.onData((args) => {
      if (args && args.tables && typeof args.tables === 'object') {
        const hasData = Object.values(args.tables).some(arr => Array.isArray(arr) && arr.length > 0);
        if (hasData) {
          this.database = this.validateAndNormalize(args.tables);
          this.isServerConnected = true;
          this.storageSource = 'streamlit_python';
          this.saveToLocalCache();
          this.notify();
        }
      }

      if (args && args.last_result) {
        this.lastResult = args.last_result;
        this.notify();
      }
    });

    // Fallback to local cache if waiting for first Streamlit render
    if (!this.database) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          this.database = this.validateAndNormalize(JSON.parse(cached));
          this.notify();
        }
      } catch (e) {
        console.warn('[dbRepository] Could not parse local cache:', e);
      }
    }

    if (!this.database) {
      this.database = this.validateAndNormalize(relationalDatabaseSeed);
      this.notify();
    }

    return this.database;
  }

  saveToLocalCache() {
    if (!this.database) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
    } catch (e) {
      // Storage quota or private mode
    }
  }

  getDB() {
    if (!this.database) {
      this.database = this.validateAndNormalize(relationalDatabaseSeed);
    }
    return this.database;
  }

  getTable(tableName) {
    const db = this.getDB();
    return db[tableName] || [];
  }

  /**
   * Updates an entire table through Streamlit's Python backend.
   * Optimistically updates local state for instant UI response and sends write to Python.
   */
  async updateTable(tableName, updaterOrNewRecords) {
    const db = this.getDB();
    const current = db[tableName] || [];
    const updated = typeof updaterOrNewRecords === 'function' ? updaterOrNewRecords(current) : updaterOrNewRecords;

    db[tableName] = updated;
    this.database = db;
    this.saveToLocalCache();
    this.notify();

    try {
      this.pendingActionsCount++;
      const res = await streamlitBridge.callAction('update_table', {
        table: tableName,
        records: updated
      });
      this.lastSaved = new Date().toISOString();
      return res;
    } catch (err) {
      console.error(`[dbRepository] Failed to update table ${tableName} via Streamlit:`, err);
      throw err;
    } finally {
      this.pendingActionsCount = Math.max(0, this.pendingActionsCount - 1);
      this.notify();
    }
  }

  /**
   * Inserts or updates a single record through Streamlit's Python backend.
   */
  async saveRecord(tableName, record, idKey = 'ID') {
    const db = this.getDB();
    const records = [...(db[tableName] || [])];
    const recordId = String(record[idKey] || '').trim();

    let foundIdx = -1;
    if (recordId) {
      foundIdx = records.findIndex(r => String(r[idKey] || '').trim() === recordId);
    }

    if (foundIdx >= 0) {
      records[foundIdx] = { ...records[foundIdx], ...record };
    } else {
      records.unshift(record);
    }

    db[tableName] = records;
    this.database = db;
    this.saveToLocalCache();
    this.notify();

    try {
      this.pendingActionsCount++;
      const res = await streamlitBridge.callAction('save_record', {
        table: tableName,
        record,
        id_key: idKey
      });
      this.lastSaved = new Date().toISOString();
      return res;
    } catch (err) {
      console.error(`[dbRepository] Failed to save record in ${tableName}:`, err);
      throw err;
    } finally {
      this.pendingActionsCount = Math.max(0, this.pendingActionsCount - 1);
      this.notify();
    }
  }

  /**
   * Deletes a record through Streamlit's Python backend.
   */
  async deleteRecord(tableName, idKey, idValue) {
    const db = this.getDB();
    const records = (db[tableName] || []).filter(r => String(r[idKey] || '').trim() !== String(idValue).trim());

    db[tableName] = records;
    this.database = db;
    this.saveToLocalCache();
    this.notify();

    try {
      this.pendingActionsCount++;
      const res = await streamlitBridge.callAction('delete_record', {
        table: tableName,
        id_key: idKey,
        id_value: idValue
      });
      this.lastSaved = new Date().toISOString();
      return res;
    } catch (err) {
      console.error(`[dbRepository] Failed to delete record in ${tableName}:`, err);
      throw err;
    } finally {
      this.pendingActionsCount = Math.max(0, this.pendingActionsCount - 1);
      this.notify();
    }
  }

  /**
   * Triggers a full force-refresh from Google Sheets via Python.
   */
  async refresh() {
    try {
      this.pendingActionsCount++;
      return await streamlitBridge.callAction('refresh');
    } finally {
      this.pendingActionsCount = Math.max(0, this.pendingActionsCount - 1);
      this.notify();
    }
  }

  async setFullDatabase(newDb) {
    this.database = this.validateAndNormalize(newDb);
    this.saveToLocalCache();
    this.notify();

    // Push updated tables to Python
    for (const [table, records] of Object.entries(this.database)) {
      if (Array.isArray(records)) {
        await this.updateTable(table, records);
      }
    }
  }

  getNextId(tableName, prefix = 'AST-', idField = 'AssetID', padLength = 4) {
    const records = this.getTable(tableName);
    let maxNum = 0;
    records.forEach(r => {
      const val = String(r[idField] || '');
      const match = val.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
  }

  getStorageSource() {
    return this.storageSource;
  }

  getLastResult() {
    return this.lastResult;
  }

  isPending() {
    return this.pendingActionsCount > 0;
  }

  validateAndNormalize(db) {
    const normalized = {};
    TABLE_NAMES.forEach(table => {
      let rawRecords = db && db[table] !== undefined && db[table] !== null
        ? (Array.isArray(db[table]) ? db[table] : [])
        : (relationalDatabaseSeed[table] || []);
      normalized[table] = rawRecords.map(r => {
        if (!r || typeof r !== 'object') return r;
        const copy = { ...r };
        for (const k of Object.keys(copy)) {
          if (k.toLowerCase().includes('date') || k === 'Date') {
            if (copy[k] !== '' && copy[k] !== null && copy[k] !== undefined) {
              copy[k] = parseExcelDate(copy[k]);
            }
          }
        }
        return copy;
      });
    });

    // Automatically cleanse any legacy 'NONE' brand/model records
    if (Array.isArray(normalized.Assets)) {
      normalized.Assets = normalized.Assets.map(a => {
        let brand = String(a.Brand || '').trim();
        let model = String(a.Model || '').trim();
        const type = String(a.AssetType || 'Device').trim();

        if (brand.toUpperCase() === 'NONE' || !brand) {
          if (type === 'UPS') brand = 'Office Standard';
          else if (type === 'Mouse' || type === 'Keyboard') brand = 'Standard';
          else brand = 'Generic';
        }

        if (model.toUpperCase() === 'NONE' || !model || model.toUpperCase() === brand.toUpperCase()) {
          if (type === 'UPS') {
            model = a.VerifiedNo ? `Office UPS Backup Unit (${a.VerifiedNo})` : 'Office UPS Backup Unit';
          } else if (type === 'Mouse') {
            model = 'Optical USB Mouse';
          } else if (type === 'Keyboard') {
            model = 'Standard Keyboard';
          } else if (type === 'Monitor') {
            model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Display Monitor`;
          } else if (type === 'Desktop' || type === 'CPU') {
            model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Desktop PC Workstation`;
          } else if (type === 'Laptop') {
            model = `${brand !== 'Generic' && brand !== 'Standard' ? brand + ' ' : ''}Business Laptop`;
          } else {
            model = `${brand !== 'Generic' ? brand + ' ' : ''}${type}`;
          }
        }

        if (brand && model.toLowerCase().startsWith(brand.toLowerCase() + ' ')) {
          model = model.slice(brand.length + 1).trim();
        }

        return {
          ...a,
          Brand: brand,
          Model: model
        };
      });
    }

    // Relational Cross-Sync: Keep Printers table and Assets table unified
    if (Array.isArray(normalized.Printers) && Array.isArray(normalized.Assets)) {
      normalized.Printers.forEach(prn => {
        const astIndex = normalized.Assets.findIndex(a => a.AssetID === prn.AssetID);
        if (astIndex !== -1) {
          const ast = normalized.Assets[astIndex];
          const printerName = String(prn.PrinterName || '').trim();
          const assetFullName = `${ast.Brand || ''} ${ast.Model || ''}`.trim();

          if (printerName && printerName !== assetFullName && printerName !== 'Printer') {
            const parts = printerName.split(' ');
            const knownBrands = ['HP', 'CANON', 'EPSON', 'BROTHER', 'SAMSUNG', 'XEROX', 'RICOH', 'DELL', 'KYOCERA', 'LEXMARK', 'PANTUM'];
            const firstWordUpper = parts[0].toUpperCase();
            let brand = 'Generic';
            let model = printerName;

            if (knownBrands.includes(firstWordUpper)) {
              brand = parts[0].toUpperCase();
              model = parts.slice(1).join(' ').trim() || 'Printer';
            } else if (parts.length > 1) {
              brand = parts[0];
              model = parts.slice(1).join(' ').trim();
            }

            normalized.Assets[astIndex] = {
              ...ast,
              Brand: brand,
              Model: model
            };
          } else if (assetFullName && assetFullName !== 'Generic Printer' && assetFullName !== 'Printer' && (!printerName || printerName === 'Printer')) {
            prn.PrinterName = assetFullName;
          }
        }
      });
    }

    return normalized;
  }

  exportToExcelFile(customDb = null, filename = 'IT_Asset_Relational_Database.xlsx') {
    const dbToExport = customDb || this.getDB();
    const wb = XLSX.utils.book_new();

    TABLE_NAMES.forEach(tableName => {
      const records = dbToExport[tableName] || [];
      const ws = XLSX.utils.json_to_sheet(records);
      XLSX.utils.book_append_sheet(wb, ws, tableName);
    });

    XLSX.writeFile(wb, filename);
  }

  async importFromExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const importedDb = {};

          TABLE_NAMES.forEach(sheetName => {
            if (wb.Sheets[sheetName]) {
              importedDb[sheetName] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
            } else {
              importedDb[sheetName] = [];
            }
          });

          await this.setFullDatabase(importedDb);
          resolve(importedDb);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}

export const dbRepository = new DBRepository();
