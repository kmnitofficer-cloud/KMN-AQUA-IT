import React, { useState } from 'react';
import { X, RefreshCw, AlertCircle, ArrowRight, ShieldCheck, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { acService, AC_BRANDS } from '../../services/acService';

export default function ReplaceACModal({ isOpen, onClose, unit, onReplaced }) {
  const [removalDate, setRemovalDate] = useState(new Date().toISOString().split('T')[0]);
  const [removalReason, setRemovalReason] = useState('Repeated breakdowns / upgrade to high-efficiency inverter');
  const [finalCondition, setFinalCondition] = useState('Scrapped / Salvaged for parts');

  const [newUnitData, setNewUnitData] = useState({
    Brand: 'Panasonic',
    Model: '',
    CapacityBTU: unit ? unit.CapacityBTU : '18,000 BTU',
    RefrigerantType: 'R32',
    PowerRating: '1.5 kW',
    PurchaseDate: new Date().toISOString().split('T')[0],
    PurchasePrice: '',
    Supplier: 'Singer Sri Lanka PLC',
    WarrantyUntil: '',
    Notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !unit) return null;

  const handleNewChange = (field, value) => {
    setNewUnitData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!newUnitData.Model.trim()) {
      setError('Please provide the model name/number of the new replacement unit.');
      return;
    }

    if (!newUnitData.PurchasePrice || isNaN(newUnitData.PurchasePrice) || Number(newUnitData.PurchasePrice) <= 0) {
      setError('Please enter a valid purchase price for the new unit.');
      return;
    }

    try {
      setIsSubmitting(true);
      await acService.replaceUnit({
        oldUnitId: unit.UnitID,
        RemovalDate: removalDate,
        RemovalReason: removalReason,
        FinalCondition: finalCondition,
        newUnitData
      });

      if (onReplaced) onReplaced();
      onClose();
    } catch (err) {
      console.error('Failed to replace AC unit:', err);
      setError('Failed to process replacement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="form-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--accent-violet-bg)',
                color: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                Replace & Upgrade AC Unit
              </h2>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                Spot: {unit.UnitCode} • {unit.RoomName} ({unit.Floor})
              </span>
            </div>
          </div>
          <button className="btn btn-outline" style={{ padding: '0.35rem 0.55rem', height: 'auto' }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="form-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert-feed-item alert-danger" style={{ padding: '0.65rem 0.85rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>{error}</span>
            </div>
          )}

          {/* Section 1: Old Machine Being Removed */}
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
                <AlertCircle size={14} />
                Current Machine Being Decommissioned
              </span>
              <span className="id-pill font-mono">{unit.UnitID}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', backgroundColor: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Unit / Model:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{unit.Brand} {unit.Model}</span>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Initial Purchase:</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rs. {Number(unit.PurchasePrice || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Maintenance:</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                  Rs. {Number(unit.lifetimeServiceCost || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Repairs:</span>
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                  Rs. {Number(unit.lifetimeRepairCost || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span className="text-muted" style={{ display: 'block', fontSize: '0.7rem' }}>Total Lifetime Investment:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                  Rs. {Number(unit.totalInvestedCost || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Removal Date *
                </label>
                <input
                  type="date"
                  required
                  value={removalDate}
                  onChange={e => setRemovalDate(e.target.value)}
                  className="form-input font-mono"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Reason for Removal *
                </label>
                <input
                  type="text"
                  required
                  value={removalReason}
                  onChange={e => setRemovalReason(e.target.value)}
                  placeholder="e.g. Compressor dead, high power consumption"
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Final Destination / Disposal *
                </label>
                <select
                  value={finalCondition}
                  onChange={e => setFinalCondition(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                >
                  <option value="Scrapped / Salvaged for parts">Scrapped / Salvaged for parts</option>
                  <option value="Kept in Workshop Storage">Kept in Workshop Storage</option>
                  <option value="Sold to Scrap Buyer">Sold to Scrap Buyer</option>
                  <option value="Returned to Supplier / Warranty Claim">Returned to Supplier / Warranty Claim</option>
                  <option value="Donated / Reassigned to Secondary Facility">Donated / Reassigned to Secondary Facility</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transition Arrow Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--accent-violet)', fontWeight: 600, fontSize: '0.8rem' }}>
            <span>Decommissioning Old Unit</span>
            <ArrowRight size={16} />
            <span>Installing New Replacement Unit</span>
          </div>

          {/* Section 2: New Replacement Machine Details */}
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--accent-violet-bg)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-violet)', display: 'flex', alignItems: 'center', gap: '0.4rem', textTransform: 'uppercase' }}>
              <Sparkles size={14} />
              New Replacement Machine Specifications
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Brand *
                </label>
                <select
                  value={newUnitData.Brand}
                  onChange={e => handleNewChange('Brand', e.target.value)}
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
                  Model Name / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-XU18XKH-1 Aero Series Inverter"
                  value={newUnitData.Model}
                  onChange={e => handleNewChange('Model', e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Cooling Capacity (BTU)
                </label>
                <select
                  value={newUnitData.CapacityBTU}
                  onChange={e => handleNewChange('CapacityBTU', e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="9,000 BTU">9,000 BTU</option>
                  <option value="12,000 BTU">12,000 BTU</option>
                  <option value="18,000 BTU">18,000 BTU</option>
                  <option value="24,000 BTU">24,000 BTU</option>
                  <option value="36,000 BTU">36,000 BTU (Cassette)</option>
                  <option value="48,000 BTU">48,000 BTU (Standing)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Refrigerant Gas
                </label>
                <select
                  value={newUnitData.RefrigerantType}
                  onChange={e => handleNewChange('RefrigerantType', e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="R32">R32 (Eco Inverter)</option>
                  <option value="R410A">R410A</option>
                  <option value="R22">R22 (Legacy)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Power Rating
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.45 kW"
                  value={newUnitData.PowerRating}
                  onChange={e => handleNewChange('PowerRating', e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  New Unit Purchase (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  placeholder="e.g. 215000"
                  value={newUnitData.PurchasePrice}
                  onChange={e => handleNewChange('PurchasePrice', e.target.value)}
                  className="form-input font-mono"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singer Sri Lanka PLC, Abans PLC"
                  value={newUnitData.Supplier}
                  onChange={e => handleNewChange('Supplier', e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Installation Date
                </label>
                <input
                  type="date"
                  value={newUnitData.PurchaseDate}
                  onChange={e => handleNewChange('PurchaseDate', e.target.value)}
                  className="form-input font-mono"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' }}>
                  Warranty Valid Until
                </label>
                <input
                  type="date"
                  value={newUnitData.WarrantyUntil}
                  onChange={e => handleNewChange('WarrantyUntil', e.target.value)}
                  className="form-input font-mono"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="form-modal-footer" style={{ padding: '0.75rem 0 0 0', margin: 0, justifyContent: 'space-between' }}>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>
              * Old machine's full history and lifetime costs will be archived permanently.
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                style={{ backgroundColor: 'var(--accent-violet)', borderColor: 'var(--accent-violet)' }}
              >
                {isSubmitting ? 'Processing...' : 'Decommission & Install New Unit'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
