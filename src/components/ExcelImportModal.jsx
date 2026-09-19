import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { parseExcelImport } from '../utils/excelHelper';

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  showToast
}) {
  const [file, setFile] = useState(null);
  const [parsedItems, setParsedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState('append'); // 'append' or 'replace'

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setError('');

    try {
      const items = await parseExcelImport(selectedFile);
      if (items.length === 0) {
        setError('No machine records could be found in this spreadsheet. Check column headers.');
      } else {
        setParsedItems(items);
      }
    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;
    onImportSuccess(parsedItems, importMode);
    showToast(`Successfully imported ${parsedItems.length} machines!`, 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Upload size={18} color="var(--brand-primary)" />
            <span>Import Machines from Excel Spreadsheet</span>
          </h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* File input box */}
          <div style={{
            border: '2px dashed var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            marginBottom: '1.25rem'
          }}
          onClick={() => document.getElementById('excel-file-input').click()}
          >
            <input
              id="excel-file-input"
              type="file"
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <FileSpreadsheet size={42} style={{ color: 'var(--brand-primary)', margin: '0 auto 0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {file ? file.name : 'Click to select Excel file (.xlsx, .xls, .csv)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Compatible with your company machine list formats
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
              Parsing spreadsheet rows...
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--accent-rose-bg)',
              color: 'var(--accent-rose)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedItems.length > 0 && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem'
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Preview: {parsedItems.length} records detected
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <label>
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                    />{' '}
                    Append to existing
                  </label>
                  <label style={{ marginLeft: '0.5rem' }}>
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                    />{' '}
                    Replace all existing
                  </label>
                </div>
              </div>

              <div className="table-container" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                <table className="excel-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Verified No</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 8).map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.verified_no || '—'}</td>
                        <td style={{ fontWeight: 600 }}>{item.item_name}</td>
                        <td>{item.category}</td>
                        <td>{item.assigned_to}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedItems.length > 8 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>
                  ...and {parsedItems.length - 8} more rows
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmImport}
            disabled={parsedItems.length === 0}
          >
            <Check size={15} />
            <span>Import {parsedItems.length} Computers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
