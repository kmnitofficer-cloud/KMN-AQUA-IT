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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <RefreshCw size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Replace & Upgrade AC Unit
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Spot: {unit.UnitCode} • {unit.RoomName} ({unit.Floor})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Section 1: Old Machine Being Removed */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle size={14} />
                Current Machine Being Decommissioned
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {unit.UnitID}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Unit / Model:</span>
                <span className="text-slate-100 font-semibold">{unit.Brand} {unit.Model}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Initial Purchase:</span>
                <span className="text-slate-100 font-semibold">
                  LKR {Number(unit.PurchasePrice || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Lifetime Maintenance:</span>
                <span className="text-amber-400 font-semibold">
                  LKR {Number(unit.lifetimeServiceCost || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Lifetime Repairs:</span>
                <span className="text-rose-400 font-semibold">
                  LKR {Number(unit.lifetimeRepairCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Total Lifetime Investment:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  LKR {Number(unit.totalInvestedCost || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Removal Date *
                </label>
                <input
                  type="date"
                  required
                  value={removalDate}
                  onChange={e => setRemovalDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Removal *
                </label>
                <input
                  type="text"
                  required
                  value={removalReason}
                  onChange={e => setRemovalReason(e.target.value)}
                  placeholder="e.g. Compressor dead, high power consumption"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Final Destination / Disposal *
                </label>
                <select
                  value={finalCondition}
                  onChange={e => setFinalCondition(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100"
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
          <div className="flex items-center justify-center gap-2 text-purple-400 font-semibold text-xs py-0.5">
            <span>Decommissioning Old Unit</span>
            <ArrowRight size={16} />
            <span>Installing New Replacement Unit</span>
          </div>

          {/* Section 2: New Replacement Machine Details */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-4">
            <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles size={14} />
              New Replacement Machine Specifications
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand *
                </label>
                <select
                  value={newUnitData.Brand}
                  onChange={e => handleNewChange('Brand', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                >
                  {AC_BRANDS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model Name / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-XU18XKH-1 Aero Series Inverter"
                  value={newUnitData.Model}
                  onChange={e => handleNewChange('Model', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cooling Capacity (BTU)
                </label>
                <select
                  value={newUnitData.CapacityBTU}
                  onChange={e => handleNewChange('CapacityBTU', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                >
                  <option value="9,000 BTU">9,000 BTU</option>
                  <option value="12,000 BTU">12,000 BTU</option>
                  <option value="18,000 BTU">18,000 BTU</option>
                  <option value="24,000 BTU">24,000 BTU</option>
                  <option value="36,000 BTU">36,000 BTU (Cassette)</option>
                  <option value="48,000 BTU">48,000 BTU (Standing)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Refrigerant Gas
                </label>
                <select
                  value={newUnitData.RefrigerantType}
                  onChange={e => handleNewChange('RefrigerantType', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                >
                  <option value="R32">R32 (Eco Inverter)</option>
                  <option value="R410A">R410A</option>
                  <option value="R22">R22 (Legacy)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Power Rating
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.45 kW"
                  value={newUnitData.PowerRating}
                  onChange={e => handleNewChange('PowerRating', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Unit Purchase Price (LKR) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="500"
                  placeholder="e.g. 215000"
                  value={newUnitData.PurchasePrice}
                  onChange={e => handleNewChange('PurchasePrice', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singer Sri Lanka PLC, Abans PLC"
                  value={newUnitData.Supplier}
                  onChange={e => handleNewChange('Supplier', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Installation / Purchase Date
                </label>
                <input
                  type="date"
                  value={newUnitData.PurchaseDate}
                  onChange={e => handleNewChange('PurchaseDate', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warranty Valid Until
                </label>
                <input
                  type="date"
                  value={newUnitData.WarrantyUntil}
                  onChange={e => handleNewChange('WarrantyUntil', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <span className="text-[11px] text-slate-400">
              * Old machine's full history and lifetime costs will be archived permanently.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
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
