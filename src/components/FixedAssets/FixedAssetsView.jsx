import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Layers,
  MapPin,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  ShieldCheck,
  Building,
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
  Tag
} from 'lucide-react';
import fixedAssetService from '../../services/fixedAssetService';
import FixedAssetsFloorPlan from './FixedAssetsFloorPlan';
import AssetInspectorDrawer from './AssetInspectorDrawer';
import TransferAssetModal from './TransferAssetModal';
import AssetFormModal from './AssetFormModal';
import './FixedAssetsStyles.css';

export default function FixedAssetsView() {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState('Ground Floor'); // 'Ground Floor' | '1st Floor' | 'Off-Site' | 'All'
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All'); // 'All' | 'Chair' | 'Table & Desk' | 'Computers & IT' etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [conditionFilter, setConditionFilter] = useState('All');

  // Selected asset for detailed view
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Position Editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingPositions, setPendingPositions] = useState({});

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);

  const handleToggleEditMode = () => {
    setIsEditMode(prev => !prev);
  };

  const handlePositionChange = (assetId, physX, physY, rotation) => {
    setPendingPositions(prev => {
      const currentAsset = assets.find(a => a.id === assetId);
      const existingRot = prev[assetId]?.rotation ?? currentAsset?.rotation ?? 0;
      return {
        ...prev,
        [assetId]: {
          physX,
          physY,
          rotation: rotation !== undefined ? rotation : existingRot
        }
      };
    });
  };

  const handleSavePositions = () => {
    const count = fixedAssetService.saveBulkPositions(pendingPositions);
    setPendingPositions({});
    setIsEditMode(false);
    loadData();
  };

  const handleCancelPositions = () => {
    setPendingPositions({});
    setIsEditMode(false);
  };

  const loadData = useCallback(() => {
    const allAssets = fixedAssetService.getAssets();
    setAssets(allAssets);
    setSummary(fixedAssetService.getSummary());

    setSelectedAsset(prev => {
      if (prev) {
        return allAssets.find(a => a.id === prev.id) || null;
      }
      return null;
    });
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = fixedAssetService.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Filtered Assets based on floor, category/keyword, room zone, condition, and search query
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // Floor filter
      if (selectedFloor === 'Ground Floor' && asset.floor !== 'Ground Floor') return false;
      if (selectedFloor === '1st Floor' && asset.floor !== '1st Floor' && asset.zoneId !== 'chilaw_lab') return false;
      if (selectedFloor === 'Off-Site' && !asset.isOffSite) return false;

      // Category / Keyword quick filter
      if (activeCategoryFilter !== 'All') {
        if (activeCategoryFilter === 'Chair') {
          if (!asset.isChair) return false;
        } else if (activeCategoryFilter === 'Table & Desk') {
          if (asset.keyword !== 'Table & Desk') return false;
        } else if (activeCategoryFilter === 'Computers & IT') {
          if (asset.category !== 'Computers & IT') return false;
        } else if (activeCategoryFilter === 'Office Equipment') {
          if (asset.category !== 'Office Equipment') return false;
        } else if (activeCategoryFilter === 'CCTV & Security') {
          if (asset.category !== 'CCTV & Security') return false;
        } else if (activeCategoryFilter === 'Air Conditioners') {
          if (asset.category !== 'Air Conditioners') return false;
        } else if (activeCategoryFilter === 'Storage & Racks') {
          if (asset.keyword !== 'Storage & Racks') return false;
        } else if (activeCategoryFilter === 'Lab Equipment') {
          if (asset.category !== 'Lab Equipment') return false;
        }
      }

      // Room Zone filter
      if (selectedZone && asset.zoneId !== selectedZone) {
        return false;
      }

      // Condition filter
      if (conditionFilter !== 'All') {
        if (conditionFilter === 'Usable' && asset.condition !== 'Usable') return false;
        if (conditionFilter === 'New' && asset.condition !== 'New') return false;
        if (conditionFilter === 'Damaged' && asset.condition !== 'Damaged' && asset.condition !== 'Needs Repair') return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTag = asset.tagNumber && asset.tagNumber.toLowerCase().includes(q);
        const matchesName = asset.itemName && asset.itemName.toLowerCase().includes(q);
        const matchesUser = asset.user && asset.user.toLowerCase().includes(q);
        const matchesLoc = (asset.zoneName || asset.locationName || '').toLowerCase().includes(q);
        const matchesBrand = (asset.brand || '').toLowerCase().includes(q);
        const matchesSerial = (asset.serialNo || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesUser && !matchesLoc && !matchesBrand && !matchesSerial) {
          return false;
        }
      }

      return true;
    });
  }, [assets, selectedFloor, activeCategoryFilter, selectedZone, conditionFilter, searchQuery]);

  // When a user selects a room on the floor plan
  const handleSelectZone = (zoneId) => {
    setSelectedZone(zoneId);
    setSelectedAsset(null); // Return to list view for this room
  };

  const handleOpenTransfer = (asset) => {
    setSelectedAsset(asset);
    setIsTransferModalOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setAssetToEdit(asset);
    setIsAssetModalOpen(true);
  };

  const handleOpenAddNew = () => {
    setAssetToEdit(null);
    setIsAssetModalOpen(true);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all fixed assets to the original Excel register (Chilaw FA Register 2026 .xlsx)? Any unsaved local edits will be reset.')) {
      fixedAssetService.resetToExcelDefaults();
      setSelectedAsset(null);
      setSelectedZone(null);
    }
  };

  // Quick category counts
  const chairsCount = useMemo(() => assets.filter(a => a.isChair).length, [assets]);
  const tablesCount = useMemo(() => assets.filter(a => a.keyword === 'Table & Desk').length, [assets]);
  const computersCount = useMemo(() => assets.filter(a => a.category === 'Computers & IT').length, [assets]);
  const officeEqCount = useMemo(() => assets.filter(a => a.category === 'Office Equipment').length, [assets]);
  const cctvCount = useMemo(() => assets.filter(a => a.category === 'CCTV & Security').length, [assets]);
  const acCount = useMemo(() => assets.filter(a => a.category === 'Air Conditioners').length, [assets]);
  const storageCount = useMemo(() => assets.filter(a => a.keyword === 'Storage & Racks').length, [assets]);
  const labCount = useMemo(() => assets.filter(a => a.category === 'Lab Equipment').length, [assets]);

  return (
    <div className="view-container">
      {/* Top Header */}
      <div className="view-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #00A3FF, #0066FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 163, 255, 0.3)'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h1 className="view-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                Fixed Assets & Infrastructure Map
              </h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Chilaw Facility Asset Register 2026 • Interactive Architectural Floor Plan & Audit Timeline
              </span>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetDefaults}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
            title="Reload base data from Chilaw FA Register 2026 .xlsx"
          >
            <RefreshCw size={13} style={{ marginRight: 4 }} />
            <span>Reset to Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-outline"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <Printer size={13} style={{ marginRight: 4 }} />
            <span>Print Register</span>
          </button>
          <button
            onClick={handleOpenAddNew}
            className="btn btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
          >
            <Plus size={14} style={{ marginRight: 4 }} />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>TOTAL FIXED ASSETS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            {summary?.total || assets.length}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary, #00A3FF)', fontWeight: 600, marginTop: '0.15rem' }}>
            Across Ground & 1st Floor
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '0.85rem 1rem',
            border: activeCategoryFilter === 'Chair' ? '1px solid var(--brand-primary, #00A3FF)' : undefined,
            background: activeCategoryFilter === 'Chair' ? 'rgba(0, 163, 255, 0.08)' : undefined,
            cursor: 'pointer'
          }}
          onClick={() => setActiveCategoryFilter(activeCategoryFilter === 'Chair' ? 'All' : 'Chair')}
          title="Click to toggle Chair filter"
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🪑 CHAIRS & SEATING</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--brand-primary, #00A3FF)' }}>QUICK FILTER</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8', marginTop: '0.2rem' }}>
            {chairsCount}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            110 Auditorium • 22 Main Office • 4 MD
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>GROUND FLOOR</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>
            {summary?.groundFloor || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Offices, Reception & Storage
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>1ST FLOOR & LAB</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.2rem' }}>
            {summary?.firstFloor || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Auditorium, Director Suite & Annex
          </div>
        </div>

        <div className="card" style={{ padding: '0.85rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>OFF-SITE / PALAVI</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#A855F7', marginTop: '0.2rem' }}>
            {summary?.offSite || 0}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Palavi Branch & Other Facilities
          </div>
        </div>
      </div>

      {/* Category Quick Filter Bar */}
      <div className="fa-filter-bar">
        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'All' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('All')}
        >
          <span>All Infrastructure</span>
          <span className="chip-count">{assets.length}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Chair' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Chair')}
        >
          <span>🪑 Chairs & Stools</span>
          <span className="chip-count">{chairsCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Table & Desk' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Table & Desk')}
        >
          <span>💼 Tables & Desks</span>
          <span className="chip-count">{tablesCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Computers & IT' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Computers & IT')}
        >
          <span>💻 Computers & IT</span>
          <span className="chip-count">{computersCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Office Equipment' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Office Equipment')}
        >
          <span>📠 Office Equipment</span>
          <span className="chip-count">{officeEqCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'CCTV & Security' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('CCTV & Security')}
        >
          <span>📹 CCTV & Security</span>
          <span className="chip-count">{cctvCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Air Conditioners' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Air Conditioners')}
        >
          <span>❄️ Air Conditioners</span>
          <span className="chip-count">{acCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Storage & Racks' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Storage & Racks')}
        >
          <span>🗄️ Storage & Racks</span>
          <span className="chip-count">{storageCount}</span>
        </button>

        <button
          className={`fa-filter-chip ${activeCategoryFilter === 'Lab Equipment' ? 'active' : ''}`}
          onClick={() => setActiveCategoryFilter('Lab Equipment')}
        >
          <span>🔬 Lab Equipment</span>
          <span className="chip-count">{labCount}</span>
        </button>
      </div>

      {/* Control Bar: Floor Toggle, Room Filter, Search & Condition */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Floor Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn ${selectedFloor === 'Ground Floor' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setSelectedFloor('Ground Floor'); setSelectedZone(null); }}
          >
            Ground Floor (GF)
          </button>
          <button
            type="button"
            className={`btn ${selectedFloor === '1st Floor' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setSelectedFloor('1st Floor'); setSelectedZone(null); }}
          >
            1st Floor (Level 1)
          </button>
          <button
            type="button"
            className={`btn ${selectedFloor === 'Off-Site' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setSelectedFloor('Off-Site'); setSelectedZone(null); }}
          >
            Palavi & Off-Site
          </button>
          <button
            type="button"
            className={`btn ${selectedFloor === 'All' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem', height: 'auto', borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setSelectedFloor('All'); setSelectedZone(null); }}
          >
            All Floors
          </button>
        </div>

        {/* Room / Zone Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedZone || ''}
            onChange={(e) => setSelectedZone(e.target.value || null)}
            className="input select"
            style={{ height: '34px', fontSize: '0.78rem', minWidth: '180px' }}
          >
            <option value="">All Rooms & Areas</option>
            {selectedFloor !== '1st Floor' && (
              <optgroup label="Ground Floor">
                <option value="main_office">Ground Operations Hall</option>
                <option value="md_office">MD's Office Room</option>
                <option value="md_lobby">MD Office Lobby</option>
                <option value="reception">Reception & Lobby</option>
                <option value="recovery_office">Recovery Team Office</option>
                <option value="stationary_room">Stationary & Records</option>
                <option value="ground_dining">Kitchen & Dining</option>
                <option value="stores">Chilaw Stores</option>
                <option value="fish_tank">Fish Tank Gallery</option>
              </optgroup>
            )}
            {selectedFloor !== 'Ground Floor' && (
              <optgroup label="1st Floor">
                <option value="auditorium">Main Auditorium (110+ Chairs)</option>
                <option value="nadun_office">Mr. Nadun's Office</option>
                <option value="nadun_lobby">1st Floor Operations Hall</option>
                <option value="conference_room">Main Conference Room</option>
                <option value="first_dining">1st Floor Dining Room</option>
                <option value="chilaw_lab">Chilaw Lab (Annex)</option>
                <option value="rest_room">Discussion / Rest Room</option>
              </optgroup>
            )}
            <optgroup label="Off-Site">
              <option value="palavi">Palavi Branch Office</option>
              <option value="second_land">2nd Land Facility</option>
              <option value="home_residence">Home Residence</option>
            </optgroup>
          </select>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="input select"
            style={{ height: '34px', fontSize: '0.78rem' }}
          >
            <option value="All">All Conditions</option>
            <option value="Usable">Usable / Good</option>
            <option value="New">Brand New</option>
            <option value="Damaged">Damaged / Repair Needed</option>
          </select>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search tag, item, user, serial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.78rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Deck */}
      <div className="fa-main-layout">
        {/* Left: Floor Plan Map or Off-Site Grid */}
        <div>
          {selectedFloor === 'Off-Site' ? (
            <div className="card" style={{ padding: '1.25rem', minHeight: '640px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Off-Site Facilities & Branch Inventory</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                    Assets transferred from Chilaw to regional offices, 2nd Land hatchery, or home residences
                  </p>
                </div>
                <span className="badge badge-primary">{filteredAssets.length} Assets</span>
              </div>

              <div className="fa-offsite-grid">
                <div
                  className="fa-offsite-card"
                  style={{ border: selectedZone === 'palavi' ? '2px solid #00A3FF' : undefined }}
                  onClick={() => setSelectedZone(selectedZone === 'palavi' ? null : 'palavi')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={20} className="text-cyan" />
                      <strong style={{ fontSize: '0.95rem' }}>Palavi Branch Office</strong>
                    </div>
                    <span className="badge badge-outline">
                      {assets.filter(a => a.zoneId === 'palavi').length} Items
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Includes 12+ chairs and equipment transferred from Chilaw Head Office to Palaviya regional branch.
                  </p>
                  <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}>
                    View Palavi Assets
                  </button>
                </div>

                <div
                  className="fa-offsite-card"
                  style={{ border: selectedZone === 'second_land' ? '2px solid #00A3FF' : undefined }}
                  onClick={() => setSelectedZone(selectedZone === 'second_land' ? null : 'second_land')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={20} className="text-emerald" />
                      <strong style={{ fontSize: '0.95rem' }}>2nd Land Facility / Hatchery</strong>
                    </div>
                    <span className="badge badge-outline">
                      {assets.filter(a => a.zoneId === 'second_land').length} Items
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Testing, aquaculture facility, GA office & auxiliary lab fixed assets.
                  </p>
                  <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}>
                    View 2nd Land Assets
                  </button>
                </div>

                <div
                  className="fa-offsite-card"
                  style={{ border: selectedZone === 'home_residence' ? '2px solid #00A3FF' : undefined }}
                  onClick={() => setSelectedZone(selectedZone === 'home_residence' ? null : 'home_residence')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Building size={20} className="text-amber" />
                      <strong style={{ fontSize: '0.95rem' }}>Home Residence / External</strong>
                    </div>
                    <span className="badge badge-outline">
                      {assets.filter(a => a.zoneId === 'home_residence').length} Items
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Fixed assets assigned to executive residences or off-site storage.
                  </p>
                  <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.75rem', padding: '0.35rem' }}>
                    View External Assets
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <FixedAssetsFloorPlan
              floor={selectedFloor === 'All' ? 'Ground Floor' : selectedFloor}
              assets={filteredAssets}
              selectedAsset={selectedAsset}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              selectedZone={selectedZone}
              onSelectZone={handleSelectZone}
              activeFilter={activeCategoryFilter}
              isEditMode={isEditMode}
              onToggleEditMode={handleToggleEditMode}
              pendingPositions={pendingPositions}
              onPositionChange={handlePositionChange}
              onSavePositions={handleSavePositions}
              onCancelPositions={handleCancelPositions}
            />
          )}
        </div>

        {/* Right: Inspector & Asset List Drawer */}
        <div>
          <AssetInspectorDrawer
            selectedAsset={selectedAsset}
            onClearSelection={() => setSelectedAsset(null)}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            assetsInCurrentView={filteredAssets}
            selectedZoneName={selectedZone ? fixedAssetService.getZones()[selectedZone]?.name : null}
            activeFilter={activeCategoryFilter}
            onOpenTransferModal={handleOpenTransfer}
            onOpenEditModal={handleOpenEdit}
            isEditMode={isEditMode}
            pendingPositions={pendingPositions}
          />
        </div>
      </div>

      {/* Modals */}
      <TransferAssetModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        asset={selectedAsset}
        onTransferSuccess={(updated) => {
          setSelectedAsset(updated);
          loadData();
        }}
      />

      <AssetFormModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        assetToEdit={assetToEdit}
        onSuccess={(saved) => {
          setSelectedAsset(saved);
          loadData();
        }}
      />
    </div>
  );
}
