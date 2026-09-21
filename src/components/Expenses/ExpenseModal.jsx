import React, { useState } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { expenseService } from '../../services/expenseService';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { printerService } from '../../services/printerService';

export default function ExpenseModal({ isOpen, onClose, onSaved }) {
  const assets = assetService.getAssets('All');
  const users = userService.getUsers('Active');
  const printers = printerService.getPrinters();

  const [expenseType, setExpenseType] = useState('Maintenance / Service');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [supplier, setSupplier] = useState('KMN IT Solution');
  const [paymentMethod, setPaymentMethod] = useState('Company Cheque');
  const [entityScope, setEntityScope] = useState('Asset'); // 'Asset', 'User', 'Printer', 'General'
  const [targetAssetId, setTargetAssetId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [targetPrinterId, setTargetPrinterId] = useState('');
  const [departmentId, setDepartmentId] = useState('DEP-0001');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      alert('Please provide a description and amount.');
      return;
    }

    await expenseService.logExpense({
      ExpenseType: expenseType,
      ExpenseDate: expenseDate,
      Description: description,
      Amount: Number(amount),
      Supplier: supplier,
      PaymentMethod: paymentMethod,
      AssetID: entityScope === 'Asset' ? targetAssetId : '',
      UserID: entityScope === 'User' ? targetUserId : '',
      PrinterAssetID: entityScope === 'Printer' ? targetPrinterId : '',
      DepartmentID: departmentId,
      Notes: notes
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-emerald" />
            <h2>Record IT Office Expense</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Expense Category *</label>
              <select
                className="form-input"
                value={expenseType}
                onChange={e => setExpenseType(e.target.value)}
              >
                <option value="Repair">Hardware Repair</option>
                <option value="Consumable / Toner">Printer Toner / Consumable</option>
                <option value="New Asset Purchase">New Equipment Purchase</option>
                <option value="Accessory">Peripherals & Accessories</option>
                <option value="Maintenance / Service">Periodic Maintenance / Service</option>
                <option value="Software / License">Software / License / Cloud</option>
                <option value="General Office">General IT / Infrastructure</option>
              </select>
            </div>

            <div className="form-group">
              <label>Expense Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label>Description *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Dell Latitude Battery Replacement or Canon Toner Cartridge"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount (LKR) *</label>
              <input
                type="number"
                min="0"
                required
                className="form-input"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
              >
                <option value="Company Cheque">Company Cheque</option>
                <option value="Cash">Cash / Petty Cash</option>
                <option value="Bank Transfer">Direct Bank Transfer</option>
                <option value="Credit Card">Corporate Credit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label>Supplier / Payee</label>
              <input
                type="text"
                className="form-input"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-2026-991"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Relational Entity Association */}
          <div className="entity-scope-box mt-4 p-3 bg-surface-elevated rounded-md border border-subtle">
            <span className="font-semibold text-sm">Associate Expense With:</span>
            <div className="flex gap-4 mt-2 mb-3">
              {['Asset', 'User', 'Printer', 'General'].map(scope => (
                <label key={scope} className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="scope"
                    value={scope}
                    checked={entityScope === scope}
                    onChange={() => setEntityScope(scope)}
                  />
                  {scope === 'General' ? 'General Office' : scope}
                </label>
              ))}
            </div>

            {entityScope === 'Asset' && (
              <div className="form-group">
                <label>Target Hardware Asset</label>
                <select
                  className="form-input"
                  value={targetAssetId}
                  onChange={e => setTargetAssetId(e.target.value)}
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(a => (
                    <option key={a.AssetID} value={a.AssetID}>
                      {a.Brand} {a.Model} ({a.VerifiedNo}) - {a.AssignedUserName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {entityScope === 'User' && (
              <div className="form-group">
                <label>Target Staff Member</label>
                <select
                  className="form-input"
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u.UserID} value={u.UserID}>{u.Name} ({u.UserID})</option>
                  ))}
                </select>
              </div>
            )}

            {entityScope === 'Printer' && (
              <div className="form-group">
                <label>Target Office Printer</label>
                <select
                  className="form-input"
                  value={targetPrinterId}
                  onChange={e => setTargetPrinterId(e.target.value)}
                >
                  <option value="">-- Choose Printer --</option>
                  {printers.map(p => (
                    <option key={p.PrinterID} value={p.AssetID}>{p.PrinterName} ({p.LocationName})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group mt-4">
            <label>Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Additional billing details..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
