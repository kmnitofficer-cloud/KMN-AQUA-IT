import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, UserCheck, ArrowRight, CornerDownLeft, Laptop, CheckCircle2 } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { assignmentService } from '../../services/assignmentService';

export default function ReassignModal({ 
  assetId, 
  initialMode = 'reassign', 
  preselectedUserId = '', 
  isOpen, 
  onClose, 
  onCompleted 
}) {
  const users = userService.getUsers('Active');
  const allAssets = assetService.getAssets('All');

  const [chosenAssetId, setChosenAssetId] = useState(assetId || '');
  const [mode, setMode] = useState(initialMode || 'reassign'); // 'reassign' or 'return'
  const [toUserId, setToUserId] = useState(preselectedUserId || '');
  const [locationId, setLocationId] = useState('LOC-0001');
  const [reason, setReason] = useState('Employee Handover');
  const [conditionWhenAssigned, setConditionWhenAssigned] = useState('Good');
  const [conditionWhenReturned, setConditionWhenReturned] = useState('Working / Good');
  const [notes, setNotes] = useState('');

  // Prioritize available storage assets at the top
  const availableAssets = useMemo(() => {
    return allAssets.filter(a => !a.CurrentUserID || a.Status === 'Available' || a.Status === 'In Storage');
  }, [allAssets]);

  const assignedAssets = useMemo(() => {
    return allAssets.filter(a => a.CurrentUserID && a.Status === 'Assigned');
  }, [allAssets]);

  // Initialize only when modal opens or key props change externally
  useEffect(() => {
    if (isOpen) {
      const activeMode = initialMode || 'reassign';
      setMode(activeMode);
      
      const targetAssetId = assetId || chosenAssetId || (availableAssets[0]?.AssetID || allAssets[0]?.AssetID || '');
      setChosenAssetId(targetAssetId);
      setToUserId(preselectedUserId || '');

      const targetAsset = targetAssetId ? assetService.getAssetById(targetAssetId) : null;
      if (activeMode === 'return') {
        setLocationId('LOC-0004');
        setReason('Equipment Removed / Replaced - Returned to Storage (Available)');
        setConditionWhenReturned('Working / Good');
      } else {
        setLocationId(targetAsset?.CurrentLocationID || 'LOC-0001');
        setReason(targetAsset?.CurrentUserID ? 'Employee Handover / Device Swap' : 'New Equipment Handover to Staff');
        setConditionWhenAssigned('Good');
      }
      setNotes('');
    }
  }, [isOpen, assetId, initialMode, preselectedUserId]);

  const asset = useMemo(() => {
    const id = assetId || chosenAssetId;
    return id ? assetService.getAssetById(id) : null;
  }, [assetId, chosenAssetId, allAssets]);

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
    if (newMode === 'return') {
      setLocationId('LOC-0004');
      setReason('Equipment Removed / Replaced - Returned to Storage (Available)');
      setConditionWhenReturned('Working / Good');
    } else {
      setLocationId(asset?.CurrentLocationID || 'LOC-0001');
      setReason(asset?.CurrentUserID ? 'Employee Handover / Device Swap' : 'New Equipment Handover to Staff');
      setConditionWhenAssigned('Good');
    }
  };

  const handleSelectAsset = (newAssetId) => {
    setChosenAssetId(newAssetId);
    const selected = assetService.getAssetById(newAssetId);
    if (selected) {
      if (mode === 'return') {
        setLocationId('LOC-0004');
        setReason('Equipment Removed / Replaced - Returned to Storage (Available)');
      } else {
        setLocationId(selected.CurrentLocationID || 'LOC-0001');
        setReason(selected.CurrentUserID ? 'Employee Handover / Device Swap' : 'New Equipment Handover to Staff');
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asset) {
      alert('Please select an asset/device to assign.');
      return;
    }

    try {
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
          locationId: locationId || 'LOC-0004',
          reason: reason || 'Equipment Removed - Returned to Storage (Available)',
          conditionWhenReturned: conditionWhenReturned || 'Working / Good',
          notes
        });
      }

      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Error during custody handover / return:', err);
      alert('Failed to process custody change: ' + err.message);
    }
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
                onChange={e => handleSelectAsset(e.target.value)}
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
                onClick={() => handleSwitchMode('reassign')}
              >
                <UserCheck size={16} /> Reassign / Hand Over to Employee
              </button>
              <button
                type="button"
                className={`action-toggle-btn ${mode === 'return' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('return')}
              >
                <CornerDownLeft size={16} /> Return to Storage (Make Available)
              </button>
            </div>
          )}

          {mode === 'return' && asset && (
            <div className="p-3 my-3 rounded-lg border border-cyan/30 bg-cyan/10 text-xs leading-relaxed text-primary">
              <span className="font-semibold text-cyan">ℹ️ Return to Inventory Workflow:</span>
              <p className="mt-1">
                This machine will be removed from <strong>{asset.AssignedUserName}</strong> and placed back into <strong>Available Inventory</strong> so you can assign it to any new person. A permanent handover log will be sealed in <strong>{asset.AssignedUserName}</strong>'s profile under <em>Assignment History & Audit Trail</em> with today's return date.
              </p>
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
              <label>{mode === 'return' ? 'Equipment Condition When Returned' : 'Equipment Condition When Handed Over'}</label>
              {mode === 'return' ? (
                <select
                  className="form-input"
                  value={conditionWhenReturned}
                  onChange={e => setConditionWhenReturned(e.target.value)}
                >
                  <option value="Working / Good">Good / Working Perfectly (Ready to Reassign)</option>
                  <option value="Fair / Cosmetic Wear">Fair / Minor Cosmetic Wear (Usable)</option>
                  <option value="Defective / Needs Repair">Defective / Faulty (Send to Repair)</option>
                </select>
              ) : (
                <select
                  className="form-input"
                  value={conditionWhenAssigned}
                  onChange={e => setConditionWhenAssigned(e.target.value)}
                >
                  <option value="Brand New">Brand New (Unboxed)</option>
                  <option value="Good">Good / Working Perfectly</option>
                  <option value="Fair">Fair / Minor Cosmetic Wear</option>
                </select>
              )}
            </div>

            <div className="form-group col-span-2">
              <label>Reason / Purpose of {mode === 'return' ? 'Return' : 'Handover'} *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder={mode === 'return' ? "e.g. Desktop upgraded to new machine, old unit returned to stock" : "e.g. User has no mouse, issued new optical USB mouse or New Desk Setup"}
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label>{mode === 'return' ? 'Return Remarks & Storage Notes' : 'Handover Remarks & Serial Notes'}</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder={mode === 'return' ? "e.g. Removed desktop from Ishara's desk. Cleaned and kept in IT Storage shelf B, available for reassignment." : "e.g. Handed over USB mouse to Mr. Nethusha for daily office use."}
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
              {mode === 'reassign' ? (
                <><UserCheck size={16} /> Confirm Custody Handover</>
              ) : (
                <><CornerDownLeft size={16} /> Return to Storage & Make Available</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
