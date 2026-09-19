import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Sparkles } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'CPU / Desktop',
  'Laptop',
  'Monitor',
  'UPS',
  'Printer / Scanner',
  'Keyboard',
  'Mouse',
  'Network / Switch / Router',
  'Other Accessory'
];

const DEFAULT_OFFICES = [
  'Chilaw Office',
  'Palavi Office',
  'Common / Lobby',
  'Storage / Scrap'
];

export default function MachineModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingMachines = []
}) {
  const [formData, setFormData] = useState({
    item_name: '',
    verified_no: '',
    category: 'CPU / Desktop',
    office: 'Chilaw Office',
    assigned_to: '',
    status: 'Working',
    remarks: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        item_name: initialData.item_name || '',
        verified_no: initialData.verified_no || '',
        category: initialData.category || 'CPU / Desktop',
        office: initialData.office || 'Chilaw Office',
        assigned_to: initialData.assigned_to || '',
        status: initialData.status || 'Working',
        remarks: initialData.remarks || ''
      });
    } else {
      setFormData({
        item_name: '',
        verified_no: '',
        category: 'CPU / Desktop',
        office: 'Chilaw Office',
        assigned_to: '',
        status: 'Working',
        remarks: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.id);

  // Auto generate next asset tag like KMN/CH/CP/080
  const handleAutoSuggestTag = () => {
    let maxNum = 0;
    const prefix = formData.office === 'Palavi Office' ? 'KMN/PL/CP/' : 'KMN/CH/CP/';
    
    existingMachines.forEach(m => {
      if (m.verified_no && m.verified_no.includes('/')) {
        const parts = m.verified_no.split('/');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextTag = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
    setFormData(prev => ({ ...prev, verified_no: nextTag }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      alert('Please enter an Item / Computer Name');
      return;
    }

    onSave({
      ...initialData,
      ...formData,
      item_name: formData.item_name.trim(),
      verified_no: formData.verified_no.trim(),
      assigned_to: formData.assigned_to.trim() || 'Unassigned',
      remarks: formData.remarks.trim()
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isEditing ? <Save size={18} /> : <PlusCircle size={18} />}
            <span>{isEditing ? 'Edit Computer Details' : 'Add New Computer / Asset'}</span>
          </h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Item / Computer Name */}
              <div className="form-group full-width">
                <label>Item / Computer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dell Vostro 3681 Desktop, HP 24-inch Monitor, HP Laptop 15"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  required
                />
              </div>

              {/* Verified No (Asset Tag) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Verified No / Asset Tag</label>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={handleAutoSuggestTag}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--brand-primary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Sparkles size={11} />
                      Auto-generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. KMN/CH/CP/026"
                  value={formData.verified_no}
                  onChange={(e) => setFormData({ ...formData, verified_no: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Office / Branch */}
              <div className="form-group">
                <label>Office / Branch</label>
                <select
                  className="form-select"
                  value={formData.office}
                  onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                >
                  {DEFAULT_OFFICES.map(off => (
                    <option key={off} value={off}>{off}</option>
                  ))}
                </select>
              </div>

              {/* Assigned To User */}
              <div className="form-group">
                <label>Assigned User / Department</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ms. Mishel, Mr. Sampath, HR Lobby, Accounts"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="form-group full-width">
                <label>Operational Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Working">Operational (Working)</option>
                  <option value="Under Service">Under Service / In Repair</option>
                  <option value="Not in use">Not in Use (Storage / Surplus)</option>
                  <option value="Not Working">Not Working / Defective</option>
                </select>
              </div>

              {/* Remarks / Hardware Specs */}
              <div className="form-group full-width">
                <label>Hardware Specifications & Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Intel Core i3-4160 @ 3.6GHz, 4GB DDR3 RAM, 500GB HDD, Windows 8.1 Pro, Keyboard sticky"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={15} />
              <span>{isEditing ? 'Save Changes' : 'Insert Computer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
