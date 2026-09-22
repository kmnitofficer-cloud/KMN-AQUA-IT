import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Wrench, 
  Cpu, 
  Save, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Search, 
  Plus, 
  Trash2, 
  UploadCloud, 
  FileCheck, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  FolderCheck
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import { repairService } from '../../services/repairService';

export default function RepairModal({ assetId, isOpen, onClose, onSaved }) {
  const assets = assetService.getAssets('All');

  // Entry Category: 'warning', 'checkup', 'repair'
  const [entryCategory, setEntryCategory] = useState('warning');

  const [targetAssetId, setTargetAssetId] = useState(assetId || '');
  const [assetSearchText, setAssetSearchText] = useState('');
  const [repairDate, setRepairDate] = useState(new Date().toISOString().split('T')[0]);
  const [problemDescription, setProblemDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [repairSupplier, setRepairSupplier] = useState('KMN IT Solution');
  const [technician, setTechnician] = useState('KMN IT Service Specialist');
  const [warrantyCovered, setWarrantyCovered] = useState('Yes');
  const [status, setStatus] = useState('Warning / Under Observation');
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [notes, setNotes] = useState('');

  // Specific Warning & Daily Check details
  const [warningNote, setWarningNote] = useState('');

  // Cost tracking states
  const [manualRepairCost, setManualRepairCost] = useState(0);
  const [laborCost, setLaborCost] = useState(0);

  // Helper to compute warranty expiry date from start date + preset
  const calculateExpiryDate = (startDateStr, preset) => {
    if (!startDateStr || preset === 'No Warranty' || preset === 'None') return '';
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) return '';
    if (preset === '6 Months') d.setMonth(d.getMonth() + 6);
    else if (preset === '1 Year') d.setFullYear(d.getFullYear() + 1);
    else if (preset === '2 Years') d.setFullYear(d.getFullYear() + 2);
    else if (preset === '3 Years') d.setFullYear(d.getFullYear() + 3);
    else if (preset === '5 Years') d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().split('T')[0];
  };

  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);
    if (isNaN(end.getTime())) return null;
    return Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  };

  // Multi-Part Replacement Tracking (Old vs New & Individual Warranty)
  const createNewPart = (defaultType = 'RAM') => {
    const today = repairDate || new Date().toISOString().split('T')[0];
    const defaultExpiry = calculateExpiryDate(today, '1 Year');

    const isPeripheral = defaultType === 'Mouse' || defaultType === 'Keyboard' || defaultType === 'Keyboard & Mouse';
    return {
      id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      partType: defaultType,
      isNewAdditionOnly: isPeripheral,
      registerAsAsset: isPeripheral,
      oldPartDetails: '',
      oldPartSerial: '',
      newPartDetails: defaultType === 'Mouse' ? 'Standard Optical USB Mouse' : '',
      newPartSerial: '',
      partCost: defaultType === 'Mouse' ? '1500' : '',
      warrantyPeriod: '1 Year',
      warrantyStart: today,
      warrantyEnd: defaultExpiry,
      warrantyProvider: repairSupplier || 'KMN IT Solution'
    };
  };

  const [hasPartReplacement, setHasPartReplacement] = useState(false);
  const [partsList, setPartsList] = useState([createNewPart('RAM')]);

  // Automatic Invoice Handling & File Upload
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const invoiceFileInputRef = useRef(null);

  // Auto-calculate parts subtotal
  const partsSubtotal = useMemo(() => {
    if (!hasPartReplacement) return 0;
    return partsList.reduce((sum, p) => sum + (Number(p.partCost) || 0), 0);
  }, [hasPartReplacement, partsList]);

  // Auto-calculated total cost
  const effectiveTotalCost = useMemo(() => {
    if (hasPartReplacement) {
      return partsSubtotal + (Number(laborCost) || 0);
    }
    return Number(manualRepairCost) || 0;
  }, [hasPartReplacement, partsSubtotal, laborCost, manualRepairCost]);

  const handleAddPart = () => {
    setPartsList(prev => [...prev, createNewPart('Storage / SSD')]);
  };

  const handleRemovePart = (id) => {
    if (partsList.length <= 1) return;
    setPartsList(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePart = (id, field, value) => {
    setPartsList(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      if (field === 'partType') {
        if (value === 'Mouse' || value === 'Keyboard' || value === 'Keyboard & Mouse') {
          updated.registerAsAsset = true;
          if (!updated.newPartDetails) {
            updated.newPartDetails = value === 'Mouse' ? 'Standard Optical USB Mouse' : 'Standard USB Keyboard';
          }
          if (!updated.partCost) {
            updated.partCost = value === 'Mouse' ? '1500' : '2500';
          }
        }
      } else if (field === 'warrantyPeriod') {
        if (value !== 'Custom Date') {
          updated.warrantyEnd = calculateExpiryDate(updated.warrantyStart || repairDate, value);
        }
      } else if (field === 'warrantyStart') {
        if (updated.warrantyPeriod && updated.warrantyPeriod !== 'Custom Date') {
          updated.warrantyEnd = calculateExpiryDate(value, updated.warrantyPeriod);
        }
      }
      return updated;
    }));
  };

  const handleInvoiceFileChange = (file) => {
    if (!file) return;
    setInvoiceFile(file);
    if (!invoiceNumber) {
      const cleanBase = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
      setInvoiceNumber(cleanBase || `INV-${Date.now().toString().slice(-4)}`);
    }
  };

  useEffect(() => {
    if (assetId) {
      setTargetAssetId(assetId);
    } else if (assets.length > 0 && !targetAssetId) {
      setTargetAssetId(assets[0].AssetID);
    }
  }, [assetId, isOpen, assets, targetAssetId]);

  const filteredAssets = useMemo(() => {
    if (!assetSearchText.trim()) return assets;
    const q = assetSearchText.toLowerCase();
    return assets.filter(a => {
      const user = (a.AssignedUserName || '').toLowerCase();
      const type = (a.AssetType || '').toLowerCase();
      const brand = (a.Brand || '').toLowerCase();
      const model = (a.Model || '').toLowerCase();
      const tag = (a.VerifiedNo || '').toLowerCase();
      const dept = (a.AssignedUserDepartment || '').toLowerCase();
      return user.includes(q) || type.includes(q) || brand.includes(q) || model.includes(q) || tag.includes(q) || dept.includes(q);
    });
  }, [assets, assetSearchText]);

  // Synchronize targetAssetId as soon as filteredAssets changes so the card matches the select immediately
  useEffect(() => {
    if (filteredAssets.length > 0) {
      const exists = filteredAssets.some(a => a.AssetID === targetAssetId);
      if (!exists) {
        setTargetAssetId(filteredAssets[0].AssetID);
      }
    }
  }, [filteredAssets, targetAssetId]);

  const assetGroups = useMemo(() => {
    return assetService.groupAssetsByUser(filteredAssets);
  }, [filteredAssets]);

  const selectedAsset = useMemo(() => {
    return assets.find(a => a.AssetID === targetAssetId);
  }, [assets, targetAssetId]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat) => {
    setEntryCategory(cat);
    if (cat === 'warning') {
      setStatus('Warning / Under Observation');
      setWarrantyCovered('Yes');
    } else if (cat === 'checkup') {
      setStatus('Routine Checkup / Inspection');
      setWarrantyCovered('Yes');
    } else {
      setStatus('Completed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAssetId || !problemDescription.trim()) {
      alert('Please specify the target asset and describe the issue / observation.');
      return;
    }

    if (hasPartReplacement) {
      const emptyPart = partsList.find(p => !p.newPartDetails || !p.newPartDetails.trim());
      if (emptyPart) {
        alert('Please provide the specification for each installed/replaced part.');
        return;
      }
    }

    const effectiveWarningNote = warningNote || (status.includes('Warning') ? notes || problemDescription : '');

    await repairService.logRepair({
      assetId: targetAssetId,
      repairDate,
      problemDescription,
      diagnosis,
      actionTaken,
      partsReplaced,
      repairSupplier,
      technician,
      repairCost: effectiveTotalCost,
      warrantyCovered,
      status,
      completedDate,
      nextServiceDate,
      notes,
      warningNote: effectiveWarningNote,
      hasPartReplacement,
      partsList: hasPartReplacement ? partsList : [],
      invoiceFile,
      invoiceNumber: invoiceNumber.trim(),
      invoiceAmount: invoiceAmount !== '' ? Number(invoiceAmount) : effectiveTotalCost,
      invoiceSupplier: repairSupplier
    });

    if (onSaved) onSaved();
    onClose();
  };

  const isWarningSelected = status.includes('Warning') || entryCategory === 'warning';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container modal-wide" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="form-modal-header">
          <div className="flex items-center gap-3">
            {isWarningSelected ? (
              <div className="p-2 rounded bg-amber-500/15 text-amber border border-amber/30">
                <AlertTriangle size={22} className="text-amber" />
              </div>
            ) : (
              <div className="p-2 rounded bg-primary/15 text-primary border border-primary/30">
                <Wrench size={22} className="text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold">
                {isWarningSelected 
                  ? 'Log Issue & Set Under Daily Warning / Observation' 
                  : 'Log Equipment Service & Hardware Part Replacement'}
              </h2>
              <span className="text-xs text-muted block">
                {isWarningSelected 
                  ? 'Keep device operational with staff while scheduling routine daily checks' 
                  : 'Record maintenance, component upgrades, warranties, and verified vendor bills'}
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Quick Category Toggle Buttons */}
          <div className="entry-category-bar mb-4">
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'warning' ? 'active warning' : ''}`}
              onClick={() => handleCategoryChange('warning')}
            >
              <AlertTriangle size={15} /> ⚠️ Warning / Daily Check (Still Working)
            </button>
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'checkup' ? 'active checkup' : ''}`}
              onClick={() => handleCategoryChange('checkup')}
            >
              <Eye size={15} /> 🔍 Routine Checkup / Inspection (No Cost)
            </button>
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'repair' ? 'active repair' : ''}`}
              onClick={() => handleCategoryChange('repair')}
            >
              <Wrench size={15} /> 🔧 Hardware Repair & Part Replacement
            </button>
          </div>

          {/* Warning Banner when Warning Mode is Active */}
          {isWarningSelected && (
            <div className="warning-callout-banner mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber shrink-0" />
                <span className="font-semibold text-sm text-amber">
                  Device Stays in Active Office Use with Employee
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                The machine remains operational at the user's desk (e.g. intermittent beep, low battery health, or occasional lag). A visible amber warning indicator will appear across the Dashboard and Asset Register for regular monitoring.
              </p>
            </div>
          )}

          <div className="form-grid">
            {/* Target Machine Selector */}
            <div className="form-group col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-primary">Target Machine / Asset *</label>
                <span className="text-xs text-muted">
                  {filteredAssets.length} of {assets.length} machines
                </span>
              </div>

              {/* Quick Search Filter */}
              <div className="search-filter-box">
                <input
                  type="text"
                  className="form-input text-xs py-1.5"
                  placeholder="🔍 Filter by User (e.g. Nethusha), Device (e.g. Dell, Monitor, UPS), or Tag..."
                  value={assetSearchText}
                  onChange={e => setAssetSearchText(e.target.value)}
                />
                <Search size={14} className="search-filter-icon" />
                {assetSearchText && (
                  <button
                    type="button"
                    onClick={() => setAssetSearchText('')}
                    className="search-filter-clear"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                required
                className="form-input font-medium"
                value={targetAssetId}
                onChange={e => setTargetAssetId(e.target.value)}
              >
                {assetGroups.map(group => (
                  <optgroup key={group.groupKey} label={group.groupLabel}>
                    {group.items.map(a => (
                      <option key={a.AssetID} value={a.AssetID}>
                        {assetService.formatAssetLabel(a)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Selected Machine Detailed Card */}
              {selectedAsset && (
                <div className="mt-2.5 p-3 rounded-lg border border-cyan/30 bg-cyan/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded bg-cyan/20 text-cyan font-bold uppercase tracking-wider text-[11px] border border-cyan/40">
                      [{selectedAsset.AssetType}]
                    </span>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {assetService.getCleanHardwareName(selectedAsset)}
                      </div>
                      <div className="text-muted flex flex-wrap items-center gap-2 mt-0.5">
                        <span>Tag: <strong className="text-cyan font-mono">{selectedAsset.VerifiedNo || 'UNTAGGED'}</strong></span>
                        <span>•</span>
                        <span>Assigned to: <strong className="text-white">{selectedAsset.AssignedUserName}</strong></span>
                        {selectedAsset.AssignedUserDepartment && (
                          <span className="text-muted">({selectedAsset.AssignedUserDepartment})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-muted border border-slate-700">
                      📍 {selectedAsset.LocationName}
                    </span>
                    <div className="text-[11px] text-muted mt-1">
                      Status: <span className="text-emerald font-medium">{selectedAsset.Status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Service Date */}
            <div className="form-group">
              <label>Service / Inspection Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={repairDate}
                onChange={e => {
                  setRepairDate(e.target.value);
                  // Auto-update warranty start dates
                  setPartsList(prev => prev.map(p => ({
                    ...p,
                    warrantyStart: e.target.value,
                    warrantyEnd: calculateExpiryDate(e.target.value, p.warrantyPeriod)
                  })));
                }}
              />
            </div>

            {/* Service Status */}
            <div className="form-group">
              <label>Service & Operational Status *</label>
              <select
                className={`form-input ${isWarningSelected ? 'border-amber text-amber font-semibold' : ''}`}
                value={status}
                onChange={e => {
                  setStatus(e.target.value);
                  if (e.target.value.includes('Warning')) setEntryCategory('warning');
                }}
              >
                <option value="Warning / Under Observation">⚠️ Warning / Under Observation (Still Working - Needs Daily Check)</option>
                <option value="Completed">Completed (Returned to Active Service - Healthy)</option>
                <option value="Routine Checkup / Inspection">Routine Checkup / Inspection (Healthy - No Cost)</option>
                <option value="In Progress">In Progress (Currently Under Repair - Down)</option>
                <option value="Pending Parts">Pending Parts / Component Arrival</option>
              </select>
            </div>

            {/* Problem Description */}
            <div className="form-group col-span-2">
              <label>Problem / Observation Description *</label>
              <input
                type="text"
                required
                className="form-input font-medium"
                placeholder="e.g. UPS GIVE WEIRD BEEP SOUND or System stuck & slow, requires SSD upgrade"
                value={problemDescription}
                onChange={e => {
                  setProblemDescription(e.target.value);
                  if (!warningNote) setWarningNote(e.target.value);
                }}
              />
            </div>

            {/* Action Taken */}
            <div className="form-group">
              <label>Action Taken / Resolution</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Checked by Yohan, installed 4GB DDR4 & 256GB SSD"
                value={actionTaken}
                onChange={e => setActionTaken(e.target.value)}
              />
            </div>

            {/* Vendor / Supplier */}
            <div className="form-group">
              <label>Vendor / Supplier</label>
              <input
                type="text"
                className="form-input"
                value={repairSupplier}
                onChange={e => setRepairSupplier(e.target.value)}
              />
            </div>
          </div>

          {/* ==========================================================
              HARDWARE PARTS REPLACEMENT & INDIVIDUAL WARRANTY SECTION
             ========================================================== */}
          <div className="parts-section-card mt-4">
            <div className="parts-section-header">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet shrink-0" />
                <div>
                  <span className="font-semibold text-sm text-primary block">
                    Did you replace or install physical hardware parts?
                  </span>
                  <span className="text-xs text-muted">
                    Track multiple components (e.g. RAM + SSD + Battery) with individual costs & warranties
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${hasPartReplacement ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setHasPartReplacement(!hasPartReplacement)}
              >
                {hasPartReplacement ? `Parts: Active (${partsList.length})` : '+ Add Hardware Parts'}
              </button>
            </div>

            {hasPartReplacement && (
              <div>
                {/* Parts List */}
                {partsList.map((part, index) => {
                  const daysRemaining = calculateDaysRemaining(part.warrantyEnd);

                  return (
                    <div key={part.id} className="part-card-item">
                      {/* Top Bar: Part # & Actions */}
                      <div className="part-card-topbar">
                        <div className="flex items-center gap-2">
                          <span className="part-badge-tag">
                            Part #{index + 1}
                          </span>
                          <span className="text-sm text-white font-semibold">
                            {part.partType}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer hover:text-white">
                            <input
                              type="checkbox"
                              checked={part.isNewAdditionOnly}
                              onChange={e => handleUpdatePart(part.id, 'isNewAdditionOnly', e.target.checked)}
                              className="rounded border-slate-700 bg-slate-800 text-primary"
                            />
                            <span>New Addition (No Old Part Removed)</span>
                          </label>

                          {partsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePart(part.id)}
                              className="part-remove-btn"
                              title="Remove this part"
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Part Specifications Grid */}
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="text-xs">Component Type *</label>
                          <select
                            className="form-input text-xs py-1.5 font-medium"
                            value={part.partType}
                            onChange={e => handleUpdatePart(part.id, 'partType', e.target.value)}
                          >
                            <option value="RAM">RAM / Memory Module</option>
                            <option value="Storage / SSD">Storage Drive (HDD / SSD / NVMe)</option>
                            <option value="Mouse">Mouse / Optical USB Mouse</option>
                            <option value="Keyboard / Touchpad">Keyboard / Touchpad</option>
                            <option value="Keyboard & Mouse">Keyboard & Mouse Set</option>
                            <option value="Power Supply">Power Supply Unit / SMPS / UPS</option>
                            <option value="Battery">Battery / Power Pack</option>
                            <option value="Screen / Display">Screen / Display Panel</option>
                            <option value="Motherboard">Motherboard / Logic Board</option>
                            <option value="Cooling Fan">Cooling Fan / Thermal Heatsink</option>
                            <option value="Network / Wi-Fi">Network / Wi-Fi Card</option>
                            <option value="Graphics / GPU">Graphics Card / GPU</option>
                            <option value="Other">Other Peripheral / Accessory</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="text-xs font-semibold text-emerald">
                            Individual Part Cost (LKR) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            className="form-input text-xs py-1.5 font-medium"
                            placeholder="e.g. 1500"
                            value={part.partCost}
                            onChange={e => handleUpdatePart(part.id, 'partCost', e.target.value)}
                          />
                        </div>

                        {!part.isNewAdditionOnly ? (
                          <>
                            <div className="form-group">
                              <label className="text-xs text-rose">Old Removed Part Specs</label>
                              <input
                                type="text"
                                className="form-input text-xs py-1.5"
                                placeholder="e.g. 4GB DDR3 RAM (Faulty) or Old Broken Mouse"
                                value={part.oldPartDetails}
                                onChange={e => handleUpdatePart(part.id, 'oldPartDetails', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="text-xs text-rose">Old Part Serial Number</label>
                              <input
                                type="text"
                                className="form-input font-mono text-xs py-1.5"
                                placeholder="e.g. SN-RAM001 or N/A"
                                value={part.oldPartSerial}
                                onChange={e => handleUpdatePart(part.id, 'oldPartSerial', e.target.value)}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 p-2.5 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={15} className="shrink-0" />
                              <span>Brand new addition / expansion (employee had no previous unit).</span>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer text-white font-medium pl-6">
                              <input
                                type="checkbox"
                                checked={part.registerAsAsset !== false}
                                onChange={e => handleUpdatePart(part.id, 'registerAsAsset', e.target.checked)}
                                className="rounded text-primary"
                              />
                              <span>
                                ✓ Also register & assign this {part.partType} directly to <strong>{selectedAsset?.AssignedUserName || 'this employee'}</strong> in Company Asset Inventory
                              </span>
                            </label>
                          </div>
                        )}

                        <div className="form-group">
                          <label className="text-xs font-semibold text-cyan">New Installed Part Specs *</label>
                          <input
                            type="text"
                            required={hasPartReplacement}
                            className="form-input text-xs py-1.5 font-medium"
                            placeholder="e.g. 4GB DDR4 or 256GB NVMe SSD"
                            value={part.newPartDetails}
                            onChange={e => handleUpdatePart(part.id, 'newPartDetails', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label className="text-xs text-cyan">New Part Serial Number</label>
                          <input
                            type="text"
                            className="form-input font-mono text-xs py-1.5"
                            placeholder="e.g. SN-RAM2026-09 or N/A"
                            value={part.newPartSerial}
                            onChange={e => handleUpdatePart(part.id, 'newPartSerial', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* INDIVIDUAL PART WARRANTY CONTROL BOX */}
                      <div className="part-warranty-box">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald" />
                            <span className="text-xs font-semibold text-emerald">
                              Part Warranty Protection
                            </span>
                          </div>

                          {/* Live Remaining Days Counter */}
                          {daysRemaining !== null ? (
                            <span className={`warranty-countdown-pill ${
                              daysRemaining > 60 ? 'active' : daysRemaining >= 0 ? 'expiring' : 'expired'
                            }`}>
                              <Clock size={12} />
                              {daysRemaining > 60 
                                ? `🛡️ ${daysRemaining.toLocaleString()} Days Active Warranty`
                                : daysRemaining >= 0
                                  ? `⚠️ Expiring Soon (${daysRemaining} Days Left)`
                                  : `⚠️ Expired (${Math.abs(daysRemaining)} Days Ago)`}
                            </span>
                          ) : (
                            <span className="text-xs text-muted italic">No warranty coverage</span>
                          )}
                        </div>

                        {/* Quick Presets */}
                        <div className="warranty-presets-row">
                          <span className="text-[11px] text-muted mr-1">Warranty Period:</span>
                          {['No Warranty', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years', 'Custom Date'].map(preset => (
                            <button
                              key={preset}
                              type="button"
                              className={`warranty-preset-btn ${part.warrantyPeriod === preset ? 'active' : ''}`}
                              onClick={() => handleUpdatePart(part.id, 'warrantyPeriod', preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Expiry Date & Warranty Vendor Inputs */}
                        {part.warrantyPeriod !== 'No Warranty' && (
                          <div className="form-grid mt-2">
                            <div className="form-group">
                              <label className="text-[11px] text-muted">Warranty Expiration Date</label>
                              <input
                                type="date"
                                className="form-input text-xs py-1"
                                value={part.warrantyEnd}
                                onChange={e => {
                                  handleUpdatePart(part.id, 'warrantyPeriod', 'Custom Date');
                                  handleUpdatePart(part.id, 'warrantyEnd', e.target.value);
                                }}
                              />
                            </div>

                            <div className="form-group">
                              <label className="text-[11px] text-muted">Warranty Provider / Vendor</label>
                              <input
                                type="text"
                                className="form-input text-xs py-1"
                                placeholder="e.g. KMN IT Solution, Kingston, Samsung"
                                value={part.warrantyProvider}
                                onChange={e => handleUpdatePart(part.id, 'warrantyProvider', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="p-3 bg-slate-900/40">
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="btn btn-outline btn-xs w-full flex items-center justify-center gap-1.5 border-dashed border-cyan/40 text-cyan hover:bg-cyan/10 py-2"
                  >
                    <Plus size={14} /> + Add Another Hardware Part (e.g. 2nd RAM, SSD, Power Supply)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ==========================================================
              AUTOMATIC COST CALCULATION & FINANCIALS
             ========================================================== */}
          <div className="repair-cost-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald" />
                <span className="font-semibold text-sm text-primary">
                  Repair & Component Cost Calculation
                </span>
              </div>
              <span className="text-xs text-muted">
                Auto-synced to Repairs Ledger, Expense Records & Invoice
              </span>
            </div>

            {hasPartReplacement ? (
              <div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="text-xs">Replaced Hardware Parts Subtotal (LKR)</label>
                    <div className="form-input text-xs font-mono font-bold bg-slate-900/60 py-2">
                      Rs. {partsSubtotal.toLocaleString()}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="text-xs">Technician Service / Labor Fee (LKR)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input text-xs py-1.5"
                      placeholder="0 (Internal or Free)"
                      value={laborCost}
                      onChange={e => setLaborCost(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="cost-summary-pill">
                  <span className="text-xs font-medium text-secondary">
                    Total Logged Repair Cost:
                  </span>
                  <strong className="text-emerald text-base font-mono">
                    Rs. {effectiveTotalCost.toLocaleString()}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="form-group col-span-2">
                  <label className="text-xs">Service / Repair Cost (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input font-bold"
                    placeholder="0"
                    value={manualRepairCost}
                    onChange={e => setManualRepairCost(Number(e.target.value))}
                  />
                  <span className="text-xs text-muted mt-0.5">
                    Enter 0 if this was an internal checkup, inspection, or covered under warranty.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ==========================================================
              OFFICIAL BILL & INVOICE UPLOAD (SAVED TO PUBLIC/INVOICES/)
             ========================================================== */}
          <div className="invoice-upload-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-cyan" />
                <span className="font-semibold text-sm text-primary">
                  Vendor Bill & Invoice Attachment
                </span>
              </div>
              <span className="invoice-save-location-pill">
                <FolderCheck size={13} />
                Saved to: <code>public/invoices/</code>
              </span>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
                isDraggingInvoice
                  ? 'border-cyan bg-cyan/10'
                  : invoiceFile
                    ? 'border-emerald/50 bg-emerald/5'
                    : 'border-slate-700 hover:border-cyan/60 bg-slate-900/40'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDraggingInvoice(true); }}
              onDragLeave={() => setIsDraggingInvoice(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingInvoice(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleInvoiceFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => invoiceFileInputRef.current && invoiceFileInputRef.current.click()}
            >
              <input
                type="file"
                ref={invoiceFileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleInvoiceFileChange(e.target.files[0]);
                  }
                }}
              />

              {invoiceFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-emerald/20 text-emerald">
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        {invoiceFile.name}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald/20 text-emerald font-normal">
                          ✓ Ready to Store & Link
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        Size: {Math.round(invoiceFile.size / 1024)} KB • Automatically saved into <code>public/invoices/{invoiceFile.name}</code> and registered in Invoice Vault
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setInvoiceFile(null);
                    }}
                    className="text-muted hover:text-rose p-1.5 rounded hover:bg-rose-500/10"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="py-2">
                  <UploadCloud size={24} className="mx-auto text-cyan mb-1" />
                  <div className="text-xs font-semibold text-primary">
                    Click to browse or drag & drop invoice PDF or image bill here
                  </div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Saved to local storage folder and linked to this repair record, parts, and invoice viewer
                  </div>
                </div>
              )}
            </div>

            {/* Invoice metadata fields */}
            <div className="form-grid mt-3">
              <div className="form-group">
                <label className="text-xs">Invoice / Bill Number</label>
                <input
                  type="text"
                  className="form-input font-mono text-xs py-1.5"
                  placeholder="e.g. KMN-INV-2026-09 or auto-generated"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs">Invoice Bill Amount (LKR)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input text-xs py-1.5 font-bold"
                  placeholder={String(effectiveTotalCost)}
                  value={invoiceAmount !== '' ? invoiceAmount : (effectiveTotalCost || '')}
                  onChange={e => setInvoiceAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Service & Observation Notes */}
          <div className="form-group mt-4">
            <label>Technician Service & Observation Notes</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="e.g. Installed new RAM & SSD. Kept under daily observation for 48 hours to confirm system stability."
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                if (isWarningSelected && !warningNote) setWarningNote(e.target.value);
              }}
            ></textarea>
          </div>

          {/* Footer */}
          <div className="form-modal-footer mt-4">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`btn ${isWarningSelected ? 'btn-warning-save' : 'btn-primary'}`}>
              <Save size={16} /> 
              {isWarningSelected 
                ? 'Save & Set Under Daily Warning' 
                : 'Permanently Save Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
