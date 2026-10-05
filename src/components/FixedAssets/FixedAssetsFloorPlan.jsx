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
  Compass,
  FileSpreadsheet,
  User
} from 'lucide-react';
import { printFixedAssetsBlueprint } from '../../utils/printFixedAssetsBlueprint';
import { EXCEL_STAFF_CUSTODIANS } from '../../services/fixedAssetService';
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
  onCancelPositions = () => {},
  onUpdateCustodian = () => {}
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredAsset, setHoveredAsset] = useState(null);
  const [hoveredZone, setHoveredZone] = useState(null);
  const [isolateFilter, setIsolateFilter] = useState(false); // If true, completely hides non-matching furniture
  const [themeMode, setThemeMode] = useState('light'); // 'light' (Architectural CAD Paper like user image) | 'dark' (Night CAD Blueprint)
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [showStaffNames, setShowStaffNames] = useState(true); // Toggle staff name tags on blueprint

  // Dragging state for item editing
  const [isDragging, setIsDragging] = useState(false);
  const [dragAssetId, setDragAssetId] = useState(null);

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const printMenuRef = useRef(null);
  const panStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0, moved: false });

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

  // Google Maps Style Mouse Wheel Zoom centered on cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoomLevel((prevZoom) => {
        const nextZoom = Math.min(Math.max(0.5, Number((prevZoom * zoomFactor).toFixed(2))), 3.5);
        if (nextZoom === prevZoom) return prevZoom;

        setPan((prevPan) => {
          const scaleRatio = nextZoom / prevZoom;
          return {
            x: Math.round(mouseX - (mouseX - prevPan.x) * scaleRatio),
            y: Math.round(mouseY - (mouseY - prevPan.y) * scaleRatio)
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Global mouseup to prevent sticky drag/pan when releasing outside the element
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setIsDragging(false);
      setDragAssetId(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const handleZoom = (delta) => {
    setZoomLevel(prev => {
      const nextZoom = Math.min(Math.max(0.5, Number((prev + delta).toFixed(2))), 3.5);
      if (nextZoom === 1 && prev !== 1) {
        setPan({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetZoom();
  }, [floor]);

  // Room Quick-Jump Definitions
  const groundFloorZones = [
    { id: 'all', label: 'All Floor', icon: '🏢', cx: 480, cy: 485, zoom: 1 },
    { id: 'main_office', label: 'Main Office', icon: '💻', cx: 310, cy: 260, zoom: 1.6 },
    { id: 'reception', label: 'Reception', icon: '🤝', cx: 615, cy: 420, zoom: 1.7 },
    { id: 'md_office', label: "MD's Suite", icon: '👔', cx: 330, cy: 630, zoom: 1.8 },
    { id: 'recovery_office', label: 'Recovery Team', icon: '📋', cx: 330, cy: 740, zoom: 1.8 },
    { id: 'stores', label: 'Stores', icon: '📦', cx: 830, cy: 510, zoom: 1.8 },
    { id: 'ground_dining', label: 'Kitchen & Dining', icon: '🍽️', cx: 270, cy: 115, zoom: 1.9 },
    { id: 'fish_tank', label: 'Fish Tank', icon: '🐠', cx: 395, cy: 540, zoom: 1.9 },
    { id: 'stationary_room', label: 'Records', icon: '📁', cx: 330, cy: 875, zoom: 1.9 }
  ];

  const firstFloorZones = [
    { id: 'all', label: 'All Floor', icon: '🏢', cx: 480, cy: 310, zoom: 1 },
    { id: 'auditorium', label: 'Main Auditorium (92)', icon: '🎭', cx: 300, cy: 470, zoom: 1.5 },
    { id: 'chilaw_lab', label: 'Chilaw Lab Annex', icon: '🧪', cx: 325, cy: 160, zoom: 1.7 },
    { id: 'conference_room', label: 'Main Conference', icon: '💼', cx: 730, cy: 210, zoom: 1.7 },
    { id: 'rest_room', label: 'Discussion Room', icon: '☕', cx: 730, cy: 110, zoom: 1.8 },
    { id: 'first_dining', label: 'Lunch Room', icon: '🍽️', cx: 730, cy: 315, zoom: 1.8 },
    { id: 'nadun_office', label: "Mr. Nadun's Office", icon: '👔', cx: 770, cy: 410, zoom: 1.8 }
  ];

  const jumpToZone = (zoneItem) => {
    if (zoneItem.id === 'all' || (selectedZone === zoneItem.id && zoomLevel > 1)) {
      resetZoom();
      onSelectZone(null);
      return;
    }

    const container = containerRef.current;
    const viewBoxW = 960;
    const viewBoxH = isGroundFloor ? 970 : 620;
    const centerX = viewBoxW / 2;
    const centerY = viewBoxH / 2;

    let scaleRatio = 0.65;
    if (container) {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        scaleRatio = (rect.width * 0.92) / viewBoxW;
      }
    }

    const targetPanX = Math.round((centerX - zoneItem.cx) * scaleRatio * zoneItem.zoom);
    const targetPanY = Math.round((centerY - zoneItem.cy) * scaleRatio * zoneItem.zoom);

    setZoomLevel(zoneItem.zoom);
    setPan({ x: targetPanX, y: targetPanY });
    onSelectZone(zoneItem.id);
  };

  const handleZoneClick = (zoneId) => {
    if (panStartRef.current?.moved) return;
    const target = (isGroundFloor ? groundFloorZones : firstFloorZones).find(z => z.id === zoneId);
    if (target) {
      jumpToZone(target);
    } else {
      onSelectZone(selectedZone === zoneId ? null : zoneId);
    }
  };

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

  // Panning & Dragging handlers
  const handleItemMouseDown = (e, asset) => {
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false
    };

    if (isEditMode) {
      e.stopPropagation();
      setIsDragging(true);
      setDragAssetId(asset.id);
      onSelectAsset(asset);
    }
  };

  const handleAssetClick = (e, asset) => {
    e.stopPropagation();
    const dx = e.clientX - (panStartRef.current?.mouseX || e.clientX);
    const dy = e.clientY - (panStartRef.current?.mouseY || e.clientY);
    if (Math.hypot(dx, dy) > 8) return;
    onSelectAsset(asset);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0 && e.button !== 1) return;
    if (isEditMode && e.target.closest('.fa-interactive-asset')) return;

    setIsPanning(true);
    panStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panX: pan.x,
      panY: pan.y,
      moved: false
    };
  };

  const handleContainerMouseMove = (e) => {
    // 1. Repositioning asset in Edit Mode
    if (isEditMode && isDragging && dragAssetId) {
      const coords = getSVGCoordinates(e);
      if (coords) {
        const currentAsset = assets.find(a => a.id === dragAssetId);
        const rot = pendingPositions[dragAssetId]?.rotation ?? currentAsset?.rotation ?? 0;
        onPositionChange(dragAssetId, coords.x, coords.y, rot);
      }
      return;
    }

    // 2. Panning map canvas Google Maps style
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      if (Math.hypot(dx, dy) > 8) {
        panStartRef.current.moved = true;
      }
      setPan({
        x: Math.round(panStartRef.current.panX + dx),
        y: Math.round(panStartRef.current.panY + dy)
      });
    }
  };

  const handleContainerMouseUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      setDragAssetId(null);
    }

    if (isPanning) {
      setIsPanning(false);
      // If user clicked without dragging
      if (!panStartRef.current.moved) {
        if (isEditMode && selectedAsset && !e.target.closest('.fa-interactive-asset')) {
          const coords = getSVGCoordinates(e);
          if (coords) {
            const currentRot = pendingPositions[selectedAsset.id]?.rotation ?? selectedAsset.rotation ?? 0;
            onPositionChange(selectedAsset.id, coords.x, coords.y, currentRot);
          }
        }
      }
    }
  };

  const handleCanvasDoubleClick = (e) => {
    if (isEditMode) return;
    if (zoomLevel >= 1.8) {
      resetZoom();
    } else {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      setZoomLevel((prev) => {
        const nextZoom = Math.min(prev * 1.5, 3.0);
        setPan((prevPan) => {
          const scaleRatio = nextZoom / prev;
          return {
            x: Math.round(mouseX - (mouseX - prevPan.x) * scaleRatio),
            y: Math.round(mouseY - (mouseY - prevPan.y) * scaleRatio)
          };
        });
        return nextZoom;
      });
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

  // Short name cleaner for CAD blueprint badges
  const getShortName = (name) => {
    if (!name) return '';
    if (name.includes('Boss') || name === 'MD') return 'Boss';
    if (name.includes('HRO') || name.includes('Recovery')) return 'HRO';
    if (name.includes('Ishara')) return 'Ishara';
    if (name.includes('Deepika')) return 'Deepika';
    if (name.includes('Lahiru')) return 'Lahiru';
    if (name.includes('Chaminda')) return 'Chaminda';
    if (name.includes('Indika')) return 'Indika';
    if (name.includes('Dilushi')) return 'Dilushi';
    if (name.includes('Narmada')) return 'Narmada';
    if (name.includes('Anjitha')) return 'Anjitha';
    if (name.includes('Mishel')) return 'Reception';
    if (name.includes('Guest')) return 'Guest';
    if (name.includes('Black Chairs')) return '6 Black';
    if (name.includes('Sachini')) return 'Sachini';
    if (name.includes('Hiruni')) return 'Hiruni';
    if (name.includes('Mahima')) return 'Mahima';
    if (name.includes('Lakshani')) return 'Lakshani';
    if (name.includes('Chalani')) return 'Chalani';
    if (name.includes('Heshani')) return 'Heshani';
    if (name.includes('Kalpana')) return 'Kalpana';
    if (name.includes('Tharindu')) return 'Tharindu';
    if (name.includes('Wasantha')) return 'Stores';
    if (name.includes('Dining')) return 'Dining';
    return name.replace(/^(Mr\.|Mrs\.|Ms\.)\s*/i, '').slice(0, 10);
  };

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

    const isOfficeBlackChair = furnitureType === 'chair_office' || furnitureType === 'chair_executive';
    const isVisitorChair = furnitureType === 'chair_visitor' || furnitureType === 'chair_dining';

    // Chair styling matching user's pencil drawing & legend:
    // ■ ▲ black chir: Solid dark fill with directional pointer
    // ▯ normal chire: Clean rounded rectangle outline
    let stroke = isSelected
      ? '#00A3FF'
      : highlighted
        ? (isOfficeBlackChair ? (isLight ? '#0F172A' : '#38BDF8') : (isLight ? '#0284C7' : '#38BDF8'))
        : (isLight ? '#94A3B8' : '#475569');

    let fill = isSelected
      ? 'rgba(0, 163, 255, 0.35)'
      : highlighted
        ? (isOfficeBlackChair
            ? (isLight ? '#1E293B' : '#0F172A')
            : (isLight ? '#FFFFFF' : '#1E293B'))
        : (isOfficeBlackChair
            ? (isLight ? '#475569' : '#1E293B')
            : (isLight ? '#F1F5F9' : '#0F172A'));

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
        className="fa-interactive-asset"
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        style={{ cursor: isEditMode ? 'grab' : 'pointer', transition: isDragging && dragAssetId === asset.id ? 'none' : 'all 0.15s ease' }}
        opacity={faded ? 0.15 : 1}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => handleAssetClick(e, asset)}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        {/* Generous invisible hit target circle so clicking is effortless */}
        <circle cx={0} cy={0} r={16} fill="transparent" style={{ pointerEvents: 'all' }} />

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

        {/* Architectural Chair CAD Graphics matching hand-drawn legend */}
        {furnitureType === 'chair_auditorium' ? (
          <g>
            <rect x={-7} y={-6} width={14} height={12} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <path d="M -7 5 Q 0 8 7 5" fill="none" stroke={stroke} strokeWidth={strokeW * 1.3} strokeLinecap="round" />
            <rect x={7} y={-8} width={4} height={7} rx={1} fill={stroke} opacity={0.8} />
          </g>
        ) : furnitureType === 'chair_executive' ? (
          <g>
            {/* Boss Executive Chair with Direction Indicator */}
            <rect x={-11} y={-5} width={3} height={11} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <rect x={8} y={-5} width={3} height={11} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <rect x={-8} y={-7} width={16} height={14} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <polygon points="-4,-8 0,-12 4,-8" fill={isSelected ? '#00A3FF' : (isLight ? '#0F172A' : '#38BDF8')} />
            <path d="M -9 7 C -9 12, 9 12, 9 7" fill={fill} stroke={stroke} strokeWidth={strokeW * 1.5} />
          </g>
        ) : furnitureType === 'chair_stool' ? (
          <g>
            <circle cx={0} cy={0} r={6} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <circle cx={0} cy={0} r={2} fill={stroke} />
          </g>
        ) : isVisitorChair ? (
          <g>
            {/* ▯ Normal / Visitor Chair matching legend */}
            <rect x={-6} y={-7} width={12} height={14} rx={2.5} fill={fill} stroke={stroke} strokeWidth={strokeW * 1.2} />
            <line x1={-5} y1={-1} x2={5} y2={-1} stroke={stroke} strokeWidth={0.8} opacity={0.5} />
            <path d="M -5 5 Q 0 7 5 5" fill="none" stroke={stroke} strokeWidth={strokeW} strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {/* ■ ▲ Black Office Chair with directional marker matching user drawing & legend */}
            <rect x={-9} y={-4} width={2.2} height={8} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW * 0.8} />
            <rect x={6.8} y={-4} width={2.2} height={8} rx={1} fill={fill} stroke={stroke} strokeWidth={strokeW * 0.8} />
            <rect x={-7} y={-6} width={14} height={11} rx={2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
            <polygon points="-3,-7 0,-11 3,-7" fill={isSelected ? '#00A3FF' : (isLight ? '#0F172A' : '#38BDF8')} />
            <path d="M -7 5 Q 0 8 7 5" fill="none" stroke={stroke} strokeWidth={strokeW * 1.4} strokeLinecap="round" />
          </g>
        )}

        {highlighted && activeFilter === 'Chair' && (
          <circle cx={0} cy={-10} r={2} fill="#00A3FF" />
        )}

        {/* Assigned Staff Person Name Tag */}
        {showStaffNames && asset.user && !asset.user.includes('Common') && !asset.user.startsWith('Verified') && !asset.user.startsWith('Area') && (
          <g transform={`rotate(${-rotation})`}>
            <rect
              x={-24}
              y={12}
              width={48}
              height={10}
              rx={2.5}
              fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)'}
              stroke={isSelected ? '#00A3FF' : isLight ? '#CBD5E1' : '#334155'}
              strokeWidth={0.8}
            />
            <text
              x={0}
              y={19.5}
              fill={isSelected ? '#00A3FF' : isLight ? '#0369A1' : '#38BDF8'}
              fontSize={6.2}
              fontWeight={800}
              textAnchor="middle"
              letterSpacing={0.2}
              style={{ pointerEvents: 'none' }}
            >
              {getShortName(asset.user)}
            </text>
          </g>
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
        className="fa-interactive-asset"
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        style={{ cursor: isEditMode ? 'grab' : 'pointer', transition: isDragging && dragAssetId === asset.id ? 'none' : 'all 0.15s ease' }}
        opacity={faded ? 0.25 : 1}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => handleAssetClick(e, asset)}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        {/* Generous invisible hit target so clicking table is effortless */}
        <rect x={-width / 2 - 5} y={-height / 2 - 5} width={width + 10} height={height + 10} fill="transparent" style={{ pointerEvents: 'all' }} />

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

        {/* Assigned Staff Person Name Tag on Table */}
        {showStaffNames && asset.user && !asset.user.includes('Common') && !asset.user.startsWith('Verified') && !asset.user.startsWith('Area') && (
          <g transform={`rotate(${-rotation})`}>
            <rect
              x={-24}
              y={height / 2 + 3}
              width={48}
              height={10}
              rx={2.5}
              fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)'}
              stroke={isSelected ? '#00A3FF' : isLight ? '#CBD5E1' : '#334155'}
              strokeWidth={0.8}
            />
            <text
              x={0}
              y={height / 2 + 10.5}
              fill={isSelected ? '#00A3FF' : isLight ? '#0369A1' : '#38BDF8'}
              fontSize={6.2}
              fontWeight={800}
              textAnchor="middle"
              letterSpacing={0.2}
              style={{ pointerEvents: 'none' }}
            >
              {getShortName(asset.user)}
            </text>
          </g>
        )}
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
        className="fa-interactive-asset"
        transform={`translate(${physX}, ${physY}) rotate(${rotation})`}
        opacity={faded ? 0.2 : 1}
        style={{ cursor: isEditMode ? 'grab' : 'pointer' }}
        onMouseDown={(e) => handleItemMouseDown(e, asset)}
        onClick={(e) => handleAssetClick(e, asset)}
        onMouseEnter={() => setHoveredAsset(asset)}
        onMouseLeave={() => setHoveredAsset(null)}
      >
        <circle cx={0} cy={0} r={14} fill="transparent" style={{ pointerEvents: 'all' }} />
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
                <>
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                    {floorAssets.filter(isAssetHighlighted).length} {activeFilter === 'Chair' ? 'Chairs' : activeFilter === 'All' ? 'Furniture Units' : activeFilter} Visible
                  </span>
                  <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Phase 1: Seating & Desks Only
                  </span>
                </>
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

          {/* Staff Names Toggle */}
          <button
            onClick={() => setShowStaffNames(prev => !prev)}
            className={`btn ${showStaffNames ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Toggle Staff / Custodian Name Badges on Map"
          >
            <User size={13} />
            <span>{showStaffNames ? 'Names: ON' : 'Names: OFF'}</span>
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

          {/* Zoom controls with percentage indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => handleZoom(0.15)}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
              title="Zoom In (+)"
            >
              <ZoomIn size={14} />
            </button>
            <span
              onClick={resetZoom}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#38BDF8',
                padding: '0.2rem 0.45rem',
                borderRadius: 4,
                cursor: 'pointer',
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                minWidth: '42px',
                textAlign: 'center'
              }}
              title="Click to Reset View"
            >
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(-0.15)}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
              title="Zoom Out (-)"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={resetZoom}
              className="btn btn-outline"
              style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', height: 'auto' }}
              title="Reset View (Fit Full Floor)"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Room Navigator Bar */}
      <div className="fa-room-jump-bar">
        <span className="fa-jump-bar-label">
          <Compass size={13} style={{ color: '#00A3FF' }} />
          <span>Jump to:</span>
        </span>
        <div className="fa-jump-chips-container">
          {(isGroundFloor ? groundFloorZones : firstFloorZones).map(z => {
            const isCurrentZone = (z.id === 'all' && !selectedZone) || selectedZone === z.id;
            const count = z.id === 'all' ? floorAssets.length : (zoneAssetCounts[z.id] || 0);
            return (
              <button
                key={z.id}
                className={`fa-room-jump-chip ${isCurrentZone ? 'active' : ''}`}
                onClick={() => jumpToZone(z)}
                title={`Focus & Zoom onto ${z.label}`}
              >
                <span>{z.icon}</span>
                <span>{z.label}</span>
                <span className="fa-jump-chip-count">{count}</span>
              </button>
            );
          })}
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

      {/* Blueprint Canvas with Google Maps Style Pan & Zoom */}
      <div
        ref={containerRef}
        className={`fa-blueprint-canvas ${isPanning ? 'panning' : isEditMode ? 'editing' : 'can-pan'}`}
        style={{
          backgroundColor: bgColor
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isPanning || (isDragging && isEditMode) ? 'none' : 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)',
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
            style={{ width: '100%', height: '100%', maxHeight: isGroundFloor ? '630px' : '580px', overflow: 'visible' }}
            preserveAspectRatio="xMidYMid meet"
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
                  onClick={() => handleZoneClick('chilaw_lab')}
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
                  onClick={() => handleZoneClick('rest_room')}
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
                  onClick={() => handleZoneClick('conference_room')}
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
                  onClick={() => handleZoneClick('first_dining')}
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
                  onClick={() => handleZoneClick('nadun_office')}
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
                  onClick={() => handleZoneClick('nadun_lobby')}
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
                  onClick={() => handleZoneClick('auditorium')}
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
                  onClick={() => handleZoneClick('ground_dining')}
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
                  onClick={() => handleZoneClick('main_office')}
                >
                  <line x1="210" y1="225" x2="400" y2="225" stroke={innerWallStroke} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="210" y1="325" x2="400" y2="325" stroke={innerWallStroke} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />

                  <text x="370" y="184" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Ground Operations Hall (Main Office)
                  </text>
                  <text x="370" y="197" fill={textMuted} fontSize="7.8" fontWeight="600" textAnchor="middle">
                    Staff Desks: Deepika, Ishara, Dilushi, Narmada, Lahiru, Chaminda, Indika, Tharindu & 6-Desk Pod
                  </text>
                  {renderRoomBadge('main_office', 370, 290, '24 Desks & Chairs')}
                </g>

                {/* 4. RECEPTION & LOBBY */}
                <g
                  id="zone-reception"
                  className={`fa-room-zone ${selectedZone === 'reception' ? 'selected' : ''}`}
                  onClick={() => handleZoneClick('reception')}
                >
                  <path d="M 550 380 Q 615 395 680 380" fill="none" stroke="#00A3FF" strokeWidth="2.5" strokeDasharray="4 3" />
                  <text x="615" y="365" fill="#00A3FF" fontSize="9" fontWeight="800" textAnchor="middle">RECEPTION COUNTER</text>
                  <text x="615" y="420" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    Reception Lobby
                  </text>
                  <text x="570" y="390" fill={isLight ? '#0284C7' : '#38BDF8'} fontSize="7.8" fontWeight="800" textAnchor="middle">
                    Guest Chairs (3)
                  </text>
                  <text x="730" y="390" fill={isLight ? '#0284C7' : '#38BDF8'} fontSize="7.8" fontWeight="800" textAnchor="middle">
                    Reception Desks (2)
                  </text>
                  {renderRoomBadge('reception', 615, 500, '2 Desks • 5 Chairs')}
                </g>

                {/* Architectural Office Legend matching user's pencil drawing & legend */}
                <g id="ground-cad-legend" transform="translate(765, 185)">
                  <rect
                    x="0"
                    y="0"
                    width="128"
                    height="88"
                    rx="6"
                    fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)'}
                    stroke={isLight ? '#94A3B8' : '#334155'}
                    strokeWidth="1.2"
                    filter={isLight ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.06))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))'}
                  />
                  <text x="14" y="18" fill={textColor} fontSize="9.5" fontWeight="900" letterSpacing="0.6">
                    OFFICE LEGEND
                  </text>
                  <line x1="14" y1="23" x2="114" y2="23" stroke={isLight ? '#CBD5E1' : '#334155'} strokeWidth="1" />

                  {/* 1. Black Office Chair ■ ▲ */}
                  <g transform="translate(24, 38)">
                    <rect x="-6" y="-6" width="12" height="12" rx="2" fill={isLight ? '#1E293B' : '#0F172A'} stroke={isLight ? '#0F172A' : '#38BDF8'} strokeWidth="1" />
                    <polygon points="-3,-7 0,-11 3,-7" fill={isLight ? '#1E293B' : '#38BDF8'} />
                    <text x="18" y="3" fill={textColor} fontSize="8" fontWeight="700">Black Chair (Office)</text>
                  </g>

                  {/* 2. Table ▭ */}
                  <g transform="translate(24, 55)">
                    <rect x="-8" y="-4" width="16" height="8" rx="1.5" fill={isLight ? '#F1F5F9' : '#1E293B'} stroke={isLight ? '#334155' : '#64748B'} strokeWidth="1.2" />
                    <line x1="-5" y1="0" x2="5" y2="0" stroke={isLight ? '#334155' : '#64748B'} strokeWidth="0.8" strokeDasharray="2 1" />
                    <text x="18" y="3" fill={textColor} fontSize="8" fontWeight="700">Workstation Table</text>
                  </g>

                  {/* 3. Normal Chair ▯ */}
                  <g transform="translate(24, 72)">
                    <rect x="-5" y="-6" width="10" height="12" rx="2" fill={isLight ? '#FFFFFF' : '#1E293B'} stroke={isLight ? '#475569' : '#94A3B8'} strokeWidth="1.2" />
                    <text x="18" y="3" fill={textColor} fontSize="8" fontWeight="700">Normal / Visitor Chair</text>
                  </g>
                </g>

                {/* 5. FISH TANK GALLERY */}
                <g
                  id="zone-fish-tank"
                  className={`fa-room-zone ${selectedZone === 'fish_tank' ? 'selected' : ''}`}
                  onClick={() => handleZoneClick('fish_tank')}
                >
                  <rect x="330" y="520" width="130" height="40" rx="4" fill="rgba(14, 165, 233, 0.22)" stroke="#00A3FF" strokeWidth="2" />
                  <text x="395" y="544" fill="#00A3FF" fontSize="10.5" fontWeight="900" textAnchor="middle">
                    🐠 Fish Tank
                  </text>
                  {renderRoomBadge('fish_tank', 395, 558, 'Fish Tank')}
                </g>

                {/* 6. STORE ROOM */}
                <g
                  id="zone-stores"
                  className={`fa-room-zone ${selectedZone === 'stores' ? 'selected' : ''}`}
                  onClick={() => handleZoneClick('stores')}
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
                  onClick={() => handleZoneClick('md_office')}
                >
                  <text x="330" y="588" fill={textColor} fontSize="13" fontWeight="800" textAnchor="middle">
                    MD's Office Room (Boss Office)
                  </text>
                  <text x="330" y="602" fill={textMuted} fontSize="8" fontWeight="600" textAnchor="middle">
                    Executive Suite (Boss Desk & 3 Front Chairs)
                  </text>
                  {renderRoomBadge('md_office', 330, 672, "MD's Chairs")}
                </g>

                {/* 8. RECOVERY TEAM OFFICE */}
                <g
                  id="zone-recovery-office"
                  className={`fa-room-zone ${selectedZone === 'recovery_office' ? 'selected' : ''}`}
                  onClick={() => handleZoneClick('recovery_office')}
                >
                  <text x="330" y="705" fill={textColor} fontSize="12" fontWeight="800" textAnchor="middle">
                    Recovery Team Office (HRO)
                  </text>
                  {renderRoomBadge('recovery_office', 330, 785, 'Recovery Chairs')}
                </g>

                {/* 9. OTHER OFFICE / RECORDS */}
                <g
                  id="zone-stationary-room"
                  className={`fa-room-zone ${selectedZone === 'stationary_room' ? 'selected' : ''}`}
                  onClick={() => handleZoneClick('stationary_room')}
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
            {/* LAYER 2: CHAIRS (Interactive Architectural Symbols!)     */}
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

        {/* Floating Selected Asset Popover Card on Map */}
        {selectedAsset && (
          <div className="fa-blueprint-asset-popover">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(0, 163, 255, 0.15)',
                    border: '1px solid rgba(0, 163, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    flexShrink: 0
                  }}
                >
                  {selectedAsset.isChair ? '🪑' : selectedAsset.keyword === 'Table & Desk' ? '💼' : selectedAsset.category === 'Computers & IT' ? '💻' : '📦'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedAsset.itemName}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 700 }}>
                    {selectedAsset.tagNumber}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectAsset(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  borderRadius: 12,
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* In Excel or Not Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.55rem',
                  borderRadius: '9999px',
                  background: selectedAsset.inExcelRegister !== false ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: selectedAsset.inExcelRegister !== false ? '#10B981' : '#F59E0B',
                  border: `1px solid ${selectedAsset.inExcelRegister !== false ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)'}`
                }}
              >
                <FileSpreadsheet size={13} />
                <span>{selectedAsset.inExcelRegister !== false ? 'In Excel: Chilaw FA Register 2026 .xlsx' : 'Not in Excel Register (Manual)'}</span>
              </span>
              <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(0, 163, 255, 0.15)', color: '#00A3FF' }}>
                {selectedAsset.floor}
              </span>
              <span className="badge" style={{ fontSize: '0.68rem', background: selectedAsset.condition === 'Damaged' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)', color: selectedAsset.condition === 'Damaged' ? '#EF4444' : '#10B981' }}>
                {selectedAsset.condition || 'Usable'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.73rem', color: '#CBD5E1', marginBottom: '0.6rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.45rem 0.65rem', borderRadius: 6 }}>
              <div>👤 Custodian: <strong style={{ color: '#FFFFFF' }}>{selectedAsset.user || 'Shared Facility'}</strong></div>
              <div>📍 Room: <strong style={{ color: '#FFFFFF' }}>{selectedAsset.zoneName || selectedAsset.locationName}</strong></div>
              <div>🕒 Audit: <strong style={{ color: '#10B981' }}>5 Cycles Recorded</strong></div>
              <div>💰 Value: <strong style={{ color: '#FCD34D' }}>{selectedAsset.amount && selectedAsset.amount !== '-' ? `LKR ${Number(selectedAsset.amount).toLocaleString()}` : '-'}</strong></div>
            </div>

            {/* Quick 1-Click Custodian / Person Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.55rem', padding: '0.35rem 0.55rem', background: 'rgba(0, 0, 0, 0.45)', borderRadius: 6, border: '1px solid rgba(0, 163, 255, 0.3)' }}>
              <span style={{ fontSize: '0.68rem', color: '#38BDF8', whiteSpace: 'nowrap', fontWeight: 800 }}>
                👤 Assign:
              </span>
              <select
                value={selectedAsset.user || ''}
                onChange={(e) => onUpdateCustodian && onUpdateCustodian(selectedAsset.id, e.target.value)}
                style={{ background: '#0F172A', color: '#FFFFFF', border: '1px solid #334155', borderRadius: 4, fontSize: '0.72rem', padding: '0.2rem 0.4rem', width: '100%', cursor: 'pointer' }}
              >
                <option value="">-- Assign Person from Excel --</option>
                {EXCEL_STAFF_CUSTODIANS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                Full audit history & custody logged in drawer 👉
              </div>
              <button
                onClick={() => {
                  const drawer = document.querySelector('.fa-inspector-card');
                  if (drawer) drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }}
                className="btn btn-primary"
                style={{ padding: '0.22rem 0.65rem', fontSize: '0.72rem', height: 'auto', whiteSpace: 'nowrap' }}
              >
                Inspect All Details
              </button>
            </div>
          </div>
        )}

        {/* Floating Google Maps Style Navigation HUD in bottom-right */}
        <div className="fa-map-controls-hud">
          <button onClick={() => handleZoom(0.2)} title="Zoom In (+)">
            <ZoomIn size={15} />
          </button>
          <button onClick={resetZoom} className="fa-hud-zoom-btn" title="Reset Zoom / Fit to Screen">
            {Math.round(zoomLevel * 100)}%
          </button>
          <button onClick={() => handleZoom(-0.2)} title="Zoom Out (-)">
            <ZoomOut size={15} />
          </button>
          <div className="fa-hud-divider" />
          <button onClick={resetZoom} title="Reset to Full Floor (Fit)">
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Floating Navigation Hint in bottom-left */}
        <div className="fa-map-hint-pill">
          <Compass size={12} style={{ color: '#00A3FF' }} />
          <span>Drag map to pan • Wheel to zoom • Double-click to zoom in</span>
        </div>
      </div>
    </div>
  );
}
