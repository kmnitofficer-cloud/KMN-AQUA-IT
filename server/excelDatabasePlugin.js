import fs from 'fs';
import path from 'path';
import xlsxModule from 'xlsx';
const XLSX = xlsxModule.default || xlsxModule;

const DB_PATH = path.resolve(process.cwd(), 'database/IT_Asset_Database.xlsx');
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const INVOICE_DIR = path.resolve(process.cwd(), 'public/invoices');

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

function ensureDirectories() {
  if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

function parseExcelDate(val) {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return '';
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400 * 1000;
    const dateObj = new Date(epoch.getTime() + val * msPerDay);
    return dateObj.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  if (/^\d{5}$/.test(str)) {
    const num = parseInt(str, 10);
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 86400 * 1000;
    const dateObj = new Date(epoch.getTime() + num * msPerDay);
    return dateObj.toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }
  const parts = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0];
  }
  return str;
}

function normalizeRecordDates(record) {
  if (!record || typeof record !== 'object') return record;
  const normalized = { ...record };
  for (const key of Object.keys(normalized)) {
    if (key.toLowerCase().includes('date') || key === 'Date') {
      if (normalized[key] !== '' && normalized[key] !== null && normalized[key] !== undefined) {
        normalized[key] = parseExcelDate(normalized[key]);
      }
    }
  }
  return normalized;
}

function readFullDatabase() {
  ensureDirectories();
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }
  const wb = XLSX.readFile(DB_PATH);
  const result = {};
  TABLE_NAMES.forEach(sheetName => {
    if (wb.Sheets[sheetName]) {
      const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
      result[sheetName] = rawRows.map(normalizeRecordDates);
    } else {
      result[sheetName] = [];
    }
  });
  return result;
}

function saveFullDatabase(data) {
  ensureDirectories();

  // 1. Create a timestamped backup before overwrite
  if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `IT_Asset_Database_${timestamp}.xlsx`);
    fs.copyFileSync(DB_PATH, backupPath);
  }

  // 2. Write new workbook
  const wb = XLSX.utils.book_new();
  TABLE_NAMES.forEach(sheetName => {
    const records = data[sheetName] || [];
    const ws = XLSX.utils.json_to_sheet(records);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, DB_PATH);
  return { success: true, timestamp: new Date().toISOString() };
}

export function excelDatabasePlugin() {
  return {
    name: 'excel-database-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];

        // 1. GET /api/database
        if (url === '/api/database' && req.method === 'GET') {
          try {
            const db = readFullDatabase();
            if (!db) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Database file not found' }));
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: db }));
            return;
          } catch (err) {
            console.error('[API Error] Failed to read database:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 2. POST /api/database/save
        if (url === '/api/database/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              if (!payload.database) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing database object' }));
                return;
              }
              const saveRes = saveFullDatabase(payload.database);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, ...saveRes }));
            } catch (err) {
              console.error('[API Error] Failed to save database:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // 3. POST /api/database/backup
        if (url === '/api/database/backup' && req.method === 'POST') {
          try {
            ensureDirectories();
            if (fs.existsSync(DB_PATH)) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const backupName = `IT_Asset_Database_manual_${timestamp}.xlsx`;
              const backupPath = path.join(BACKUP_DIR, backupName);
              fs.copyFileSync(DB_PATH, backupPath);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, backupName, timestamp }));
              return;
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Database does not exist yet' }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 4. GET /api/database/backups
        if (url === '/api/database/backups' && req.method === 'GET') {
          try {
            ensureDirectories();
            const files = fs.readdirSync(BACKUP_DIR)
              .filter(f => f.endsWith('.xlsx'))
              .map(f => {
                const stat = fs.statSync(path.join(BACKUP_DIR, f));
                return {
                  filename: f,
                  sizeBytes: stat.size,
                  createdAt: stat.birthtime || stat.mtime
                };
              })
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, backups: files }));
            return;
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }

        // 5. POST /api/invoices/upload
        if (url === '/api/invoices/upload' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const { filename, base64Data, invoiceData } = JSON.parse(body);
              if (!filename || !base64Data) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'filename and base64Data are required' }));
                return;
              }

              ensureDirectories();
              const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
              const filePath = path.join(INVOICE_DIR, safeName);
              const buffer = Buffer.from(base64Data.split(',').pop(), 'base64');
              fs.writeFileSync(filePath, buffer);

              // Update Invoices sheet if invoiceData was provided
              if (invoiceData) {
                const currentDb = readFullDatabase() || {};
                const invoiceList = currentDb.Invoices || [];
                const newId = `INV-${String(invoiceList.length + 1).padStart(4, '0')}`;
                const newInvoice = {
                  InvoiceID: newId,
                  InvoiceNumber: invoiceData.InvoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
                  InvoiceDate: invoiceData.InvoiceDate || new Date().toISOString().split('T')[0],
                  Supplier: invoiceData.Supplier || 'General Vendor',
                  Amount: Number(invoiceData.Amount) || 0,
                  AssetID: invoiceData.AssetID || '',
                  UserID: invoiceData.UserID || '',
                  PrinterAssetID: invoiceData.PrinterAssetID || '',
                  ExpenseID: invoiceData.ExpenseID || '',
                  FileName: safeName,
                  FilePath: `/invoices/${safeName}`,
                  FileSize: `${Math.round(buffer.length / 1024)} KB`,
                  UploadDate: new Date().toISOString().split('T')[0],
                  Description: invoiceData.Description || 'Uploaded Invoice'
                };
                invoiceList.push(newInvoice);
                currentDb.Invoices = invoiceList;
                saveFullDatabase(currentDb);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, invoice: newInvoice }));
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                filename: safeName,
                filePath: `/invoices/${safeName}`,
                sizeBytes: buffer.length
              }));
            } catch (err) {
              console.error('[API Error] Invoice upload failed:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // Pass through other requests
        next();
      });
    }
  };
}
