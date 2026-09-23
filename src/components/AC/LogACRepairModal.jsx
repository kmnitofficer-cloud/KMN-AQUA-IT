import React, { useState } from 'react';
import { X, AlertTriangle, Upload, DollarSign, Calendar, Wrench, CheckCircle2 } from 'lucide-react';
import { acService } from '../../services/acService';

export default function LogACRepairModal({ isOpen, onClose, unit, onRepairLogged }) {
  const [formData, setFormData] = useState({
    IssueDate: new Date().toISOString().split('T')[0],
    ResolvedDate: '',
    IssueDescription: '',
    PartsReplaced: '',
    RepairCost: '',
    Technician: '',
    Status: 'In Progress', // 'In Progress', 'Completed'
    InvoiceNo: '',
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

    if (!formData.IssueDescription.trim()) {
      setError('Please provide a description of the issue or breakdown.');
      return;
    }

    try {
      setIsSubmitting(true);
      await acService.logRepair({
        ...formData,
        UnitID: unit.UnitID,
        RepairCost: Number(formData.RepairCost) || 0,
        billFile
      });

      if (onRepairLogged) onRepairLogged();
      onClose();
    } catch (err) {
      console.error('Failed to log AC repair:', err);
      setError('Failed to record breakdown repair. Please try again.');
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
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Log AC Breakdown & Repair
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
                Issue Reported Date *
              </label>
              <input
                type="date"
                required
                value={formData.IssueDate}
                onChange={e => handleChange('IssueDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Repair Status *
              </label>
              <select
                value={formData.Status}
                onChange={e => {
                  handleChange('Status', e.target.value);
                  if (e.target.value === 'Completed' && !formData.ResolvedDate) {
                    handleChange('ResolvedDate', new Date().toISOString().split('T')[0]);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500 font-semibold"
              >
                <option value="In Progress">🔴 In Progress (Unit Under Repair)</option>
                <option value="Completed">🟢 Completed (Unit Restored to Active)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Issue / Breakdown Description *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Unit blowing warm air, outdoor unit compressor humming without starting, water leaking from tray..."
              value={formData.IssueDescription}
              onChange={e => handleChange('IssueDescription', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Parts Replaced / Repaired
              </label>
              <input
                type="text"
                placeholder="e.g. Capacitor 45uF, PCB Relay, Fan Motor"
                value={formData.PartsReplaced}
                onChange={e => handleChange('PartsReplaced', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Total Repair Cost (LKR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 18500"
                  value={formData.RepairCost}
                  onChange={e => handleChange('RepairCost', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500 pr-12 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">
                  LKR
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technician / Workshop
              </label>
              <input
                type="text"
                placeholder="e.g. Chilaw Refrigeration, In-house IT"
                value={formData.Technician}
                onChange={e => handleChange('Technician', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Resolved Date
              </label>
              <input
                type="date"
                value={formData.ResolvedDate}
                onChange={e => handleChange('ResolvedDate', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Invoice / Repair Bill Number
            </label>
            <input
              type="text"
              placeholder="e.g. REP-AC-2026-09"
              value={formData.InvoiceNo}
              onChange={e => handleChange('InvoiceNo', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          {/* Bill Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Attach Repair Invoice / Job Sheet (PDF or Photo)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-slate-700 hover:border-rose-500 bg-slate-800/40 hover:bg-slate-800 cursor-pointer transition text-xs text-slate-300">
                <Upload size={16} className="text-rose-400" />
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
              Repair Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Replaced capacitor, pressure tested lines, verified 20 minutes continuous cooling."
              value={formData.Notes}
              onChange={e => handleChange('Notes', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-rose-500 resize-none"
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Log Breakdown Repair'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
