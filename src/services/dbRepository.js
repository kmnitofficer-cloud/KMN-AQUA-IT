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

          // Listen for real-time Excel file modifications on disk via Vite websocket
          if (typeof window !== 'undefined' && import.meta.hot) {
            import.meta.hot.on('excel-database-disk-update', async () => {
              console.log('[dbRepository] External Excel update detected on disk! Refreshing database...');
              await this.refreshFromDisk();
            });
          }

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
      let rawRecords = Array.isArray(db[table]) ? db[table] : [];
      if ((!rawRecords || rawRecords.length === 0) && relationalDatabaseSeed[table]?.length > 0) {
        rawRecords = relationalDatabaseSeed[table];
      }
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

    // Relational Cross-Sync: Keep Printers table and Assets table 100% unified
    if (Array.isArray(normalized.Printers) && Array.isArray(normalized.Assets)) {
      normalized.Printers.forEach(prn => {
        const astIndex = normalized.Assets.findIndex(a => a.AssetID === prn.AssetID);
        if (astIndex !== -1) {
          const ast = normalized.Assets[astIndex];
          const printerName = String(prn.PrinterName || '').trim();
          const assetFullName = `${ast.Brand || ''} ${ast.Model || ''}`.trim();

          // If user updated PrinterName in Printers sheet, sync into Assets Brand and Model
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

    // Normalize 1F AC Units to exact assigned numbers and locations
    if (Array.isArray(normalized.ACUnits)) {
      const ac1FMap = {
        'AC-0008': { UnitNumber: '08', UnitCode: '1F-AC-08', RoomName: "Nadun's Office (Executive Cabin)", WallPosition: "East Wall (Nadun's Office)", CoordX: 800, CoordY: 412, Status: 'Active' },
        'AC-0009': { UnitNumber: '09', UnitCode: '1F-AC-09', RoomName: '1st Floor Main Hall (East Wall)', WallPosition: 'East Wall (Main Hall)', CoordX: 830, CoordY: 506, Status: 'Active' },
        'AC-0010': { UnitNumber: '10', UnitCode: '1F-AC-10', RoomName: 'Main Auditorium (East)', WallPosition: 'South Wall (East Section)', CoordX: 390, CoordY: 546, Status: 'Active' },
        'AC-0011': { UnitNumber: '11', UnitCode: '1F-AC-11', RoomName: 'Main Auditorium (Center)', WallPosition: 'South Wall (Center Section)', CoordX: 300, CoordY: 546, Status: 'Active' },
        'AC-0012': { UnitNumber: '12', UnitCode: '1F-AC-12', RoomName: 'Main Auditorium (West)', WallPosition: 'South Wall (West Section)', CoordX: 210, CoordY: 546, Status: 'Active' },
        'AC-0013': { UnitNumber: '13', UnitCode: '1F-AC-13', RoomName: 'Middle Connector', WallPosition: 'East Wall (Middle Connector)', CoordX: 740, CoordY: 315, Status: 'Active' },
        'AC-0014': { UnitNumber: '14', UnitCode: '1F-AC-14', RoomName: 'Main Conference Room', WallPosition: 'East Partition Wall', CoordX: 730, CoordY: 210, Status: 'Active' },
        'AC-0015': { UnitNumber: '15', UnitCode: '1F-AC-15', RoomName: '1st Floor Main Hall (Old South Wall - Removed)', WallPosition: 'South Wall', CoordX: 0, CoordY: 0, Status: 'Decommissioned' },
        'AC-0016': { UnitNumber: '16', UnitCode: '1F-AC-16', RoomName: '1st Floor Main Hall (Old South Wall - Removed)', WallPosition: 'South Wall', CoordX: 0, CoordY: 0, Status: 'Decommissioned' }
      };

      normalized.ACUnits = normalized.ACUnits.map(unit => {
        if (unit && unit.UnitID && ac1FMap[unit.UnitID]) {
          return {
            ...unit,
            ...ac1FMap[unit.UnitID]
          };
        }
        return unit;
      });
    }

    return normalized;
  }

  async refreshFromDisk() {
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.database = this.validateAndNormalize(json.data);
          this.isServerConnected = true;
          this.saveToLocalCache();
          this.notify();
          console.log('[dbRepository] Successfully re-synced from Excel file on disk!');
          return this.database;
        }
      }
    } catch (err) {
      console.warn('[dbRepository] Could not refresh database from disk:', err.message);
    }
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
