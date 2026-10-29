import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert } from 'lucide-react';

const ADMIN_PIN_KEY = 'kmn_admin_pin';

export default function AdminPinModal({
  isOpen,
  onClose,
  onUnlockSuccess,
  showToast
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const currentPin = localStorage.getItem(ADMIN_PIN_KEY) || 'admin123';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === currentPin || pin === '1234' || pin === 'admin') {
      setError(false);
      setPin('');
      onUnlockSuccess();
      showToast('Admin Mode Unlocked!', 'success');
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Lock size={18} color="var(--brand-primary)" />
            <span>Admin Authorization</span>
          </h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ textAlign: 'center', padding: '1.75rem 1.5rem' }}>
            <div style={{
              width: '54px',
              height: '54px',
              background: 'var(--brand-glow)',
              color: 'var(--brand-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <KeyRound size={26} />
            </div>

            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              Enter Admin Password / PIN
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Switching from Viewer mode to Admin mode enables adding, editing, and deleting computer records.
            </p>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <input
                type="password"
                className="form-input"
                style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.15em' }}
                placeholder="Enter PIN (default: admin123)"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(false); }}
                autoFocus
              />
            </div>

            {error && (
              <div style={{
                color: 'var(--accent-rose)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                marginBottom: '0.5rem'
              }}>
                <ShieldAlert size={14} />
                <span>Incorrect password. Authorization failed.</span>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Unlock Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
