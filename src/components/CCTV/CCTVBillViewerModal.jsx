import React from 'react';
import { X, FileText, Download, Building2, Calendar, Tag, DollarSign, CheckCircle2, Clock, Trash2, ExternalLink, ArrowLeftRight } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function CCTVBillViewerModal({ isOpen, onClose, bill, onDelete }) {
  if (!isOpen || !bill) return null;

  const isPaid = (bill.PaymentStatus || '').toLowerCase() === 'paid';
  const hasFile = Boolean(bill.FileName || bill.FilePath);
  const isImage = bill.FileName && /\.(jpg|jpeg|png|webp|gif)$/i.test(bill.FileName);
  const isSplit = bill.Office === 'Split';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete CCTV bill "${bill.BillNumber}"?`)) {
      if (onDelete) onDelete(bill.BillID);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="form-modal-header border-b border-subtle pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isSplit ? 'bg-cyan-900/30 text-cyan-400' : bill.Office === 'Palawiya' ? 'bg-violet-900/30 text-violet-400' : 'bg-blue-900/30 text-blue-400'}`}>
              {isSplit ? <ArrowLeftRight size={20} /> : <Building2 size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono">{bill.BillNumber}</h2>
                {isSplit ? (
                  <span className="badge badge-outline border-cyan/60 text-cyan flex items-center gap-1">
                    <ArrowLeftRight size={11} />
                    Split (Both Offices)
                  </span>
                ) : (
                  <span className={`badge ${bill.Office === 'Palawiya' ? 'badge-purple' : 'badge-primary'}`}>
                    {bill.Office} CCTV
                  </span>
                )}
                <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                  {isPaid ? <CheckCircle2 size={12} className="inline mr-1" /> : <Clock size={12} className="inline mr-1" />}
                  {bill.PaymentStatus || 'Paid'}
                </span>
              </div>
              <span className="text-xs text-muted">ID: {bill.BillID} • {bill.Supplier}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="form-modal-body space-y-4">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-elevated p-3.5 rounded-lg border border-subtle">
            <div>
              <span className="text-xs text-muted block mb-0.5">Total Amount</span>
              <span className="text-lg font-bold text-emerald font-mono">
                Rs. {(Number(bill.Amount) || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block mb-0.5">Bill Date</span>
              <span className="text-sm font-semibold">{formatDisplayDate(bill.BillDate)}</span>
            </div>
            <div>
              <span className="text-xs text-muted block mb-0.5">Billing Period</span>
              <span className="text-sm font-semibold">{bill.BillPeriod || 'Standard'}</span>
            </div>
            <div>
              <span className="text-xs text-muted block mb-0.5">Payment Method</span>
              <span className="text-sm font-semibold">{bill.PaymentMethod || 'Company Cheque'}</span>
            </div>
          </div>

          {/* Split Office Allocation Details */}
          {isSplit && (
            <div className="p-3.5 bg-surface-elevated rounded-lg border-2 border-cyan/40">
              <div className="flex items-center gap-1.5 text-cyan text-xs font-bold uppercase tracking-wider mb-2.5">
                <ArrowLeftRight size={14} /> Multi-Office Split Breakdown
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-surface rounded border border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue flex items-center gap-1">
                      <Building2 size={13} /> Chilaw Office Share
                    </span>
                    <span className="font-mono font-bold text-emerald text-sm">
                      Rs. {(Number(bill.ChilawAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    {bill.ChilawDescription || 'Parts & maintenance for Chilaw CCTV'}
                  </p>
                </div>

                <div className="p-3 bg-surface rounded border border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-violet flex items-center gap-1">
                      <Building2 size={13} /> Palawiya Office Share
                    </span>
                    <span className="font-mono font-bold text-emerald text-sm">
                      Rs. {(Number(bill.PalawiyaAmount) || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-secondary mt-1">
                    {bill.PalawiyaDescription || 'Parts & maintenance for Palawiya CCTV'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description & Scope */}
          <div className="p-3 bg-surface rounded-lg border border-subtle">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
              Description & Service Details
            </span>
            <p className="text-sm text-primary leading-relaxed">{bill.Description}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-surface rounded-lg border border-subtle">
              <span className="text-xs text-muted block mb-1">Surveillance Category</span>
              <span className="font-semibold text-cyan">{bill.BillCategory || 'General / Other'}</span>
            </div>
            <div className="p-3 bg-surface rounded-lg border border-subtle">
              <span className="text-xs text-muted block mb-1">Assigned Location</span>
              <span className="font-semibold">{bill.Office === 'Palawiya' ? 'Palaviya Branch (LOC-0002)' : 'Chilaw Headquarters (LOC-0001)'}</span>
            </div>
          </div>

          {bill.Notes && (
            <div className="p-3 bg-surface-elevated rounded-lg border border-subtle text-sm">
              <span className="text-xs text-muted block mb-1">Additional Notes</span>
              <p className="text-secondary text-xs">{bill.Notes}</p>
            </div>
          )}

          {/* Attached Document Section */}
          <div className="p-3.5 bg-surface rounded-lg border border-subtle">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Attached Receipt / Bill Document
              </span>
              {hasFile && (
                <span className="text-xs text-muted font-mono">{bill.FileSize || 'Document File'}</span>
              )}
            </div>

            {hasFile ? (
              <div className="flex items-center justify-between p-3 bg-surface-elevated rounded border border-subtle">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-primary" />
                  <div>
                    <span className="font-semibold text-sm block">{bill.FileName}</span>
                    <span className="text-xs text-muted">Ready to view / download</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {bill.FilePath && (
                    <a
                      href={bill.FilePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <ExternalLink size={14} /> Open
                    </a>
                  )}
                  {bill.FilePath && (
                    <a
                      href={bill.FilePath}
                      download={bill.FileName}
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={14} /> Download
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-muted bg-surface-elevated rounded border border-subtle">
                No electronic file or scan was attached to this bill.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="form-modal-actions border-t border-subtle pt-3 flex justify-between">
          <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={14} /> Delete Bill
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
