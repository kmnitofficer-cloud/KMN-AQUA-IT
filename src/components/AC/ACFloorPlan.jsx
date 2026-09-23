import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Wind,
  Layers,
  Thermometer,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';

export default function ACFloorPlan({
  floor = 'Ground Floor',
  units = [],
  selectedUnit = null,
  onSelectUnit = () => {},
  blueprintTheme = 'dark', // 'dark' | 'light'
  showAirflow = true
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredUnit, setHoveredUnit] = useState(null);

  const isGround = floor === 'Ground Floor';
  const isDark = blueprintTheme === 'dark';

  // Theme palettes
  const theme = isDark
    ? {
        bg: '#0B132B',
        grid: '#1C2541',
        wall: '#3A506B',
        wallThick: '#4B6584',
        wallFill: 'rgba(30, 41, 59, 0.7)',
        roomFill: 'rgba(15, 23, 42, 0.55)',
        roomFillAlt: 'rgba(20, 30, 55, 0.65)',
        door: '#60A5FA',
        stair: '#475569',
        text: '#94A3B8',
        textBright: '#F1F5F9',
        accent: '#38BDF8'
      }
    : {
        bg: '#F8FAFC',
        grid: '#E2E8F0',
        wall: '#64748B',
        wallThick: '#475569',
        wallFill: 'rgba(226, 232, 240, 0.6)',
        roomFill: 'rgba(255, 255, 255, 0.85)',
        roomFillAlt: 'rgba(241, 245, 249, 0.8)',
        door: '#2563EB',
        stair: '#94A3B8',
        text: '#64748B',
        textBright: '#0F172A',
        accent: '#0284C7'
      };

  const handleZoom = delta => {
    setZoomLevel(prev => Math.min(Math.max(0.7, prev + delta), 1.8));
  };

  const resetZoom = () => setZoomLevel(1);

  const getStatusColor = status => {
    switch (status) {
      case 'Active':
        return '#10B981'; // vibrant emerald
      case 'Needs Service':
        return '#F59E0B'; // amber
      case 'Under Repair':
        return '#EF4444'; // crimson red
      case 'Decommissioned':
      default:
        return '#64748B'; // slate
    }
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
    <div className="relative w-full h-full min-h-[580px] flex flex-col rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl backdrop-blur-xl bg-slate-900/90 select-none">
      {/* Blueprint Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
            {isGround ? 'GF' : '1F'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{isGround ? 'Ground Floor Office Plan' : 'First Floor Office Wing & Executive Suites'}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {units.length} AC Units
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Scale 1:100 • Architectural HVAC Layout • Interactive Node Map
            </p>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Active ({units.filter(u => u.Status === 'Active').length})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Service Due ({units.filter(u => u.Status === 'Needs Service').length})
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              Under Repair ({units.filter(u => u.Status === 'Under Repair').length})
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => handleZoom(0.15)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => handleZoom(-0.15)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Reset View"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#090D16] via-[#0E1726] to-[#0A101D]">
        {/* Animated Background Subtle Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${theme.wall} 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        <div
          className="transition-transform duration-300 ease-out origin-center cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-center p-4"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox="0 0 920 660"
            className="w-full h-full max-h-[640px] drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Glow Filter for Active AC Units */}
              <filter id="glowActive" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glowRepair" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feColorMatrix
                  type="matrix"
                  values="1 0 0 0 1  0 0.2 0 0 0.2  0 0 0.2 0 0.2  0 0 0 1 0"
                />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Linear Gradients */}
              <linearGradient id="groundFloorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="firstFloorHallGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#111C30" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="officeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1A2639" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0D1522" stopOpacity="0.9" />
              </linearGradient>

              {/* Airflow ripple animation */}
              <style>{`
                @keyframes pulseAir {
                  0% { opacity: 0.15; transform: scale(0.95); }
                  50% { opacity: 0.45; transform: scale(1.05); }
                  100% { opacity: 0.15; transform: scale(0.95); }
                }
                @keyframes airflowWave {
                  0% { stroke-dashoffset: 40; }
                  100% { stroke-dashoffset: 0; }
                }
                .air-wave {
                  stroke-dasharray: 6 6;
                  animation: airflowWave 1.8s linear infinite;
                }
                .ac-pulse {
                  animation: pulseAir 3s ease-in-out infinite;
                  transform-origin: center;
                }
              `}</style>
            </defs>

            {/* ======================================================== */}
            {/* GROUND FLOOR BLUEPRINT RENDERING                         */}
            {/* ======================================================== */}
            {isGround && (
              <g id="ground-floor-blueprint">
                {/* Main Ground Floor Outer Boundary */}
                <rect
                  x="140"
                  y="90"
                  width="640"
                  height="480"
                  rx="12"
                  fill="url(#groundFloorGrad)"
                  stroke={theme.wallThick}
                  strokeWidth="6"
                  strokeLinejoin="round"
                />

                {/* Sub-flooring grid tiles */}
                <g opacity="0.18">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line
                      key={`vg-${i}`}
                      x1={140 + (i + 1) * 64}
                      y1="90"
                      x2={140 + (i + 1) * 64}
                      y2="570"
                      stroke={theme.grid}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
                  {Array.from({ length: 6 }).map((_, j) => (
                    <line
                      key={`hg-${j}`}
                      x1="140"
                      y1={90 + (j + 1) * 68}
                      x2="780"
                      y2={90 + (j + 1) * 68}
                      stroke={theme.grid}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  ))}
                </g>

                {/* Interior Partition Wall (matches user drawing line from left door to center) */}
                <path
                  d="M 140 330 L 480 330"
                  stroke={theme.wall}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="480" cy="330" r="5" fill={theme.wallThick} />

                {/* Glass Partition Wall running down to divide front admin vs storage */}
                <line
                  x1="480"
                  y1="330"
                  x2="480"
                  y2="420"
                  stroke={theme.accent}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.6"
                />

                {/* Main Entrance Door on West Wall (with Arrow "↑ up" from user drawing) */}
                <g id="main-entrance">
                  {/* Door Opening Gap */}
                  <line x1="140" y1="360" x2="140" y2="440" stroke="#0B132B" strokeWidth="8" />
                  {/* Door Swing Arc */}
                  <path
                    d="M 140 440 A 80 80 0 0 1 220 360"
                    fill="none"
                    stroke={theme.door}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <line x1="140" y1="360" x2="220" y2="360" stroke={theme.door} strokeWidth="3" />
                  {/* Arrow Indicator: ↑ Main Entrance */}
                  <g transform="translate(90, 400)">
                    <rect x="-10" y="-14" width="54" height="26" rx="6" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
                    <text x="17" y="3" fill="#38BDF8" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                      ↑ IN
                    </text>
                  </g>
                </g>

                {/* Secondary Exit Doors (Bottom & Right) */}
                <g id="exits">
                  {/* Bottom Exit */}
                  <line x1="220" y1="570" x2="280" y2="570" stroke="#0B132B" strokeWidth="8" />
                  <path
                    d="M 220 570 A 60 60 0 0 0 280 510"
                    fill="none"
                    stroke={theme.door}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <text x="250" y="598" fill={theme.text} fontSize="11" fontFamily="sans-serif" textAnchor="middle">
                    Rear Exit ▾
                  </text>

                  {/* East / Right Exit */}
                  <line x1="780" y1="310" x2="780" y2="370" stroke="#0B132B" strokeWidth="8" />
                  <path
                    d="M 780 310 A 60 60 0 0 1 840 370"
                    fill="none"
                    stroke={theme.door}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <text x="815" y="345" fill={theme.text} fontSize="11" fontFamily="sans-serif">
                    Side Door ▸
                  </text>
                </g>

                {/* Room Zones Labels */}
                <g id="ground-room-labels" opacity="0.75">
                  <text x="310" y="210" fill={theme.textBright} fontSize="14" fontWeight="600" textAnchor="middle">
                    Ground Floor Operations Hall
                  </text>
                  <text x="310" y="230" fill={theme.text} fontSize="11" textAnchor="middle">
                    North-West Workstation Bay (4x Clusters)
                  </text>

                  <text x="630" y="210" fill={theme.textBright} fontSize="14" fontWeight="600" textAnchor="middle">
                    Customer Reception & Lounge
                  </text>
                  <text x="630" y="230" fill={theme.text} fontSize="11" textAnchor="middle">
                    North-East Client Greeting Area
                  </text>

                  <text x="310" y="470" fill={theme.textBright} fontSize="14" fontWeight="600" textAnchor="middle">
                    Admin & Records Archive
                  </text>
                  <text x="310" y="490" fill={theme.text} fontSize="11" textAnchor="middle">
                    South-West Enclosure
                  </text>

                  <text x="630" y="470" fill={theme.textBright} fontSize="14" fontWeight="600" textAnchor="middle">
                    General Processing & Dispatch
                  </text>
                  <text x="630" y="490" fill={theme.text} fontSize="11" textAnchor="middle">
                    South-East Terminal Rows
                  </text>
                </g>

                {/* Architectural Desk Cluster Graphics (Subtle visual indication of layout) */}
                <g id="workstations-ground" opacity="0.35">
                  {/* NW Desks */}
                  <rect x="230" y="145" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="230" y="240" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  {/* NE Desks */}
                  <rect x="570" y="145" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="570" y="240" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  {/* SW Desks */}
                  <rect x="230" y="375" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="230" y="470" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  {/* SE Desks */}
                  <rect x="570" y="375" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="570" y="470" width="100" height="42" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                </g>
              </g>
            )}

            {/* ======================================================== */}
            {/* FIRST FLOOR BLUEPRINT RENDERING                          */}
            {/* ======================================================== */}
            {!isGround && (
              <g id="first-floor-blueprint">
                {/* 1. L-Shaped Wing Corridor / Main Hall (Right Side) */}
                {/* Long vertical hall */}
                <rect
                  x="590"
                  y="180"
                  width="190"
                  height="400"
                  rx="10"
                  fill="url(#firstFloorHallGrad)"
                  stroke={theme.wallThick}
                  strokeWidth="5"
                />

                {/* Top Wing connecting corridor & top rooms */}
                <rect
                  x="300"
                  y="60"
                  width="480"
                  height="125"
                  rx="10"
                  fill="url(#officeGrad)"
                  stroke={theme.wallThick}
                  strokeWidth="5"
                />

                {/* Partition dividing Executive Room 2, Executive Room 1, Corner Conf */}
                <line x1="430" y1="60" x2="430" y2="185" stroke={theme.wall} strokeWidth="4" />
                <line x1="590" y1="60" x2="590" y2="185" stroke={theme.wall} strokeWidth="4" />

                {/* 2. 3-Room Block on the Left (from sketch: 3 rooms side by side) */}
                <rect
                  x="110"
                  y="260"
                  width="290"
                  height="190"
                  rx="8"
                  fill="url(#officeGrad)"
                  stroke={theme.wallThick}
                  strokeWidth="5"
                />
                {/* Partition lines for the 3 individual rooms */}
                <line x1="205" y1="260" x2="205" y2="450" stroke={theme.wall} strokeWidth="4" />
                <line x1="300" y1="260" x2="300" y2="450" stroke={theme.wall} strokeWidth="4" />

                {/* Door openings for 3-Room Block */}
                <line x1="140" y1="450" x2="175" y2="450" stroke="#0B132B" strokeWidth="7" />
                <path d="M 140 450 A 35 35 0 0 0 175 415" fill="none" stroke={theme.door} strokeWidth="2" strokeDasharray="3 3" />

                <line x1="235" y1="450" x2="270" y2="450" stroke="#0B132B" strokeWidth="7" />
                <path d="M 235 450 A 35 35 0 0 0 270 415" fill="none" stroke={theme.door} strokeWidth="2" strokeDasharray="3 3" />

                <line x1="330" y1="450" x2="365" y2="450" stroke="#0B132B" strokeWidth="7" />
                <path d="M 330 450 A 35 35 0 0 0 365 415" fill="none" stroke={theme.door} strokeWidth="2" strokeDasharray="3 3" />

                {/* 3. Central Staircase & Corridor Area */}
                {/* Staircase Box (marked with ↓ up and ↙ Down in sketch) */}
                <g id="staircase-block" transform="translate(425, 230)">
                  <rect
                    x="0"
                    y="0"
                    width="145"
                    height="180"
                    rx="8"
                    fill="#151D2F"
                    stroke={theme.wall}
                    strokeWidth="3"
                  />
                  {/* Stair treads */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <line
                      key={`stair-${i}`}
                      x1="12"
                      y1={20 + i * 18}
                      x2="133"
                      y2={20 + i * 18}
                      stroke={theme.stair}
                      strokeWidth="2"
                    />
                  ))}
                  {/* Staircase center handrail */}
                  <line x1="72" y1="12" x2="72" y2="168" stroke="#38BDF8" strokeWidth="2" opacity="0.6" />
                  
                  {/* Directional Arrows matching sketch */}
                  <g transform="translate(35, 95)">
                    <rect x="-8" y="-12" width="38" height="22" rx="4" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                    <text x="11" y="2" fill="#38BDF8" fontSize="9" fontWeight="bold" textAnchor="middle">
                      ↓ UP
                    </text>
                  </g>
                  <g transform="translate(100, 95)">
                    <rect x="-8" y="-12" width="46" height="22" rx="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
                    <text x="15" y="2" fill="#F59E0B" fontSize="9" fontWeight="bold" textAnchor="middle">
                      ↙ DOWN
                    </text>
                  </g>
                  <text x="72" y="172" fill={theme.text} fontSize="10" textAnchor="middle">
                    Main Stairwell
                  </text>
                </g>

                {/* Walking corridor indicator connecting blocks */}
                <path
                  d="M 400 350 L 590 350"
                  stroke={theme.grid}
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />

                {/* First Floor Room Labels */}
                <g id="first-floor-labels">
                  {/* Top Rooms */}
                  <text x="365" y="115" fill={theme.textBright} fontSize="12" fontWeight="bold" textAnchor="middle">
                    Executive 2
                  </text>
                  <text x="365" y="132" fill={theme.text} fontSize="10" textAnchor="middle">
                    Office Suite
                  </text>

                  <text x="510" y="115" fill={theme.textBright} fontSize="12" fontWeight="bold" textAnchor="middle">
                    Executive 1
                  </text>
                  <text x="510" y="132" fill={theme.text} fontSize="10" textAnchor="middle">
                    Director Office
                  </text>

                  <text x="680" y="115" fill={theme.textBright} fontSize="12" fontWeight="bold" textAnchor="middle">
                    Corner Conf.
                  </text>
                  <text x="680" y="132" fill={theme.text} fontSize="10" textAnchor="middle">
                    Meeting Room
                  </text>

                  {/* 3-Room Block Labels */}
                  <text x="157" y="340" fill={theme.textBright} fontSize="11" fontWeight="bold" textAnchor="middle">
                    Accounts
                  </text>
                  <text x="157" y="355" fill={theme.text} fontSize="9" textAnchor="middle">
                    & Audit
                  </text>

                  <text x="252" y="335" fill="#38BDF8" fontSize="11" fontWeight="bold" textAnchor="middle">
                    IT & Server
                  </text>
                  <text x="252" y="350" fill={theme.text} fontSize="9" textAnchor="middle">
                    24/7 Facility
                  </text>

                  <text x="350" y="340" fill={theme.textBright} fontSize="11" fontWeight="bold" textAnchor="middle">
                    Sr. Manager
                  </text>
                  <text x="350" y="355" fill={theme.text} fontSize="9" textAnchor="middle">
                    Office
                  </text>

                  {/* Long East Wing Corridor Labels */}
                  <text x="670" y="280" fill={theme.textBright} fontSize="13" fontWeight="bold" textAnchor="middle">
                    1st Floor Operations
                  </text>
                  <text x="670" y="300" fill={theme.text} fontSize="10" textAnchor="middle">
                    North Workstation Wing
                  </text>

                  <text x="670" y="400" fill={theme.textBright} fontSize="13" fontWeight="bold" textAnchor="middle">
                    Operations Center
                  </text>
                  <text x="670" y="420" fill={theme.text} fontSize="10" textAnchor="middle">
                    Team Desks
                  </text>

                  <text x="670" y="520" fill={theme.textBright} fontSize="13" fontWeight="bold" textAnchor="middle">
                    Operations South
                  </text>
                  <text x="670" y="540" fill={theme.text} fontSize="10" textAnchor="middle">
                    Support Wing
                  </text>
                </g>

                {/* Sub-corridor desk mockups */}
                <g id="workstations-first" opacity="0.3">
                  <rect x="615" y="220" width="85" height="38" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="615" y="340" width="85" height="38" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <rect x="615" y="460" width="85" height="38" rx="4" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                </g>
              </g>
            )}

            {/* ======================================================== */}
            {/* AIRFLOW DISCHARGE RIPPLE ANIMATIONS                      */}
            {/* ======================================================== */}
            {showAirflow && (
              <g id="airflow-discharge">
                {units
                  .filter(u => u.Status === 'Active')
                  .map(unit => {
                    const cx = unit.CoordX;
                    const cy = unit.CoordY;
                    const isTopWall = cy < 200;
                    const isBottomWall = cy > 500;
                    const isEastWall = cx > 700;

                    // Compute discharge direction
                    let dx = 0;
                    let dy = 0;
                    let angle = 90; // blowing downwards default

                    if (isTopWall) {
                      dy = 50;
                      angle = 90;
                    } else if (isBottomWall) {
                      dy = -50;
                      angle = -90;
                    } else if (isEastWall) {
                      dx = -55;
                      angle = 180;
                    } else {
                      dy = 45;
                      angle = 90;
                    }

                    return (
                      <g key={`flow-${unit.UnitID}`} className="pointer-events-none">
                        {/* Cooling Aura */}
                        <circle
                          cx={cx + dx * 0.4}
                          cy={cy + dy * 0.4}
                          r="34"
                          fill="rgba(56, 189, 248, 0.08)"
                          className="ac-pulse"
                        />
                        {/* Dynamic Cooling Breeze Waves */}
                        <path
                          d={`M ${cx - 16} ${cy + (isBottomWall ? -10 : 10)} Q ${cx + dx * 0.5} ${cy + dy * 0.5} ${cx + dx} ${cy + dy}`}
                          fill="none"
                          stroke="rgba(56, 189, 248, 0.45)"
                          strokeWidth="2"
                          className="air-wave"
                        />
                        <path
                          d={`M ${cx + 16} ${cy + (isBottomWall ? -10 : 10)} Q ${cx + dx * 0.5} ${cy + dy * 0.5} ${cx + dx} ${cy + dy + 10}`}
                          fill="none"
                          stroke="rgba(56, 189, 248, 0.3)"
                          strokeWidth="1.5"
                          className="air-wave"
                        />
                      </g>
                    );
                  })}
              </g>
            )}

            {/* ======================================================== */}
            {/* INTERACTIVE AC UNIT MARKERS / NODES                      */}
            {/* ======================================================== */}
            <g id="ac-unit-markers">
              {units.map(unit => {
                const isSelected = selectedUnit && selectedUnit.UnitID === unit.UnitID;
                const isHovered = hoveredUnit && hoveredUnit.UnitID === unit.UnitID;
                const statusColor = getStatusColor(unit.Status);
                const isActive = unit.Status === 'Active';
                const isRepair = unit.Status === 'Under Repair';

                return (
                  <g
                    key={unit.UnitID}
                    transform={`translate(${unit.CoordX}, ${unit.CoordY})`}
                    className="cursor-pointer transition-transform duration-200"
                    onClick={() => onSelectUnit(unit)}
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                  >
                    {/* Selected Target Halo Ring */}
                    {isSelected && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r="32"
                          fill="none"
                          stroke="#38BDF8"
                          strokeWidth="2.5"
                          strokeDasharray="4 3"
                          className="animate-spin"
                          style={{ animationDuration: '6s' }}
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="28"
                          fill="rgba(56, 189, 248, 0.2)"
                        />
                      </g>
                    )}

                    {/* Outer status pulse ring */}
                    {isActive && (
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="none"
                        stroke={statusColor}
                        strokeWidth="1.5"
                        opacity="0.6"
                        className="animate-ping"
                        style={{ animationDuration: '3s' }}
                      />
                    )}

                    {/* Unit Box / Split AC Graphic Body */}
                    <rect
                      x="-24"
                      y="-12"
                      width="48"
                      height="24"
                      rx="6"
                      fill="#0B132B"
                      stroke={isSelected ? '#38BDF8' : statusColor}
                      strokeWidth={isSelected ? 2.5 : 2}
                      filter={isActive ? 'url(#glowActive)' : isRepair ? 'url(#glowRepair)' : undefined}
                    />

                    {/* AC Grille Lines */}
                    <line x1="-16" y1="-4" x2="6" y2="-4" stroke={statusColor} strokeWidth="1.5" opacity="0.6" />
                    <line x1="-16" y1="0" x2="6" y2="0" stroke={statusColor} strokeWidth="1.5" opacity="0.6" />
                    <line x1="-16" y1="4" x2="6" y2="4" stroke={statusColor} strokeWidth="1.5" opacity="0.6" />

                    {/* Status Indicator LED */}
                    <circle
                      cx="14"
                      cy="0"
                      r="3.5"
                      fill={statusColor}
                    />

                    {/* AC Unit Number Pin Pill */}
                    <g transform="translate(0, -22)">
                      <rect
                        x="-16"
                        y="-10"
                        width="32"
                        height="18"
                        rx="9"
                        fill={isSelected ? '#0284C7' : '#1E293B'}
                        stroke={statusColor}
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {unit.UnitNumber || unit.UnitID.slice(-2)}
                      </text>
                    </g>

                    {/* Temperature Pill Tag underneath */}
                    <g transform="translate(0, 24)">
                      <rect
                        x="-20"
                        y="-8"
                        width="40"
                        height="16"
                        rx="8"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke="rgba(148, 163, 184, 0.3)"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="4"
                        fill={isActive ? '#38BDF8' : '#94A3B8'}
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                      >
                        {unit.TargetTemp ? `${unit.TargetTemp}°C` : 'OFF'}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        {hoveredUnit && (
          <div
            className="absolute bottom-5 left-5 max-w-sm p-4 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-md pointer-events-none transition-all z-20 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-cyan-400">
                  {hoveredUnit.UnitCode}
                </span>
                <span className="text-xs text-slate-300 font-semibold">
                  {hoveredUnit.Brand} {hoveredUnit.Model}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(hoveredUnit.Status)}`}>
                {hoveredUnit.Status}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-2 font-medium">
              📍 {hoveredUnit.RoomName}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400">Capacity: </span>
                <span className="text-slate-200 font-semibold">{hoveredUnit.CapacityBTU}</span>
              </div>
              <div>
                <span className="text-slate-400">Target: </span>
                <span className="text-cyan-400 font-bold">{hoveredUnit.TargetTemp}°C</span>
              </div>
              <div>
                <span className="text-slate-400">Purchase: </span>
                <span className="text-emerald-400 font-semibold">
                  LKR {Number(hoveredUnit.PurchasePrice || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Maint. Costs: </span>
                <span className="text-amber-400 font-semibold">
                  LKR {Number(hoveredUnit.lifetimeServiceCost || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {hoveredUnit.Notes && (
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-1 italic">
                "{hoveredUnit.Notes}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Blueprint Footer / Quick Stats Bar */}
      <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>Click any AC pin to view history, log service, or replace machine</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Building: Main Commercial Complex</span>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
