import React, { useState, useEffect } from 'react';
import { X, Printer, Plus, Save, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { printerService } from '../../services/printerService';
import { invoiceService } from '../../services/invoiceService';

export default function TonerModal({ printerAssetId, isOpen, onClose, onSaved }) {
  const printers = printerService.getPrinters();
  const existingInvoices = invoiceService.getInvoices();
  const selectedPrinter = printers.find(p => p.AssetID === printerAssetId) || printers[0];

  const [targetAssetId, setTargetAssetId] = useState(printerAssetId || '');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [consumableType, setConsumableType] = useState('Black Toner');
  const [brand, setBrand] = useState('Canon');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(2200);
  const [supplier, setSupplier] = useState('KMN IT Solution');
  const [installedBy, setInstalledBy] = useState('KMN IT Service Specialist');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [notes, setNotes] = useState('');

  const totalCost = (Number(unitCost) || 0) * (Number(quantity) || 1);

  useEffect(() => {
    if (printerAssetId) {
      setTargetAssetId(printerAssetId);
      const prn = printers.find(p => p.AssetID === printerAssetId);
      if (prn) {
        setBrand(prn.Brand || 'Canon');
        setModel(prn.TonerCartridgeModel || 'Cartridge');
      }
    } else if (printers.length > 0) {
      setTargetAssetId(printers[0].AssetID);
      setBrand(printers[0].Brand || 'Canon');
      setModel(printers[0].TonerCartridgeModel || 'Cartridge');
    }
  }, [printerAssetId, isOpen]);

  if (!isOpen) return null;

  const handleInvoiceFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setInvoiceFile(file);
      if (!invoiceNumber) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        setInvoiceNumber(cleanName.slice(0, 20));
      }
      setSelectedInvoiceId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAssetId) {
      alert('Please select a printer.');
      return;
    }

    await printerService.logTonerTransaction({
      printerAssetId: targetAssetId,
      consumableType,
      brand,
      model,
      quantity,
      unitCost,
      date: transactionDate,
      supplier,
      installedBy,
      selectedInvoiceId,
      invoiceNumber: invoiceNumber.trim(),
      invoiceFile,
      notes
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Printer size={20} className="text-cyan" />
            <h2>Log Printer Toner / Ink Replacement</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Target Printer *</label>
              <select
                required
                className="form-input"
                value={targetAssetId}
                onChange={e => {
                  setTargetAssetId(e.target.value);
                  const p = printers.find(prn => prn.AssetID === e.target.value);
                  if (p) {
                    setBrand(p.Brand || '');
                    setModel(p.TonerCartridgeModel || '');
                  }
                }}
              >
                {printers.map(p => (
                  <option key={p.PrinterID} value={p.AssetID}>
                    {p.PrinterName} ({p.LocationName}) - IP: {p.IPAddress}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Consumable Type</label>
              <select
                className="form-input"
                value={consumableType}
                onChange={e => setConsumableType(e.target.value)}
              >
                <option value="Black Toner">Black Toner Cartridge</option>
                <option value="Color Toner">Color Toner Cartridge</option>
                <option value="Black Ink">Black Ink Bottle / Tank</option>
                <option value="Color Ink">Color Ink Cartridge</option>
                <option value="Drum Unit">Imaging Drum Unit</option>
                <option value="Maintenance Box">Waste Ink Maintenance Box</option>
              </select>
            </div>

            <div className="form-group">
              <label>Replacement / Service Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={transactionDate}
                onChange={e => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Cartridge / Item Model *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Canon Cartridge 337 or HP 680"
                value={model}
                onChange={e => setModel(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Unit Cost (LKR) *</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                value={unitCost}
                onChange={e => setUnitCost(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Supplier / Vendor</label>
              <input
                type="text"
                className="form-input"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Technician / Installed By</label>
              <input
                type="text"
                className="form-input"
                value={installedBy}
                onChange={e => setInstalledBy(e.target.value)}
              />
            </div>
          </div>

          {/* Live Cost Summary Banner */}
          <div className="p-3 my-4 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
            <span className="text-xs text-muted">
              Calculated Total: <strong>{quantity} unit(s) × Rs. {Number(unitCost).toLocaleString()}</strong>
            </span>
            <span className="text-sm font-bold text-cyan">
              Total Amount: Rs. {totalCost.toLocaleString()}
            </span>
          </div>

          {/* Official Bill & Invoice Attachment Section */}
          <div className="p-4 rounded border border-subtle bg-card/60 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-primary" />
              <h4 className="text-sm font-semibold text-primary">Official Vendor Bill / Invoice Attachment</h4>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Link Existing Stored Bill / Invoice</label>
                <select
                  className="form-input"
                  value={selectedInvoiceId}
                  onChange={e => {
                    setSelectedInvoiceId(e.target.value);
                    if (e.target.value) {
                      const inv = existingInvoices.find(i => i.InvoiceID === e.target.value);
                      if (inv) setInvoiceNumber(inv.InvoiceNumber || inv.InvoiceID);
                      setInvoiceFile(null);
                    }
                  }}
                >
                  <option value="">-- No Existing Invoice (Upload New Below) --</option>
                  {existingInvoices.map(inv => (
                    <option key={inv.InvoiceID} value={inv.InvoiceID}>
                      {inv.InvoiceID}: {inv.InvoiceNumber || 'Bill'} - Rs. {Number(inv.Amount).toLocaleString()} ({inv.Supplier || 'Vendor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Invoice / Reference Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1641 or KMN-INV-8821"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </div>
            </div>

            {!selectedInvoiceId && (
              <div className="mt-3">
                <label className="text-xs text-muted block mb-1.5 font-medium">Or Upload Bill PDF File (Synchronized with Vault):</label>
                <input
                  type="file"
                  id="toner-invoice-upload"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleInvoiceFileChange}
                />
                <label htmlFor="toner-invoice-upload" className="btn btn-outline text-xs cursor-pointer flex items-center gap-2 w-fit">
                  <Upload size={14} />
                  {invoiceFile ? `Selected: ${invoiceFile.name} (${Math.round(invoiceFile.size / 1024)} KB)` : 'Attach PDF Invoice File'}
                </label>
                {invoiceFile && (
                  <span className="text-xs text-emerald mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ready to store in public/invoices and link to expense
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-group mt-2">
            <label>Transaction Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="e.g. Replaced empty toner in HR Lobby, verified print alignment test."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="alert-box-info mt-3">
            <p className="text-xs">
              <strong>Relational Persistence:</strong> This transaction will be permanently saved in the Consumables table, registered as an expense, linked to the bill invoice, and will automatically update the printer's total recorded operating cost.
            </p>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Record Consumable Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
