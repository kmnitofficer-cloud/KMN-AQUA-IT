import React, { useState, useEffect } from 'react';
import { 
  X, Database, Download, Upload, Shield, RefreshCw, 
  CheckCircle2, Cloud, CloudUpload, CloudDownload, 
  AlertCircle, ExternalLink, HelpCircle, Check, Trash2
} from 'lucide-react';
import { dbRepository } from '../../services/dbRepository';
import { googleDriveService } from '../../services/googleDriveService';

export default function DatabaseSyncModal({ isOpen, onClose }) {
  const [backups, setBackups] = useState([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  
  // Google Drive state
  const [driveUrl, setDriveUrl] = useState(() => googleDriveService.getScriptUrl());
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveStatus, setDriveStatus] = useState(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  const db = dbRepository.getDB();
  const storageSource = dbRepository.getStorageSource();

  const loadBackups = async () => {
    // Backups managed on server
    setBackups([]);
  };

  useEffect(() => {
    if (isOpen) {
      loadBackups();
      setDriveUrl(googleDriveService.getScriptUrl());
      setDriveStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveDriveUrl = async () => {
    if (!driveUrl || !driveUrl.trim()) {
      setDriveStatus({ success: false, message: 'Please enter your Google Apps Script Web App URL first.' });
      return;
    }
    googleDriveService.setScriptUrl(driveUrl);
    setIsSyncingDrive(true);
    setDriveStatus({ success: true, message: 'Connecting directly to Google Drive...' });
    try {
      await dbRepository.refreshFromGoogleDrive();
      setDriveStatus({
        success: true,
        message: 'Google Apps Script URL saved & connected directly to Google Drive!'
      });
    } catch (err) {
      setDriveStatus({
        success: true,
        message: 'URL saved! (Ready to sync: ' + err.message + ')'
      });
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleTestDrive = async () => {
    if (!driveUrl || !driveUrl.trim()) {
      setDriveStatus({ success: false, message: 'Please enter your Google Apps Script Web App URL first.' });
      return;
    }
    setIsTestingDrive(true);
    setDriveStatus(null);
    try {
      googleDriveService.setScriptUrl(driveUrl);
      const res = await googleDriveService.testConnection(driveUrl);
      if (res.success) {
        // Direct connect: immediately activate Google Drive and refresh live data into app
        try {
          await dbRepository.refreshFromGoogleDrive();
          setDriveStatus({
            success: true,
            message: `Connected directly to Google Drive! Live database loaded from: "${res.spreadsheetName || 'Active'}"`
          });
        } catch (syncErr) {
          setDriveStatus({
            success: true,
            message: `Connected successfully to "${res.spreadsheetName || 'Active'}"! Tip: Click "Push Current Data" below to seed empty tables.`
          });
        }
      } else {
        setDriveStatus({
          success: false,
          message: res.error || 'Connection failed. Verify Web App is deployed with "Anyone" access.'
        });
      }
    } catch (err) {
      setDriveStatus({ success: false, message: err.message });
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handlePushToDrive = async () => {
    if (!confirm('This will upload all current assets, users, repairs, printers, and invoices to your Google Drive spreadsheet. Proceed?')) {
      return;
    }
    setIsSyncingDrive(true);
    setDriveStatus(null);
    try {
      googleDriveService.setScriptUrl(driveUrl);
      await dbRepository.pushToGoogleDrive();
      setDriveStatus({
        success: true,
        message: 'All relational tables successfully pushed to Google Drive!'
      });
      alert('Success! All database tables are now safely stored in your Google Drive spreadsheet.');
    } catch (err) {
      setDriveStatus({ success: false, message: 'Failed to push to Google Drive: ' + err.message });
      alert('Failed: ' + err.message);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handlePullFromDrive = async () => {
    setIsSyncingDrive(true);
    setDriveStatus(null);
    try {
      googleDriveService.setScriptUrl(driveUrl);
      await dbRepository.refreshFromGoogleDrive();
      setDriveStatus({
        success: true,
        message: 'Database refreshed with latest data from Google Drive!'
      });
      alert('Success! Dashboard updated with latest data from Google Drive.');
    } catch (err) {
      setDriveStatus({ success: false, message: 'Failed to pull from Google Drive: ' + err.message });
      alert('Failed: ' + err.message);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleClearDrive = () => {
    if (confirm('Disconnect Google Drive? The app will revert to local server/cache.')) {
      googleDriveService.setScriptUrl('');
      setDriveUrl('');
      setDriveStatus({ success: true, message: 'Disconnected from Google Drive.' });
    }
  };

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
      await dbRepository.refresh();
      alert('Database synced with Streamlit cloud database!');
    } catch (err) {
      alert('Sync failed: ' + err.message);
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
      <div className="form-modal-container max-w-3xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-primary" />
            <h2>Relational Database & Cloud Sync Hub</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-modal-body">
          {/* Active Mode Status Banner */}
          <div className="db-status-box mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald" />
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <span>Database Engine Active</span>
                  <span className={`badge text-xs ${storageSource === 'google_drive' ? 'badge-primary' : 'badge-success'}`}>
                    {storageSource === 'google_drive' ? 'Google Drive Cloud' : (storageSource === 'local_disk' ? 'Local Excel File' : 'Local Browser Cache')}
                  </span>
                </h4>
                <p className="text-xs text-muted">
                  {storageSource === 'google_drive' 
                    ? `Connected to Google Drive: "${dbRepository.spreadsheetName || 'IT_Asset_Database'}"`
                    : 'Storage target: database/IT_Asset_Database.xlsx • Auto-backup enabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm" onClick={handleDownloadXlsx} title="Download database as Excel spreadsheet">
                <Download size={14} /> Export (.xlsx)
              </button>
              {storageSource === 'local_disk' && (
                <button className="btn btn-outline btn-sm text-primary" onClick={handleReloadFromDisk} disabled={isReloading} title="Force reload from Excel workbook on disk">
                  <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} /> {isReloading ? 'Reloading...' : 'Reload Excel'}
                </button>
              )}
            </div>
          </div>

          {/* GOOGLE DRIVE & GITHUB PAGES INTEGRATION CARD */}
          <div className="p-4 mb-6 rounded-lg border border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud size={20} className="text-primary" />
                <h3 className="font-semibold text-base">Google Drive Cloud Database (GitHub Pages Mode)</h3>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-xs text-muted hover:text-white flex items-center gap-1"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
              >
                <HelpCircle size={14} />
                <span>{showSetupGuide ? 'Hide Instructions' : 'How to Setup'}</span>
              </button>
            </div>

            <p className="text-xs text-muted mb-3">
              Connect this app to your Google Drive to store all <strong>19 database tables</strong> in a Google Spreadsheet and all <strong>uploaded bill PDFs</strong> in a Drive folder. Works 100% on GitHub Pages with zero server costs!
            </p>

            {/* Quick Setup Guide Drawer */}
            {showSetupGuide && (
              <div className="mb-4 p-3 bg-surface-elevated rounded border border-border-subtle text-xs space-y-2">
                <p className="font-semibold text-primary">3-Minute Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted">
                  <li>In Google Drive, create a Google Spreadsheet named <code>IT_Asset_Database</code>.</li>
                  <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Copy and paste the code from <code>google-apps-script/Code.gs</code> in this repository.</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>, select <strong>Web app</strong>, set <em>Who has access</em> to <strong>Anyone</strong>, and Deploy.</li>
                  <li>Copy your Web App URL (starts with <code>https://script.google.com/macros/s/...</code>) and paste it below.</li>
                </ol>
              </div>
            )}

            {/* URL Input */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="url"
                className="form-input flex-1 font-mono text-xs"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
              />
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={handleSaveDriveUrl}
                title="Save URL"
              >
                <Check size={14} /> Save
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleTestDrive}
                disabled={isTestingDrive}
              >
                {isTestingDrive ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                <span>{isTestingDrive ? 'Testing...' : 'Test Connection'}</span>
              </button>
              {driveUrl && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-rose"
                  onClick={handleClearDrive}
                  title="Disconnect Google Drive"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Drive Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
              <button
                type="button"
                className="btn btn-outline btn-sm text-primary"
                onClick={handlePullFromDrive}
                disabled={isSyncingDrive || !driveUrl}
                title="Pull latest database records from Google Drive"
              >
                <CloudDownload size={14} />
                <span>Pull from Google Drive</span>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm text-emerald hover:bg-emerald/10"
                onClick={handlePushToDrive}
                disabled={isSyncingDrive || !driveUrl}
                title="Push all current data to Google Drive (Initial Seed / Backup)"
              >
                <CloudUpload size={14} />
                <span>Push Current Data to Google Drive</span>
              </button>
            </div>

            {/* Status Message */}
            {driveStatus && (
              <div className={`mt-3 p-2 rounded text-xs flex items-center gap-2 ${driveStatus.success ? 'bg-emerald/10 text-emerald border border-emerald/20' : 'bg-rose/10 text-rose border border-rose/20'}`}>
                {driveStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{driveStatus.message}</span>
              </div>
            )}
          </div>

          {/* Import Upload & Manual Backup */}
          <div className="import-action-card mb-6">
            <div>
              <span className="font-semibold text-sm">Import / Restore Local Excel Workbook</span>
              <p className="text-xs text-muted">Load a multi-sheet relational workbook (.xlsx) directly into the system</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="excel-import-file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
              />
              <label htmlFor="excel-import-file" className="btn btn-outline btn-sm cursor-pointer">
                <Upload size={14} /> Import File
              </label>
              {storageSource === 'local_disk' && (
                <button className="btn btn-outline btn-sm" onClick={handleManualBackup} disabled={isBackingUp}>
                  <Shield size={14} /> {isBackingUp ? 'Backing up...' : 'Snapshot'}
                </button>
              )}
            </div>
          </div>

          {/* Tables Overview */}
          <div className="section-title mb-3">
            <h3>Relational Tables ({tableSummary.length} Total)</h3>
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
