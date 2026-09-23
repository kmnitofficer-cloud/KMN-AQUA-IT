import React, { useState, useEffect } from 'react';
import { X, Database, Download, Upload, Shield, RefreshCw, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { dbRepository } from '../../services/dbRepository';

export default function DatabaseSyncModal({ isOpen, onClose }) {
  const [backups, setBackups] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ success: true, message: 'Connected to local Excel database' });

  const db = dbRepository.getDB();

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/database/backups');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setBackups(json.backups || []);
      }
    } catch (e) {
      console.warn('Could not list backups:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const [isReloading, setIsReloading] = useState(false);

  const handleReloadFromDisk = async () => {
    setIsReloading(true);
    try {
      await dbRepository.refreshFromDisk();
      alert('Relational Excel database successfully reloaded from database/IT_Asset_Database.xlsx!');
    } catch (err) {
      alert('Failed to reload database from disk: ' + err.message);
    } finally {
      setIsReloading(false);
    }
  };

  const handleDownloadXlsx = () => {
    dbRepository.exportToExcelFile(null, `IT_Asset_Database_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch('/api/database/backup', { method: 'POST' });
      if (res.ok) {
        alert('Manual backup snapshot created successfully in backups/ folder!');
        loadBackups();
      }
    } catch (err) {
      alert('Backup failed: ' + err.message);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!confirm('Importing will update the relational tables with the data from this Excel workbook. Do you wish to continue?')) {
      return;
    }

    try {
      await dbRepository.importFromExcelFile(file);
      alert('Relational Excel database successfully imported and refreshed!');
      onClose();
    } catch (err) {
      alert('Failed to parse and import Excel file: ' + err.message);
    }
  };

  const tableSummary = [
    { name: 'Users', count: (db.Users || []).length, desc: 'Employees, technicians & vacant desks' },
    { name: 'Assets', count: (db.Assets || []).length, desc: 'Hardware computers, monitors & devices' },
    { name: 'AssetComponents', count: (db.AssetComponents || []).length, desc: 'Desktop PC bundle hierarchies' },
    { name: 'Assignments', count: (db.Assignments || []).length, desc: 'Complete historical custody chain' },
    { name: 'Printers', count: (db.Printers || []).length, desc: 'Network printers & IP addresses' },
    { name: 'Consumables', count: (db.Consumables || []).length, desc: 'Toner & ink cartridge replacements' },
    { name: 'Repairs', count: (db.Repairs || []).length, desc: 'Maintenance & service history' },
    { name: 'Parts', count: (db.Parts || []).length, desc: 'Old vs new hardware upgrades' },
    { name: 'Expenses', count: (db.Expenses || []).length, desc: 'Traceable financial expenditures' },
    { name: 'Invoices', count: (db.Invoices || []).length, desc: 'Verified bill & invoice records' },
    { name: 'Locations', count: (db.Locations || []).length, desc: 'Branch offices & storage rooms' },
    { name: 'Departments', count: (db.Departments || []).length, desc: 'Organizational divisions' },
    { name: 'Suppliers', count: (db.Suppliers || []).length, desc: 'Hardware & service vendors' },
    { name: 'LegacyRawImport', count: (db.LegacyRawImport || []).length, desc: 'Preserved untouched legacy data' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <h2>Excel Relational Database Hub & Backups</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-modal-body">
          {/* Status Banner */}
          <div className="db-status-box mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald" />
              <div>
                <h4 className="font-semibold">Relational Database Engine Active</h4>
                <p className="text-xs text-muted">
                  Storage target: <strong>database/IT_Asset_Database.xlsx</strong> • Auto-backup enabled
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm text-cyan hover:bg-cyan/10" onClick={handleReloadFromDisk} disabled={isReloading} title="Force reload from Excel workbook on disk">
                <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} /> {isReloading ? 'Reloading...' : 'Reload from Excel'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={handleManualBackup} disabled={isBackingUp}>
                <Shield size={14} /> {isBackingUp ? 'Backing up...' : 'Create Snapshot'}
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleDownloadXlsx}>
                <Download size={14} /> Download (.xlsx)
              </button>
            </div>
          </div>

          {/* Import Upload */}
          <div className="import-action-card mb-6">
            <div>
              <span className="font-semibold text-sm">Import / Sync External Excel Database</span>
              <p className="text-xs text-muted">Load a multi-sheet relational workbook (.xlsx) directly into the system</p>
            </div>
            <div>
              <input
                type="file"
                id="excel-import-file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
              />
              <label htmlFor="excel-import-file" className="btn btn-outline btn-sm cursor-pointer">
                <Upload size={14} /> Upload & Replace DB
              </label>
            </div>
          </div>

          {/* Tables Overview */}
          <div className="section-title mb-3">
            <h3>Relational Tables in IT_Asset_Database.xlsx</h3>
          </div>
          <div className="db-tables-grid">
            {tableSummary.map(t => (
              <div key={t.name} className="db-table-pill">
                <div>
                  <span className="db-table-name">{t.name}</span>
                  <span className="db-table-desc">{t.desc}</span>
                </div>
                <span className="db-table-count">{t.count} rows</span>
              </div>
            ))}
          </div>

          {/* Backups List */}
          {backups.length > 0 && (
            <div className="mt-6">
              <div className="section-title mb-2">
                <h3>Automated Snapshots in backups/</h3>
              </div>
              <div className="backups-list">
                {backups.slice(0, 5).map(b => (
                  <div key={b.filename} className="backup-item">
                    <span className="font-mono text-xs">{b.filename}</span>
                    <span className="text-muted text-xs">{Math.round(b.sizeBytes / 1024)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Close Hub</button>
        </div>
      </div>
    </div>
  );
}
