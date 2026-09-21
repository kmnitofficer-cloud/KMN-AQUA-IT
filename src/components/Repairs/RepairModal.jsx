import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Wrench, Cpu, Save, FileText, AlertTriangle, CheckCircle2, Eye, Search, Plus, Trash2, UploadCloud, FileCheck, Paperclip } from 'lucide-react';
import { assetService } from '../../services/assetService';
import { repairService } from '../../services/repairService';

export default function RepairModal({ assetId, isOpen, onClose, onSaved }) {
  const assets = assetService.getAssets('All');

  // Entry Category: 'repair', 'warning', 'checkup'
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
  const [repairCost, setRepairCost] = useState(0);
  const [warrantyCovered, setWarrantyCovered] = useState('Yes');
  const [status, setStatus] = useState('Warning / Under Observation');
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [notes, setNotes] = useState('');

  // Specific Warning & Daily Check details
  const [warningNote, setWarningNote] = useState('');

  // Multi-Part Replacement Tracking (Old vs New)
  const createNewPart = () => ({
    id: `part-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    partType: 'RAM',
    isNewAdditionOnly: false,
    oldPartDetails: '',
    oldPartSerial: '',
    newPartDetails: '',
    newPartSerial: '',
    partCost: ''
  });

  const [hasPartReplacement, setHasPartReplacement] = useState(false);
  const [partsList, setPartsList] = useState([createNewPart()]);

  // Automatic Invoice Handling & File Upload
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [isDraggingInvoice, setIsDraggingInvoice] = useState(false);
  const invoiceFileInputRef = useRef(null);

  const handleAddPart = () => {
    setPartsList(prev => [...prev, createNewPart()]);
  };

  const handleRemovePart = (id) => {
    if (partsList.length <= 1) return;
    setPartsList(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdatePart = (id, field, value) => {
    setPartsList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
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
      setRepairCost(0);
      setWarrantyCovered('Yes');
    } else if (cat === 'checkup') {
      setStatus('Routine Checkup / Inspection');
      setRepairCost(0);
      setWarrantyCovered('Yes');
    } else {
      setStatus('Completed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetAssetId || !problemDescription.trim()) {
      alert('Please specify the asset and describe the issue / observation.');
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
      repairCost: Number(repairCost) || 0,
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
      invoiceAmount: invoiceAmount !== '' ? Number(invoiceAmount) : (Number(repairCost) || 0),
      invoiceSupplier: repairSupplier
    });

    if (onSaved) onSaved();
    onClose();
  };

  const isWarningSelected = status.includes('Warning') || entryCategory === 'warning';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            {isWarningSelected ? (
              <AlertTriangle size={22} className="text-amber" />
            ) : (
              <Wrench size={20} className="text-primary" />
            )}
            <div>
              <h2>{isWarningSelected ? 'Log Issue & Set Under Warning / Daily Check' : 'Log Equipment Repair & Service Record'}</h2>
              <span className="text-xs text-muted block">
                {isWarningSelected ? 'Keep device operational with user while tracking ongoing warnings' : 'Record vendor services, inspections, and component replacements'}
              </span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          {/* Quick Category Toggle Buttons */}
          <div className="entry-category-bar mb-4">
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'warning' ? 'active warning' : ''}`}
              onClick={() => handleCategoryChange('warning')}
            >
              <AlertTriangle size={15} /> ⚠️ Warning / Under Daily Observation (Still Works)
            </button>
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'checkup' ? 'active checkup' : ''}`}
              onClick={() => handleCategoryChange('checkup')}
            >
              <Eye size={15} /> 🔍 Routine Checkup / Inspection (No Payment)
            </button>
            <button
              type="button"
              className={`entry-cat-btn ${entryCategory === 'repair' ? 'active repair' : ''}`}
              onClick={() => handleCategoryChange('repair')}
            >
              <Wrench size={15} /> 🔧 Hardware Repair & Part Fix
            </button>
          </div>

          {/* Prominent Warning Callout Banner when Warning mode is active */}
          {isWarningSelected && (
            <div className="warning-callout-banner mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber shrink-0" />
                <span className="font-semibold text-sm text-amber">
                  Device Stays in Active Office Use with Employee
                </span>
              </div>
              <p className="text-xs text-muted mt-1">
                The machine is still running, but needs daily monitoring (e.g. intermittent beep, battery check, lag, or error). An amber warning badge will appear across the Dashboard and Asset Register so IT staff check on it regularly.
              </p>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-primary">Target Machine / Asset *</label>
                <span className="text-xs text-muted">
                  {filteredAssets.length} of {assets.length} machines
                </span>
              </div>

              {/* Quick Search / Filter Input */}
              <div className="relative mb-2">
                <input
                  type="text"
                  className="form-input text-xs pl-8 pr-16 py-1.5"
                  placeholder="🔍 Filter by User (e.g. Anjelo), Machine (e.g. UPS, Monitor, Dell), or Tag..."
                  value={assetSearchText}
                  onChange={e => setAssetSearchText(e.target.value)}
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-muted pointer-events-none" />
                {assetSearchText && (
                  <button
                    type="button"
                    onClick={() => setAssetSearchText('')}
                    className="absolute right-2.5 top-1.5 text-xs text-muted hover:text-white px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
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

              {/* Selected Machine Detailed Summary Card */}
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
                      Status: <span className="text-emerald-400 font-medium">{selectedAsset.Status}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Service / Inspection Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={repairDate}
                onChange={e => setRepairDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Service / Operational Status *</label>
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

            <div className="form-group col-span-2">
              <label>Problem / Observation Description *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. UPS GIVE VIERD BEEP SOUND or Battery drains fast or CPU low performance"
                value={problemDescription}
                onChange={e => {
                  setProblemDescription(e.target.value);
                  if (!warningNote) setWarningNote(e.target.value);
                }}
              />
            </div>

            <div className="form-group">
              <label>Action Taken / Resolution</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Checked by Yohan, reset battery, placed on daily observation"
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
              <span className="text-xs text-muted">Enter 0 if this was an internal checkup or under warranty.</span>
            </div>

            <div className="form-group">
              <label>Warranty Covered?</label>
              <select
                className="form-input"
                value={warrantyCovered}
                onChange={e => setWarrantyCovered(e.target.value)}
              >
                <option value="Yes">Yes (Covered Under OEM Warranty / Internal Check)</option>
                <option value="No">No (Paid Out of Pocket)</option>
              </select>
            </div>
          </div>

          {/* Part Replacement Sub-Form (Multiple Parts & Old vs New Tracking) */}
          <div className="part-replacement-subform mt-4">
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-md border border-subtle">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-violet" />
                <div>
                  <span className="font-semibold text-sm block">Did you replace or install physical hardware parts?</span>
                  <span className="text-xs text-muted">Supports adding multiple parts (e.g. RAM + SSD + Battery) on one service</span>
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-xs ${hasPartReplacement ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setHasPartReplacement(!hasPartReplacement)}
              >
                {hasPartReplacement ? `Parts: YES (${partsList.length})` : '+ Add Hardware Parts'}
              </button>
            </div>

            {hasPartReplacement && (
              <div className="mt-3 p-3 bg-surface-elevated rounded-md border border-subtle space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-subtle">
                  <span className="text-xs font-semibold text-primary">
                    Installed / Replaced Components ({partsList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="btn btn-outline btn-xs flex items-center gap-1 text-cyan border-cyan/40 hover:bg-cyan/10"
                  >
                    <Plus size={13} /> Add Another Part
                  </button>
                </div>

                {partsList.map((part, index) => (
                  <div key={part.id} className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/60">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-violet/25 text-violet font-bold text-xs font-mono border border-violet/40">
                          Part #{index + 1}
                        </span>
                        <span className="text-xs text-white font-medium">
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
                          <span>New Addition (No Old Part)</span>
                        </label>
                        {partsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePart(part.id)}
                            className="text-xs text-rose hover:text-rose-400 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-rose-500/10"
                            title="Remove this part"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group col-span-2 sm:col-span-1">
                        <label className="text-xs">Component Type *</label>
                        <select
                          className="form-input text-xs py-1.5"
                          value={part.partType}
                          onChange={e => handleUpdatePart(part.id, 'partType', e.target.value)}
                        >
                          <option value="RAM">RAM / Memory Module</option>
                          <option value="Storage / SSD">Storage Drive (HDD / SSD / NVMe)</option>
                          <option value="Power Supply">Power Supply Unit / SMPS / UPS</option>
                          <option value="Battery">Battery / Power Pack</option>
                          <option value="Screen / Display">Screen / Display Panel</option>
                          <option value="Motherboard">Motherboard / Logic Board</option>
                          <option value="Keyboard / Touchpad">Keyboard / Touchpad</option>
                          <option value="Cooling Fan">Cooling Fan / Thermal Heatsink</option>
                          <option value="Network / Wi-Fi">Network / Wi-Fi Card</option>
                          <option value="Graphics / GPU">Graphics Card / GPU</option>
                          <option value="Other">Other Internal Component</option>
                        </select>
                      </div>

                      <div className="form-group col-span-2 sm:col-span-1">
                        <label className="text-xs">Individual Part Cost (LKR)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-input text-xs py-1.5"
                          placeholder="e.g. 4500 (optional)"
                          value={part.partCost}
                          onChange={e => handleUpdatePart(part.id, 'partCost', e.target.value)}
                        />
                      </div>

                      {!part.isNewAdditionOnly ? (
                        <>
                          <div className="form-group">
                            <label className="text-xs text-rose-300">Old Removed Part Specs</label>
                            <input
                              type="text"
                              className="form-input text-xs py-1.5"
                              placeholder="e.g. 4GB DDR3 RAM (Faulty)"
                              value={part.oldPartDetails}
                              onChange={e => handleUpdatePart(part.id, 'oldPartDetails', e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label className="text-xs text-rose-300">Old Part Serial Number</label>
                            <input
                              type="text"
                              className="form-input font-mono text-xs py-1.5"
                              placeholder="e.g. RAM001 or N/A"
                              value={part.oldPartSerial}
                              onChange={e => handleUpdatePart(part.id, 'oldPartSerial', e.target.value)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 p-2 rounded bg-cyan/10 border border-cyan/20 text-cyan text-xs flex items-center gap-2">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span>Brand new hardware addition or memory expansion (no faulty part removed).</span>
                        </div>
                      )}

                      <div className="form-group">
                        <label className="text-xs text-emerald-300">New Installed Part Specs *</label>
                        <input
                          type="text"
                          required={hasPartReplacement}
                          className="form-input text-xs py-1.5 font-medium"
                          placeholder="e.g. 8GB DDR3 1600MHz Kingston"
                          value={part.newPartDetails}
                          onChange={e => handleUpdatePart(part.id, 'newPartDetails', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="text-xs text-emerald-300">New Part Serial Number</label>
                        <input
                          type="text"
                          className="form-input font-mono text-xs py-1.5"
                          placeholder="e.g. SN-RAM009"
                          value={part.newPartSerial}
                          onChange={e => handleUpdatePart(part.id, 'newPartSerial', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPart}
                  className="btn btn-outline btn-xs w-full flex items-center justify-center gap-1.5 border-dashed border-cyan/40 text-cyan hover:bg-cyan/10 py-2"
                >
                  <Plus size={14} /> + Add Another Hardware Part (e.g. 2nd RAM, SSD, Power Supply)
                </button>
              </div>
            )}
          </div>

          {/* Integrated Vendor Bill & Invoice Upload (Automatic File Handling) */}
          <div className="invoice-section mt-4 p-4 rounded-lg border border-subtle bg-surface-elevated">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-cyan" />
                <span className="font-semibold text-sm">Vendor Bill & Invoice Attachment (Automatic Handling)</span>
              </div>
              <span className="text-xs text-muted">PDF, PNG, JPG, JPEG</span>
            </div>

            {/* Drag & Drop File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors cursor-pointer ${
                isDraggingInvoice
                  ? 'border-cyan bg-cyan/10'
                  : invoiceFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
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
                    <div className="p-2 rounded bg-emerald-500/20 text-emerald-400">
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        {invoiceFile.name}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-normal">
                          ✓ Ready to Auto-Upload & Link
                        </span>
                      </div>
                      <div className="text-xs text-muted">
                        Size: {Math.round(invoiceFile.size / 1024)} KB • Automatically archived in Invoices register & linked to all parts
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
                    Automatically uploaded and linked to this repair record, all installed parts, and expense logs
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
                  className="form-input text-xs py-1.5"
                  placeholder={String(repairCost || 0)}
                  value={invoiceAmount !== '' ? invoiceAmount : (repairCost || '')}
                  onChange={e => setInvoiceAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Technician & Daily Check Service Notes</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="e.g. THIS IS AUTO FIXED BUT IN WARNING NEED TO CHECK IN DAILY - check battery backup during routine rounds."
              value={notes}
              onChange={e => {
                setNotes(e.target.value);
                if (isWarningSelected && !warningNote) setWarningNote(e.target.value);
              }}
            ></textarea>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${isWarningSelected ? 'btn-warning-save' : 'btn-primary'}`}>
              <Save size={16} /> {isWarningSelected ? 'Save & Set Under Daily Warning' : 'Permanently Save Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
