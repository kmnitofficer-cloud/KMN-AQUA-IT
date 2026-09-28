import React, { useState } from 'react';
import { 
  Cpu, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';
import { repairService } from '../../services/repairService';
import { invoiceService } from '../../services/invoiceService';
import { formatDisplayDate } from '../../utils/dateUtils';
import InvoiceViewerModal from '../Invoices/InvoiceViewerModal';

export default function PartsView() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  // Invoice modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const parts = repairService.getParts();

  const handleOpenInvoice = (invoiceId) => {
    if (!invoiceId) return;
    const inv = invoiceService.getInvoiceById(invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    }
  };

  const filteredParts = parts.filter(p => {
    if (filter === 'Active' && p.WarrantyBadgeType !== 'active' && p.WarrantyBadgeType !== 'expiring-soon') return false;
    if (filter === 'Expiring' && p.WarrantyBadgeType !== 'expiring-soon') return false;
    if (filter === 'Expired' && p.WarrantyBadgeType !== 'expired') return false;

    const q = search.toLowerCase();
    return (
      (p.PartType && p.PartType.toLowerCase().includes(q)) ||
      (p.OldPartDetails && p.OldPartDetails.toLowerCase().includes(q)) ||
      (p.NewPartDetails && p.NewPartDetails.toLowerCase().includes(q)) ||
      (p.Model && p.Model.toLowerCase().includes(q)) ||
      (p.Brand && p.Brand.toLowerCase().includes(q)) ||
      (p.VerifiedNo && p.VerifiedNo.toLowerCase().includes(q)) ||
      (p.AssignedUserName && p.AssignedUserName.toLowerCase().includes(q)) ||
      (p.WarrantyProvider && p.WarrantyProvider.toLowerCase().includes(q)) ||
      (p.InvoiceNumber && p.InvoiceNumber.toLowerCase().includes(q))
    );
  });

  const totalPartsCost = filteredParts.reduce((sum, p) => sum + (Number(p.Cost) || 0), 0);
  const warrantiedCount = parts.filter(p => p.WarrantyEnd).length;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Hardware Components, Replacements & Warranties</h2>
          <p className="text-muted">
            Registry of all installed internal components, memory upgrades, storage swaps, factory serial numbers, and live warranty duration tracking.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Components ({parts.length})
          </button>
          <button
            className={`filter-tab ${filter === 'Active' ? 'active' : ''}`}
            onClick={() => setFilter('Active')}
          >
            🛡️ Under Warranty ({warrantiedCount})
          </button>
          <button
            className={`filter-tab ${filter === 'Expiring' ? 'active' : ''}`}
            onClick={() => setFilter('Expiring')}
          >
            ⚠️ Expiring Soon ({parts.filter(p => p.WarrantyBadgeType === 'expiring-soon').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Expired' ? 'active' : ''}`}
            onClick={() => setFilter('Expired')}
          >
            Expired ({parts.filter(p => p.WarrantyBadgeType === 'expired').length})
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search part specs, serials, machine, user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="summary-banner mb-4">
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-violet" />
          <span>Tracking <strong>{filteredParts.length}</strong> installed hardware component records</span>
        </div>
        <div className="font-semibold text-primary">
          Parts Investment Total: <strong className="text-emerald font-mono">Rs. {totalPartsCost.toLocaleString()}</strong>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part ID</th>
                <th>Installed Date</th>
                <th>Target Asset & User</th>
                <th>Component Category</th>
                <th>Old Removed Specs</th>
                <th>New Installed Specs</th>
                <th>Warranty Status & Days</th>
                <th>Cost (LKR)</th>
                <th>Vendor Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted">
                    No hardware component replacements found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredParts.map(p => {
                  const days = p.WarrantyRemainingDays;

                  return (
                    <tr key={p.PartID}>
                      <td><span className="id-pill">{p.PartID}</span></td>
                      <td className="whitespace-nowrap"><span className="font-mono text-xs">{formatDisplayDate(p.NewPartInstalledDate || p.OldPartRemovedDate)}</span></td>
                      <td>
                        <div>
                          <span className="font-semibold text-primary">{p.Brand} {p.Model}</span>
                          <div className="text-xs text-muted">
                            Tag: <strong className="text-cyan font-mono">{p.VerifiedNo}</strong> • {p.AssignedUserName}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="part-tag-item">
                          <Cpu size={12} /> {p.PartType}
                        </span>
                      </td>
                      <td>
                        <div className="text-rose font-medium text-xs">{p.OldPartDetails}</div>
                        {p.OldPartSerial && p.OldPartSerial !== 'N/A' && (
                          <div className="text-xs text-muted font-mono">S/N: {p.OldPartSerial}</div>
                        )}
                      </td>
                      <td>
                        <div className="text-emerald font-semibold text-xs flex items-center gap-1">
                          <ArrowRight size={13} className="text-muted shrink-0" /> {p.NewPartDetails}
                        </div>
                        {p.NewPartSerial && p.NewPartSerial !== 'N/A' && (
                          <div className="text-xs text-muted font-mono">S/N: {p.NewPartSerial}</div>
                        )}
                      </td>
                      <td>
                        {p.WarrantyEnd ? (
                          <div>
                            <div className="mb-1">
                              <span className={`warranty-countdown-pill ${
                                p.WarrantyBadgeType === 'active' ? 'active' :
                                p.WarrantyBadgeType === 'expiring-soon' ? 'expiring' : 'expired'
                              }`}>
                                <Clock size={11} />
                                {days !== null ? (
                                  days > 60 ? `${days.toLocaleString()} Days Left` :
                                  days >= 0 ? `⚠️ ${days} Days Left` :
                                  `Expired`
                                ) : 'Active'}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted">
                              Expires: {p.WarrantyEnd} ({p.WarrantyPeriod || '1 Year'})
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">No warranty</span>
                        )}
                      </td>
                      <td>
                        <strong className="text-emerald font-mono">
                          Rs. {Number(p.Cost || 0).toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        {p.InvoiceID ? (
                          <button
                            type="button"
                            className="invoice-clickable-btn"
                            title="Click to view/download official invoice file"
                            onClick={() => handleOpenInvoice(p.InvoiceID)}
                          >
                            <FileText size={12} /> {p.InvoiceNumber || p.InvoiceID}
                          </button>
                        ) : (
                          <span className="text-xs text-muted italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
