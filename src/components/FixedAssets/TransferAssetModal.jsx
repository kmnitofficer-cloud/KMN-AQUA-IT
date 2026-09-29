import React, { useState } from 'react';
import { X, ArrowRightLeft, Building, User, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import fixedAssetService from '../../services/fixedAssetService';

export default function TransferAssetModal({
  isOpen,
  onClose,
  asset,
  onTransferSuccess = () => {}
}) {
  const zones = fixedAssetService.getZones();
  const [toZoneId, setToZoneId] = useState(asset?.zoneId || 'main_office');
  const [newCustodian, setNewCustodian] = useState(asset?.user || '');
  const [reason, setReason] = useState('Physical asset reallocation');
  const [authorizedBy, setAuthorizedBy] = useState('IT & Operations');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !asset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updated = fixedAssetService.logTransfer(asset.id, {
        toZoneId,
        newCustodian,
        reason,
        authorizedBy
      });

      if (updated) {
        onTransferSuccess(updated);
        onClose();
      }
    } catch (err) {
      console.error('Transfer failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
      >
        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.15rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 163, 255, 0.15)', color: '#00A3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowRightLeft size={16} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Transfer & Relocate Asset
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {asset.itemName} ({asset.tagNumber.slice(-14)})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.3rem', height: 'auto', borderRadius: '50%' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.25rem' }}>
          {/* Current Status Box */}
          <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              CURRENT LOCATION & CUSTODIAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span>📍 {asset.zoneName || asset.locationName}</span>
              <span style={{ color: 'var(--brand-primary, #00A3FF)', fontWeight: 600 }}>👤 {asset.user || 'Common'}</span>
            </div>
          </div>

          {/* Destination Room */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <Building size={14} className="text-cyan" />
              <span>Target Room / Location *</span>
            </label>
            <select
              value={toZoneId}
              onChange={(e) => setToZoneId(e.target.value)}
              className="input select"
              required
              style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
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
                <option value="auditorium">Main Auditorium (Conference Hall)</option>
                <option value="nadun_office">Mr. Nadun's Office (Executive Director)</option>
                <option value="nadun_lobby">1st Floor Main Hall & Lobby</option>
                <option value="conference_room">Main Conference Room</option>
                <option value="first_dining">1st Floor Dining Room (Lunch Room)</option>
                <option value="chilaw_lab">Chilaw Lab (New Lab Annex)</option>
                <option value="rest_room">Discussion Room / Rest Room</option>
              </optgroup>
              <optgroup label="Off-Site / Branches">
                <option value="palavi">Palavi Branch Office</option>
                <option value="second_land">2nd Land Facility / Hatchery</option>
                <option value="home_residence">Home Residence / External</option>
              </optgroup>
            </select>
          </div>

          {/* New Custodian */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <User size={14} className="text-emerald" />
              <span>New Custodian / User *</span>
            </label>
            <input
              type="text"
              value={newCustodian}
              onChange={(e) => setNewCustodian(e.target.value)}
              placeholder="e.g. Ms. Ishara, MD, Mr. Nadun, Common"
              className="input"
              required
              style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Reason */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <FileText size={14} className="text-amber" />
              <span>Reason for Relocation</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Department transfer, seating reorganization, sent to Palavi"
              className="input"
              style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Authorized By */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700 }}>
              <span>Authorized By</span>
            </label>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              placeholder="e.g. IT Officer / Admin"
              className="input"
              style={{ width: '100%', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline" style={{ padding: '0.4rem 0.85rem' }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.4rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              <span>{isSubmitting ? 'Transferring...' : 'Confirm & Log Transfer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
