import React, { useState } from 'react';
import { X, Plus, Edit2, MapPin, Thermometer } from 'lucide-react';
import { acService, AC_BRANDS, AC_FLOORS, AC_WORK_MODES, AC_STATUSES } from '../../services/acService';

export default function ACUnitFormModal({ isOpen, onClose, unitToEdit, onSaved, defaultFloor = 'Ground Floor' }) {
  const isEditing = Boolean(unitToEdit);

  const [formData, setFormData] = useState({
    UnitNumber: unitToEdit ? unitToEdit.UnitNumber : '',
    UnitCode: unitToEdit ? unitToEdit.UnitCode : '',
    Floor: unitToEdit ? unitToEdit.Floor : defaultFloor,
    RoomName: unitToEdit ? unitToEdit.RoomName : '',
    WallPosition: unitToEdit ? unitToEdit.WallPosition : 'North Wall',
    Brand: unitToEdit ? unitToEdit.Brand : 'Panasonic',
    Model: unitToEdit ? unitToEdit.Model : '',
    CapacityBTU: unitToEdit ? unitToEdit.CapacityBTU : '18,000 BTU',
    RefrigerantType: unitToEdit ? unitToEdit.RefrigerantType : 'R32',
    PowerRating: unitToEdit ? unitToEdit.PowerRating : '1.5 kW',
    PurchaseDate: unitToEdit ? unitToEdit.PurchaseDate : new Date().toISOString().split('T')[0],
    PurchasePrice: unitToEdit ? unitToEdit.PurchasePrice : '',
    Supplier: unitToEdit ? unitToEdit.Supplier : '',
    WarrantyUntil: unitToEdit ? unitToEdit.WarrantyUntil : '',
    Status: unitToEdit ? unitToEdit.Status : 'Active',
    WorkMode: unitToEdit ? unitToEdit.WorkMode : 'Normal Cooling',
    TargetTemp: unitToEdit ? unitToEdit.TargetTemp : 22,
    CoordX: unitToEdit ? unitToEdit.CoordX : 300,
    CoordY: unitToEdit ? unitToEdit.CoordY : 200,
    Notes: unitToEdit ? unitToEdit.Notes : ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.RoomName.trim() || !formData.Model.trim()) {
      setError('Please provide room name and model.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        await acService.updateACUnit(unitToEdit.UnitID, formData);
      } else {
        await acService.addACUnit(formData);
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save AC unit:', err);
      setError('Failed to save unit details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {isEditing ? `Edit AC Unit (${unitToEdit.UnitCode})` : 'Add New AC Unit'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {isEditing ? `${unitToEdit.Brand} ${unitToEdit.Model}` : 'Deploy new unit onto building blueprint'}
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Floor *
              </label>
              <select
                value={formData.Floor}
                onChange={e => handleChange('Floor', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                {AC_FLOORS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room / Zone Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Accounts & Audit Room, Reception"
                value={formData.RoomName}
                onChange={e => handleChange('RoomName', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brand *
              </label>
              <select
                value={formData.Brand}
                onChange={e => handleChange('Brand', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                {AC_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Model Name / Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS-S18TKH Inverter"
                value={formData.Model}
                onChange={e => handleChange('Model', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cooling Capacity
              </label>
              <select
                value={formData.CapacityBTU}
                onChange={e => handleChange('CapacityBTU', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                <option value="9,000 BTU">9,000 BTU</option>
                <option value="12,000 BTU">12,000 BTU</option>
                <option value="18,000 BTU">18,000 BTU</option>
                <option value="24,000 BTU">24,000 BTU</option>
                <option value="36,000 BTU">36,000 BTU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Refrigerant
              </label>
              <select
                value={formData.RefrigerantType}
                onChange={e => handleChange('RefrigerantType', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                <option value="R32">R32</option>
                <option value="R410A">R410A</option>
                <option value="R22">R22</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Purchase Price (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                placeholder="195000"
                value={formData.PurchasePrice}
                onChange={e => handleChange('PurchasePrice', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={formData.Status}
                onChange={e => handleChange('Status', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 font-semibold"
              >
                {AC_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Mode
              </label>
              <select
                value={formData.WorkMode}
                onChange={e => handleChange('WorkMode', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                {AC_WORK_MODES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Temp (°C)
              </label>
              <input
                type="number"
                min="16"
                max="30"
                value={formData.TargetTemp}
                onChange={e => handleChange('TargetTemp', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Supplier
              </label>
              <input
                type="text"
                placeholder="e.g. Singer, Abans"
                value={formData.Supplier}
                onChange={e => handleChange('Supplier', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Warranty Until
              </label>
              <input
                type="date"
                value={formData.WarrantyUntil}
                onChange={e => handleChange('WarrantyUntil', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-2">
              <MapPin size={14} className="text-cyan-400" />
              Blueprint Pin Position (SVG Coordinates)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">X Coordinate (0 - 900)</label>
                <input
                  type="number"
                  min="50"
                  max="850"
                  value={formData.CoordX}
                  onChange={e => handleChange('CoordX', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Y Coordinate (0 - 650)</label>
                <input
                  type="number"
                  min="50"
                  max="600"
                  value={formData.CoordY}
                  onChange={e => handleChange('CoordY', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.Notes}
              onChange={e => handleChange('Notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
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
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add AC Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
