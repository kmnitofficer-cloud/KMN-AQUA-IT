import { relationalDatabaseSeed } from '../data/relationalDatabaseSeed';
import { parseExcelDate } from '../utils/dateUtils';
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
  'LegacyRawImport'
];

class DBRepository {
  constructor() {
    this.database = null;
    this.listeners = new Set();
    this.isServerConnected = false;
    this.isSaving = false;
    this.lastSaved = null;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    for (const cb of this.listeners) {
      try {
        cb(this.database);
      } catch (e) {
        console.error('Error notifying DB listener:', e);
      }
    }
  }

  async init() {
    // 1. Attempt to fetch from local Vite API server (Excel file directly on disk)
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.database = this.validateAndNormalize(json.data);
          this.isServerConnected = true;
          this.saveToLocalCache();
          this.notify();
          return this.database;
        }
      }
    } catch (err) {
      console.warn('Backend Excel API not reachable, falling back to local cache/seed:', err.message);
    }

    // 2. Fallback to localStorage cache
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        this.database = this.validateAndNormalize(JSON.parse(cached));
        this.notify();
        return this.database;
      }
    } catch (e) {
      console.error('Failed to read local cache:', e);
    }

    // 3. Fallback to seeded relational database
    this.database = this.validateAndNormalize(relationalDatabaseSeed);
    this.saveToLocalCache();
    this.notify();
    return this.database;
  }

  validateAndNormalize(db) {
    const normalized = {};
    TABLE_NAMES.forEach(table => {
      const rawRecords = Array.isArray(db[table]) ? db[table] : [];
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

    return normalized;
  }

  saveToLocalCache() {
    if (!this.database) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.database));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
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

  async updateTable(tableName, updaterOrNewRecords) {
    const db = this.getDB();
    const current = db[tableName] || [];
    const updated = typeof updaterOrNewRecords === 'function' ? updaterOrNewRecords(current) : updaterOrNewRecords;
    
    db[tableName] = updated;
    this.database = db;
    this.saveToLocalCache();
    this.notify();

    // Persist asynchronously to the Excel file on disk
    await this.persistToExcel();
    return updated;
  }

  async setFullDatabase(newDb) {
    this.database = this.validateAndNormalize(newDb);
    this.saveToLocalCache();
    this.notify();
    await this.persistToExcel();
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

  async persistToExcel() {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }
    this.isSaving = true;
    this.pendingSave = false;

    try {
      const res = await fetch('/api/database/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ database: this.database })
      });

      if (res.ok) {
        this.isServerConnected = true;
        this.lastSaved = new Date().toISOString();
      }
    } catch (err) {
      console.warn('Could not auto-sync to Excel on disk:', err.message);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        setTimeout(() => this.persistToExcel(), 50);
      }
    }
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
