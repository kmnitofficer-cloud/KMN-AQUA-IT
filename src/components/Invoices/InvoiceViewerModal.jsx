import React, { useState } from 'react';
import { X, FileText, Download, ExternalLink, FolderOpen, AlertCircle, Eye, Cloud } from 'lucide-react';
import { DRIVE_CONFIG, KNOWN_INVOICE_MAP } from '../../config/driveConfig';

export default function InvoiceViewerModal({ invoice, isOpen, onClose }) {
  const [viewerMode, setViewerMode] = useState('direct'); // 'direct' | 'drive'
  const [loadError, setLoadError] = useState(false);

  if (!isOpen || !invoice) return null;

  const driveFolderUrl = DRIVE_CONFIG.INVOICES_FOLDER_URL || 'https://drive.google.com/drive/folders/1vgrHwewH0tTGwG0NMLzHRQioazXiAamD?usp=sharing';

  // 1. Resolve file name
  const fileName = invoice.FileName || (invoice.InvoiceNumber ? `${invoice.InvoiceNumber}.pdf` : '');
  
  // 2. Resolve Google Drive ID
  let driveId = invoice.DriveFileID || '';
  if (!driveId && fileName && KNOWN_INVOICE_MAP[fileName]) {
    driveId = KNOWN_INVOICE_MAP[fileName].driveId;
  }
  if (!driveId && invoice.InvoiceID && KNOWN_INVOICE_MAP[invoice.InvoiceID]) {
    driveId = KNOWN_INVOICE_MAP[invoice.InvoiceID].driveId;
  }
  if (!driveId && invoice.InvoiceNumber) {
    const found = Object.values(KNOWN_INVOICE_MAP).find(m => m.number === invoice.InvoiceNumber);
    if (found) driveId = found.driveId;
  }

  // 3. Resolve URLs
  const baseUrl = import.meta.env.BASE_URL || './';
  const localPdfUrl = fileName ? `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}invoices/${fileName}` : null;
  const drivePreviewUrl = driveId ? `https://drive.google.com/file/d/${driveId}/preview` : null;
  const driveViewUrl = driveId 
    ? `https://drive.google.com/file/d/${driveId}/view?usp=drivesdk` 
    : (invoice.DriveUrl || driveFolderUrl);
  const downloadUrl = driveId 
    ? `https://drive.google.com/uc?export=download&id=${driveId}` 
    : (invoice.DownloadUrl || localPdfUrl || driveFolderUrl);

  // Active preview URL according to selected mode
  const activePreviewUrl = viewerMode === 'drive' 
    ? (drivePreviewUrl || localPdfUrl) 
    : (localPdfUrl || drivePreviewUrl);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="invoice-viewer-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="invoice-viewer-header">
          <div className="flex items-center gap-3">
            <div className="avatar-circle">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{invoice.InvoiceNumber || invoice.InvoiceID}</h3>
                {driveId && (
                  <span className="badge badge-success text-[10px] font-mono py-0.5 px-1.5 flex items-center gap-1">
                    <Cloud size={10} /> Google Drive Synced
                  </span>
                )}
              </div>
              <div className="text-xs text-muted">
                {invoice.Supplier || 'Verified Vendor'} • Rs. {Number(invoice.Amount || 0).toLocaleString()} • {invoice.InvoiceDate || 'Recent'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-subtle p-0.5 bg-surface-elevated text-xs mr-2">
              {localPdfUrl && (
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    viewerMode === 'direct' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-muted hover:text-foreground'
                  }`}
                  onClick={() => { setViewerMode('direct'); setLoadError(false); }}
                  title="View PDF directly in browser"
                >
                  <Eye size={12} /> Direct PDF
                </button>
              )}
              {drivePreviewUrl && (
                <button
                  type="button"
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-all ${
                    viewerMode === 'drive' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-muted hover:text-foreground'
                  }`}
                  onClick={() => { setViewerMode('drive'); setLoadError(false); }}
                  title="View via Google Drive Preview"
                >
                  <Cloud size={12} /> Drive Preview
                </button>
              )}
            </div>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={fileName || 'Invoice.pdf'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm"
                title="Download PDF"
              >
                <Download size={14} /> Download
              </a>
            )}

            <a
              href={driveViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              title="Open document in Google Drive"
            >
              <ExternalLink size={14} /> Open in Drive
            </a>

            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm text-cyan"
              title="Open Invoices Folder in Google Drive"
            >
              <FolderOpen size={14} /> Invoices Folder
            </a>

            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Embedded Viewer Body */}
        <div className="invoice-viewer-body" style={{ position: 'relative' }}>
          {activePreviewUrl && !loadError ? (
            <iframe
              src={activePreviewUrl}
              title={invoice.InvoiceNumber || 'Invoice Preview'}
              className="invoice-iframe"
              onError={() => setLoadError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center" style={{ minHeight: '400px', background: 'var(--surface-color, #f8fafc)' }}>
              <AlertCircle size={44} className="text-amber-500 mb-3" />
              <h4 className="font-semibold text-lg mb-1">Invoice Document Ready in Google Drive</h4>
              <p className="text-muted text-sm max-w-md mb-4">
                <strong>{fileName || invoice.InvoiceNumber}</strong> is stored securely in your Google Drive Invoices Folder. If the inline iframe is blocked by browser security or third-party cookies, click below to open directly:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {localPdfUrl && (
                  <a
                    href={localPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <Eye size={16} /> Open Local PDF Document
                  </a>
                )}
                <a
                  href={driveViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  <ExternalLink size={16} /> Open Document in Google Drive
                </a>
                <a
                  href={driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline text-cyan"
                >
                  <FolderOpen size={16} /> Open Google Drive Vault
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="invoice-viewer-footer">
          <span className="flex items-center gap-2">
            <span>File: <strong>{fileName || 'Invoice.pdf'}</strong> ({invoice.FileSize || 'Verified PDF'})</span>
            {driveId && <span className="text-xs text-muted">ID: {driveId}</span>}
          </span>
          <span className="text-muted text-xs truncate max-w-md">
            {invoice.Description || 'Verified Official Vendor Bill'}
          </span>
        </div>
      </div>
    </div>
  );
}

