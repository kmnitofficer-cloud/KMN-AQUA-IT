import React, { useState, useEffect } from 'react';
import {
  Wind,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Plus,
  Thermometer,
  ShieldCheck,
  Calendar,
  Layers,
  Search,
  Filter,
  FileText,
  DollarSign,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { acService, AC_FLOORS, AC_STATUSES } from '../../services/acService';
import { dbRepository } from '../../services/dbRepository';
import ACFloorPlan from './ACFloorPlan';
import LogACServiceModal from './LogACServiceModal';
import LogACRepairModal from './LogACRepairModal';
import ReplaceACModal from './ReplaceACModal';
import ACUnitFormModal from './ACUnitFormModal';

export default function ACView() {
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAirflow, setShowAirflow] = useState(true);

  const [units, setUnits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('overview'); // 'overview' | 'services' | 'repairs' | 'replacements'

  // Modal States
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState(null);

  const loadData = () => {
    const allUnits = acService.getACUnits();
    setUnits(allUnits);
    setSummary(acService.getACSummary());

    if (selectedUnit) {
      const refreshedSelected = allUnits.find(u => u.UnitID === selectedUnit.UnitID);
      setSelectedUnit(refreshedSelected || allUnits[0] || null);
    } else if (allUnits.length > 0) {
      // Default to first unit on the current floor
      const firstOnFloor = allUnits.find(u => u.Floor === selectedFloor) || allUnits[0];
      setSelectedUnit(firstOnFloor);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = dbRepository.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Filter units for the floor plan
  const floorUnits = units.filter(u => {
    const matchesFloor = u.Floor === selectedFloor;
    const matchesStatus = statusFilter === 'All' || u.Status === statusFilter;
    return matchesFloor && matchesStatus;
  });

  // Filter units for the comprehensive table
  const tableUnits = units.filter(u => {
    const matchesFloor = selectedFloor === 'All' || u.Floor === selectedFloor;
    const matchesStatus = statusFilter === 'All' || u.Status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      u.UnitCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.RoomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.Brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.Model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFloor && matchesStatus && matchesSearch;
  });

  const handleTempAdjust = async delta => {
    if (!selectedUnit) return;
    const newTemp = Math.min(Math.max(16, (Number(selectedUnit.TargetTemp) || 22) + delta), 28);
    await acService.updateACUnit(selectedUnit.UnitID, { TargetTemp: newTemp });
    loadData();
  };

  const handleModeChange = async newMode => {
    if (!selectedUnit) return;
    await acService.updateACUnit(selectedUnit.UnitID, { WorkMode: newMode });
    loadData();
  };

  const getStatusBadge = status => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Needs Service':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Under Repair':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      {/* Top Banner / Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Wind size={28} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <span>HVAC & Air Conditioning Management</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-medium">
                Live Blueprint Plan
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Interactive 2-floor layout, asset cost tracking, maintenance schedules & replacement lifecycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUnitToEdit(null);
              setIsUnitModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-cyan-600/25 transition"
          >
            <Plus size={16} />
            <span>Add AC Unit</span>
          </button>
        </div>
      </div>

      {/* Financial & Performance Stats Banner */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Units</span>
              <span className="text-cyan-400 font-mono font-semibold">13 Total</span>
            </div>
            <div className="text-xl font-black text-slate-100">{summary.totalUnits} Units</div>
            <div className="flex items-center gap-2 text-[11px] mt-1.5 font-medium">
              <span className="text-emerald-400">{summary.activeUnits} Active</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">{summary.needsServiceUnits} Service</span>
              <span className="text-slate-600">•</span>
              <span className="text-rose-400">{summary.underRepairUnits} Repair</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Initial Asset Cost</span>
              <DollarSign size={14} className="text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              LKR {(summary.totalAssetCost / 1000).toFixed(0)}k
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Initial installation & machine cost
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Routine Maintenance</span>
              <Wrench size={14} className="text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">
              LKR {summary.totalServiceCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Filter cleaning, gas top-ups & washes
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Repairs & Breakdown</span>
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 font-mono">
              LKR {summary.totalRepairCost.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Capacitors, motors & emergency fixes
            </p>
          </div>

          <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-800/40 shadow-lg">
            <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
              <span>Grand Total Invested</span>
              <Sparkles size={14} className="text-cyan-400" />
            </div>
            <div className="text-xl font-black text-cyan-300 font-mono">
              LKR {(summary.grandTotalExpense / 1000).toFixed(1)}k
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Machines + Lifetime upkeep
            </p>
          </div>
        </div>
      )}

      {/* Floor & Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
        {/* Floor Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
          {AC_FLOORS.map(floor => {
            const count = units.filter(u => u.Floor === floor).length;
            const isSelected = selectedFloor === floor;
            return (
              <button
                key={floor}
                onClick={() => {
                  setSelectedFloor(floor);
                  const firstOnNewFloor = units.find(u => u.Floor === floor);
                  if (firstOnNewFloor) setSelectedUnit(firstOnNewFloor);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{floor}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-cyan-700/70 text-cyan-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filters & Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {['All', 'Active', 'Needs Service', 'Under Repair'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  statusFilter === st
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              showAirflow
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle cool airflow visualization animation on map"
          >
            <Wind size={14} className={showAirflow ? 'animate-pulse' : ''} />
            <span>Airflow</span>
          </button>
        </div>
      </div>

      {/* Main Split Interface (Blueprint Map + AC Unit Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: AC Unit Inspector Card (KOMVENT Inspired Control Deck) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedUnit ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl">
              {/* Inspector Header */}
              <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                      {selectedUnit.UnitCode}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Spot #{selectedUnit.UnitNumber}
                    </span>
                  </div>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${getStatusBadge(selectedUnit.Status)}`}>
                    {selectedUnit.Status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-100">
                  {selectedUnit.Brand} {selectedUnit.Model}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                  <span>📍 {selectedUnit.RoomName}</span>
                  <span>•</span>
                  <span>{selectedUnit.Floor}</span>
                </p>
              </div>

              {/* Climate Dial & Mode Control Box */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/40">
                <div className="flex items-center justify-between gap-4">
                  {/* Temperature Stepper */}
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Thermometer size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
                        Set Temperature
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-100 font-mono">
                          {selectedUnit.TargetTemp || 22}
                        </span>
                        <span className="text-cyan-400 font-bold text-lg">°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons - / + */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleTempAdjust(-1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center"
                      title="Lower temperature"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleTempAdjust(1)}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-base transition flex items-center justify-center"
                      title="Increase temperature"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>Operating Work Mode:</span>
                    <span className="text-cyan-400 font-semibold">{selectedUnit.WorkMode}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px] font-medium">
                    {['Normal Cooling', 'Eco Cooling', 'Turbo Cooling', 'Low Power'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`py-1.5 px-2 rounded-lg text-center truncate transition ${
                          selectedUnit.WorkMode === mode
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unit Lifetime Financial Breakdown Card */}
              <div className="p-4 bg-slate-950/60 border-b border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  Financial & Cost Audit
                </span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Purchase</span>
                    <span className="text-slate-200 font-bold font-mono">
                      LKR {Number(selectedUnit.PurchasePrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-amber-500/80 block text-[10px]">Maintenance</span>
                    <span className="text-amber-400 font-bold font-mono">
                      LKR {Number(selectedUnit.lifetimeServiceCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-rose-500/80 block text-[10px]">Repairs</span>
                    <span className="text-rose-400 font-bold font-mono">
                      LKR {Number(selectedUnit.lifetimeRepairCost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-between text-xs">
                  <span className="text-cyan-300 font-semibold">Total Invested in Spot:</span>
                  <span className="text-cyan-300 font-black font-mono text-sm">
                    LKR {Number(selectedUnit.totalInvestedCost || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="p-4 border-b border-slate-800 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 hover:text-cyan-300 transition text-xs font-semibold"
                >
                  <Wrench size={16} />
                  <span>Log Service</span>
                </button>

                <button
                  onClick={() => setIsRepairModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-rose-400 hover:text-rose-300 transition text-xs font-semibold"
                >
                  <AlertTriangle size={16} />
                  <span>Log Repair</span>
                </button>

                <button
                  onClick={() => setIsReplaceModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 transition text-xs font-semibold"
                  title="Replace with new AC unit while preserving old machine history"
                >
                  <RefreshCw size={16} />
                  <span>Replace Unit</span>
                </button>
              </div>

              {/* Tab Navigation in Inspector */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/40 text-xs">
                <button
                  onClick={() => setInspectorTab('overview')}
                  className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
                    inspectorTab === 'overview'
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Specs
                </button>
                <button
                  onClick={() => setInspectorTab('services')}
                  className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
                    inspectorTab === 'services'
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Services ({selectedUnit.serviceCount || 0})
                </button>
                <button
                  onClick={() => setInspectorTab('repairs')}
                  className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
                    inspectorTab === 'repairs'
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Repairs ({selectedUnit.repairCount || 0})
                </button>
                <button
                  onClick={() => setInspectorTab('replacements')}
                  className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
                    inspectorTab === 'replacements'
                      ? 'border-purple-500 text-purple-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  History ({selectedUnit.replacements ? selectedUnit.replacements.length : 0})
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="p-5 max-h-[300px] overflow-y-auto text-xs space-y-3">
                {/* 1. Overview Specs Tab */}
                {inspectorTab === 'overview' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Cooling Capacity</span>
                        <span className="font-semibold text-slate-200">{selectedUnit.CapacityBTU}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Refrigerant Gas</span>
                        <span className="font-semibold text-slate-200">{selectedUnit.RefrigerantType}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Power Rating</span>
                        <span className="font-semibold text-slate-200">{selectedUnit.PowerRating || '1.5 kW'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Supplier / Vendor</span>
                        <span className="font-semibold text-slate-200">{selectedUnit.Supplier || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Installation Date:</span>
                        <span className="font-mono">{selectedUnit.PurchaseDate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Warranty Until:</span>
                        <span className="font-mono text-emerald-400">{selectedUnit.WarrantyUntil || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Last Serviced:</span>
                        <span className="font-mono">{selectedUnit.LastServiceDate || 'None'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Next Due:</span>
                        <span className="font-mono text-amber-400">{selectedUnit.NextServiceDue || 'Not Scheduled'}</span>
                      </div>
                    </div>

                    {selectedUnit.Notes && (
                      <p className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 italic">
                        "{selectedUnit.Notes}"
                      </p>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          setUnitToEdit(selectedUnit);
                          setIsUnitModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                      >
                        <Edit2 size={13} />
                        <span>Edit Unit Details</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Services Tab */}
                {inspectorTab === 'services' && (
                  <div className="space-y-2.5">
                    {selectedUnit.services && selectedUnit.services.length > 0 ? (
                      selectedUnit.services.map(srv => (
                        <div
                          key={srv.ServiceID}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{srv.ServiceType}</span>
                            <span className="font-mono font-bold text-amber-400">
                              LKR {Number(srv.Cost || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>📅 {srv.ServiceDate}</span>
                            <span>👤 {srv.Technician}</span>
                          </div>
                          {srv.GasRefillPSI && (
                            <div className="text-[11px] text-cyan-400">
                              Pressure: {srv.GasRefillPSI}
                            </div>
                          )}
                          {srv.Notes && (
                            <p className="text-[11px] text-slate-400 italic">
                              "{srv.Notes}"
                            </p>
                          )}
                          {srv.FilePath && (
                            <div className="pt-1">
                              <a
                                href={srv.FilePath}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <FileText size={12} />
                                View Attached Invoice ({srv.FileName || 'PDF'})
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        No routine maintenance logged for this unit yet.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Repairs Tab */}
                {inspectorTab === 'repairs' && (
                  <div className="space-y-2.5">
                    {selectedUnit.repairs && selectedUnit.repairs.length > 0 ? (
                      selectedUnit.repairs.map(rep => (
                        <div
                          key={rep.RepairID}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-400">{rep.IssueDescription}</span>
                            <span className="font-mono font-bold text-rose-400">
                              LKR {Number(rep.RepairCost || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Reported: {rep.IssueDate}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              rep.Status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {rep.Status}
                            </span>
                          </div>
                          {rep.PartsReplaced && (
                            <div className="text-[11px] text-slate-300">
                              <span className="text-slate-500">Parts: </span>
                              {rep.PartsReplaced}
                            </div>
                          )}
                          {rep.Technician && (
                            <div className="text-[11px] text-slate-400">
                              Technician: {rep.Technician}
                            </div>
                          )}
                          {rep.FilePath && (
                            <div className="pt-1">
                              <a
                                href={rep.FilePath}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                              >
                                <FileText size={12} />
                                View Attached Job Sheet / Bill
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        No breakdown repairs reported. System healthy!
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Replacement History Tab */}
                {inspectorTab === 'replacements' && (
                  <div className="space-y-2.5">
                    {selectedUnit.replacements && selectedUnit.replacements.length > 0 ? (
                      selectedUnit.replacements.map(repLog => (
                        <div
                          key={repLog.ReplacementID}
                          className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-300">
                              Previous Machine: {repLog.OldUnitBrand} {repLog.OldUnitModel}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-200">
                              Removed {repLog.RemovalDate}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300">
                            <span className="text-slate-400">Reason: </span>
                            {repLog.RemovalReason}
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-2 rounded-lg border border-purple-900/30">
                            <div>
                              <span className="text-slate-400">Old Unit Services: </span>
                              <span className="font-mono text-amber-400">
                                LKR {Number(repLog.OldUnitLifetimeServiceCost || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Old Unit Repairs: </span>
                              <span className="font-mono text-rose-400">
                                LKR {Number(repLog.OldUnitLifetimeRepairCost || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            <span>Disposal: </span>
                            <span className="text-slate-200">{repLog.FinalCondition}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        This is the original machine installed at this spot. No previous decommissioned units.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500">
              Select an AC pin from the floor plan to view details.
            </div>
          )}
        </div>

        {/* Right: Interactive SVG Blueprint Map */}
        <div className="lg:col-span-7 h-[640px]">
          <ACFloorPlan
            floor={selectedFloor}
            units={floorUnits}
            selectedUnit={selectedUnit}
            onSelectUnit={unit => setSelectedUnit(unit)}
            showAirflow={showAirflow}
          />
        </div>
      </div>

      {/* Full AC Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/50">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>AC Units Master Inventory & Expense Ledger</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {tableUnits.length} Units
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete cost breakdown per unit: Purchase, Routine Servicing, Repairs, and Net Lifetime TCO
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search unit, room, brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Unit Code</th>
                <th className="py-3 px-4">Floor & Room</th>
                <th className="py-3 px-4">Brand & Model</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Purchase (LKR)</th>
                <th className="py-3 px-4 text-right">Maintenance (LKR)</th>
                <th className="py-3 px-4 text-right">Repairs (LKR)</th>
                <th className="py-3 px-4 text-right">Total Invested</th>
                <th className="py-3 px-4 text-center">Next Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {tableUnits.map(unit => {
                const isSelected = selectedUnit && selectedUnit.UnitID === unit.UnitID;
                return (
                  <tr
                    key={unit.UnitID}
                    onClick={() => {
                      setSelectedFloor(unit.Floor);
                      setSelectedUnit(unit);
                    }}
                    className={`cursor-pointer transition hover:bg-slate-800/40 ${
                      isSelected ? 'bg-cyan-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {unit.UnitCode}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{unit.RoomName}</div>
                      <div className="text-[10px] text-slate-500">{unit.Floor}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{unit.Brand}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{unit.Model}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {unit.CapacityBTU}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(unit.Status)}`}>
                        {unit.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-200">
                      {Number(unit.PurchasePrice || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">
                      {Number(unit.lifetimeServiceCost || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">
                      {Number(unit.lifetimeRepairCost || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                      {Number(unit.totalInvestedCost || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400 text-[11px]">
                      {unit.NextServiceDue || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsServiceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition"
                          title="Log Service"
                        >
                          <Wrench size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsRepairModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                          title="Log Repair"
                        >
                          <AlertTriangle size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsReplaceModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition"
                          title="Replace Unit"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      <LogACServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        unit={selectedUnit}
        onServiceLogged={loadData}
      />

      <LogACRepairModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        unit={selectedUnit}
        onRepairLogged={loadData}
      />

      <ReplaceACModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        unit={selectedUnit}
        onReplaced={loadData}
      />

      <ACUnitFormModal
        isOpen={isUnitModalOpen}
        onClose={() => {
          setIsUnitModalOpen(false);
          setUnitToEdit(null);
        }}
        unitToEdit={unitToEdit}
        onSaved={loadData}
        defaultFloor={selectedFloor}
      />
    </div>
  );
}
