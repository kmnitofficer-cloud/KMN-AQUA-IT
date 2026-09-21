import React from 'react';
import { X, FileText, Download, ExternalLink, Calendar, DollarSign, Building } from 'lucide-react';

export default function InvoiceViewerModal({ invoice, isOpen, onClose }) {
  if (!isOpen || !invoice) return null;

  const fileUrl = invoice.FilePath || `/invoices/${invoice.FileName}`;

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
              <h3>{invoice.InvoiceNumber}</h3>
              <div className="text-xs text-muted">
                {invoice.Supplier} • Rs. {Number(invoice.Amount || 0).toLocaleString()} • {invoice.InvoiceDate}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fileUrl}
              download={invoice.FileName}
              className="btn btn-outline btn-sm"
              title="Download PDF"
            >
              <Download size={14} /> Download PDF
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              title="Open in new window"
            >
              <ExternalLink size={14} /> Open
            </a>
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        {/* Embedded Viewer */}
        <div className="invoice-viewer-body">
          <iframe
            src={fileUrl}
            title={invoice.InvoiceNumber}
            className="invoice-iframe"
          />
        </div>

        {/* Footer */}
        <div className="invoice-viewer-footer">
          <span>File: <strong>{invoice.FileName}</strong> ({invoice.FileSize || 'PDF'})</span>
          <span>{invoice.Description}</span>
        </div>
      </div>
    </div>
  );
}
