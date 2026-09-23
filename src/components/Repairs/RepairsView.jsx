import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Cpu, 
  FileText
} from 'lucide-react';
import { repairService } from '../../services/repairService';
import { invoiceService } from '../../services/invoiceService';
import { formatDisplayDate } from '../../utils/dateUtils';
import RepairModal from './RepairModal';
import InvoiceViewerModal from '../Invoices/InvoiceViewerModal';

export default function RepairsView({ onOpenAsset: _onOpenAsset }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Invoice viewer modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const repairs = repairService.getRepairs();

  const handleOpenInvoice = (invoiceId) => {
    if (!invoiceId) return;
    const allInvoices = invoiceService.getInvoices();
    const inv = allInvoices.find(i => i.InvoiceID === invoiceId || i.InvoiceNumber === invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    } else {
      setSelectedInvoice({
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceId,
        Supplier: 'KMN IT Solution',
        Amount: 0,
        InvoiceDate: '2026-09-05',
        FileName: '05.09.2026..pdf',
        FilePath: '/invoices/05.09.2026..pdf',
        Description: `Invoice ${invoiceId}`
      });
      setIsInvoiceModalOpen(true);
    }
  };

  // Helper to split parts cleanly
  const parseParts = (text) => {
    if (!text || text === 'N/A' || text === 'None') return [];
    return text
      .split(/;\s*|,\s*/)
      .map(t => t.trim())
      .filter(Boolean);
  };

  const filteredRepairs = repairs.filter(r => {
    if (filter === 'Completed' && r.Status !== 'Completed') return false;
    if (filter === 'Warnings' && !r.Status.includes('Warning') && !r.Status.includes('Observation')) return false;
    if (filter === 'Under Repair' && (r.Status === 'Completed' || r.Status.includes('Warning'))) return false;

    const q = search.toLowerCase();
    return (
      (r.ProblemDescription && r.ProblemDescription.toLowerCase().includes(q)) ||
      (r.ActionTaken && r.ActionTaken.toLowerCase().includes(q)) ||
      (r.Model && r.Model.toLowerCase().includes(q)) ||
      (r.VerifiedNo && r.VerifiedNo.toLowerCase().includes(q)) ||
      (r.RepairSupplier && r.RepairSupplier.toLowerCase().includes(q)) ||
      (r.RepairID && r.RepairID.toLowerCase().includes(q)) ||
      (r.PartsReplaced && r.PartsReplaced.toLowerCase().includes(q))
    );
  });

  const totalCost = filteredRepairs.reduce((sum, r) => sum + (Number(r.RepairCost) || 0), 0);

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Hardware Maintenance & Repair Registry</h2>
          <p className="text-muted">
            Permanent ledger of all equipment breakdowns, vendor services, actions taken, warranties, and component replacements.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => { setSelectedAssetId(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Log Repair / Issue
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Services ({repairs.length})
          </button>
          <button
            className={`filter-tab ${filter === 'Warnings' ? 'active' : ''}`}
            onClick={() => setFilter('Warnings')}
          >
            ⚠️ Warnings & Checks ({repairs.filter(r => r.Status && (r.Status.includes('Warning') || r.Status.includes('Observation'))).length})
          </button>
          <button
            className={`filter-tab ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Completed ({repairs.filter(r => r.Status === 'Completed').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Under Repair' ? 'active' : ''}`}
            onClick={() => setFilter('Under Repair')}
          >
            Active In Repair ({repairs.filter(r => r.Status !== 'Completed' && !r.Status.includes('Warning')).length})
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search problem, device, parts, vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary KPI Pill */}
      <div className="summary-banner mb-4">
        <div className="flex items-center gap-3">
          <Wrench size={18} className="text-amber" />
          <span>Showing <strong>{filteredRepairs.length}</strong> repair & service records</span>
        </div>
        <div className="font-semibold text-primary">
          Total Recorded Cost: <strong className="text-emerald text-base font-mono">Rs. {totalCost.toLocaleString()}</strong>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Repair ID</th>
                <th>Date</th>
                <th>Hardware Device</th>
                <th>Tag / No</th>
                <th>Problem Description</th>
                <th>Resolution / Action</th>
                <th>Parts Replaced</th>
                <th>Invoice / Bill</th>
                <th>Supplier / Tech</th>
                <th>Cost (LKR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-muted">
                    No repair records found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map(r => {
                  const partsList = parseParts(r.PartsReplaced);

                  return (
                    <tr key={r.RepairID}>
                      <td><span className="id-pill">{r.RepairID}</span></td>
                      <td className="whitespace-nowrap"><span className="font-mono text-sm">{formatDisplayDate(r.RepairDate)}</span></td>
                      <td>
                        <div>
                          <span className="font-semibold text-primary">{r.Brand} {r.Model}</span>
                          <div className="text-xs text-muted">{r.AssetID} • {r.AssignedUserName}</div>
                        </div>
                      </td>
                      <td><span className="tag-pill font-mono">{r.VerifiedNo}</span></td>
                      <td><strong className="text-rose">{r.ProblemDescription}</strong></td>
                      <td>{r.ActionTaken}</td>
                      <td>
                        {partsList.length > 0 ? (
                          <div className="flex flex-col gap-1 max-w-xs">
                            {partsList.map((pt, i) => (
                              <span key={i} className="part-tag-item">
                                <Cpu size={12} className="shrink-0" />
                                {pt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">None</span>
                        )}
                      </td>
                      <td>
                        {r.InvoiceID ? (
                          <button
                            type="button"
                            className="invoice-clickable-btn"
                            title="Click to view & download official invoice PDF/image"
                            onClick={() => handleOpenInvoice(r.InvoiceID)}
                          >
                            <FileText size={12} /> {r.InvoiceID}
                          </button>
                        ) : (
                          <span className="text-xs text-muted italic">N/A</span>
                        )}
                      </td>
                      <td>
                        <div>{r.RepairSupplier}</div>
                        <div className="text-xs text-muted">{r.Technician}</div>
                      </td>
                      <td>
                        <strong className="text-emerald font-mono">
                          Rs. {Number(r.RepairCost || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${
                          r.Status === 'Completed' ? 'badge-success' :
                          (r.Status && (r.Status.includes('Warning') || r.Status.includes('Observation'))) ? 'badge-warning font-semibold' :
                          'badge-danger'
                        }`}>
                          {r.Status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repair Modal */}
      <RepairModal
        assetId={selectedAssetId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          // Trigger reload / re-render
          setIsModalOpen(false);
        }}
      />

      {/* Invoice Viewer Modal */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
