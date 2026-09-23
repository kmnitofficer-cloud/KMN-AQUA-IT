import React, { useState } from 'react';
import { X, Upload, FileText, Save } from 'lucide-react';
import { invoiceService } from '../../services/invoiceService';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';

export default function InvoiceUploadModal({ isOpen, onClose, onSaved }) {
  const assets = assetService.getAssets('All');
  const users = userService.getUsers('Active');

  const [selectedFile, setSelectedFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [supplier, setSupplier] = useState('KMN IT Solution');
  const [amount, setAmount] = useState(0);
  const [assetId, setAssetId] = useState('');
  const [userId, setUserId] = useState('');
  const [description, setDescription] = useState('');
  const [createExpense, setCreateExpense] = useState(true);
  const [expenseType, setExpenseType] = useState('General IT');
  const [paymentMethod, setPaymentMethod] = useState('Company Cheque');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!invoiceNumber) {
        const base = file.name.replace(/\.[^/.]+$/, '');
        setInvoiceNumber(base.slice(0, 20));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF invoice file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      await invoiceService.uploadInvoiceFile(selectedFile, {
        InvoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        InvoiceDate: invoiceDate,
        Supplier: supplier,
        Amount: Number(amount) || 0,
        AssetID: assetId,
        UserID: userId,
        Description: description,
        createMatchingExpense: createExpense,
        ExpenseType: expenseType,
        PaymentMethod: paymentMethod
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      alert('Failed to upload invoice: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Upload size={20} className="text-primary" />
            <h2>Upload IT Bill / PDF Invoice</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* File Upload Zone */}
          <div className="file-upload-zone mb-4">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="pdf-upload" className="file-upload-label">
              <FileText size={36} className="text-muted mb-2" />
              {selectedFile ? (
                <div>
                  <span className="font-semibold text-primary">{selectedFile.name}</span>
                  <div className="text-xs text-muted mt-1">{Math.round(selectedFile.size / 1024)} KB • Ready to store</div>
                </div>
              ) : (
                <div>
                  <span className="font-semibold">Click to select PDF document</span>
                  <div className="text-xs text-muted mt-1">Vendor bills, service receipts, hardware purchase invoices</div>
                </div>
              )}
            </label>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Invoice Number *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. KMN-INV-2026-081"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Invoice Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Supplier / Vendor *</label>
              <input
                type="text"
                required
                className="form-input"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Invoice Total Amount (LKR) *</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Link to Hardware Asset (Optional)</label>
              <select
                className="form-input"
                value={assetId}
                onChange={e => setAssetId(e.target.value)}
              >
                <option value="">-- None / General Office --</option>
                {assetService.groupAssetsByUser(assets).map(group => (
                  <optgroup key={group.groupKey} label={group.groupLabel}>
                    {group.items.map(a => (
                      <option key={a.AssetID} value={a.AssetID}>
                        {assetService.formatAssetLabel(a)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Link to Staff Member (Optional)</label>
              <select
                className="form-input"
                value={userId}
                onChange={e => setUserId(e.target.value)}
              >
                <option value="">-- None / General --</option>
                {users.map(u => (
                  <option key={u.UserID} value={u.UserID}>{u.Name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Description / Line Items</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="e.g. 2x Canon toner cartridges supplied and delivered to Chilaw Office."
              value={description}
              onChange={e => setDescription(e.target.value)}
            ></textarea>
          </div>

          {/* Automatic Expense Synchronization Box */}
          <div style={{
            margin: '1rem 0',
            padding: '0.85rem 1rem',
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: '8px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={createExpense}
                onChange={e => setCreateExpense(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary, #3b82f6)' }}
              />
              <span className="text-primary">✓ Auto-Record Matching Office Expense</span>
            </label>
            <p className="text-xs text-muted" style={{ margin: '0.35rem 0 0 1.6rem' }}>
              Automatically synchronizes this bill amount (Rs. {Number(amount || 0).toLocaleString()}) with the Office Expenses Ledger to ensure 100% budget match on the Dashboard.
            </p>

            {createExpense && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))'
              }}>
                <div className="form-group mb-0">
                  <label className="text-xs font-semibold text-muted">Expense Category</label>
                  <select
                    className="form-input text-xs"
                    value={expenseType}
                    onChange={e => setExpenseType(e.target.value)}
                  >
                    <option value="Consumable / Toner">Printer Consumable / Toner</option>
                    <option value="Hardware Repair">Hardware Repair & Maintenance</option>
                    <option value="Hardware Upgrade / Component">Hardware Upgrade (RAM / SSD)</option>
                    <option value="Purchase">IT Equipment Purchase</option>
                    <option value="Software / License">Software & Subscriptions</option>
                    <option value="General IT">General IT Expense</option>
                  </select>
                </div>
                <div className="form-group mb-0">
                  <label className="text-xs font-semibold text-muted">Payment Method</label>
                  <select
                    className="form-input text-xs"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Company Cheque">Company Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash / Petty Cash">Cash / Petty Cash</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isUploading || !selectedFile}>
              <Save size={16} /> {isUploading ? 'Uploading & Linking...' : 'Upload & Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
