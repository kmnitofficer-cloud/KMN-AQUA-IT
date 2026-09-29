import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Printer,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Move,
  Save,
  X,
  Compass
} from 'lucide-react';
import { printFixedAssetsBlueprint } from '../../utils/printFixedAssetsBlueprint';
import './FixedAssetsStyles.css';

export default function FixedAssetsFloorPlan({
  floor = 'Ground Floor',
  assets = [],
  selectedAsset = null,
  onSelectAsset = () => {},
  selectedZone = null,
  onSelectZone = () => {},
  activeFilter = 'All', // 'All' | 'Chair' | 'Table & Desk' | 'Computers & IT' etc.
  isEditMode = false,
  onToggleEditMode = () => {},
  pendingPositions = {},
  onPositionChange = () => {},
  onSavePositions = () => {},
  onCancelPositions = () => {}
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [isolateFilter, setIsolateFilter] = useState(false); // If true, completely hides non-matching furniture
  const [themeMode, setThemeMode] = useState('light'); // 'light' (Architectural CAD Paper like user image) | 'dark' (Night CAD Blueprint)
  const [printMenuOpen, setPrintMenuOpen] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragAssetId, setDragAssetId] = useState(null);

  const svgRef = useRef(null);
  const printMenuRef = useRef(null);

  const isGroundFloor = !floor || floor.includes('Ground') || floor.includes('GF');

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target)) {
        setPrintMenuOpen(false);
      }
    };
    if (printMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [printMenuOpen]);

  const handleZoom = delta => {
    setZoomLevel(prev => Math.min(Math.max(0.6, prev + delta), 2.2));
  };

  const resetZoom = () => setZoomLevel(1);

  // SVG coordinate transformation
  const getSVGCoordinates = (event) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: Math.round(svgP.x), y: Math.round(svgP.y) };
  };

  // Group assets by zone for count badges
  const zoneAssetCounts = useMemo(() => {
    const counts = {};
    assets.forEach(a => {
      if (a.zoneId) {
        counts[a.zoneId] = (counts[a.zoneId] || 0) + 1;
      }
    });
    return counts;
  }, [assets]);

  // Assets belonging to current floor
  const floorAssets = useMemo(() => {
    return assets.filter(a => {
      if (isGroundFloor) {
        return a.floor === 'Ground Floor';
      } else {
        return a.floor === '1st Floor' || a.zoneId === 'chilaw_lab';
      }
    });
  }, [assets, isGroundFloor]);

  // Color logic
  const isLight = themeMode === 'light';
  const bgColor = isLight ? '#F8FAFC' : '#070D18';
  const wallStroke = isLight ? '#1E293B' : '#475569';
  const wallFill = isLight ? '#E2E8F0' : 'rgba(30, 41, 59, 0.4)';
  const innerWallStroke = isLight ? '#334155' : '#64748B';
  const gridLineColor = isLight ? '#CBD5E1' : '#334155';
  const gridOpacity = isLight ? 0.35 : 0.15;
  const textColor = isLight ? '#0F172A' : '#F8FAFC';
  const textMuted = isLight ? '#64748B' : '#94A3B8';

  // Helper to determine if an asset is highlighted based on active filter
  const isAssetHighlighted = (asset) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Chair') return asset.isChair;
    if (activeFilter === 'Table & Desk') return asset.keyword === 'Table & Desk';
    if (activeFilter === 'Computers & IT') return asset.category === 'Computers & IT';
    if (activeFilter === 'Office Equipment') return asset.category === 'Office Equipment';
    if (activeFilter === 'CCTV & Security') return asset.category === 'CCTV & Security';
    if (activeFilter === 'Air Conditioners') return asset.category === 'Air Conditioners';
    if (activeFilter === 'Storage & Racks') return asset.keyword === 'Storage & Racks';
    if (activeFilter === 'Lab Equipment') return asset.category === 'Lab Equipment';
    return true;
  };

  // Get current position (including pending edits)
  const getAssetCurrentPosition = (asset) => {
    if (pendingPositions[asset.id]) {
      return {
        physX: pendingPositions[asset.id].physX,
        physY: pendingPositions[asset.id].physY,
        rotation: pendingPositions[asset.id].rotation !== undefined ? pendingPositions[asset.id].rotation : (asset.rotation || 0)
      };
    }
    return {
      physX: asset.physX || asset.coordX || 0,
      physY: asset.physY || asset.coordY || 0,
      rotation: asset.rotation || 0
    };
  };

  // Dragging handlers
  const handleItemMouseDown = (e, asset) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    setDragAssetId(asset.id);
    onSelectAsset(asset);
  };

  const handleSvgMouseMove = (e) => {
    if (!isEditMode || !isDragging || !dragAssetId) return;
    const coords = getSVGCoordinates(e);
    if (coords) {
      const currentAsset = assets.find(a => a.id === dragAssetId);
      const rot = pendingPositions[dragAssetId]?.rotation ?? currentAsset?.rotation ?? 0;
      onPositionChange(dragAssetId, coords.x, coords.y, rot);
    }
  };

  const handleSvgMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragAssetId(null);
    }
  };

  const handleCanvasClick = (e) => {
    if (isEditMode && selectedAsset) {
      const coords = getSVGCoordinates(e);
      if (coords) {
        const currentRot = pendingPositions[selectedAsset.id]?.rotation ?? selectedAsset.rotation ?? 0;
        onPositionChange(selectedAsset.id, coords.x, coords.y, currentRot);
      }
    }
  };

  const handleRotateSelected = () => {
    if (!selectedAsset) return;
    const pos = getAssetCurrentPosition(selectedAsset);
    const nextRot = (pos.rotation + 90) % 360;
    onPositionChange(selectedAsset.id, pos.physX, pos.physY, nextRot);
  };

  // Print Handlers
  const handlePrint = (printMode) => {
    setPrintMenuOpen(false);
    printFixedAssetsBlueprint({
      floorTitle: isGroundFloor ? 'Ground Floor' : '1st Floor (Level 1)',
      svgElement: svgRef.current,
      assets: floorAssets,
      mode: printMode,
      activeFilter
    });
  };

  const pendingCount = Object.keys(pendingPositions).length;

  // Render architectural chair symbol matching CAD drawing
  const renderArchitecturalChair = (asset) => {
    const isSelected = selectedAsset && selectedAsset.id === asset.id;
    const isHovered = hoveredAsset && hoveredAsset.id === asset.id;
    const highlighted = isAssetHighlighted(asset);

    if (isolateFilter && activeFilter !== 'All' && !highlighted) {
      return null;
    }

    const faded = activeFilter !== 'All' && !highlighted;
    const { physX, physY, rotation } = getAssetCurrentPosition(asset);
    const furnitureType = asset.furnitureType || 'chair_office';

    // Chair styling
    let stroke = isSelected ? '#00A3FF' : highlighted ? (isLight ? '#0284C7' : '#38BDF8') : (isLight ? '#94A3B8' : '#475569');
    let fill = isSelected ? 'rgba(0, 163, 255, 0.3)' : highlighted ? (isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.25)') : (isLight ? '#FFFFFF' : '#1E293B');
    let strokeW = isSelected ? 2.2 : highlighted ? 1.5 : 1;

    if (asset.condition === 'Damaged') {
      stroke = '#EF4444';
      if (highlighted) fill = 'rgba(239, 68, 68, 0.2)';
    } else if (asset.condition === 'New') {
      stroke = '#00A3FF';
      if (highlighted) fill = 'rgba(0, 163, 255, 0.2)';
    }

    const isPendingThis = !!pendingPositions[asset.id];

    return (
      <g
        key={asset.id}
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        style={{ cursor: isEditMode ? 'grab' : 'pointer', transition: isDragging && dragAssetId === asset.id ? 'none' : 'all 0.15s ease' }}
        opacity={faded ? 0.15 : 1}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectAsset(asset);
        }}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        {/* Selected target ring / crosshair */}
        {isSelected && (
          <g>
            <circle cx={0} cy={0} r={18} fill="rgba(0, 163, 255, 0.25)" stroke="#00A3FF" strokeWidth={1.8} />
            <circle cx={0} cy={0} r={24} fill="none" stroke="#00A3FF" strokeWidth={1.2} strokeDasharray="3 2" />
            {isEditMode && (
              <line x1={0} y1={-24} x2={0} y2={-30} stroke="#00A3FF" strokeWidth={2} />
            )}
          </g>
        )}

        {/* Pending modified highlight */}
        {isPendingThis && (
          <circle cx={0} cy={0} r={16} fill="none" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="3 3" />
        )}

        {/* Hover ring */}
        {isHovered && !isSelected && (
          <circle cx={0} cy={0} r={14} fill="none" stroke="#00A3FF" strokeWidth={1.5} strokeDasharray="2 2" />
        )}

        {/* Architectural Chair CAD Graphics */}
        {furnitureType === 'chair_auditorium' ? (
          <g>
            <rect x={-7} y={-6} width={14} height={12} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <path d="M -7 5 Q 0 8 7 5" fill="none" stroke={stroke} strokeWidth={strokeW * 1.3} strokeLinecap="round" />
            <rect x={7} y={-8} width={4} height={7} rx={1} fill={stroke} opacity={0.8} />
          </g>
        ) : furnitureType === 'chair_executive' ? (
          <g>
            <rect x={-11} y={-5} width={3} height={10} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <rect x={8} y={-5} width={3} height={10} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <rect x={-8} y={-7} width={16} height={14} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <path d="M -9 6 C -9 11, 9 11, 9 6" fill={fill} stroke={stroke} strokeWidth={strokeW * 1.5} />
          </g>
        ) : furnitureType === 'chair_stool' ? (
          <g>
            <circle cx={0} cy={0} r={6} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <circle cx={0} cy={0} r={2} fill={stroke} />
          </g>
        ) : (
          <g>
            <rect x={-9} y={-4} width={2} height={8} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW * 0.9} />
            <rect x={7} y={-4} width={2} height={8} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW * 0.9} />
            <rect x={-7} y={-6} width={14} height={11} rx={2.5} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <path d="M -7 5 Q 0 8 7 5" fill="none" stroke={stroke} strokeWidth={strokeW * 1.4} strokeLinecap="round" />
          </g>
        )}

        {highlighted && activeFilter === 'Chair' && (
          <circle cx={0} cy={-10} r={2} fill="#00A3FF" />
        )}
      </g>
    );
  };

  // Render architectural table symbol
  const renderArchitecturalTable = (asset) => {
    const isSelected = selectedAsset && selectedAsset.id === asset.id;
    const isHovered = hoveredAsset && hoveredAsset.id === asset.id;
    const highlighted = isAssetHighlighted(asset);

    if (isolateFilter && activeFilter !== 'All' && !highlighted) {
      return null;
    }

    const faded = activeFilter !== 'All' && !highlighted;
    const { physX, physY, rotation } = getAssetCurrentPosition(asset);
    const width = asset.width || 44;
    const height = asset.height || 20;
    const furnitureType = asset.furnitureType || 'table_desk';

    let stroke = isSelected ? '#00A3FF' : highlighted ? (isLight ? '#0284C7' : '#38BDF8') : (isLight ? '#94A3B8' : '#475569');
    let fill = isSelected ? 'rgba(0, 163, 255, 0.2)' : highlighted ? (isLight ? '#E0F2FE' : 'rgba(56, 189, 248, 0.15)') : (isLight ? '#F1F5F9' : 'rgba(30, 41, 59, 0.6)');
    let strokeW = isSelected ? 2 : highlighted ? 1.4 : 1;

    return (
      <g
        key={asset.id}
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        style={{ cursor: isEditMode ? 'grab' : 'pointer', transition: isDragging && dragAssetId === asset.id ? 'none' : 'all 0.15s ease' }}
        opacity={faded ? 0.25 : 1}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectAsset(asset);
        }}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        {furnitureType === 'table_coffee' ? (
          <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={height / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        ) : furnitureType === 'table_executive' ? (
          <g>
            <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <rect x={-width / 2} y={height / 2} width={24} height={20} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW * 0.8} />
          </g>
        ) : (
          <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
        )}
        <line x1={-width / 2 + 3} y1={0} x2={width / 2 - 3} y2={0} stroke={stroke} strokeWidth={0.8} strokeDasharray="3 2" opacity={0.5} />
      </g>
    );
  };

  // Render computer / monitor symbol
  const renderArchitecturalComputer = (asset) => {
    const isSelected = selectedAsset && selectedAsset.id === asset.id;
    const highlighted = isAssetHighlighted(asset);

    if (isolateFilter && activeFilter !== 'All' && !highlighted) {
      return null;
    }

    const faded = activeFilter !== 'All' && !highlighted;
    const { physX, physY, rotation } = getAssetCurrentPosition(asset);

    let stroke = isSelected ? '#00A3FF' : highlighted ? '#00A3FF' : (isLight ? '#64748B' : '#94A3B8');
    let fill = isSelected ? '#00A3FF' : highlighted ? '#38BDF8' : (isLight ? '#94A3B8' : '#475569');

    return (
      <g
        key={asset.id}
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        opacity={faded ? 0.2 : 1}
        style={{ cursor: isEditMode ? 'grab' : 'pointer' }}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectAsset(asset);
        }}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        <rect x={-8} y={-2} width={16} height={3} rx={1} fill={fill} stroke={stroke} strokeWidth={0.8} />
        <line x1={0} y1={-2} x2={0} y2={2} stroke={stroke} strokeWidth={1.2} />
        <line x1={-3} y1={2} x2={3} y2={2} stroke={stroke} strokeWidth={1} />
      </g>
    );
  };

  // Helper for rendering Room Count Badges
  const renderRoomBadge = (zoneId, x, y, defaultLabel) => {
    const count = zoneAssetCounts[zoneId] || 0;
    const isSelected = selectedZone === zoneId;
    const hasItems = count > 0;

    let filterLabel = activeFilter === 'All' ? 'Items' : activeFilter;
    if (activeFilter === 'Chair') filterLabel = count === 1 ? 'Chair' : 'Chairs';

    return (
      <g
        transform={`translate(${x}, ${y})`}
        className="fa-room-badge"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectZone(isSelected ? null : zoneId);
        }}
        onMouseEnter={() => setHoveredZone(zoneId)}
        onMouseLeave={() => setHoveredZone(null)}
      >
        <rect
          x={-55}
          y={-11}
          width={110}
          height={22}
          rx={11}
          fill={isSelected ? '#00A3FF' : hasItems ? (isLight ? '#FFFFFF' : '#0F172A') : (isLight ? '#F1F5F9' : 'rgba(15, 23, 42, 0.6)')}
          stroke={isSelected ? '#00A3FF' : hasItems ? '#0284C7' : '#94A3B8'}
          strokeWidth={isSelected ? 2 : 1.2}
          filter={isLight ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))' : 'drop-shadow(0 2px 5px rgba(0,0,0,0.5))'}
        />
        <text
          x={0}
          y={3.5}
          fill={isSelected ? '#FFFFFF' : hasItems ? (isLight ? '#0284C7' : '#38BDF8') : textMuted}
          fontSize={8.5}
          fontWeight={800}
          textAnchor="middle"
          letterSpacing={0.3}
        >
          {hasItems ? `${count} ${filterLabel}` : defaultLabel || '0 Items'}
        </text>
      </g>
    );
  };

  return (
    <div className="fa-blueprint-card" style={{ background: isLight ? '#FFFFFF' : 'var(--bg-surface)' }}>
      {/* Blueprint Header */}
      <div className="fa-blueprint-header" style={{ borderBottomColor: isLight ? '#E2E8F0' : 'var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: isEditMode ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #00A3FF, #0066FF)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: isEditMode ? '0 2px 8px rgba(245, 158, 11, 0.4)' : '0 2px 8px rgba(0, 163, 255, 0.3)'
            }}
          >
            {isEditMode ? <Move size={16} /> : isGroundFloor ? 'GF' : '1F'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: textColor }}>
                {isGroundFloor ? 'Ground Floor Architectural CAD Plan' : '1st Floor (Level 1) Architectural CAD Plan'}
              </span>
              {isEditMode ? (
                <span className="badge badge-warning" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                  ✏️ EDIT PLACEMENT MODE ACTIVE
                </span>
              ) : (
                <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                  {floorAssets.filter(isAssetHighlighted).length} {activeFilter === 'Chair' ? 'Chairs' : activeFilter === 'All' ? 'Items' : activeFilter} Visible
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: textMuted, fontWeight: 600 }}>
              {isEditMode
                ? 'Drag & drop any chair or desk to position it, or click on the map. Click "Save Positions" when done.'
                : isGroundFloor
                  ? 'MD Executive Office, Workstations Hall, Reception & Lobby, Store, Dining & Offices'
                  : 'Main Auditorium (92 Chairs), Nadun\'s Executive Suite, Conference Room, Dining & Lab Annex'}
            </div>
          </div>
        </div>

        {/* Interactive Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Edit Positions Toggle Button */}
          <button
            onClick={onToggleEditMode}
            className={`btn ${isEditMode ? 'btn-warning' : 'btn-outline'}`}
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.75rem',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700
            }}
            title={isEditMode ? 'Exit placement editor' : 'Enter placement editor to drag & place furniture'}
          >
            <Move size={13} />
            <span>{isEditMode ? 'Editing Active' : 'Edit Positions'}</span>
          </button>

          {/* Isolate Filter Toggle */}
          {!isEditMode && (
            <button
              onClick={() => setIsolateFilter(!isolateFilter)}
              className={`btn ${isolateFilter ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title={isolateFilter ? 'Showing ONLY filtered items' : 'Highlight filtered items (dim other furniture)'}
            >
              {isolateFilter ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isolateFilter ? 'Isolate Filter' : 'Highlight Filter'}</span>
            </button>
          )}

          {/* Theme Toggle (Paper Light vs CAD Dark) */}
          <button
            onClick={() => setThemeMode(isLight ? 'dark' : 'light')}
            className="btn btn-outline"
            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            title={isLight ? 'Switch to Dark CAD Blueprint' : 'Switch to Architectural White Paper'}
          >
            {isLight ? <Moon size={13} /> : <Sun size={13} />}
            <span>{isLight ? 'Dark CAD' : 'White CAD'}</span>
          </button>

          {/* Print Menu Dropdown */}
          <div ref={printMenuRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => handlePrint('blank-map')}
                className="btn btn-outline"
                style={{
                  padding: '0.32rem 0.65rem',
                  fontSize: '0.75rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderColor: 'var(--brand-primary, #00A3FF)',
                  color: 'var(--brand-primary, #00A3FF)',
                  fontWeight: 700,
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  borderRight: 'none'
                }}
                title="Print Clean Blank Blueprint (For hand drawing where assets go)"
              >
                <Printer size={13} />
                <span>Print Blank Map</span>
              </button>
              <button
                onClick={() => setPrintMenuOpen(!printMenuOpen)}
                className="btn btn-outline"
                style={{
                  padding: '0.32rem 0.4rem',
                  fontSize: '0.75rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  borderColor: 'var(--brand-primary, #00A3FF)',
                  color: 'var(--brand-primary, #00A3FF)',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0
                }}
                title="Print Options"
              >
                <ChevronDown size={13} />
              </button>
            </div>

            {printMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: isLight ? '#FFFFFF' : 'var(--bg-surface-elevated, #0F172A)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: 8,
                  padding: '4px',
                  zIndex: 60,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                  minWidth: 260
                }}
              >
                <button
                  onClick={() => handlePrint('blank-map')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: textColor,
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 163, 255, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Printer size={15} style={{ color: '#00A3FF' }} />
                  <div>
                    <div style={{ fontWeight: 800 }}>A4 Blank Map (Only Map)</div>
                    <div style={{ fontSize: '0.65rem', color: textMuted }}>Clean architectural plan to hand-draw placements</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('full-map')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: textColor,
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 163, 255, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Layers size={15} style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ fontWeight: 800 }}>Map with Current Furniture</div>
                    <div style={{ fontSize: '0.65rem', color: textMuted }}>Includes all placed chairs & desks</div>
                  </div>
                </button>

                <button
                  onClick={() => handlePrint('detailed')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    fontSize: '0.75rem',
                    background: 'transparent',
                    border: 'none',
                    color: textColor,
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderTop: '1px solid var(--border-subtle, #334155)',
                    marginTop: 2
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 163, 255, 0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <CheckCircle2 size={15} style={{ color: '#F59E0B' }} />
                  <div>
                    <div style={{ fontWeight: 800 }}>Detailed Map + Asset Table</div>
                    <div style={{ fontSize: '0.65rem', color: textMuted }}>Blueprint with asset schedule schedule table</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <button
            onClick={() => handleZoom(0.15)}
            className="btn btn-outline"
            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => handleZoom(-0.15)}
            className="btn btn-outline"
            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={resetZoom}
            className="btn btn-outline"
            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Edit Mode Banner Controls */}
      {isEditMode && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(0, 163, 255, 0.15))',
            borderBottom: '1px solid #F59E0B',
            padding: '0.6rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            zIndex: 15
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Move size={16} className="text-amber" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: textColor }}>
              {selectedAsset
                ? `Selected: ${selectedAsset.itemName} (${selectedAsset.tagNumber.slice(-14)})`
                : 'Click any chair or desk to drag it, or click anywhere to position it.'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {selectedAsset && (
              <button
                onClick={handleRotateSelected}
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Rotate 90 degrees"
              >
                <RotateCw size={13} />
                <span>Rotate (90°)</span>
              </button>
            )}

            <button
              onClick={onCancelPositions}
              className="btn btn-outline"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <X size={13} />
              <span>Cancel</span>
            </button>

            <button
              onClick={onSavePositions}
              className="btn btn-primary"
              style={{
                padding: '0.25rem 0.85rem',
                fontSize: '0.75rem',
                height: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#10B981',
                borderColor: '#10B981'
              }}
            >
              <Save size={13} />
              <span>Save Positions {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Blueprint Canvas */}
      <div
        className="fa-blueprint-canvas"
        style={{
          backgroundColor: bgColor,
          cursor: isEditMode ? (isDragging ? 'grabbing' : 'crosshair') : 'default'
        }}
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transition: isDragging ? 'none' : 'transform 0.25s ease-out',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem',
            userSelect: 'none'
          }}
        >
          <svg
            ref={svgRef}
            viewBox={isGroundFloor ? '0 0 960 970' : '0 0 960 620'}
            style={{ width: '100%', height: '100%', maxHeight: isGroundFloor ? '630px' : '580px' }}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onClick={handleCanvasClick}
          >
            <defs>
              <pattern id="archCadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke={gridLineColor} strokeWidth="0.6" opacity={gridOpacity} />
              </pattern>
            </defs>

            {/* Grid Background */}
            <rect width="960" height={isGroundFloor ? 970 : 620} fill="url(#archCadGrid)" />

            {/* ======================================================== */}
            {/* FIRST FLOOR BLUEPRINT                                    */}
            {/* ======================================================== */}
            {!isGroundFloor && (
              <g id="first-floor-drawing">
                {/* 1. NEW LAB ANNEX */}
                <g
                  id="zone-chilaw-lab"
                  className={`fa-room-zone ${selectedZone === 'chilaw_lab' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'chilaw_lab' ? null : 'chilaw_lab')}
                >
                  <rect x="250" y="85" width="150" height="150" rx="4" fill={wallFill} stroke={wallStroke} strokeWidth="4" />
                  <rect x="258" y="93" width="134" height="134" rx="2" fill="none" stroke={innerWallStroke} strokeWidth="1.2" opacity="0.5" />
                  <rect x="264" y="99" width="122" height="18" rx="2" fill={isLight ? '#E2E8F0' : 'rgba(148, 163, 184, 0.25)'} stroke={innerWallStroke} strokeWidth="1.2" />
                  <rect x="264" y="123" width="22" height="78" rx="2" fill={isLight ? '#E2E8F0' : 'rgba(148, 163, 184, 0.25)'} stroke={innerWallStroke} strokeWidth="1.2" />
                  <line x1="305" y1="235" x2="345" y2="235" stroke={bgColor} strokeWidth="5" />
                  <path d="M 305 235 A 40 40 0 0 1 345 195" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />

                  <text x="325" y="145" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Chilaw Lab
                  </text>
                  <text x="325" y="160" fill={textMuted} fontSize="8" fontWeight="600" textAnchor="middle">
                    Testing Annex (8 Stools)
                  </text>
                  {renderRoomBadge('chilaw_lab', 325, 185, 'Lab Equipment')}
                </g>

                {/* 2. Main Building Outer Walls */}
                <path
                  d="M 525 45 L 880 45 L 880 560 L 140 560 L 140 310 L 525 310 Z"
                  fill={wallFill}
                  stroke={wallStroke}
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 533 53 L 872 53 L 872 552 L 148 552 L 148 318 L 533 318 Z"
                  fill="none"
                  stroke={innerWallStroke}
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* Partitions */}
                <line x1="580" y1="45" x2="580" y2="365" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="580" y1="150" x2="880" y2="150" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="580" y1="270" x2="880" y2="270" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="580" y1="365" x2="880" y2="365" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="140" y1="365" x2="580" y2="365" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="460" y1="365" x2="460" y2="560" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="210" y1="310" x2="210" y2="365" stroke={innerWallStroke} strokeWidth="3.5" />

                {/* 3. DISCUSSION ROOM / REST ROOM */}
                <g
                  id="zone-rest-room"
                  className={`fa-room-zone ${selectedZone === 'rest_room' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'rest_room' ? null : 'rest_room')}
                >
                  <text x="730" y="90" fill={textColor} fontSize="12" fontWeight="800" textAnchor="middle">
                    Discussion Room
                  </text>
                  <text x="730" y="103" fill={textMuted} fontSize="7.5" fontWeight="600" textAnchor="middle">
                    Rest Room & Meeting Table
                  </text>
                  {renderRoomBadge('rest_room', 730, 124, 'Rest Room')}
                </g>

                {/* 4. MAIN CONFERENCE ROOM */}
                <g
                  id="zone-conference-room"
                  className={`fa-room-zone ${selectedZone === 'conference_room' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'conference_room' ? null : 'conference_room')}
                >
                  <rect x="670" y="195" width="120" height="30" rx="15" fill={isLight ? '#F1F5F9' : 'rgba(148, 163, 184, 0.2)'} stroke={innerWallStroke} strokeWidth="1.5" />
                  <text x="730" y="172" fill={textColor} fontSize="12.5" fontWeight="800" textAnchor="middle">
                    Main Conference Room
                  </text>
                  {renderRoomBadge('conference_room', 730, 245, 'Conference')}
                </g>

                {/* 5. 1ST FLOOR DINING ROOM */}
                <g
                  id="zone-first-dining"
                  className={`fa-room-zone ${selectedZone === 'first_dining' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'first_dining' ? null : 'first_dining')}
                >
                  <rect x="710" y="306" width="40" height="24" rx="3" fill={isLight ? '#F1F5F9' : 'rgba(148, 163, 184, 0.2)'} stroke={innerWallStroke} strokeWidth="1.4" />
                  <text x="730" y="295" fill={textColor} fontSize="11.5" fontWeight="800" textAnchor="middle">
                    Lunch Room (Dining)
                  </text>
                  {renderRoomBadge('first_dining', 730, 342, 'Dining')}
                </g>

                {/* 6. MR. NADUN'S EXECUTIVE ROOM */}
                <g
                  id="zone-nadun-office"
                  className={`fa-room-zone ${selectedZone === 'nadun_office' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'nadun_office' ? null : 'nadun_office')}
                >
                  <line x1="670" y1="365" x2="670" y2="440" stroke={innerWallStroke} strokeWidth="3" />
                  <line x1="670" y1="440" x2="880" y2="440" stroke={innerWallStroke} strokeWidth="3" />
                  <rect x="735" y="395" width="70" height="24" rx="2" fill={isLight ? '#F1F5F9' : 'rgba(148, 163, 184, 0.2)'} stroke={innerWallStroke} strokeWidth="1.4" />
                  <text x="770" y="380" fill={textColor} fontSize="11" fontWeight="800" textAnchor="middle">
                    Mr. Nadun's Office
                  </text>
                  {renderRoomBadge('nadun_office', 770, 428, "Nadun's Room")}
                </g>

                {/* 7. 1ST FLOOR OPERATIONS HALL */}
                <g
                  id="zone-nadun-lobby"
                  className={`fa-room-zone ${selectedZone === 'nadun_lobby' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'nadun_lobby' ? null : 'nadun_lobby')}
                >
                  <text x="620" y="490" fill={textColor} fontSize="12" fontWeight="800" textAnchor="middle">
                    1st Floor Operations Hall
                  </text>
                  {renderRoomBadge('nadun_lobby', 620, 526, 'Main Hall')}
                </g>

                {/* 8. MAIN AUDITORIUM */}
                <g
                  id="zone-auditorium"
                  className={`fa-room-zone ${selectedZone === 'auditorium' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'auditorium' ? null : 'auditorium')}
                >
                  <rect x="240" y="375" width="120" height="22" rx="4" fill={isLight ? '#E0F2FE' : 'rgba(0, 163, 255, 0.12)'} stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="300" y="390" fill="#00A3FF" fontSize="8.5" fontWeight="800" textAnchor="middle">
                    STAGE / PRESENTATION SCREEN
                  </text>

                  <line x1="300" y1="405" x2="300" y2="550" stroke="#00A3FF" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
                  <text x="300" y="415" fill={textMuted} fontSize="7" fontWeight="700" textAnchor="middle">AISLE</text>

                  {[426, 449, 472, 495, 518].map(sy => (
                    <line key={sy} x1="150" y1={sy} x2="450" y2={sy} stroke={innerWallStroke} strokeWidth="0.8" strokeDasharray="2 2" opacity="0.3" />
                  ))}

                  <text x="300" y="546" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Main Auditorium • 92 Chairs
                  </text>
                  {renderRoomBadge('auditorium', 300, 560, '92 Chairs')}
                </g>
              </g>
            )}

            {/* ======================================================== */}
            {/* GROUND FLOOR BLUEPRINT                                   */}
            {/* ======================================================== */}
            {isGroundFloor && (
              <g id="ground-floor-drawing">
                {/* 1. Outer Double Walls */}
                <path
                  d="M 180 60 L 550 60 L 550 170 L 905 170 L 905 570 L 525 570 L 525 920 L 180 920 Z"
                  fill={wallFill}
                  stroke={wallStroke}
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 188 68 L 542 68 L 542 178 L 897 178 L 897 562 L 517 562 L 517 912 L 188 912 Z"
                  fill="none"
                  stroke={innerWallStroke}
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* Major Partitions */}
                <line x1="180" y1="170" x2="550" y2="170" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="365" y1="60" x2="365" y2="170" stroke={innerWallStroke} strokeWidth="3" strokeDasharray="8 4" />
                <line x1="480" y1="350" x2="480" y2="520" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="480" y1="520" x2="750" y2="520" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="750" y1="170" x2="750" y2="570" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="180" y1="515" x2="480" y2="515" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="180" y1="570" x2="470" y2="570" stroke={innerWallStroke} strokeWidth="4" />
                <line x1="470" y1="570" x2="470" y2="920" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="180" y1="685" x2="470" y2="685" stroke={innerWallStroke} strokeWidth="3.5" />
                <line x1="180" y1="800" x2="470" y2="800" stroke={innerWallStroke} strokeWidth="3.5" />

                {/* 2. KITCHEN / GROUND DINING */}
                <g
                  id="zone-ground-dining"
                  className={`fa-room-zone ${selectedZone === 'ground_dining' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'ground_dining' ? null : 'ground_dining')}
                >
                  <rect x="254" y="99" width="32" height="32" rx="3" fill={isLight ? '#F1F5F9' : 'rgba(148, 163, 184, 0.2)'} stroke={innerWallStroke} strokeWidth="1.5" />
                  <text x="270" y="85" fill={textColor} fontSize="11.5" fontWeight="800" textAnchor="middle">
                    Kitchen & Dining
                  </text>
                  {renderRoomBadge('ground_dining', 270, 145, 'Dining Table')}
                </g>

                {/* 3. GROUND OPERATIONS HALL */}
                <g
                  id="zone-main-office"
                  className={`fa-room-zone ${selectedZone === 'main_office' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'main_office' ? null : 'main_office')}
                >
                  <line x1="210" y1="225" x2="400" y2="225" stroke={innerWallStroke} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="210" y1="325" x2="400" y2="325" stroke={innerWallStroke} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />

                  <text x="310" y="175" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Ground Operations Hall (Main Office)
                  </text>
                  <text x="310" y="188" fill={textMuted} fontSize="8" fontWeight="600" textAnchor="middle">
                    Staff Desks: Ishara, Antonette, Deepika, Lahiru, Indika, etc.
                  </text>
                  {renderRoomBadge('main_office', 310, 275, '24 Desks & Chairs')}
                </g>

                {/* 4. RECEPTION & LOBBY */}
                <g
                  id="zone-reception"
                  className={`fa-room-zone ${selectedZone === 'reception' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'reception' ? null : 'reception')}
                >
                  <path d="M 550 380 Q 615 395 680 380" fill="none" stroke="#00A3FF" strokeWidth="2.5" strokeDasharray="4 3" />
                  <text x="615" y="365" fill="#00A3FF" fontSize="9" fontWeight="800" textAnchor="middle">RECEPTION COUNTER</text>
                  <text x="615" y="420" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Reception Lobby
                  </text>
                  {renderRoomBadge('reception', 615, 475, 'Reception Chairs')}
                </g>

                {/* 5. FISH TANK GALLERY */}
                <g
                  id="zone-fish-tank"
                  className={`fa-room-zone ${selectedZone === 'fish_tank' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'fish_tank' ? null : 'fish_tank')}
                >
                  <rect x="330" y="520" width="130" height="40" rx="4" fill="rgba(14, 165, 233, 0.15)" stroke="#00A3FF" strokeWidth="1.5" />
                  <text x="395" y="544" fill="#00A3FF" fontSize="9" fontWeight="800" textAnchor="middle">
                    🐠 Fish Tank Gallery
                  </text>
                  {renderRoomBadge('fish_tank', 395, 558, 'Fish Tank')}
                </g>

                {/* 6. STORE ROOM */}
                <g
                  id="zone-stores"
                  className={`fa-room-zone ${selectedZone === 'stores' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'stores' ? null : 'stores')}
                >
                  <text x="830" y="490" fill={textColor} fontSize="11" fontWeight="800" textAnchor="middle">
                    📦 Stores
                  </text>
                  <text x="830" y="505" fill={textMuted} fontSize="7.5" fontWeight="600" textAnchor="middle">
                    Mr. Wasantha
                  </text>
                  {renderRoomBadge('stores', 830, 526, 'Stores')}
                </g>

                {/* 7. MD'S / BOSS OFFICE */}
                <g
                  id="zone-md-office"
                  className={`fa-room-zone ${selectedZone === 'md_office' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'md_office' ? null : 'md_office')}
                >
                  <text x="330" y="588" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    MD's Office Room
                  </text>
                  <text x="330" y="602" fill={textMuted} fontSize="8" fontWeight="600" textAnchor="middle">
                    Executive Suite (8 Chairs & Tables)
                  </text>
                  {renderRoomBadge('md_office', 330, 672, "MD's Chairs")}
                </g>

                {/* 8. RECOVERY TEAM OFFICE */}
                <g
                  id="zone-recovery-office"
                  className={`fa-room-zone ${selectedZone === 'recovery_office' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'recovery_office' ? null : 'recovery_office')}
                >
                  <text x="330" y="705" fill={textColor} fontSize="12" fontWeight="800" textAnchor="middle">
                    Recovery Team Office
                  </text>
                  {renderRoomBadge('recovery_office', 330, 785, 'Recovery Chairs')}
                </g>

                {/* 9. OTHER OFFICE / RECORDS */}
                <g
                  id="zone-stationary-room"
                  className={`fa-room-zone ${selectedZone === 'stationary_room' ? 'selected' : ''}`}
                  onClick={() => onSelectZone(selectedZone === 'stationary_room' ? null : 'stationary_room')}
                >
                  <text x="330" y="835" fill={textColor} fontSize="12" fontWeight="800" textAnchor="middle">
                    Stationary & Records Room
                  </text>
                  {renderRoomBadge('stationary_room', 330, 875, 'Records')}
                </g>
              </g>
            )}

            {/* ======================================================== */}
            {/* LAYER 1: TABLES & WORKSTATION DESKS                      */}
            {/* ======================================================== */}
            <g id="architectural-tables-layer">
              {floorAssets.filter(a => a.keyword === 'Table & Desk' || a.furnitureType?.startsWith('table_')).map(renderArchitecturalTable)}
            </g>

            {/* ======================================================== */}
            {/* LAYER 2: COMPUTERS & MONITORS ON DESKS                   */}
            {/* ======================================================== */}
            <g id="architectural-computers-layer">
              {floorAssets.filter(a => a.category === 'Computers & IT' || a.furnitureType === 'pc_monitor').map(renderArchitecturalComputer)}
            </g>

            {/* ======================================================== */}
            {/* LAYER 3: CHAIRS (Interactive Architectural Symbols!)     */}
            {/* ======================================================== */}
            <g id="architectural-chairs-layer">
              {floorAssets.filter(a => a.isChair || a.furnitureType?.startsWith('chair_')).map(renderArchitecturalChair)}
            </g>

            {/* Placement Crosshair / Indicator in Edit Mode */}
            {isEditMode && selectedAsset && (
              <g style={{ pointerEvents: 'none' }}>
                {(() => {
                  const pos = getAssetCurrentPosition(selectedAsset);
                  return (
                    <g transform={`translate(${pos.physX}, ${pos.physY})`}>
                      <line x1={-30} y1={0} x2={30} y2={0} stroke="#00A3FF" strokeWidth={1} strokeDasharray="3 2" />
                      <line x1={0} y1={-30} x2={0} y2={30} stroke="#00A3FF" strokeWidth={1} strokeDasharray="3 2" />
                      <circle cx={0} cy={0} r={28} fill="none" stroke="#00A3FF" strokeWidth={1.5} strokeDasharray="4 3" />
                      <text x={0} y={-34} fill="#00A3FF" fontSize={9} fontWeight={800} textAnchor="middle">
                        X: {pos.physX}, Y: {pos.physY} ({pos.rotation}°)
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Hover Tooltip inside SVG */}
            {hoveredAsset && !isDragging && (
              <g transform={`translate(${getAssetCurrentPosition(hoveredAsset).physX}, ${getAssetCurrentPosition(hoveredAsset).physY - 26})`} style={{ pointerEvents: 'none' }}>
                <rect
                  x={-85}
                  y={-28}
                  width={170}
                  height={28}
                  rx={6}
                  fill="rgba(15, 23, 42, 0.95)"
                  stroke="#00A3FF"
                  strokeWidth={1.2}
                  filter="drop-shadow(0 4px 10px rgba(0,0,0,0.4))"
                />
                <text x={0} y={-14} fill="#FFFFFF" fontSize={8.5} fontWeight={800} textAnchor="middle">
                  {hoveredAsset.itemName}
                </text>
                <text x={0} y={-4} fill="#38BDF8" fontSize={7.5} fontWeight={700} textAnchor="middle">
                  {hoveredAsset.tagNumber.slice(-14)} • {hoveredAsset.user || hoveredAsset.zoneName}
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
