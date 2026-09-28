import React, { useState } from 'react';
import { X, Printer, DollarSign, Clock, Wrench, FileText, Wifi, Plus } from 'lucide-react';
import { printerService } from '../../services/printerService';
import { formatDisplayDate } from '../../utils/dateUtils';
import TonerModal from './TonerModal';

export default function PrinterProfileModal({ printerId, isOpen, onClose, onLogRepair }) {
  const [isTonerModalOpen, setIsTonerModalOpen] = useState(false);

  if (!isOpen || !printerId) return null;

  const printer = printerService.getPrinterById(printerId);
  if (!printer) return null;

  const costSummary = printerService.getPrinterCostSummary(printer.AssetID);
  const tonerHistory = printerService.getPrinterTonerHistory(printer.AssetID);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-header-info">
            <div className="printer-type-badge">
              <Printer size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2>{printer.PrinterName}</h2>
                <span className={`badge ${printer.Status.includes('Error') ? 'badge-danger' : 'badge-success'}`}>
                  {printer.Status}
                </span>
              </div>
              <div className="profile-sub-badges">
                <span className="badge badge-primary">{printer.PrinterID}</span>
                <span className="tag-pill font-mono">{printer.VerifiedNo}</span>
                <span className="text-muted text-sm">{printer.PrinterType}</span>
                <span className="text-cyan font-mono text-sm">IP: {printer.IPAddress}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => setIsTonerModalOpen(true)}>
              <Plus size={14} /> Record Toner / Ink
            </button>
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="profile-meta-grid">
          <div className="meta-card">
            <Wifi size={16} className="text-primary" />
            <div>
              <span className="meta-label">Connection</span>
              <span className="meta-val">{printer.ConnectionMethod} ({printer.IPAddress})</span>
            </div>
          </div>
          <div className="meta-card">
            <Printer size={16} className="text-cyan" />
            <div>
              <span className="meta-label">Cartridge Model</span>
              <span className="meta-val font-semibold">{printer.TonerCartridgeModel}</span>
            </div>
          </div>
          <div className="meta-card">
            <div>
              <span className="meta-label">Assigned Location</span>
              <span className="meta-val">{printer.LocationName}</span>
            </div>
          </div>
          <div className="meta-card">
            <div>
              <span className="meta-label">Assigned User / Dept</span>
              <span className="meta-val">{printer.AssignedUserName !== 'Unassigned' ? printer.AssignedUserName : printer.DepartmentName}</span>
            </div>
          </div>
        </div>

        {/* Lifetime Printer Cost Card */}
        <div className="profile-cost-box mt-6">
          <div className="cost-box-header">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald" />
              <h3>Printer Lifetime Cost Accounting</h3>
            </div>
            <span className="cost-box-total">
              Total Recorded: <strong>Rs. {costSummary.totalRecordedCost.toLocaleString()}</strong>
            </span>
          </div>
          <div className="cost-box-breakdown">
            <div className="cost-item">
              <span className="cost-item-label">Purchase Price</span>
              <span className="cost-item-val">Rs. {costSummary.purchaseCost.toLocaleString()}</span>
            </div>
            <div className="cost-item">
              <span className="cost-item-label">Toner & Ink History ({costSummary.tonerTransactionsCount} replacements)</span>
              <span className="cost-item-val text-cyan">Rs. {costSummary.tonerHistoryCost.toLocaleString()}</span>
            </div>
            <div className="cost-item">
              <span className="cost-item-label">Repairs & Maintenance</span>
              <span className="cost-item-val text-amber">Rs. {costSummary.repairHistoryCost.toLocaleString()}</span>
            </div>
            <div className="cost-item">
              <span className="cost-item-label">Other Expenses</span>
              <span className="cost-item-val">Rs. {costSummary.otherExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Toner & Consumables History Table */}
        <div className="profile-section mt-6">
          <div className="section-title-bar">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-cyan" />
              <h3>Toner & Cartridge Replacement History ({tonerHistory.length})</h3>
            </div>
            <button className="btn btn-outline btn-xs" onClick={() => setIsTonerModalOpen(true)}>
              + Add Transaction
            </button>
          </div>

          {tonerHistory.length === 0 ? (
            <div className="empty-panel">
              <p>No consumable transactions logged yet for this printer.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Consumable Item</th>
                    <th>Cartridge Model</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                    <th>Supplier</th>
                    <th>Technician</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tonerHistory.map(t => (
                    <tr key={t.TransactionID}>
                      <td><span className="font-mono text-xs">{formatDisplayDate(t.Date)}</span></td>
                      <td><strong>{t.ConsumableType}</strong></td>
                      <td>{t.Model}</td>
                      <td>{t.Quantity}</td>
                      <td>Rs. {Number(t.UnitCost).toLocaleString()}</td>
                      <td><strong className="text-emerald">Rs. {Number(t.TotalCost).toLocaleString()}</strong></td>
                      <td>{t.Supplier}</td>
                      <td>{t.InstalledBy || 'IT'}</td>
                      <td>{t.Notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toner Modal */}
      <TonerModal
        printerAssetId={printer.AssetID}
        isOpen={isTonerModalOpen}
        onClose={() => setIsTonerModalOpen(false)}
      />
    </div>
  );
}
