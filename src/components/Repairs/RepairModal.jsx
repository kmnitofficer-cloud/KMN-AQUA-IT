import React, { useState, useEffect } from 'react';
import { X, Wrench, Cpu, Save, FileText } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { repairService } from '../../services/repairService';

export default function RepairModal({ assetId, isOpen, onClose, onSaved }) {
  const assets = assetService.getAssets('All');

  const [targetAssetId, setTargetAssetId] = useState(assetId || '');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().split('T')[0]);
  const [problemDescription, setProblemDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [repairSupplier, setRepairSupplier] = useState('KMN IT Solution');
  const [technician, setTechnician] = useState('KMN IT Service Specialist');
  const [repairCost, setRepairCost] = useState(0);
  const [warrantyCovered, setWarrantyCovered] = useState('No');
  const [status, setStatus] = useState('Completed');
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [notes, setNotes] = useState('');

  // Part Replacement Tracking (Old vs New)
  const [hasPartReplacement, setHasPartReplacement] = useState(false);
  const [partType, setPartType] = useState('RAM');
  const [oldPartDetails, setOldPartDetails] = useState('');
  const [oldPartSerial, setOldPartSerial] = useState('');
  const [newPartDetails, setNewPartDetails] = useState('');
  const [newPartSerial, setNewPartSerial] = useState('');

  // Invoice Ref
  const [invoiceNumber, setInvoiceNumber] = useState('');

  useEffect(() => {
    if (assetId) {
      setTargetAssetId(assetId);
    } else if (assets.length > 0) {
      setTargetAssetId(assets[0].AssetID);
    }
  }, [assetId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAssetId || !problemDescription.trim()) {
      alert('Please specify the asset and describe the issue.');
      return;
    }

    await repairService.logRepair({
      assetId: targetAssetId,
      repairDate,
      problemDescription,
      diagnosis,
      actionTaken,
      partsReplaced,
      repairSupplier,
      technician,
      repairCost,
      warrantyCovered,
      status,
      completedDate,
      nextServiceDate,
      notes,
      hasPartReplacement,
      partType,
      oldPartDetails,
      oldPartSerial,
      newPartDetails,
      newPartSerial,
      invoiceNumber
    });

    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <Wrench size={20} className="text-amber" />
            <h2>Log Equipment Repair & Service Record</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Target Machine / Asset *</label>
              <select
                required
                className="form-input"
                value={targetAssetId}
                onChange={e => setTargetAssetId(e.target.value)}
              >
                {assets.map(a => (
                  <option key={a.AssetID} value={a.AssetID}>
                    {a.Brand} {a.Model} ({a.VerifiedNo}) - {a.AssignedUserName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Service / Repair Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={repairDate}
                onChange={e => setRepairDate(e.target.value)}
              />
            </div>

            <div className="form-group col-span-2">
              <label>Problem Description *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Battery not charging, CPU low performance, Display flickering"
                value={problemDescription}
                onChange={e => setProblemDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Action Taken / Resolution</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Battery replaced with new OEM unit"
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Vendor / Supplier</label>
              <input
                type="text"
                className="form-input"
                value={repairSupplier}
                onChange={e => setRepairSupplier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Total Repair Cost (LKR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
                value={repairCost}
                onChange={e => setRepairCost(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Warranty Covered?</label>
              <select
                className="form-input"
                value={warrantyCovered}
                onChange={e => setWarrantyCovered(e.target.value)}
              >
                <option value="No">No (Paid Out of Pocket)</option>
                <option value="Yes">Yes (Covered Under OEM Warranty)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Status</label>
              <select
                className="form-input"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="Completed">Completed (Returned to Active Service)</option>
                <option value="In Progress">In Progress (Currently Under Repair)</option>
                <option value="Pending Parts">Pending Parts / Component Arrival</option>
              </select>
            </div>

            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. KMN-IT-7741"
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Part Replacement Sub-Form (Old vs New Tracking) */}
          <div className="part-replacement-subform mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet" />
                <span className="font-semibold text-sm">Hardware Component Replacement (Old vs New Tracking)</span>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={hasPartReplacement}
                  onChange={e => setHasPartReplacement(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            {hasPartReplacement && (
              <div className="form-grid mt-3 p-3 bg-surface-elevated rounded-md border border-subtle">
                <div className="form-group">
                  <label>Component Type</label>
                  <select
                    className="form-input"
                    value={partType}
                    onChange={e => setPartType(e.target.value)}
                  >
                    <option value="RAM">RAM / Memory Module</option>
                    <option value="Storage / SSD">Storage Drive (HDD / SSD / NVMe)</option>
                    <option value="Battery">Battery / Power Pack</option>
                    <option value="Screen / Display">Screen / Display Panel</option>
                    <option value="Power Supply">Power Supply Unit / UPS Unit</option>
                    <option value="Motherboard">Motherboard / Logic Board</option>
                    <option value="Other">Other Internal Component</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Old Removed Part Specs</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4GB DDR3 RAM (Faulty)"
                    value={oldPartDetails}
                    onChange={e => setOldPartDetails(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Old Part Serial Number</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="e.g. RAM001 or N/A"
                    value={oldPartSerial}
                    onChange={e => setOldPartSerial(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>New Installed Part Specs</label>
                  <input
                    type="text"
                    required={hasPartReplacement}
                    className="form-input"
                    placeholder="e.g. 8GB DDR3 1600MHz RAM"
                    value={newPartDetails}
                    onChange={e => setNewPartDetails(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>New Part Serial Number</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="e.g. RAM009"
                    value={newPartSerial}
                    onChange={e => setNewPartSerial(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="form-group mt-4">
            <label>Technician & Service Notes</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Diagnosis details, test results, or next maintenance recommendation..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            ></textarea>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Permanently Save Repair Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
