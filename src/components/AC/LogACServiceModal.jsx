import React, { useState } from 'react';
import { X, Wrench, Upload, Calendar, DollarSign, UserCheck, ShieldCheck, Check } from 'lucide-react';
import { acService } from '../../services/acService';

export default function LogACServiceModal({ isOpen, onClose, unit, onServiceLogged }) {
  const [formData, setFormData] = useState({
    ServiceDate: new Date().toISOString().split('T')[0],
    ServiceType: 'Routine Maintenance',
    Cost: '',
    Technician: 'Lanka Cool Tech (Pvt) Ltd',
    InvoiceNo: '',
    GasRefillPSI: '140 PSI (Normal)',
    FilterCleaned: true,
    CoilCleaned: true,
    NextServiceDue: '',
    Notes: ''
  });

  const [billFile, setBillFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !unit) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = e => {
    if (e.target.files && e.target.files[0]) {
      setBillFile(e.target.files[0]);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!formData.Cost || isNaN(formData.Cost) || Number(formData.Cost) < 0) {
      setError('Please enter a valid service cost (0 or greater).');
      return;
    }

    try {
      setIsSubmitting(true);
      await acService.logService({
        ...formData,
        UnitID: unit.UnitID,
        Cost: Number(formData.Cost),
        billFile
      });

      if (onServiceLogged) onServiceLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log AC service:', err);
      setError('Failed to record service. Please try again.');
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
              <Wrench size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Log AC Maintenance Service
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {unit.UnitCode} • {unit.Brand} {unit.Model} ({unit.RoomName})
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Service Date *
              </label>
              <input
                type="date"
                required
                value={formData.ServiceDate}
                onChange={e => handleChange('ServiceDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Service Type *
              </label>
              <select
                value={formData.ServiceType}
                onChange={e => handleChange('ServiceType', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="Routine Maintenance">Routine Maintenance & Filter Clean</option>
                <option value="Chemical Wash & Gas Top-up">Chemical Wash & Gas Top-up</option>
                <option value="Gas Refill Only">Gas Refill Only</option>
                <option value="Deep Blower Pressure Clean">Deep Blower Pressure Clean</option>
                <option value="Full Comprehensive Service">Full Comprehensive Service</option>
                <option value="Emergency Service">Emergency Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Service Cost (LKR) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 5500"
                  value={formData.Cost}
                  onChange={e => handleChange('Cost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 pr-12 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  LKR
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technician / Contractor
              </label>
              <input
                type="text"
                placeholder="e.g. Lanka Cool Tech, Abans"
                value={formData.Technician}
                onChange={e => handleChange('Technician', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Invoice / Bill Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-AC-2026-10"
                value={formData.InvoiceNo}
                onChange={e => handleChange('InvoiceNo', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Gas Level / PSI Reading
              </label>
              <input
                type="text"
                placeholder="e.g. 140 PSI (OK) or Topped up R32"
                value={formData.GasRefillPSI}
                onChange={e => handleChange('GasRefillPSI', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.FilterCleaned}
                onChange={e => handleChange('FilterCleaned', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-slate-600 bg-slate-700"
              />
              <span className="text-xs text-slate-200">Indoor Filters Cleaned</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.CoilCleaned}
                onChange={e => handleChange('CoilCleaned', e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 border-slate-600 bg-slate-700"
              />
              <span className="text-xs text-slate-200">Cooling Coils Washed</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Next Scheduled Service Due
            </label>
            <input
              type="date"
              value={formData.NextServiceDue}
              onChange={e => handleChange('NextServiceDue', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Bill Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attach Service Invoice / Receipt (PDF or Image)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-800/40 hover:bg-slate-800 cursor-pointer transition text-xs text-slate-300">
                <Upload size={16} className="text-cyan-400" />
                <span>{billFile ? billFile.name : 'Choose invoice file (PDF, JPG, PNG)'}</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {billFile && (
                <button
                  type="button"
                  onClick={() => setBillFile(null)}
                  className="p-2.5 rounded-xl bg-slate-800 text-rose-400 hover:bg-slate-700"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Notes & Observations
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Blower fan running smoothly, condenser coil cleared of dust, optimal cooling achieved."
              value={formData.Notes}
              onChange={e => handleChange('Notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold shadow-lg shadow-cyan-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Save Service Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
