import React, { useState } from 'react';
import { FileText, Upload, Search, Download, Eye, ExternalLink } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { formatDisplayDate } from '../../utils/dateUtils';
import InvoiceViewerModal from './InvoiceViewerModal';
import InvoiceUploadModal from './InvoiceUploadModal';

export default function InvoicesView() {
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const invoices = invoiceService.getInvoices();

  const filteredInvoices = invoices.filter(i => {
    const q = search.toLowerCase();
    return (
      (i.InvoiceNumber && i.InvoiceNumber.toLowerCase().includes(q)) ||
      (i.Supplier && i.Supplier.toLowerCase().includes(q)) ||
      (i.Description && i.Description.toLowerCase().includes(q)) ||
      (i.AssetName && i.AssetName.toLowerCase().includes(q)) ||
      (i.UserName && i.UserName.toLowerCase().includes(q)) ||
      (i.FileName && i.FileName.toLowerCase().includes(q))
    );
  });

  const totalInvoiced = filteredInvoices.reduce((sum, i) => sum + (Number(i.Amount) || 0), 0);

  const handleOpenViewer = (inv) => {
    setSelectedInvoice(inv);
    setIsViewerOpen(true);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Verified Bills & PDF Invoice Vault</h2>
          <p className="text-muted">
            Permanent repository of official PDF vendor bills, maintenance invoices, and hardware acquisition receipts.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            <Upload size={16} /> Upload PDF Bill / Invoice
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-muted">Stored Documents ({invoices.length})</span>
          <span className="badge badge-success font-mono">
            Total: Rs. {totalInvoiced.toLocaleString()}
          </span>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search invoice number, supplier, asset..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Supplier / Payee</th>
                <th>Description</th>
                <th>Associated Entity</th>
                <th>Amount (LKR)</th>
                <th>File Document</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted">
                    No PDF bills or invoices found. Click "Upload PDF Bill" to add one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.InvoiceID} className="cursor-pointer hover-highlight" onClick={() => handleOpenViewer(inv)}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="font-semibold text-primary font-mono">{inv.InvoiceNumber}</span>
                      </div>
                    </td>
                    <td><span className="font-mono text-sm">{formatDisplayDate(inv.InvoiceDate)}</span></td>
                    <td><strong>{inv.Supplier}</strong></td>
                    <td><span className="text-sm">{inv.Description}</span></td>
                    <td>
                      <div>
                        {inv.AssetName && inv.AssetName !== 'General / None' && (
                          <div className="text-xs font-semibold text-cyan">{inv.AssetName}</div>
                        )}
                        {inv.UserName && inv.UserName !== 'General Office' && (
                          <div className="text-xs text-muted">Staff: {inv.UserName}</div>
                        )}
                        {(!inv.AssetName || inv.AssetName === 'General / None') && (!inv.UserName || inv.UserName === 'General Office') && (
                          <span className="text-xs text-muted">General Office</span>
                        )}
                      </div>
                    </td>
                    <td><strong className="text-emerald">Rs. {Number(inv.Amount).toLocaleString()}</strong></td>
                    <td>
                      <span className="text-xs text-muted bg-surface-elevated px-2 py-1 rounded font-mono">
                        {inv.FileName}
                      </span>
                    </td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        <button
                          className="icon-btn"
                          title="View PDF Document"
                          onClick={() => handleOpenViewer(inv)}
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={inv.DownloadUrl || inv.FilePath || `/invoices/${inv.FileName}`}
                          download={inv.FileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icon-btn"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />

      {/* Invoice Upload Modal */}
      <InvoiceUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
