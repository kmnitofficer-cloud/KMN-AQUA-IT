import React, { useState } from 'react';
import { X, Plus, Edit2, MapPin } from 'lucide-react';
import { acService, AC_BRANDS, AC_FLOORS, AC_WORK_MODES, AC_STATUSES } from '../../services/acService';

export default function ACUnitFormModal({ isOpen, onClose, unitToEdit, onSaved, defaultFloor = 'Ground Floor' }) {
  const isEditing = Boolean(unitToEdit);

  const [formData, setFormData] = useState({
    UnitNumber: unitToEdit ? unitToEdit.UnitNumber : '',
    UnitCode: unitToEdit ? unitToEdit.UnitCode : '',
    Floor: unitToEdit ? unitToEdit.Floor : defaultFloor,
    RoomName: unitToEdit ? unitToEdit.RoomName : '',
    WallPosition: unitToEdit ? unitToEdit.WallPosition : 'North Wall',
    Brand: unitToEdit ? unitToEdit.Brand : 'Panasonic',
    Model: unitToEdit ? unitToEdit.Model : '',
    CapacityBTU: unitToEdit ? unitToEdit.CapacityBTU : '18,000 BTU',
    RefrigerantType: unitToEdit ? unitToEdit.RefrigerantType : 'R32',
    PowerRating: unitToEdit ? unitToEdit.PowerRating : '1.5 kW',
    PurchaseDate: unitToEdit ? unitToEdit.PurchaseDate : new Date().toISOString().split('T')[0],
    PurchasePrice: unitToEdit ? unitToEdit.PurchasePrice : '',
    Supplier: unitToEdit ? unitToEdit.Supplier : '',
    WarrantyUntil: unitToEdit ? unitToEdit.WarrantyUntil : '',
    Status: unitToEdit ? unitToEdit.Status : 'Active',
    WorkMode: unitToEdit ? unitToEdit.WorkMode : 'Normal Cooling',
    TargetTemp: unitToEdit ? unitToEdit.TargetTemp : 22,
    CoordX: unitToEdit ? unitToEdit.CoordX : 300,
    CoordY: unitToEdit ? unitToEdit.CoordY : 200,
    Notes: unitToEdit ? unitToEdit.Notes : ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.RoomName.trim() || !formData.Model.trim()) {
      setError('Please provide room name and model.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await acService.updateACUnit(unitToEdit.UnitID, formData);
      } else {
        await acService.addACUnit(formData);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save AC unit:', err);
      setError('Failed to save unit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="form-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--brand-glow)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {isEditing ? `Edit AC Unit (${unitToEdit.UnitCode})` : 'Add New AC Unit'}
              </h2>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {isEditing ? `${unitToEdit.Brand} ${unitToEdit.Model}` : 'Deploy new unit onto building blueprint'}
              </span>
            </div>
          </div>
          <button className="btn btn-outline" style={{ padding: '0.35rem 0.55rem', height: 'auto' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="form-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div className="alert-feed-item alert-danger" style={{ padding: '0.65rem 0.85rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Floor *
              </label>
              <select
                value={formData.Floor}
                onChange={e => handleChange('Floor', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                {AC_FLOORS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Room / Zone Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Accounts Room, Boss Office"
                value={formData.RoomName}
                onChange={e => handleChange('RoomName', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Brand *
              </label>
              <select
                value={formData.Brand}
                onChange={e => handleChange('Brand', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                {AC_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Model Name / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS-S18TKH Inverter"
                value={formData.Model}
                onChange={e => handleChange('Model', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Cooling Capacity
              </label>
              <select
                value={formData.CapacityBTU}
                onChange={e => handleChange('CapacityBTU', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="9,000 BTU">9,000 BTU</option>
                <option value="12,000 BTU">12,000 BTU</option>
                <option value="18,000 BTU">18,000 BTU</option>
                <option value="24,000 BTU">24,000 BTU</option>
                <option value="36,000 BTU">36,000 BTU</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Refrigerant
              </label>
              <select
                value={formData.RefrigerantType}
                onChange={e => handleChange('RefrigerantType', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="R32">R32</option>
                <option value="R410A">R410A</option>
                <option value="R22">R22</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Purchase (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="195000"
                value={formData.PurchasePrice}
                onChange={e => handleChange('PurchasePrice', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Status
              </label>
              <select
                value={formData.Status}
                onChange={e => handleChange('Status', e.target.value)}
                className="form-input"
                style={{ width: '100%', fontWeight: 600 }}
              >
                {AC_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Work Mode
              </label>
              <select
                value={formData.WorkMode}
                onChange={e => handleChange('WorkMode', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                {AC_WORK_MODES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Target Temp (°C)
              </label>
              <input
                type="number"
                min="16"
                max="30"
                value={formData.TargetTemp}
                onChange={e => handleChange('TargetTemp', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Supplier
              </label>
              <input
                type="text"
                placeholder="e.g. Singer, Abans"
                value={formData.Supplier}
                onChange={e => handleChange('Supplier', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Warranty Until
              </label>
              <input
                type="date"
                value={formData.WarrantyUntil}
                onChange={e => handleChange('WarrantyUntil', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Coordinates */}
          <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <MapPin size={14} style={{ color: 'var(--brand-primary)' }} />
              Blueprint Pin Position (SVG Coordinates)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="text-muted" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>X Coordinate (0 - 900)</label>
                <input
                  type="number"
                  min="50"
                  max="850"
                  value={formData.CoordX}
                  onChange={e => handleChange('CoordX', Number(e.target.value))}
                  className="form-input font-mono"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.2rem' }}>Y Coordinate (0 - 950)</label>
                <input
                  type="number"
                  min="50"
                  max="950"
                  value={formData.CoordY}
                  onChange={e => handleChange('CoordY', Number(e.target.value))}
                  className="form-input font-mono"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.Notes}
              onChange={e => handleChange('Notes', e.target.value)}
              className="form-textarea"
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          {/* Footer Actions */}
          <div className="form-modal-footer" style={{ padding: '0.75rem 0 0 0', margin: 0 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add AC Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
