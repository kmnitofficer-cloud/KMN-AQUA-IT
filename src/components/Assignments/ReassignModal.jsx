import React, { useState, useEffect } from 'react';
import { X, RefreshCw, UserCheck, ArrowRight, CornerDownLeft } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { assignmentService } from '../../services/assignmentService';

export default function ReassignModal({ assetId, isOpen, onClose, onCompleted }) {
  const users = userService.getUsers('Active');
  const asset = assetId ? assetService.getAssetById(assetId) : null;

  const [mode, setMode] = useState('reassign'); // 'reassign' or 'return'
  const [toUserId, setToUserId] = useState('');
  const [locationId, setLocationId] = useState('LOC-0001');
  const [reason, setReason] = useState('Employee Handover');
  const [conditionWhenAssigned, setConditionWhenAssigned] = useState('Good');
  const [conditionWhenReturned, setConditionWhenReturned] = useState('Working');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (asset) {
      setLocationId(asset.CurrentLocationID || 'LOC-0001');
      setToUserId('');
      setReason('Employee Handover');
      setNotes('');
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'reassign') {
      if (!toUserId) {
        alert('Please select a recipient employee for reassignment.');
        return;
      }
      await assignmentService.reassignAsset({
        assetId: asset.AssetID,
        toUserId,
        locationId,
        reason,
        conditionWhenAssigned,
        conditionWhenReturned,
        notes
      });
    } else {
      await assignmentService.returnAsset({
        assetId: asset.AssetID,
        locationId,
        reason: reason || 'Returned to Office Storage',
        conditionWhenReturned,
        notes
      });
    }

    if (onCompleted) onCompleted();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-cyan" />
            <h2>Asset Custody Handover / Reassignment</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Current Custody Card */}
          <div className="custody-banner">
            <div>
              <span className="custody-label">Hardware Device</span>
              <h4>{asset.Brand} {asset.Model}</h4>
              <span className="text-muted text-xs font-mono">ID: {asset.AssetID} • Tag: {asset.VerifiedNo}</span>
            </div>
            <div className="text-right">
              <span className="custody-label">Currently Assigned To</span>
              <div className="font-semibold text-primary">{asset.AssignedUserName || 'Unassigned / Storage'}</div>
              <span className="text-muted text-xs">Location: {asset.LocationName}</span>
            </div>
          </div>

          {/* Action Selector */}
          <div className="action-toggle-row mt-4">
            <button
              type="button"
              className={`action-toggle-btn ${mode === 'reassign' ? 'active' : ''}`}
              onClick={() => setMode('reassign')}
            >
              <UserCheck size={16} /> Reassign to Another Employee
            </button>
            <button
              type="button"
              className={`action-toggle-btn ${mode === 'return' ? 'active' : ''}`}
              onClick={() => setMode('return')}
            >
              <CornerDownLeft size={16} /> Return to Storage / Stock
            </button>
          </div>

          <div className="form-grid mt-4">
            {mode === 'reassign' ? (
              <div className="form-group">
                <label>New Assigned Employee *</label>
                <select
                  required
                  className="form-input"
                  value={toUserId}
                  onChange={e => setToUserId(e.target.value)}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {users
                    .filter(u => u.UserID !== asset.CurrentUserID)
                    .map(u => (
                      <option key={u.UserID} value={u.UserID}>{u.Name} ({u.JobTitle || u.UserID})</option>
                    ))
                  }
                </select>
              </div>
            ) : null}

            <div className="form-group">
              <label>Office Location *</label>
              <select
                className="form-input"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="LOC-0001">Chilaw Office (HQ)</option>
                <option value="LOC-0002">Palaviya Office</option>
                <option value="LOC-0003">HR Lobby</option>
                <option value="LOC-0004">IT Store / Storage Room</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reason for Action *</label>
              <select
                className="form-input"
                value={reason}
                onChange={e => setReason(e.target.value)}
              >
                <option value="Employee Handover">Employee Handover</option>
                <option value="Replaced Faulty Unit">Replaced Faulty Unit</option>
                <option value="Upgrade / Replacement">Upgrade / Replacement</option>
                <option value="Branch Relocation">Branch Relocation</option>
                <option value="Employee Resignation / Exit">Employee Resignation / Exit</option>
                <option value="Returned to Storage">Returned to Storage</option>
                <option value="Other Transfer">Other Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Condition Upon Return (from {asset.AssignedUserName})</label>
              <select
                className="form-input"
                value={conditionWhenReturned}
                onChange={e => setConditionWhenReturned(e.target.value)}
              >
                <option value="Working">Working / Normal</option>
                <option value="Good">Good Condition</option>
                <option value="Faulty">Faulty (Needs Service)</option>
                <option value="Damaged">Physical Damage</option>
              </select>
            </div>

            {mode === 'reassign' && (
              <div className="form-group">
                <label>Condition Given to New User</label>
                <select
                  className="form-input"
                  value={conditionWhenAssigned}
                  onChange={e => setConditionWhenAssigned(e.target.value)}
                >
                  <option value="Good">Good Condition</option>
                  <option value="Working">Working / Standard</option>
                  <option value="New">Brand New</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group mt-4">
            <label>Transfer Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Record reason, accessory items transferred (charger, bag, mouse), etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="alert-box-info mt-4">
            <p className="text-xs">
              <strong>Audit Guarantee:</strong> Old assignment history under {asset.AssignedUserName} will be permanently archived with return timestamp and reason.
            </p>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {mode === 'reassign' ? 'Confirm Reassignment' : 'Confirm Return to Storage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
