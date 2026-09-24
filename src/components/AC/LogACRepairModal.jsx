import React, { useState } from 'react';
import { X, AlertTriangle, Upload, DollarSign, Calendar, Wrench, CheckCircle2 } from 'lucide-react';
import { acService } from '../../services/acService';

export default function LogACRepairModal({ isOpen, onClose, unit, onRepairLogged }) {
  const [formData, setFormData] = useState({
    IssueDate: new Date().toISOString().split('T')[0],
    ResolvedDate: '',
    IssueDescription: '',
    PartsReplaced: '',
    RepairCost: '',
    Technician: '',
    Status: 'In Progress', // 'In Progress', 'Completed'
    InvoiceNo: '',
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

    if (!formData.IssueDescription.trim()) {
      setError('Please provide a description of the issue or breakdown.');
      return;
    }

    try {
      setIsSubmitting(true);
      await acService.logRepair({
        ...formData,
        UnitID: unit.UnitID,
        RepairCost: Number(formData.RepairCost) || 0,
        billFile
      });

      if (onRepairLogged) onRepairLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log AC repair:', err);
      setError('Failed to record breakdown repair. Please try again.');
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
                backgroundColor: 'var(--accent-rose-bg)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Log AC Breakdown & Repair
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
                Issue Reported Date *
              </label>
              <input
                type="date"
                required
                value={formData.IssueDate}
                onChange={e => handleChange('IssueDate', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Repair Status *
              </label>
              <select
                value={formData.Status}
                onChange={e => {
                  handleChange('Status', e.target.value);
                  if (e.target.value === 'Completed' && !formData.ResolvedDate) {
                    handleChange('ResolvedDate', new Date().toISOString().split('T')[0]);
                  }
                }}
                className="form-input"
                style={{ width: '100%', fontWeight: 600 }}
              >
                <option value="In Progress">🔴 In Progress (Unit Under Repair)</option>
                <option value="Completed">🟢 Completed (Unit Restored to Active)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Issue / Breakdown Description *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Unit blowing warm air, compressor humming without starting, water leaking..."
              value={formData.IssueDescription}
              onChange={e => handleChange('IssueDescription', e.target.value)}
              className="form-textarea"
              style={{ width: '100%', resize: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Parts Replaced / Repaired
              </label>
              <input
                type="text"
                placeholder="e.g. Capacitor 45uF, PCB Relay"
                value={formData.PartsReplaced}
                onChange={e => handleChange('PartsReplaced', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Total Repair Cost (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 18500"
                value={formData.RepairCost}
                onChange={e => handleChange('RepairCost', e.target.value)}
                className="form-input font-mono"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Technician / Workshop
              </label>
              <input
                type="text"
                placeholder="e.g. Chilaw Refrigeration, In-house IT"
                value={formData.Technician}
                onChange={e => handleChange('Technician', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                Resolved Date
              </label>
              <input
                type="date"
                value={formData.ResolvedDate}
                onChange={e => handleChange('ResolvedDate', e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Invoice / Repair Bill Number
            </label>
            <input
              type="text"
              placeholder="e.g. REP-AC-2026-09"
              value={formData.InvoiceNo}
              onChange={e => handleChange('InvoiceNo', e.target.value)}
              className="form-input font-mono"
              style={{ width: '100%' }}
            />
          </div>

          {/* Bill Attachment */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
              Attach Repair Invoice / Job Sheet (PDF or Photo)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label className="btn btn-outline" style={{ flex: 1, cursor: 'pointer', fontSize: '0.75rem', padding: '0.65rem 1rem' }}>
                <Upload size={14} style={{ color: 'var(--accent-rose)' }} />
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
              Repair Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Replaced capacitor, pressure tested lines, verified 20 minutes continuous cooling."
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
              style={{ backgroundColor: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
            >
              {isSubmitting ? 'Recording...' : 'Log Breakdown Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
