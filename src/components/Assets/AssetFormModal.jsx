import React, { useState, useEffect } from 'react';
import { X, Save, Laptop } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';

export default function AssetFormModal({ isOpen, onClose, asset = null, onSaved }) {
  const users = userService.getUsers('Active');

  const [formData, setFormData] = useState({
    VerifiedNo: '',
    AssetType: 'Laptop',
    Brand: 'Dell',
    Model: '',
    SerialNumber: '',
    Specifications: '',
    PurchaseDate: new Date().toISOString().split('T')[0],
    PurchaseCost: 0,
    WarrantyStart: new Date().toISOString().split('T')[0],
    WarrantyEnd: '',
    Status: 'Available',
    CurrentUserID: '',
    CurrentLocationID: 'LOC-0001',
    Notes: ''
  });

  useEffect(() => {
    if (asset) {
      setFormData({
        AssetID: asset.AssetID,
        VerifiedNo: asset.VerifiedNo || '',
        AssetType: asset.AssetType || 'Laptop',
        Brand: asset.Brand || 'Dell',
        Model: asset.Model || '',
        SerialNumber: asset.SerialNumber || '',
        Specifications: asset.Specifications || '',
        PurchaseDate: asset.PurchaseDate || '',
        PurchaseCost: asset.PurchaseCost || 0,
        WarrantyStart: asset.WarrantyStart || '',
        WarrantyEnd: asset.WarrantyEnd || '',
        Status: asset.Status || 'Available',
        CurrentUserID: asset.CurrentUserID || '',
        CurrentLocationID: asset.CurrentLocationID || 'LOC-0001',
        Notes: asset.Notes || ''
      });
    } else {
      setFormData({
        VerifiedNo: '',
        AssetType: 'Laptop',
        Brand: 'Dell',
        Model: '',
        SerialNumber: '',
        Specifications: '',
        PurchaseDate: new Date().toISOString().split('T')[0],
        PurchaseCost: 0,
        WarrantyStart: new Date().toISOString().split('T')[0],
        WarrantyEnd: '',
        Status: 'Available',
        CurrentUserID: '',
        CurrentLocationID: 'LOC-0001',
        Notes: ''
      });
    }
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Model.trim()) {
      alert('Please enter a machine or model name.');
      return;
    }
    await assetService.saveAsset(formData);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Laptop size={20} className="text-primary" />
            <h2>{asset ? `Edit Asset (${asset.AssetID})` : 'Register New IT Asset'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Asset Category *</label>
              <select
                className="form-input"
                value={formData.AssetType}
                onChange={e => setFormData({ ...formData, AssetType: e.target.value })}
              >
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="All-in-One">All-in-One</option>
                <option value="CPU">CPU / System Unit</option>
                <option value="Monitor">Monitor</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Printer">Printer</option>
                <option value="UPS">UPS</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Accessory">Accessory</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Company Verified No / Tag</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. KMN/CH/CP/080"
                value={formData.VerifiedNo}
                onChange={e => setFormData({ ...formData, VerifiedNo: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Brand / Manufacturer *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Dell, HP, ASUS, Canon"
                value={formData.Brand}
                onChange={e => setFormData({ ...formData, Brand: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Model & Item Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Latitude 5420 or Pro 200 G4"
                value={formData.Model}
                onChange={e => setFormData({ ...formData, Model: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>OEM Factory Serial Number</label>
              <input
                type="text"
                className="form-input font-mono"
                placeholder="e.g. 7X89B23"
                value={formData.SerialNumber}
                onChange={e => setFormData({ ...formData, SerialNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Acquisition Cost (LKR)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 250000"
                value={formData.PurchaseCost}
                onChange={e => setFormData({ ...formData, PurchaseCost: Number(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label>Purchase Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.PurchaseDate}
                onChange={e => setFormData({ ...formData, PurchaseDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Warranty Expiration Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.WarrantyEnd}
                onChange={e => setFormData({ ...formData, WarrantyEnd: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Initial Status</label>
              <select
                className="form-input"
                value={formData.Status}
                onChange={e => setFormData({ ...formData, Status: e.target.value })}
              >
                <option value="Available">Available (In Storage)</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Disposed">Disposed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign to Employee</label>
              <select
                className="form-input"
                value={formData.CurrentUserID}
                onChange={e => setFormData({
                  ...formData,
                  CurrentUserID: e.target.value,
                  Status: e.target.value ? 'Assigned' : 'Available'
                })}
              >
                <option value="">-- Leave Unassigned (Storage) --</option>
                {users.map(u => (
                  <option key={u.UserID} value={u.UserID}>{u.Name} ({u.UserID})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Location</label>
              <select
                className="form-input"
                value={formData.CurrentLocationID}
                onChange={e => setFormData({ ...formData, CurrentLocationID: e.target.value })}
              >
                <option value="LOC-0001">Chilaw Office</option>
                <option value="LOC-0002">Palaviya Office</option>
                <option value="LOC-0003">HR Lobby</option>
                <option value="LOC-0004">IT Store / Storage</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Hardware Specifications</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Intel Core i5 11th Gen, 16GB RAM, 512GB NVMe SSD"
              value={formData.Specifications}
              onChange={e => setFormData({ ...formData, Specifications: e.target.value })}
            />
          </div>

          <div className="form-group mt-4">
            <label>Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Vendor info, condition remarks, etc."
              value={formData.Notes}
              onChange={e => setFormData({ ...formData, Notes: e.target.value })}
            ></textarea>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
