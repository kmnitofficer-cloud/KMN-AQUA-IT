import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, UserCheck, ArrowRight, CornerDownLeft, Laptop, CheckCircle2 } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { assignmentService } from '../../services/assignmentService';

export default function ReassignModal({ assetId, isOpen, onClose, onCompleted }) {
  const users = userService.getUsers('Active');
  const allAssets = assetService.getAssets('All');

  const [chosenAssetId, setChosenAssetId] = useState(assetId || '');
  const [mode, setMode] = useState('reassign'); // 'reassign' or 'return'
  const [toUserId, setToUserId] = useState('');
  const [locationId, setLocationId] = useState('LOC-0001');
  const [reason, setReason] = useState('Employee Handover');
  const [conditionWhenAssigned, setConditionWhenAssigned] = useState('Good');
  const [conditionWhenReturned, setConditionWhenReturned] = useState('Working');
  const [notes, setNotes] = useState('');

  // Prioritize available storage assets at the top
  const availableAssets = useMemo(() => {
    return allAssets.filter(a => !a.CurrentUserID || a.Status === 'Available' || a.Status === 'In Storage');
  }, [allAssets]);

  const assignedAssets = useMemo(() => {
    return allAssets.filter(a => a.CurrentUserID && a.Status === 'Assigned');
  }, [allAssets]);

  useEffect(() => {
    if (assetId) {
      setChosenAssetId(assetId);
    } else if (availableAssets.length > 0 && !chosenAssetId) {
      setChosenAssetId(availableAssets[0].AssetID);
    } else if (allAssets.length > 0 && !chosenAssetId) {
      setChosenAssetId(allAssets[0].AssetID);
    }
  }, [assetId, isOpen, availableAssets, allAssets, chosenAssetId]);

  const asset = useMemo(() => {
    const id = assetId || chosenAssetId;
    return id ? assetService.getAssetById(id) : null;
  }, [assetId, chosenAssetId]);

  useEffect(() => {
    if (asset) {
      setLocationId(asset.CurrentLocationID || 'LOC-0001');
      setToUserId('');
      setReason(asset.CurrentUserID ? 'Employee Handover / Device Swap' : 'New Equipment Handover to Staff');
      setNotes('');
    }
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asset) {
      alert('Please select an asset/device to assign.');
      return;
    }

    if (mode === 'reassign') {
      if (!toUserId) {
        alert('Please select a recipient employee for handover.');
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
      <div className="form-modal-container max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <RefreshCw size={20} className="text-cyan" />
            <h2 className="text-base font-bold">
              {assetId ? 'Asset Custody Handover / Reassignment' : 'Hand Over / Assign Equipment to Staff'}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Equipment Selector (if not pre-selected) */}
          {!assetId ? (
            <div className="form-group mb-4">
              <label className="font-semibold text-primary">
                Select Equipment / Peripheral to Hand Over *
              </label>
              <select
                required
                className="form-input font-medium"
                value={chosenAssetId}
                onChange={e => setChosenAssetId(e.target.value)}
              >
                <optgroup label="📦 Available in Storage (Ready to Hand Over)">
                  {availableAssets.map(a => (
                    <option key={a.AssetID} value={a.AssetID}>
                      [{a.AssetType}] {a.Brand} {a.Model} (Tag: {a.VerifiedNo || 'UNTAGGED'}) - Available
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💼 Currently Assigned Equipment">
                  {assignedAssets.map(a => (
                    <option key={a.AssetID} value={a.AssetID}>
                      [{a.AssetType}] {a.Brand} {a.Model} (Tag: {a.VerifiedNo}) - Held by {a.AssignedUserName}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          ) : null}

          {/* Current Custody Card */}
          {asset && (
            <div className="custody-banner">
              <div>
                <span className="custody-label">Hardware Device</span>
                <h4>{asset.Brand} {asset.Model}</h4>
                <span className="text-muted text-xs font-mono">
                  ID: {asset.AssetID} • Tag: {asset.VerifiedNo || 'UNTAGGED'}
                </span>
              </div>
              <div className="text-right">
                <span className="custody-label">Current Custody</span>
                <div className="font-semibold text-primary">
                  {asset.AssignedUserName || (
                    <span className="text-emerald font-semibold">✓ In Storage (Available)</span>
                  )}
                </div>
                <span className="text-muted text-xs">Location: {asset.LocationName}</span>
              </div>
            </div>
          )}

          {/* Action Selector (only show return option if currently assigned) */}
          {asset && asset.CurrentUserID && (
            <div className="action-toggle-row mt-4">
              <button
                type="button"
                className={`action-toggle-btn ${mode === 'reassign' ? 'active' : ''}`}
                onClick={() => setMode('reassign')}
              >
                <UserCheck size={16} /> Reassign / Hand Over to Employee
              </button>
              <button
                type="button"
                className={`action-toggle-btn ${mode === 'return' ? 'active' : ''}`}
                onClick={() => setMode('return')}
              >
                <CornerDownLeft size={16} /> Return to Storage / Stock
              </button>
            </div>
          )}

          <div className="form-grid mt-4">
            {mode === 'reassign' ? (
              <div className="form-group col-span-2">
                <label className="font-semibold text-emerald">Recipient Employee *</label>
                <select
                  required
                  className="form-input font-medium"
                  value={toUserId}
                  onChange={e => setToUserId(e.target.value)}
                >
                  <option value="">-- Choose Staff Member or Shared Network --</option>
                  <option value="SHARED_NETWORK">🌐 Shared Network Device (All Office Staff)</option>
                  <optgroup label="👤 Specific Employee Custody">
                    {users
                      .filter(u => asset ? u.UserID !== asset.CurrentUserID : true)
                      .map(u => (
                        <option key={u.UserID} value={u.UserID}>
                          {u.Name} {u.JobTitle ? `(${u.JobTitle})` : ''} - {u.EmployeeID || u.UserID}
                        </option>
                      ))
                    }
                  </optgroup>
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
              <label>Equipment Condition When Handed Over</label>
              <select
                className="form-input"
                value={conditionWhenAssigned}
                onChange={e => setConditionWhenAssigned(e.target.value)}
              >
                <option value="Brand New">Brand New (Unboxed)</option>
                <option value="Good">Good / Working Perfectly</option>
                <option value="Fair">Fair / Minor Cosmetic Wear</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label>Reason / Purpose of Handover *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. User has no mouse, issued new optical USB mouse or New Desk Setup"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label>Handover Remarks & Serial Notes</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. Handed over USB mouse to Mr. Nethusha for daily office use."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="form-modal-footer mt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserCheck size={16} /> 
              {mode === 'reassign' ? 'Confirm Custody Handover' : 'Return to Storage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
