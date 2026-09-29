import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Tag, Layers, Building, DollarSign } from 'lucide-react';
import fixedAssetService from '../../services/fixedAssetService';

export default function AssetFormModal({
  isOpen,
  onClose,
  assetToEdit = null,
  onSuccess = () => {}
}) {
  const [formData, setFormData] = useState({
    itemName: '',
    tagNumber: '',
    keyword: 'Chair',
    category: 'Furniture & Fittings',
    zoneId: 'main_office',
    user: '',
    condition: 'Usable',
    brand: '',
    model: '',
    serialNo: '',
    amount: '',
    purchasedBy: '',
    description: '',
    remarks: ''
  });

  useEffect(() => {
    if (assetToEdit) {
      setFormData({
        itemName: assetToEdit.itemName || '',
        tagNumber: assetToEdit.tagNumber || '',
        keyword: assetToEdit.keyword || 'Chair',
        category: assetToEdit.category || 'Furniture & Fittings',
        zoneId: assetToEdit.zoneId || 'main_office',
        user: assetToEdit.user || '',
        condition: assetToEdit.condition || 'Usable',
        brand: assetToEdit.brand || '',
        model: assetToEdit.model || '',
        serialNo: assetToEdit.serialNo || '',
        amount: assetToEdit.amount || '',
        purchasedBy: assetToEdit.purchasedBy || '',
        description: assetToEdit.description || '',
        remarks: assetToEdit.remarks || ''
      });
    } else {
      setFormData({
        itemName: '',
        tagNumber: '',
        keyword: 'Chair',
        category: 'Furniture & Fittings',
        zoneId: 'main_office',
        user: '',
        condition: 'Usable',
        brand: '',
        model: '',
        serialNo: '',
        amount: '',
        purchasedBy: '',
        description: '',
        remarks: ''
      });
    }
  }, [assetToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (assetToEdit) {
      const updated = fixedAssetService.updateAsset(assetToEdit.id, formData);
      onSuccess(updated);
    } else {
      const added = fixedAssetService.addAsset(formData);
      onSuccess(added);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '540px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 163, 255, 0.15)', color: '#00A3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} />
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {assetToEdit ? 'Edit Asset Details' : 'Add New Fixed Asset'}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.3rem', height: 'auto', borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Item Name *</label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g. High Back Chair"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Tag / Verification No</label>
              <input
                type="text"
                value={formData.tagNumber}
                onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                placeholder="e.g. KMN/CH/FF/259"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input select"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Furniture & Fittings">Furniture & Fittings</option>
                <option value="Computers & IT">Computers & IT</option>
                <option value="Office Equipment">Office Equipment</option>
                <option value="CCTV & Security">CCTV & Security</option>
                <option value="Air Conditioners">Air Conditioners</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Keyword / Subcategory</label>
              <select
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="input select"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Chair">Chair</option>
                <option value="Table & Desk">Table & Desk</option>
                <option value="Storage & Racks">Storage & Racks</option>
                <option value="Computer & Hardware">Computer & Hardware</option>
                <option value="Monitor">Monitor</option>
                <option value="Laptop">Laptop</option>
                <option value="UPS">UPS</option>
                <option value="Printer">Printer</option>
                <option value="Fan">Fan</option>
                <option value="Telephone">Telephone</option>
                <option value="Air Conditioner">Air Conditioner</option>
                <option value="CCTV & Camera">CCTV & Camera</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Room / Zone *</label>
              <select
                value={formData.zoneId}
                onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                className="input select"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              >
                <optgroup label="Ground Floor">
                  <option value="main_office">Ground Operations Hall (Main Office)</option>
                  <option value="md_office">MD's Office Room</option>
                  <option value="md_lobby">MD Office Lobby</option>
                  <option value="reception">Reception & Front Lobby</option>
                  <option value="recovery_office">Recovery Team Office Room</option>
                  <option value="stationary_room">Stationary & Records Room</option>
                  <option value="ground_dining">Ground Floor Dining & Pantry</option>
                  <option value="stores">Chilaw Stores (Mr. Wasantha)</option>
                  <option value="fish_tank">Fish Tank Gallery</option>
                </optgroup>
                <optgroup label="1st Floor">
                  <option value="auditorium">Main Auditorium</option>
                  <option value="nadun_office">Mr. Nadun's Office</option>
                  <option value="nadun_lobby">1st Floor Main Hall & Lobby</option>
                  <option value="conference_room">Main Conference Room</option>
                  <option value="first_dining">1st Floor Dining Room</option>
                  <option value="chilaw_lab">Chilaw Lab (New Lab)</option>
                  <option value="rest_room">Discussion Room / Rest Room</option>
                </optgroup>
                <optgroup label="Off-Site">
                  <option value="palavi">Palavi Branch Office</option>
                  <option value="second_land">2nd Land Facility / Hatchery</option>
                  <option value="home_residence">Home Residence / External</option>
                </optgroup>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Assigned User / Custodian</label>
              <input
                type="text"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                placeholder="e.g. Ms. Ishara, MD, Common"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="input select"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Usable">Usable / Good</option>
                <option value="New">Brand New</option>
                <option value="Damaged">Damaged / Needs Attention</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Amount (LKR)</label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 42000"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Brand / Model</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Damro / Alpha"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Serial No</label>
              <input
                type="text"
                value={formData.serialNo}
                onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                placeholder="Serial or barcode"
                className="input"
                style={{ width: '100%', height: '34px', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 700 }}>Description / Remarks</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Features, material, dimensions..."
              className="input"
              style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.4rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              <span>{assetToEdit ? 'Save Changes' : 'Add Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
