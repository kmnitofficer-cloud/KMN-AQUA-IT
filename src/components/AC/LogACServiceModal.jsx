import React, { useState } from 'react';
import { X, Wrench, Upload, Calendar, DollarSign, UserCheck, ShieldCheck, Check } from 'lucide-react';
import { acService } from '../../services/acService';

export default function LogACServiceModal({ isOpen, onClose, unit, onServiceLogged }) {
  const [formData, setFormData] = useState({
    ServiceDate: new Date().toISOString().split('T')[0],
    ServiceType: 'Routine Maintenance',
    Cost: '',
    Technician: 'Lanka Cool Tech (Pvt) Ltd',
    InvoiceNo: '',
    GasRefillPSI: '140 PSI (Normal)',
    FilterCleaned: true,
    CoilCleaned: true,
    NextServiceDue: '',
    Notes: ''
  });

  const [billFile, setBillFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !unit) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setBillFile(e.target.files[0]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.Cost || isNaN(formData.Cost) || Number(formData.Cost) < 0) {
      setError('Please enter a valid service cost (0 or greater).');
      return;
    }

    try {
      setIsSubmitting(true);
      await acService.logService({
        ...formData,
        UnitID: unit.UnitID,
        Cost: Number(formData.Cost),
        billFile
      });

      if (onServiceLogged) onServiceLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log AC service:', err);
      setError('Failed to record service. Please try again.');
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
                backgroundColor: 'var(--accent-amber-bg)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wrench size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Log AC Maintenance Service
              </h2>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {unit.UnitCode} • {unit.Brand} {unit.Model} ({unit.RoomName})
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
                Service Date *
              </label>
              <input
                type="date"
                required
                value={formData.ServiceDate}
                onChange={e => handleChange('ServiceDate', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Service Type *
              </label>
              <select
                value={formData.ServiceType}
                onChange={e => handleChange('ServiceType', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="Routine Maintenance">Routine Maintenance & Filter Clean</option>
                <option value="Chemical Wash & Gas Top-up">Chemical Wash & Gas Top-up</option>
                <option value="Gas Refill Only">Gas Refill Only</option>
                <option value="Deep Blower Pressure Clean">Deep Blower Pressure Clean</option>
                <option value="Full Comprehensive Service">Full Comprehensive Service</option>
                <option value="Emergency Service">Emergency Service</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Service Cost (Rs.) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="100"
                placeholder="e.g. 5500"
                value={formData.Cost}
                onChange={e => handleChange('Cost', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Technician / Contractor
              </label>
              <input
                type="text"
                placeholder="e.g. Lanka Cool Tech, Abans"
                value={formData.Technician}
                onChange={e => handleChange('Technician', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Invoice / Bill Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-AC-2026-10"
                value={formData.InvoiceNo}
                onChange={e => handleChange('InvoiceNo', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Gas Level / PSI Reading
              </label>
              <input
                type="text"
                placeholder="e.g. 140 PSI (OK)"
                value={formData.GasRefillPSI}
                onChange={e => handleChange('GasRefillPSI', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={formData.FilterCleaned}
                onChange={e => handleChange('FilterCleaned', e.target.checked)}
              />
              <span>Indoor Filters Cleaned</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={formData.CoilCleaned}
                onChange={e => handleChange('CoilCleaned', e.target.checked)}
              />
              <span>Cooling Coils Washed</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Next Scheduled Service Due
            </label>
            <input
              type="date"
              value={formData.NextServiceDue}
              onChange={e => handleChange('NextServiceDue', e.target.value)}
              className="form-input font-mono"
              style={{ width: '100%' }}
            />
          </div>

          {/* Bill Attachment */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Attach Service Invoice / Receipt (PDF or Image)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="btn btn-outline" style={{ flex: 1, cursor: 'pointer', fontSize: '0.75rem', padding: '0.65rem 1rem' }}>
                <Upload size={14} style={{ color: 'var(--brand-primary)' }} />
                <span>{billFile ? billFile.name : 'Choose invoice file (PDF, JPG, PNG)'}</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              {billFile && (
                <button
                  type="button"
                  onClick={() => setBillFile(null)}
                  className="btn btn-outline"
                  style={{ color: 'var(--accent-rose)' }}
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Service Notes & Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Blower fan running smoothly, condenser coil cleared of dust, optimal cooling achieved."
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
              {isSubmitting ? 'Recording...' : 'Save Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
