import React, { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Save, Building2, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { cctvService, CCTV_BILL_CATEGORIES } from '../../services/cctvService';

export default function AddCCTVBillModal({ isOpen, onClose, onSaved, defaultOffice = 'Chilaw' }) {
  const [office, setOffice] = useState(defaultOffice); // 'Chilaw' | 'Palawiya' | 'Split'
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billPeriod, setBillPeriod] = useState(() => {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });
  const [category, setCategory] = useState(CCTV_BILL_CATEGORIES[0]);
  const [supplier, setSupplier] = useState('');
  const [amount, setAmount] = useState('');
  
  // Split amounts & descriptions
  const [chilawAmount, setChilawAmount] = useState('');
  const [palawiyaAmount, setPalawiyaAmount] = useState('');
  const [chilawDesc, setChilawDesc] = useState('');
  const [palawiyaDesc, setPalawiyaDesc] = useState('');

  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [paymentMethod, setPaymentMethod] = useState('Company Cheque');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [createExpense, setCreateExpense] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setOffice(defaultOffice || 'Chilaw');
      setBillNumber('');
      setBillDate(new Date().toISOString().split('T')[0]);
      const d = new Date();
      setBillPeriod(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }));
      setCategory(CCTV_BILL_CATEGORIES[0]);
      setSupplier(defaultOffice === 'Palawiya' ? 'Dialog Axiata 4G' : 'SLT Mobitel Fiber');
      setAmount('');
      setChilawAmount('');
      setPalawiyaAmount('');
      setChilawDesc('');
      setPalawiyaDesc('');
      setPaymentStatus('Paid');
      setPaymentMethod('Company Cheque');
      setDescription('');
      setNotes('');
      setSelectedFile(null);
      setCreateExpense(true);
      setIsSubmitting(false);
    }
  }, [isOpen, defaultOffice]);

  if (!isOpen) return null;

  const isSplit = office === 'Split';
  const splitTotal = (Number(chilawAmount) || 0) + (Number(palawiyaAmount) || 0);

  const handleOfficeChange = (newOffice) => {
    setOffice(newOffice);
    if (!supplier || supplier === 'SLT Mobitel Fiber' || supplier === 'Dialog Axiata 4G') {
      if (newOffice === 'Palawiya') {
        setSupplier('Dialog Axiata 4G');
      } else if (newOffice === 'Chilaw') {
        setSupplier('SLT Mobitel Fiber');
      } else {
        setSupplier('KMN IT Solution');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!billNumber) {
        const base = file.name.replace(/\.[^/.]+$/, '').slice(0, 20);
        setBillNumber(base);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSplit) {
      if (splitTotal <= 0) {
        alert('Please specify an amount for either Chilaw, Palawiya, or both.');
        return;
      }
    } else {
      if (!amount || Number(amount) <= 0) {
        alert('Please provide a valid bill amount.');
        return;
      }
    }

    const finalDescription = isSplit 
      ? (description.trim() || `Split Bill: Chilaw (Rs. ${Number(chilawAmount || 0).toLocaleString()}) & Palawiya (Rs. ${Number(palawiyaAmount || 0).toLocaleString()})`)
      : description.trim();

    if (!finalDescription) {
      alert('Please provide a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cctvService.addCCTVBill({
        Office: office,
        BillNumber: billNumber.trim() || `CCTV-${Date.now().toString().slice(-4)}`,
        BillDate: billDate,
        BillPeriod: billPeriod,
        BillCategory: category,
        Supplier: supplier.trim() || 'General Vendor',
        Amount: isSplit ? splitTotal : Number(amount),
        ChilawAmount: isSplit ? Number(chilawAmount) || 0 : (office === 'Chilaw' ? Number(amount) : 0),
        PalawiyaAmount: isSplit ? Number(palawiyaAmount) || 0 : (office === 'Palawiya' ? Number(amount) : 0),
        ChilawDescription: chilawDesc.trim(),
        PalawiyaDescription: palawiyaDesc.trim(),
        PaymentStatus: paymentStatus,
        PaymentMethod: paymentMethod,
        Description: finalDescription,
        Notes: notes.trim(),
        createMatchingExpense: createExpense
      }, selectedFile);

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving CCTV bill:', err);
      alert('Failed to save CCTV bill: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-emerald" />
            <div>
              <h2 className="text-lg font-bold">Add CCTV Bill / Invoice</h2>
              <span className="text-xs text-muted">Assign bill to Chilaw, Palawiya, or split across both offices</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Target Office Switcher with 3 options */}
          <div className="form-group mb-4">
            <label className="text-sm font-semibold mb-2 block">Bill Allocation *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                className={`office-select-btn ${office === 'Chilaw' ? 'active-chilaw' : ''}`}
                onClick={() => handleOfficeChange('Chilaw')}
              >
                <Building2 size={18} />
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm">Chilaw Office</div>
                  <div className="text-[11px] text-muted">100% to Chilaw</div>
                </div>
              </button>

              <button
                type="button"
                className={`office-select-btn ${office === 'Palawiya' ? 'active-palawiya' : ''}`}
                onClick={() => handleOfficeChange('Palawiya')}
              >
                <Building2 size={18} />
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm">Palawiya Office</div>
                  <div className="text-[11px] text-muted">100% to Palawiya</div>
                </div>
              </button>

              <button
                type="button"
                className={`office-select-btn ${isSplit ? 'active-split' : ''}`}
                onClick={() => handleOfficeChange('Split')}
              >
                <ArrowLeftRight size={18} className="text-cyan" />
                <div className="text-left">
                  <div className="font-bold text-xs sm:text-sm">Split (Both)</div>
                  <div className="text-[11px] text-muted">Shared in 1 Bill</div>
                </div>
              </button>
            </div>
          </div>

          {/* Split Allocation Details Card (Only shown if Split is selected) */}
          {isSplit && (
            <div className="mb-4 p-3.5 bg-surface-elevated rounded-lg border-2 border-cyan/40">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-cyan text-sm font-bold">
                  <ArrowLeftRight size={16} />
                  <span>Split Amount Between Chilaw & Palawiya</span>
                </div>
                <span className="badge badge-success font-mono font-bold text-xs">
                  Total: Rs. {splitTotal.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chilaw Share */}
                <div className="p-3 bg-surface rounded-md border border-subtle">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue flex items-center gap-1">
                      <Building2 size={13} /> Chilaw Share
                    </span>
                  </div>
                  <div className="form-group mb-2">
                    <label className="text-[11px] text-muted">Chilaw Amount (LKR) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input font-mono font-bold text-sm"
                      placeholder="e.g. 15000"
                      value={chilawAmount}
                      onChange={e => setChilawAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-[11px] text-muted">Chilaw Items / Work Scope</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g. 2 Bullet Cameras, 1 Power Supply"
                      value={chilawDesc}
                      onChange={e => setChilawDesc(e.target.value)}
                    />
                  </div>
                </div>

                {/* Palawiya Share */}
                <div className="p-3 bg-surface rounded-md border border-subtle">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-violet flex items-center gap-1">
                      <Building2 size={13} /> Palawiya Share
                    </span>
                  </div>
                  <div className="form-group mb-2">
                    <label className="text-[11px] text-muted">Palawiya Amount (LKR) *</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-input font-mono font-bold text-sm"
                      placeholder="e.g. 10000"
                      value={palawiyaAmount}
                      onChange={e => setPalawiyaAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="text-[11px] text-muted">Palawiya Items / Work Scope</label>
                    <input
                      type="text"
                      className="form-input text-xs"
                      placeholder="e.g. 1 Dome Camera, Cable rewiring"
                      value={palawiyaDesc}
                      onChange={e => setPalawiyaDesc(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            {/* Bill / Invoice Number */}
            <div className="form-group">
              <label>Bill / Reference # *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. SLT-CH-0926 or INV-4412"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
              />
            </div>

            {/* Bill Category */}
            <div className="form-group">
              <label>Expense Category *</label>
              <select
                className="form-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CCTV_BILL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label>Bill Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={billDate}
                onChange={e => setBillDate(e.target.value)}
              />
            </div>

            {/* Billing Month / Period */}
            <div className="form-group">
              <label>Billing Month / Period</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. September 2026"
                value={billPeriod}
                onChange={e => setBillPeriod(e.target.value)}
              />
            </div>

            {/* Supplier / Payee */}
            <div className="form-group">
              <label>Vendor / Supplier *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. SLT Mobitel, Dialog, KMN IT Solution"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label>Amount (LKR) *</label>
              {isSplit ? (
                <input
                  type="text"
                  readOnly
                  className="form-input font-mono font-bold bg-surface-elevated text-emerald cursor-not-allowed"
                  value={`Rs. ${splitTotal.toLocaleString()} (Auto-Calculated)`}
                />
              ) : (
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  className="form-input font-mono font-bold"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              )}
            </div>

            {/* Payment Status */}
            <div className="form-group">
              <label>Payment Status</label>
              <select
                className="form-input"
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value)}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending Approval</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="form-group">
              <label>Payment Method</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="Company Cheque">Company Cheque</option>
                <option value="Bank Transfer">Bank Transfer / Online</option>
                <option value="Cash">Petty Cash</option>
                <option value="Credit Card">Credit Card</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-group col-span-2">
              <label>Overall Description {isSplit ? '(Optional - will auto-generate from split details)' : '*'}</label>
              <input
                type="text"
                required={!isSplit}
                className="form-input"
                placeholder={isSplit ? "e.g. Combined CCTV maintenance & camera replacements invoice" : "e.g. Monthly fiber connectivity fee for Chilaw NVR live feed"}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="form-group col-span-2">
              <label>Additional Notes / Warranty</label>
              <textarea
                className="form-input resize-none"
                rows="2"
                placeholder="Any special remarks, camera channel references, or technical specifications..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Attached Document / Receipt Upload */}
          <div className="file-upload-zone my-3">
            <input
              type="file"
              id="cctv-bill-upload"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="cctv-bill-upload" className="file-upload-label cursor-pointer">
              <FileText size={32} className="text-muted mb-1.5" />
              {selectedFile ? (
                <div>
                  <span className="font-semibold text-primary">{selectedFile.name}</span>
                  <div className="text-xs text-muted mt-0.5">
                    {Math.round(selectedFile.size / 1024)} KB • Attached receipt document
                  </div>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-sm">Attach Bill PDF or Image Receipt</span>
                  <div className="text-xs text-muted mt-0.5">
                    Vendor bill, invoice copy, service voucher, or payment slip
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Auto Reconcile Checkbox */}
          <div className="checkbox-group mb-4 p-3 bg-surface-elevated rounded-md border border-subtle">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium">
              <input
                type="checkbox"
                checked={createExpense}
                onChange={e => setCreateExpense(e.target.checked)}
              />
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald" />
                <span>Synchronize with Central Office Expenses Ledger</span>
              </div>
            </label>
            <span className="text-xs text-muted block ml-6 mt-0.5">
              Automatically creates an entry under IT Expenses attributed to {office} CCTV.
            </span>
          </div>

          {/* Actions */}
          <div className="form-modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={16} /> {isSubmitting ? 'Saving...' : (isSplit ? 'Save Split CCTV Bill' : `Save ${office} CCTV Bill`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
