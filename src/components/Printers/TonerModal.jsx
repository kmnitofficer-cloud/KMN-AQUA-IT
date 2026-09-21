import React, { useState, useEffect } from 'react';
import { X, Printer, Plus, Save } from 'lucide-react';
import { printerService } from '../../services/printerService';

export default function TonerModal({ printerAssetId, isOpen, onClose, onSaved }) {
  const printers = printerService.getPrinters();
  const selectedPrinter = printers.find(p => p.AssetID === printerAssetId) || printers[0];

  const [targetAssetId, setTargetAssetId] = useState(printerAssetId || '');
  const [consumableType, setConsumableType] = useState('Black Toner');
  const [brand, setBrand] = useState('Canon');
  const [model, setModel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(2200);
  const [supplier, setSupplier] = useState('KMN IT Solution');
  const [installedBy, setInstalledBy] = useState('KMN IT Service Specialist');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

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
      supplier,
      installedBy,
      invoiceNumber,
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
              <label>Cartridge / Item Model</label>
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
              <label>Quantity</label>
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
              <label>Unit Cost (LKR)</label>
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

            <div className="form-group">
              <label>Invoice / Reference No</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. KMN-INV-8821"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Transaction Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="e.g. Replaced empty toner in HR Lobby, verified print alignment test."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="alert-box-info mt-4">
            <p className="text-xs">
              <strong>Relational Persistence:</strong> This transaction will be permanently saved in the Consumables table, registered as an expense, and will automatically update the printer's total recorded cost.
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
