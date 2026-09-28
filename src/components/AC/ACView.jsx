import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  Edit2,
  Printer
} from 'lucide-react';
import { printBlueprintMap } from '../../utils/printBlueprint';
import { acService, AC_FLOORS, AC_STATUSES } from '../../services/acService';
import { dbRepository } from '../../services/dbRepository';
import ACFloorPlan from './ACFloorPlan';
import LogACServiceModal from './LogACServiceModal';
import LogACRepairModal from './LogACRepairModal';
import ReplaceACModal from './ReplaceACModal';
import ACUnitFormModal from './ACUnitFormModal';
import './ACStyles.css';

export default function ACView() {
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAirflow, setShowAirflow] = useState(false);

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

  const loadData = useCallback(() => {
    const allUnits = acService.getACUnits();
    setUnits(allUnits);
    setSummary(acService.getACSummary());

    setSelectedUnit(prevSelected => {
      if (prevSelected) {
        const refreshedSelected = allUnits.find(u => u.UnitID === prevSelected.UnitID);
        return refreshedSelected || allUnits[0] || null;
      } else if (allUnits.length > 0) {
        const firstOnFloor = allUnits.find(u => u.Floor === selectedFloor) || allUnits[0];
        return firstOnFloor || null;
      }
      return null;
    });
  }, [selectedFloor]);

  useEffect(() => {
    loadData();
    const unsubscribe = dbRepository.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Filter units for the floor plan (memoized to eliminate unnecessary SVG re-renders)
  const floorUnits = useMemo(() => {
    return units.filter(u => {
      const matchesFloor =
        u.Floor === selectedFloor ||
        (selectedFloor === 'First Floor' && (u.Floor === 'New Lab' || u.RoomName === 'LAB' || u.UnitID === 'AC-0014'));
      const matchesStatus = statusFilter === 'All' || u.Status === statusFilter;
      return matchesFloor && matchesStatus;
    });
  }, [units, selectedFloor, statusFilter]);

  // Filter units for the comprehensive table (memoized)
  const tableUnits = useMemo(() => {
    return units.filter(u => {
      const matchesFloor =
        selectedFloor === 'All' ||
        u.Floor === selectedFloor ||
        (selectedFloor === 'First Floor' && (u.Floor === 'New Lab' || u.RoomName === 'LAB' || u.UnitID === 'AC-0014'));
      const matchesStatus = statusFilter === 'All' || u.Status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        (u.UnitCode && u.UnitCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.RoomName && u.RoomName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.Brand && u.Brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.Model && u.Model.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFloor && matchesStatus && matchesSearch;
    });
  }, [units, selectedFloor, statusFilter, searchQuery]);

  const handleTempAdjust = async delta => {
    if (!selectedUnit) return;
    const newTemp = Math.min(Math.max(16, (Number(selectedUnit.TargetTemp) || 22) + delta), 28);
    // Instant optimistic local update (zero flicker)
    setSelectedUnit(prev => (prev ? { ...prev, TargetTemp: newTemp } : null));
    setUnits(prev => prev.map(u => u.UnitID === selectedUnit.UnitID ? { ...u, TargetTemp: newTemp } : u));
    await acService.updateACUnit(selectedUnit.UnitID, { TargetTemp: newTemp });
  };

  const handleModeChange = async newMode => {
    if (!selectedUnit) return;
    // Instant optimistic local update (zero flicker)
    setSelectedUnit(prev => (prev ? { ...prev, WorkMode: newMode } : null));
    setUnits(prev => prev.map(u => u.UnitID === selectedUnit.UnitID ? { ...u, WorkMode: newMode } : u));
    await acService.updateACUnit(selectedUnit.UnitID, { WorkMode: newMode });
  };

  const getStatusBadgeClass = status => {
    switch (status) {
      case 'Active':
        return 'badge badge-success';
      case 'Needs Service':
        return 'badge badge-warning';
      case 'Under Repair':
        return 'badge badge-danger';
      default:
        return 'badge';
    }
  };

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px var(--brand-glow)'
              }}
            >
              <Wind size={20} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              HVAC & Air Conditioning Management
            </h2>
            <span className="badge badge-primary font-mono" style={{ fontSize: '0.7rem' }}>
              Live Blueprint Plan
            </span>
          </div>
          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Interactive 2-floor layout, asset cost tracking, maintenance schedules & replacement lifecycle
          </p>
        </div>

        <div className="view-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setUnitToEdit(null);
              setIsUnitModalOpen(true);
            }}
          >
            <Plus size={16} /> Add AC Unit
          </button>
        </div>
      </div>

      {/* KPI Financial & Infrastructure Summary */}
      {summary && (
        <div className="ac-kpi-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total AC Units</span>
              <span className="badge badge-primary font-mono">{summary.totalUnits} Total</span>
            </div>
            <div className="kpi-value text-cyan font-mono">{summary.totalUnits} Units</div>
            <div className="kpi-subtext" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{summary.activeUnits} Active</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{summary.needsServiceUnits} Service</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{summary.underRepairUnits} Repair</span>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Initial Asset Cost</span>
              <DollarSign size={16} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div className="kpi-value text-emerald font-mono">
              Rs. {Number(summary.totalAssetCost || 0).toLocaleString()}
            </div>
            <span className="kpi-subtext">Original machines & installation</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Routine Maintenance</span>
              <Wrench size={16} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="kpi-value text-amber font-mono">
              Rs. {Number(summary.totalServiceCost || 0).toLocaleString()}
            </div>
            <span className="kpi-subtext">Filter cleaning, gas top-ups & wash</span>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Repairs & Breakdown</span>
              <AlertTriangle size={16} style={{ color: 'var(--accent-rose)' }} />
            </div>
            <div className="kpi-value text-rose font-mono">
              Rs. {Number(summary.totalRepairCost || 0).toLocaleString()}
            </div>
            <span className="kpi-subtext">Capacitors, motors & emergency fixes</span>
          </div>

          <div className="kpi-card" style={{ borderLeft: '3px solid var(--accent-cyan)' }}>
            <div className="kpi-header">
              <span className="kpi-title">Grand Total Invested</span>
              <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div className="kpi-value font-mono" style={{ color: 'var(--accent-cyan)' }}>
              Rs. {Number(summary.grandTotalExpense || 0).toLocaleString()}
            </div>
            <span className="kpi-subtext">Hardware assets + Lifetime upkeep</span>
          </div>
        </div>
      )}

      {/* Floor & Filter Control Bar */}
      <div className="filter-bar mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Floor Selection Tabs */}
        <div className="filter-tabs">
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
                className={`filter-tab ${isSelected ? 'active' : ''}`}
              >
                <span>{floor}</span>
                <span
                  style={{
                    marginLeft: '0.45rem',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs & Print Blueprint Actions */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div className="filter-tabs">
            {['All', 'Active', 'Needs Service', 'Under Repair'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`filter-tab ${statusFilter === st ? 'active' : ''}`}
                style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem' }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Quick Print Map Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              onClick={() => {
                if (selectedFloor !== 'Ground Floor') {
                  setSelectedFloor('Ground Floor');
                }
                setTimeout(() => {
                  const svg = document.querySelector('.komvent-blueprint-canvas svg');
                  printBlueprintMap({
                    floorTitle: 'Ground Floor',
                    svgElement: svg,
                    units,
                    mode: 'full-map'
                  });
                }, 80);
              }}
              className="btn btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '0.32rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderColor: 'var(--brand-primary, #00A3FF)',
                color: 'var(--brand-primary, #00A3FF)',
                fontWeight: 600
              }}
              title="Print Ground Floor Blueprint Map (A4 Full Page, Only Map)"
            >
              <Printer size={13} />
              <span>Print GF Map (A4)</span>
            </button>

            <button
              onClick={() => {
                if (selectedFloor !== 'First Floor') {
                  setSelectedFloor('First Floor');
                }
                setTimeout(() => {
                  const svg = document.querySelector('.komvent-blueprint-canvas svg');
                  printBlueprintMap({
                    floorTitle: '1st Floor (Level 1)',
                    svgElement: svg,
                    units,
                    mode: 'full-map'
                  });
                }, 80);
              }}
              className="btn btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '0.32rem 0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderColor: 'var(--brand-primary, #00A3FF)',
                color: 'var(--brand-primary, #00A3FF)',
                fontWeight: 600
              }}
              title="Print 1st Floor Blueprint Map (A4 Full Page, Only Map)"
            >
              <Printer size={13} />
              <span>Print 1F Map (A4)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Interface (Blueprint Map + AC Unit Inspector) */}
      <div className="ac-main-grid">
        {/* Left: AC Unit Inspector Card */}
        <div>
          {selectedUnit ? (
            <div className="ac-inspector-card">
              {/* Inspector Header */}
              <div className="ac-inspector-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="id-pill font-mono">{selectedUnit.UnitCode}</span>
                    <span className="location-pill font-mono" style={{ fontSize: '0.7rem' }}>
                      Spot #{selectedUnit.UnitNumber || '01'}
                    </span>
                  </div>
                  <span className={getStatusBadgeClass(selectedUnit.Status)}>
                    {selectedUnit.Status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                  {selectedUnit.Brand} {selectedUnit.Model}
                </h3>
                <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📍 {selectedUnit.RoomName}</span>
                  <span>•</span>
                  <span>{selectedUnit.Floor}</span>
                </p>
              </div>

              {/* Climate Dial & Mode Control Box */}
              <div className="ac-climate-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--brand-glow)',
                        color: 'var(--brand-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Thermometer size={22} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.04em', display: 'block' }}>
                        Set Temperature
                      </span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                          {selectedUnit.TargetTemp || 22}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons - / + */}
                  <div className="ac-temp-stepper">
                    <button
                      onClick={() => handleTempAdjust(-1)}
                      className="ac-temp-btn"
                      title="Lower temperature"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleTempAdjust(1)}
                      className="ac-temp-btn"
                      title="Increase temperature"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Mode Selector */}
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    <span>Operating Work Mode:</span>
                    <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{selectedUnit.WorkMode}</span>
                  </div>
                  <div className="ac-modes-grid">
                    {['Normal Cooling', 'Eco Cooling', 'Turbo Cooling', 'Low Power'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`ac-mode-btn ${selectedUnit.WorkMode === mode ? 'active' : ''}`}
                      >
                        {mode.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lifetime Financial Audit Card */}
              <div className="ac-cost-audit">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em', display: 'block', marginBottom: '0.5rem' }}>
                  Financial & Cost Audit
                </span>
                <div className="ac-cost-grid">
                  <div className="ac-cost-item">
                    <span className="cost-item-label">Purchase</span>
                    <span className="cost-item-val font-mono" style={{ fontSize: '0.85rem' }}>
                      Rs. {Number(selectedUnit.PurchasePrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="ac-cost-item">
                    <span className="cost-item-label" style={{ color: 'var(--accent-amber)' }}>Maintenance</span>
                    <span className="cost-item-val font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                      Rs. {Number(selectedUnit.lifetimeServiceCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="ac-cost-item">
                    <span className="cost-item-label" style={{ color: 'var(--accent-rose)' }}>Repairs</span>
                    <span className="cost-item-val font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-rose)' }}>
                      Rs. {Number(selectedUnit.lifetimeRepairCost || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="ac-cost-total-banner">
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Total Invested in Spot:
                  </span>
                  <span className="font-mono font-bold" style={{ fontSize: '0.9rem', color: 'var(--brand-primary)' }}>
                    Rs. {Number(selectedUnit.totalInvestedCost || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="ac-actions-row">
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="ac-action-btn service"
                >
                  <Wrench size={16} />
                  <span>Log Service</span>
                </button>

                <button
                  onClick={() => setIsRepairModalOpen(true)}
                  className="ac-action-btn repair"
                >
                  <AlertTriangle size={16} />
                  <span>Log Repair</span>
                </button>

                <button
                  onClick={() => setIsReplaceModalOpen(true)}
                  className="ac-action-btn replace"
                  title="Replace with new AC unit while preserving old machine history"
                >
                  <RefreshCw size={16} />
                  <span>Replace Unit</span>
                </button>
              </div>

              {/* Tab Navigation in Inspector */}
              <div className="ac-tab-bar">
                <button
                  onClick={() => setInspectorTab('overview')}
                  className={`ac-tab-nav-btn ${inspectorTab === 'overview' ? 'active' : ''}`}
                >
                  Specs
                </button>
                <button
                  onClick={() => setInspectorTab('services')}
                  className={`ac-tab-nav-btn ${inspectorTab === 'services' ? 'active' : ''}`}
                >
                  Services ({selectedUnit.serviceCount || 0})
                </button>
                <button
                  onClick={() => setInspectorTab('repairs')}
                  className={`ac-tab-nav-btn ${inspectorTab === 'repairs' ? 'active' : ''}`}
                >
                  Repairs ({selectedUnit.repairCount || 0})
                </button>
                <button
                  onClick={() => setInspectorTab('replacements')}
                  className={`ac-tab-nav-btn ${inspectorTab === 'replacements' ? 'active' : ''}`}
                >
                  History ({selectedUnit.replacements ? selectedUnit.replacements.length : 0})
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="ac-tab-pane">
                {/* 1. Overview Specs Tab */}
                {inspectorTab === 'overview' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="ac-cost-item">
                        <span className="cost-item-label">Cooling Capacity</span>
                        <span className="cost-item-val" style={{ fontSize: '0.8rem' }}>{selectedUnit.CapacityBTU}</span>
                      </div>
                      <div className="ac-cost-item">
                        <span className="cost-item-label">Refrigerant Gas</span>
                        <span className="cost-item-val" style={{ fontSize: '0.8rem' }}>{selectedUnit.RefrigerantType}</span>
                      </div>
                      <div className="ac-cost-item">
                        <span className="cost-item-label">Power Rating</span>
                        <span className="cost-item-val" style={{ fontSize: '0.8rem' }}>{selectedUnit.PowerRating || '1.5 kW'}</span>
                      </div>
                      <div className="ac-cost-item">
                        <span className="cost-item-label">Supplier / Vendor</span>
                        <span className="cost-item-val" style={{ fontSize: '0.8rem' }}>{selectedUnit.Supplier || 'N/A'}</span>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Installation Date:</span>
                        <span className="font-mono">{selectedUnit.PurchaseDate || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Warranty Until:</span>
                        <span className="font-mono" style={{ color: 'var(--accent-emerald)' }}>{selectedUnit.WarrantyUntil || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Last Serviced:</span>
                        <span className="font-mono">{selectedUnit.LastServiceDate || 'None'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-muted">Next Due:</span>
                        <span className="font-mono" style={{ color: 'var(--accent-amber)' }}>{selectedUnit.NextServiceDue || 'Not Scheduled'}</span>
                      </div>
                    </div>

                    {selectedUnit.Notes && (
                      <p style={{ margin: 0, padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        "{selectedUnit.Notes}"
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                      <button
                        onClick={() => {
                          setUnitToEdit(selectedUnit);
                          setIsUnitModalOpen(true);
                        }}
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Edit2 size={13} />
                        <span>Edit Unit Details</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 2. Services Tab */}
                {inspectorTab === 'services' && (
                  <>
                    {selectedUnit.services && selectedUnit.services.length > 0 ? (
                      selectedUnit.services.map(srv => (
                        <div
                          key={srv.ServiceID}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{srv.ServiceType}</span>
                            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>
                              Rs. {Number(srv.Cost || 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            <span>📅 {srv.ServiceDate}</span>
                            <span>👤 {srv.Technician}</span>
                          </div>
                          {srv.GasRefillPSI && (
                            <div style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>
                              Pressure: {srv.GasRefillPSI}
                            </div>
                          )}
                          {srv.Notes && (
                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.7rem' }}>
                              "{srv.Notes}"
                            </p>
                          )}
                          {srv.FilePath && (
                            <div style={{ paddingTop: '0.2rem' }}>
                              <a
                                href={srv.FilePath}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 600 }}
                              >
                                <FileText size={12} />
                                View Attached Invoice ({srv.FileName || 'PDF'})
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No routine maintenance logged for this unit yet.
                      </div>
                    )}
                  </>
                )}

                {/* 3. Repairs Tab */}
                {inspectorTab === 'repairs' && (
                  <>
                    {selectedUnit.repairs && selectedUnit.repairs.length > 0 ? (
                      selectedUnit.repairs.map(rep => (
                        <div
                          key={rep.RepairID}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>{rep.IssueDescription}</span>
                            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
                              Rs. {Number(rep.RepairCost || 0).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            <span>Reported: {rep.IssueDate}</span>
                            <span className={rep.Status === 'Completed' ? 'badge badge-success' : 'badge badge-danger'}>
                              {rep.Status}
                            </span>
                          </div>
                          {rep.PartsReplaced && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                              <strong style={{ color: 'var(--text-muted)' }}>Parts: </strong>
                              {rep.PartsReplaced}
                            </div>
                          )}
                          {rep.Technician && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              Technician: {rep.Technician}
                            </div>
                          )}
                          {rep.FilePath && (
                            <div style={{ paddingTop: '0.2rem' }}>
                              <a
                                href={rep.FilePath}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 600 }}
                              >
                                <FileText size={12} />
                                View Attached Job Sheet / Bill
                              </a>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No breakdown repairs reported. System healthy!
                      </div>
                    )}
                  </>
                )}

                {/* 4. Replacement History Tab */}
                {inspectorTab === 'replacements' && (
                  <>
                    {selectedUnit.replacements && selectedUnit.replacements.length > 0 ? (
                      selectedUnit.replacements.map(repLog => (
                        <div
                          key={repLog.ReplacementID}
                          style={{
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--accent-violet-bg)',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.45rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-violet)' }}>
                              Previous: {repLog.OldUnitBrand} {repLog.OldUnitModel}
                            </span>
                            <span className="badge badge-purple font-mono" style={{ fontSize: '0.65rem' }}>
                              Removed {repLog.RemovalDate}
                            </span>
                          </div>

                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.725rem' }}>
                            <strong style={{ color: 'var(--text-muted)' }}>Reason: </strong>
                            {repLog.RemovalReason}
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.7rem' }}>
                            <div>
                              <span className="text-muted">Old Unit Services: </span>
                              <span className="font-mono" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                                Rs. {Number(repLog.OldUnitLifetimeServiceCost || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted">Old Unit Repairs: </span>
                              <span className="font-mono" style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                                Rs. {Number(repLog.OldUnitLifetimeRepairCost || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            <span>Disposal: </span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{repLog.FinalCondition}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        This is the original machine installed at this spot. No previous decommissioned units.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="section-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
              Select an AC pin from the floor plan to view details.
            </div>
          )}
        </div>

        {/* Right: Interactive SVG Blueprint Map */}
        <div>
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
      <div className="table-card">
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-surface)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <span>AC Units Master Inventory & Expense Ledger</span>
              <span className="badge badge-primary font-mono" style={{ fontSize: '0.7rem' }}>
                {tableUnits.length} Units
              </span>
            </h3>
            <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem' }}>
              Complete cost breakdown per unit: Purchase, Routine Servicing, Repairs, and Net Lifetime TCO
            </p>
          </div>

          <div className="search-input-wrapper">
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search unit, room, brand..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="filter-search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit Code</th>
                <th>Floor & Room</th>
                <th>Brand & Model</th>
                <th>Capacity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Purchase (Rs.)</th>
                <th style={{ textAlign: 'right' }}>Maintenance (Rs.)</th>
                <th style={{ textAlign: 'right' }}>Repairs (Rs.)</th>
                <th style={{ textAlign: 'right' }}>Total Invested</th>
                <th style={{ textAlign: 'center' }}>Next Due</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableUnits.map(unit => {
                const isSelected = selectedUnit && selectedUnit.UnitID === unit.UnitID;
                return (
                  <tr
                    key={unit.UnitID}
                    onClick={() => {
                      setSelectedFloor(unit.Floor);
                      setSelectedUnit(unit);
                    }}
                    className={`hover-highlight ${isSelected ? 'row-selected' : ''}`}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'var(--brand-glow)' : undefined
                    }}
                  >
                    <td className="font-mono font-bold" style={{ color: 'var(--brand-primary)' }}>
                      {unit.UnitCode}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{unit.RoomName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{unit.Floor}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{unit.Brand}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{unit.Model}</div>
                    </td>
                    <td className="font-mono text-muted">
                      {unit.CapacityBTU}
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(unit.Status)}>
                        {unit.Status}
                      </span>
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      {Number(unit.PurchasePrice || 0).toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right', color: 'var(--accent-amber)' }}>
                      {Number(unit.lifetimeServiceCost || 0).toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right', color: 'var(--accent-rose)' }}>
                      {Number(unit.lifetimeRepairCost || 0).toLocaleString()}
                    </td>
                    <td className="font-mono font-bold" style={{ textAlign: 'right', color: 'var(--brand-primary)' }}>
                      {Number(unit.totalInvestedCost || 0).toLocaleString()}
                    </td>
                    <td className="font-mono text-muted" style={{ textAlign: 'center', fontSize: '0.75rem' }}>
                      {unit.NextServiceDue || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsServiceModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.45rem', height: 'auto', color: 'var(--accent-cyan)' }}
                          title="Log Service"
                        >
                          <Wrench size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsRepairModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.45rem', height: 'auto', color: 'var(--accent-rose)' }}
                          title="Log Repair"
                        >
                          <AlertTriangle size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUnit(unit);
                            setIsReplaceModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.45rem', height: 'auto', color: 'var(--accent-violet)' }}
                          title="Replace Unit"
                        >
                          <RefreshCw size={13} />
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
