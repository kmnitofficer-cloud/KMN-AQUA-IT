import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  User,
  ArrowRightLeft,
  Edit2,
  Clock,
  Printer,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  X,
  Search,
  Building,
  Info,
  Move,
  RotateCw,
  FileSpreadsheet
} from 'lucide-react';
import { EXCEL_STAFF_CUSTODIANS } from '../../services/fixedAssetService';
import './FixedAssetsStyles.css';

export default function AssetInspectorDrawer({
  selectedAsset,
  onClearSelection,
  onSelectAsset,
  assetsInCurrentView = [],
  selectedZoneName = null,
  activeFilter = 'All',
  onOpenTransferModal = () => {},
  onOpenEditModal = () => {},
  onUpdateCustodian = () => {},
  isEditMode = false,
  pendingPositions = {}
}) {
  const [listSearch, setListSearch] = useState('');

  // Filter the list when browsing assets in the current room or category
  const filteredList = assetsInCurrentView.filter(a => {
    if (!listSearch) return true;
    const q = listSearch.toLowerCase();
    return (
      (a.tagNumber && a.tagNumber.toLowerCase().includes(q)) ||
      (a.itemName && a.itemName.toLowerCase().includes(q)) ||
      (a.user && a.user.toLowerCase().includes(q)) ||
      (a.zoneName && a.zoneName.toLowerCase().includes(q)) ||
      (a.serialNo && a.serialNo.toLowerCase().includes(q))
    );
  });

  const getConditionBadge = (condition) => {
    switch (condition) {
      case 'New':
        return <span className="badge badge-primary">✨ New</span>;
      case 'Damaged':
      case 'Needs Repair':
        return <span className="badge badge-danger">⚠️ Damaged</span>;
      case 'Usable':
      default:
        return <span className="badge badge-success">✓ Usable</span>;
    }
  };

  // If an asset is selected, show its full profile, audit timeline, and transfer history
  if (selectedAsset) {
    const glyph = selectedAsset.isChair ? '🪑' : selectedAsset.keyword === 'Table & Desk' ? '💼' : selectedAsset.category === 'Computers & IT' ? '💻' : '📦';

    return (
      <div className="fa-inspector-card">
        {/* Header */}
        <div className="fa-inspector-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <button
              onClick={onClearSelection}
              className="btn btn-outline"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <X size={14} />
              <span>Back to Room List</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {getConditionBadge(selectedAsset.condition)}
              <span className="badge" style={{ background: 'rgba(0, 163, 255, 0.1)', color: '#00A3FF', border: '1px solid rgba(0, 163, 255, 0.25)' }}>
                {selectedAsset.floor}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, rgba(0, 163, 255, 0.2), rgba(0, 102, 255, 0.3))',
                border: '1px solid rgba(0, 163, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0
              }}
            >
              {glyph}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {selectedAsset.itemName}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <span className="tag-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary, #00A3FF)' }}>
                  {selectedAsset.tagNumber}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>• {selectedAsset.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="fa-inspector-content">
          {/* Active Placement Indicator Card in Edit Mode */}
          {isEditMode && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid #F59E0B',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                marginBottom: '1rem',
                fontSize: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <strong style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Move size={14} /> Map Placement Active
                </strong>
                <span className="badge badge-warning" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                  X: {pendingPositions[selectedAsset.id]?.physX ?? selectedAsset.physX ?? 0}, Y: {pendingPositions[selectedAsset.id]?.physY ?? selectedAsset.physY ?? 0} ({pendingPositions[selectedAsset.id]?.rotation ?? selectedAsset.rotation ?? 0}°)
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Click anywhere on the floor plan or drag this item on the blueprint to place it at its exact real position.
              </div>
            </div>
          )}

          {/* Excel Register Verification Status Banner */}
          <div className={`fa-excel-status-banner ${selectedAsset.inExcelRegister === false ? 'not-in-excel' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <FileSpreadsheet size={17} style={{ color: selectedAsset.inExcelRegister === false ? '#F59E0B' : '#10B981' }} />
                <span style={{ fontWeight: 800, fontSize: '0.84rem', color: selectedAsset.inExcelRegister === false ? '#F59E0B' : '#10B981' }}>
                  {selectedAsset.inExcelRegister === false ? '⚠️ Not in Excel Register (Manual System Entry)' : '📗 In Chilaw FA Register 2026 .xlsx'}
                </span>
              </div>
              <span
                className="badge"
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: selectedAsset.inExcelRegister === false ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: selectedAsset.inExcelRegister === false ? '#F59E0B' : '#10B981'
                }}
              >
                {selectedAsset.inExcelRegister === false ? 'Unverified' : 'Verified in Register'}
              </span>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: 6, padding: '0.55rem 0.75rem', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Excel File Source:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Chilaw FA Register 2026 .xlsx</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Worksheet:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary, #00A3FF)' }}>Orginal • Furniture & Fittings</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Asset Register ID:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAsset.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Location:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAsset.locationName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registered Custodian:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAsset.user || 'Facility / Common'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Purchase Date in Excel:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAsset.dateOfPurchase || 'Before 2016'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Excel Book Value / Amount:</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>
                  {selectedAsset.amount && selectedAsset.amount !== '-' ? `LKR ${Number(selectedAsset.amount).toLocaleString()}` : 'Not Specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Custody & Location Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.5rem' }}>
              CURRENT LOCATION & CUSTODIAN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Building size={16} className="text-cyan" />
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {selectedAsset.zoneName || selectedAsset.locationName}
                </span>
              </div>
              <span className="badge badge-outline" style={{ fontSize: '0.7rem' }}>
                {selectedAsset.floor}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(148, 163, 184, 0.12)', paddingTop: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <User size={15} className="text-emerald" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Assigned User: <strong style={{ color: 'var(--text-primary)' }}>{selectedAsset.user || 'Facility / Common'}</strong>
                </span>
              </div>
              <button
                onClick={() => onOpenTransferModal(selectedAsset)}
                className="btn btn-outline"
                style={{ padding: '0.22rem 0.55rem', fontSize: '0.72rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', borderColor: 'var(--brand-primary, #00A3FF)', color: 'var(--brand-primary, #00A3FF)' }}
              >
                <ArrowRightLeft size={12} />
                <span>Transfer</span>
              </button>
            </div>

            {/* 1-Click Quick Custodian / Person Assignment */}
            <div style={{ marginTop: '0.65rem', borderTop: '1px solid rgba(148, 163, 184, 0.12)', paddingTop: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--brand-primary, #00A3FF)' }}>
                  👤 Quick Assign Excel Person / Custodian:
                </span>
              </div>
              <select
                value={selectedAsset.user || ''}
                onChange={(e) => onUpdateCustodian && onUpdateCustodian(selectedAsset.id, e.target.value)}
                className="input select"
                style={{ width: '100%', height: '32px', fontSize: '0.76rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface)' }}
              >
                <option value="">-- Choose Person from Chilaw Register --</option>
                {EXCEL_STAFF_CUSTODIANS.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 5-Cycle Physical Audit Verification Grid from Excel */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} className="text-emerald" />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Excel Audit Verifications (5 Cycles)
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>
                {selectedAsset.auditTimeline?.length || 5} Cycles Logged
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
              <div className="fa-audit-cycle-card" style={{ borderLeft: '3px solid #10B981' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#10B981', fontSize: '0.72rem' }}>2026/08 Physical Audit</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏷️ {selectedAsset.verified2026 || selectedAsset.tagNumber}</div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Verified Usable</span>
              </div>

              <div className="fa-audit-cycle-card" style={{ borderLeft: '3px solid #00A3FF' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#00A3FF', fontSize: '0.72rem' }}>2025/09 Physical Audit</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏷️ {selectedAsset.verified2025 || selectedAsset.verified2026 || selectedAsset.tagNumber}</div>
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,163,255,0.15)', color: '#00A3FF' }}>Verified</span>
              </div>

              <div className="fa-audit-cycle-card" style={{ borderLeft: '3px solid #8B5CF6' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#A78BFA', fontSize: '0.72rem' }}>2024/04 Physical Audit</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏷️ {selectedAsset.verified2024 || selectedAsset.tagNumber}</div>
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>Verified</span>
              </div>

              <div className="fa-audit-cycle-card" style={{ borderLeft: '3px solid #F59E0B' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#F59E0B', fontSize: '0.72rem' }}>2023/04 Physical Audit</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏷️ {selectedAsset.verified2023 || 'Recorded in Category Sheet'}</div>
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Audited</span>
              </div>

              <div className="fa-audit-cycle-card" style={{ borderLeft: '3px solid #64748B' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#94A3B8', fontSize: '0.72rem' }}>2022/06 Baseline Registration</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>🏷️ {selectedAsset.verified2022 || 'Baseline Asset Tag'}</div>
                </div>
                <span className="badge badge-outline" style={{ fontSize: '0.65rem' }}>Baseline</span>
              </div>
            </div>

            {/* Audit Verification History Timeline Node Flow */}
            <div className="fa-timeline">
              {selectedAsset.auditTimeline && selectedAsset.auditTimeline.length > 0 ? (
                selectedAsset.auditTimeline.map((item, idx) => (
                  <div key={idx} className="fa-timeline-item">
                    <div className={`fa-timeline-node ${idx === 0 ? 'current' : idx === selectedAsset.auditTimeline.length - 1 ? 'baseline' : ''}`} />
                    <div className="fa-timeline-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.78rem', color: idx === 0 ? '#10B981' : 'var(--text-primary)' }}>
                          Audit Cycle: {item.auditCycle}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {item.date}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--brand-primary, #00A3FF)', fontWeight: 700, marginBottom: '0.15rem' }}>
                        🏷️ {item.tagNumber}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span>📍 {item.location}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.verifiedBy}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  No previous audit records logged.
                </div>
              )}
            </div>
          </div>

          {/* Relocation & Transfer History */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} className="text-amber" />
                <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Movement & Relocation Logs
                </span>
              </div>
            </div>

            {selectedAsset.transferHistory && selectedAsset.transferHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {selectedAsset.transferHistory.map((tr, tIdx) => (
                  <div
                    key={tIdx}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        {tr.date}
                      </span>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        Relocated
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.2rem' }}>
                      <span>{tr.fromLocation}</span>
                      <span style={{ color: '#00A3FF' }}>➔</span>
                      <span style={{ color: '#10B981' }}>{tr.toLocation}</span>
                    </div>
                    {tr.reason && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Reason: {tr.reason}
                      </div>
                    )}
                    {tr.custodian && (
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Custodian: {tr.custodian}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                No transfers recorded. Asset remains at its registered location.
              </div>
            )}
          </div>

          {/* Asset Specifications & Details */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 800 }}>
                ASSET SPECIFICATIONS & VALUE
              </span>
              <button
                onClick={() => onOpenEditModal(selectedAsset)}
                className="btn btn-outline"
                style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Edit2 size={11} />
                <span>Edit</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.76rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Purchase Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAsset.dateOfPurchase || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Book Value / Amount</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedAsset.amount && selectedAsset.amount !== '-' ? `LKR ${Number(selectedAsset.amount).toLocaleString()}` : '-'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Brand & Model</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {[selectedAsset.brand, selectedAsset.model].filter(Boolean).join(' ') || 'Standard'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Serial / Model Code</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedAsset.serialNo || '-'}</span>
              </div>
            </div>

            {selectedAsset.description && (
              <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.12)', marginTop: '0.6rem', paddingTop: '0.45rem', fontSize: '0.74rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem' }}>Description & Features</span>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedAsset.description}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If no asset is selected, show list of assets in current room / filter
  const roomTitle = selectedZoneName || (activeFilter === 'All' ? 'All Facility Fixed Assets' : `${activeFilter} Inventory`);

  return (
    <div className="fa-inspector-card">
      {/* Header */}
      <div className="fa-inspector-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {roomTitle}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {selectedZoneName ? 'Click an asset to view its audit history & transfer logs' : 'Select any pin or item below'}
            </div>
          </div>
          <span className="badge badge-primary" style={{ fontWeight: 800 }}>
            {filteredList.length} Items
          </span>
        </div>

        {/* Quick Search inside Drawer */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search items, tags, users in this list..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: '2rem', height: '32px', fontSize: '0.76rem', width: '100%' }}
          />
        </div>

        {isEditMode && (
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid #F59E0B', borderRadius: 'var(--radius-sm)', padding: '0.45rem 0.65rem', marginTop: '0.5rem', fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Move size={13} />
            <span>Select any item below, then click on the map to set its position!</span>
          </div>
        )}
      </div>

      {/* Content List */}
      <div className="fa-inspector-content" style={{ padding: '0.85rem' }}>
        {filteredList.length > 0 ? (
          filteredList.map(asset => {
            const glyph = asset.isChair ? '🪑' : asset.keyword === 'Table & Desk' ? '💼' : asset.category === 'Computers & IT' ? '💻' : '📦';

            return (
              <div
                key={asset.id}
                className="fa-asset-item"
                onClick={() => onSelectAsset(asset)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'rgba(0, 163, 255, 0.1)',
                      border: '1px solid rgba(0, 163, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}
                  >
                    {glyph}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {asset.itemName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--brand-primary, #00A3FF)', fontWeight: 600 }}>{asset.tagNumber.slice(-14)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {asset.user || asset.zoneName}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                  {getConditionBadge(asset.condition)}
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <p>No assets found matching the current search / filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
