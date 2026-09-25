import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import './ACStyles.css';

export default function ACFloorPlan({
  floor = 'Ground Floor',
  units = [],
  selectedUnit = null,
  onSelectUnit = () => { },
  _showAirflow = true
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredUnit, setHoveredUnit] = useState(null);

  const isGroundFloor = !floor || floor.includes('Ground') || floor.includes('GF');

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

  const getUnitCoordinates = unit => {
    if (isGroundFloor) {
      return { x: unit.CoordX, y: unit.CoordY };
    }
    // 1st Floor mapping
    const mapByCode = {
      '1F-AC-08': { x: 680, y: 88 },  // Main Conference Room
      '1F-AC-09': { x: 210, y: 535 }, // Auditorium West Unit
      '1F-AC-10': { x: 300, y: 535 }, // Auditorium Center Unit
      '1F-AC-11': { x: 390, y: 535 }, // Auditorium East Unit
      '1F-AC-12': { x: 520, y: 535 }, // Nadun's Office
      '1F-AC-13': { x: 660, y: 535 }, // Main Hall West
      '1F-AC-14': { x: 595, y: 315 }, // Middle Connector
      '1F-AC-15': { x: 752, y: 360 }, // Main Hall Center
      '1F-AC-16': { x: 770, y: 535 }  // Main Hall South
    };
    if (unit.UnitCode && mapByCode[unit.UnitCode]) {
      return mapByCode[unit.UnitCode];
    }
    // If unit has coordinates in the removed top-left area (x < 530, y < 310), reposition to 1F slots
    if (unit.CoordX < 530 && unit.CoordY < 310) {
      if (unit.CoordX < 250) return { x: 210, y: 535 };
      if (unit.CoordX < 350) return { x: 300, y: 535 };
      if (unit.CoordX < 450) return { x: 390, y: 535 };
      return { x: 520, y: 535 };
    }
    return { x: unit.CoordX || 700, y: unit.CoordY || 300 };
  };

  const getUnitRoomName = unit => {
    if (!unit) return '';
    if (isGroundFloor) return unit.RoomName;
    const roomMap = {
      '1F-AC-08': 'Main Conference Room',
      '1F-AC-09': 'Main Auditorium (West)',
      '1F-AC-10': 'Main Auditorium (Center)',
      '1F-AC-11': 'Main Auditorium (East)',
      '1F-AC-12': "Nadun's Office",
      '1F-AC-13': '1st Floor Main Hall (West)',
      '1F-AC-14': 'Middle Connector',
      '1F-AC-15': '1st Floor Main Hall (Center)',
      '1F-AC-16': '1st Floor Main Hall (South)'
    };
    return (unit.UnitCode && roomMap[unit.UnitCode]) || unit.RoomName;
  };

  return (
    <div className="komvent-blueprint-card">
      {/* Blueprint Header */}
      <div className="komvent-blueprint-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #00A3FF, #0066FF)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            {isGroundFloor ? 'GF' : '1F'}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {isGroundFloor ? 'Ground Floor' : '1st Floor (Level 1)'}
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {isGroundFloor
                ? 'Kitchen, Washrooms, Hall (with Stairs), Reception (Single Entry), Fish Tank Gallery, Store Room & 3 Offices'
                : 'Auditorium (2 Doors, 3 ACs), Washroom, Nadun\'s Office, Stairs Down & 3 Rooms (Conference, Middle Connector, Main Hall)'}
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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

      {/* Blueprint Canvas */}
      <div className="komvent-blueprint-canvas">
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 0.25s ease-out',
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
            viewBox={isGroundFloor ? '0 0 960 970' : '0 0 960 620'}
            style={{ width: '100%', height: '100%', maxHeight: isGroundFloor ? '630px' : '580px' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Fine architectural CAD grid */}
              <pattern id="komventCadGrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94A3B8" strokeWidth="0.6" opacity="0.18" />
              </pattern>

              {/* Glowing Aura Filter */}
              <filter id="neonHalo" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

            </defs>

            {/* Grid Background */}
            <rect width="960" height={isGroundFloor ? 970 : 620} fill="url(#komventCadGrid)" />

            {/* ======================================================== */}
            {/* LEVEL 1: 1ST FLOOR DRAWING                               */}
            {/* Auditorium (2 doors, 3 ACs), Nadun's Office, Washroom,   */}
            {/* Corridor, Stairs & 3 Rooms (Conference, Middle, Hall)    */}
            {/* ======================================================== */}
            {!isGroundFloor && (
              <g id="blueprint-1st-floor">
                {/* 1. Open Atrium / Cut-out indicator for removed top-left area */}
                <g id="first-floor-open-atrium" opacity="0.5">
                  <rect
                    x="150"
                    y="80"
                    width="360"
                    height="215"
                    rx="8"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.2"
                    strokeDasharray="6 4"
                  />
                  <text x="330" y="175" fill="#64748B" fontSize="11" fontWeight="800" textAnchor="middle" letterSpacing="3">
                    OPEN ATRIUM / TERRACE
                  </text>
                  <text x="330" y="195" fill="#94A3B8" fontSize="8.5" fontWeight="600" textAnchor="middle">
                    Open To Ground Operations Hall Below
                  </text>
                </g>

                {/* 2. Outer Building Double Walls for 1st Floor */}
                <path
                  d="
                    M 525 70 
                    L 860 70 
                    L 860 560 
                    L 140 560 
                    L 140 310 
                    L 525 310 
                    Z
                  "
                  fill="rgba(241, 245, 249, 0.4)"
                  stroke="#334155"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />

                <path
                  d="
                    M 533 78 
                    L 852 78 
                    L 852 552 
                    L 148 552 
                    L 148 318 
                    L 533 318 
                    Z
                  "
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* 3. Outer Windows */}
                {/* Window at North of Vertical Corridor */}
                <line x1="535" y1="70" x2="570" y2="70" stroke="#00A3FF" strokeWidth="3" />
                {/* Windows along Horizontal Corridor (facing the open atrium) */}
                <line x1="260" y1="310" x2="330" y2="310" stroke="#00A3FF" strokeWidth="2.5" />
                <line x1="390" y1="310" x2="470" y2="310" stroke="#00A3FF" strokeWidth="2.5" />
                {/* Window along North of Conference Room */}
                <line x1="620" y1="70" x2="650" y2="70" stroke="#00A3FF" strokeWidth="2.5" />
                <line x1="720" y1="70" x2="810" y2="70" stroke="#00A3FF" strokeWidth="2.5" />
                {/* Window along East wall of Conference Room */}
                <line x1="860" y1="120" x2="860" y2="210" stroke="#00A3FF" strokeWidth="2.5" />

                {/* 4. Partitions Between Rooms */}
                {/* Vertical partition between Vertical Corridor and Conference Room (x = 580, y = 70 to 270) */}
                <line x1="580" y1="70" x2="580" y2="140" stroke="#334155" strokeWidth="3.5" />
                <line x1="580" y1="185" x2="580" y2="270" stroke="#334155" strokeWidth="3.5" />

                {/* Horizontal partition dividing Conference Room and Middle Connector (y = 270, x = 580 to 860) */}
                <line x1="580" y1="270" x2="860" y2="270" stroke="#334155" strokeWidth="3.5" />

                {/* Partition dividing Middle Connector from Corridor & Main Hall */}
                {/* West wall of Middle Connector (x = 580, y = 270 to 365) */}
                <line x1="580" y1="270" x2="580" y2="310" stroke="#334155" strokeWidth="3.5" />
                <line x1="580" y1="355" x2="580" y2="365" stroke="#334155" strokeWidth="3.5" />
                {/* South wall of Middle Connector (y = 365, x = 580 to 860) */}
                <line x1="580" y1="365" x2="700" y2="365" stroke="#334155" strokeWidth="3.5" />
                <line x1="745" y1="365" x2="860" y2="365" stroke="#334155" strokeWidth="3.5" />

                {/* Partition dividing Horizontal Corridor from Auditorium & Nadun's Office (y = 365, x = 140 to 580) */}
                <line x1="140" y1="365" x2="210" y2="365" stroke="#334155" strokeWidth="3.5" />
                <line x1="255" y1="365" x2="345" y2="365" stroke="#334155" strokeWidth="3.5" />
                <line x1="390" y1="365" x2="500" y2="365" stroke="#334155" strokeWidth="3.5" />
                <line x1="545" y1="365" x2="580" y2="365" stroke="#334155" strokeWidth="3.5" />

                {/* Partition dividing Washroom from Horizontal Corridor (x = 210, y = 310 to 365) */}
                <line x1="210" y1="310" x2="210" y2="320" stroke="#334155" strokeWidth="3.5" />
                <line x1="210" y1="355" x2="210" y2="365" stroke="#334155" strokeWidth="3.5" />

                {/* Partition dividing Auditorium and Nadun's Office (x = 460, y = 365 to 560) */}
                <line x1="460" y1="365" x2="460" y2="435" stroke="#334155" strokeWidth="3.5" />
                <line x1="460" y1="480" x2="460" y2="560" stroke="#334155" strokeWidth="3.5" />

                {/* Partition dividing Nadun's Office from Stairs (x = 580, y = 365 to 560) */}
                <line x1="580" y1="365" x2="580" y2="560" stroke="#334155" strokeWidth="3.5" />

                {/* 5. Doors and Entryways */}
                {/* Door: Vertical Corridor to Main Conference Room */}
                <line x1="580" y1="140" x2="580" y2="185" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 580 185 A 45 45 0 0 0 625 140" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Double Door: Conference Room to Middle Connector */}
                <g transform="translate(710, 270)">
                  <line x1="-36" y1="0" x2="36" y2="0" stroke="#FFFFFF" strokeWidth="6" />
                  <path d="M -36 0 A 36 36 0 0 1 0 -36" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path d="M 36 0 A 36 36 0 0 0 0 -36" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="-20" y="16" fill="#00A3FF" fontSize="10" fontWeight="800">D</text>
                  <text x="10" y="16" fill="#00A3FF" fontSize="10" fontWeight="800">D</text>
                </g>

                {/* Door: Vertical Corridor to Middle Connector */}
                <line x1="580" y1="310" x2="580" y2="355" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 580 355 A 45 45 0 0 0 625 310" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Door: Middle Connector to 1st Floor Main Hall */}
                <line x1="700" y1="365" x2="745" y2="365" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 700 365 A 45 45 0 0 1 745 320" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Door: Horizontal Corridor into Washroom */}
                <line x1="210" y1="320" x2="210" y2="355" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M 210 355 A 35 35 0 0 1 175 320" fill="none" stroke="#00A3FF" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="210" y1="355" x2="175" y2="320" stroke="#00A3FF" strokeWidth="1.5" />

                {/* Door 1: Corridor into Auditorium (West Door) */}
                <line x1="210" y1="365" x2="255" y2="365" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 210 365 A 45 45 0 0 0 255 410" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="210" y1="365" x2="255" y2="410" stroke="#00A3FF" strokeWidth="1.8" />
                <text x="232" y="380" fill="#00A3FF" fontSize="8.5" fontWeight="800" textAnchor="middle">D1</text>

                {/* Door 2: Corridor into Auditorium (East Door) */}
                <line x1="345" y1="365" x2="390" y2="365" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 345 365 A 45 45 0 0 0 390 410" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="345" y1="365" x2="390" y2="410" stroke="#00A3FF" strokeWidth="1.8" />
                <text x="367" y="380" fill="#00A3FF" fontSize="8.5" fontWeight="800" textAnchor="middle">D2</text>

                {/* Door: Auditorium to Nadun's Office (Connecting Door) */}
                <line x1="460" y1="435" x2="460" y2="480" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 460 480 A 45 45 0 0 1 505 435" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="460" y1="480" x2="505" y2="435" stroke="#00A3FF" strokeWidth="1.8" />

                {/* Door: Corridor into Nadun's Office */}
                <line x1="500" y1="365" x2="545" y2="365" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 500 365 A 45 45 0 0 0 545 410" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="500" y1="365" x2="545" y2="410" stroke="#00A3FF" strokeWidth="1.8" />

                {/* 6. Corridors with Floor Tiles & Flow Paths */}
                {/* Vertical Corridor Floor Tiles */}
                {[105, 140, 175, 210, 245, 280].map(y => (
                  <line key={`vct-${y}`} x1="528" y1={y} x2="577" y2={y} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                ))}
                {/* Horizontal Corridor Floor Tiles */}
                {[255, 300, 345, 390, 435, 480].map(x => (
                  <line key={`hct-${x}`} x1={x} y1="313" x2={x} y2="362" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                ))}
                {/* Directional Corridor Path */}
                <path
                  d="M 552 85 L 552 337 L 225 337"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  opacity="0.85"
                />
                {[552].map(x => [100, 140, 180, 220, 260, 300].map(y => (
                  <circle key={`cp-v-${y}`} cx={x} cy={y} r="2.5" fill="#EF4444" opacity="0.9" />
                )))}
                {[520, 475, 430, 385, 340, 295, 250].map(x => (
                  <circle key={`cp-h-${x}`} cx={x} cy="337" r="2.5" fill="#EF4444" opacity="0.9" />
                ))}
                {/* Corridor Labels */}
                <g transform="translate(562, 210) rotate(90)">
                  <text x="0" y="0" fill="#EF4444" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="3">
                    CORRIDOR
                  </text>
                </g>
                <text x="360" y="332" fill="#EF4444" fontSize="9" fontWeight="800" textAnchor="middle" letterSpacing="4">
                  CORRIDOR
                </text>

                {/* 7. Washroom Interior */}
                <g id="washroom-interior">
                  {/* WC toilet bowl & tank */}
                  <rect x="146" y="316" width="10" height="18" rx="2" fill="rgba(241, 245, 249, 0.85)" stroke="#64748B" strokeWidth="1" />
                  <ellipse cx="164" cy="325" rx="7" ry="6" fill="rgba(241, 245, 249, 0.85)" stroke="#64748B" strokeWidth="1" />
                  {/* Vanity basin */}
                  <rect x="146" y="342" width="22" height="15" rx="3" fill="rgba(14, 165, 233, 0.15)" stroke="#00A3FF" strokeWidth="1.2" />
                  <circle cx="157" cy="349.5" r="3.5" fill="#FFFFFF" stroke="#00A3FF" strokeWidth="0.8" />
                  <text x="180" y="337" fill="var(--text-primary)" fontSize="9.5" fontWeight="800" textAnchor="middle">
                    Washroom
                  </text>
                  <text x="180" y="348" fill="var(--text-muted)" fontSize="7" fontWeight="600" textAnchor="middle">
                    Restroom
                  </text>
                </g>

                {/* 8. Main Auditorium Interior Architecture */}
                <g id="auditorium-interior">
                  {/* Presentation Stage / Podium */}
                  <rect x="250" y="375" width="100" height="22" rx="4" fill="rgba(0, 163, 255, 0.12)" stroke="#00A3FF" strokeWidth="1.4" strokeDasharray="3 2" />
                  <text x="300" y="389" fill="#00A3FF" fontSize="8" fontWeight="800" textAnchor="middle">
                    STAGE / PRESENTATION SCREEN
                  </text>

                  {/* Auditorium Tiered Seating Rows */}
                  {/* Row 1 */}
                  <g transform="translate(170, 420)">
                    <rect x="0" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[21, 42, 63, 84].map(sx => (
                      <line key={`r1l-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                    <rect x="155" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[176, 197, 218, 239].map(sx => (
                      <line key={`r1r-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                  </g>

                  {/* Row 2 */}
                  <g transform="translate(170, 452)">
                    <rect x="0" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[21, 42, 63, 84].map(sx => (
                      <line key={`r2l-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                    <rect x="155" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[176, 197, 218, 239].map(sx => (
                      <line key={`r2r-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                  </g>

                  {/* Row 3 */}
                  <g transform="translate(170, 484)">
                    <rect x="0" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[21, 42, 63, 84].map(sx => (
                      <line key={`r3l-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                    <rect x="155" y="0" width="105" height="14" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                    {[176, 197, 218, 239].map(sx => (
                      <line key={`r3r-${sx}`} x1={sx} y1="0" x2={sx} y2="14" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 1" />
                    ))}
                  </g>

                  <text x="300" y="458" fill="#64748B" fontSize="7.5" fontWeight="700" textAnchor="middle" letterSpacing="1">
                    AISLE
                  </text>
                </g>

                {/* 9. Nadun's Office Interior Furniture */}
                <g id="naduns-office-furniture">
                  {/* Executive L-shaped Desk */}
                  <rect x="478" y="455" width="68" height="24" rx="3" fill="rgba(148, 163, 184, 0.25)" stroke="#64748B" strokeWidth="1.4" />
                  <rect x="526" y="479" width="20" height="20" rx="2" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                  {/* Laptop screen */}
                  <rect x="495" y="460" width="18" height="8" rx="1.5" fill="#38BDF8" opacity="0.8" />
                  {/* Executive high-back chair */}
                  <circle cx="505" cy="495" r="8" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                  {/* Visitor consultation chairs */}
                  <circle cx="492" cy="436" r="6" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                  <circle cx="525" cy="436" r="6" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                  {/* Document Storage Credenza */}
                  <rect x="558" y="465" width="14" height="45" rx="2" fill="rgba(148, 163, 184, 0.18)" stroke="#94A3B8" strokeWidth="1" />
                  <text x="565" y="490" fill="var(--text-muted)" fontSize="6" fontWeight="700" textAnchor="middle">FILES</text>
                </g>

                {/* 10. Main Conference Room Furniture */}
                <g id="conference-furniture">
                  <rect x="635" y="130" width="130" height="52" rx="20" fill="rgba(148, 163, 184, 0.22)" stroke="#64748B" strokeWidth="1.4" />
                  <rect x="660" y="148" width="80" height="16" rx="4" fill="rgba(0, 163, 255, 0.1)" stroke="#00A3FF" strokeWidth="1" strokeDasharray="3 2" />
                  {/* Chairs */}
                  {[650, 680, 710, 740].map(cx => (
                    <circle key={`cf-top-${cx}`} cx={cx} cy="115" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  ))}
                  {[650, 680, 710, 740].map(cx => (
                    <circle key={`cf-bot-${cx}`} cx={cx} cy="197" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  ))}
                  <circle cx="620" cy="156" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  <circle cx="780" cy="156" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  {/* Presentation screen */}
                  <rect x="852" y="135" width="5" height="42" rx="1.5" fill="#00A3FF" opacity="0.8" />
                </g>

                {/* 11. Main Hall Workstations */}
                <g id="main-hall-workstations">
                  <rect x="690" y="445" width="125" height="26" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                  <line x1="752" y1="445" x2="752" y2="471" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="721" cy="485" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  <circle cx="783" cy="485" r="6.5" fill="rgba(100, 116, 139, 0.25)" stroke="#64748B" strokeWidth="1" />
                  <rect x="710" y="450" width="22" height="8" rx="1.5" fill="#38BDF8" opacity="0.6" />
                  <rect x="772" y="450" width="22" height="8" rx="1.5" fill="#38BDF8" opacity="0.6" />
                </g>

                {/* 12. Stairwell Down */}
                <g id="first-floor-stairwell" transform="translate(590, 375)">
                  <rect x="0" y="0" width="80" height="110" fill="rgba(148, 163, 184, 0.15)" stroke="#94A3B8" strokeWidth="1.5" />
                  {[18, 36, 54, 72, 90].map(y => (
                    <line key={y} x1="0" y1={y} x2="80" y2={y} stroke="#94A3B8" strokeWidth="1.2" />
                  ))}
                  <g transform="translate(40, 55)">
                    <line x1="0" y1="-20" x2="0" y2="20" stroke="#F59E0B" strokeWidth="2.5" />
                    <polyline points="-6,12 0,20 6,12" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
                  </g>
                  <text x="40" y="104" fill="#64748B" fontSize="8" fontWeight="800" textAnchor="middle">
                    STAIRS DOWN
                  </text>
                </g>

                {/* 13. Physical AC Wall Mount Boxes */}
                {/* Main Conference Room: North Wall */}
                <rect x="660" y="72" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                {/* Middle Connector: West Wall */}
                <rect x="582" y="295" width="12" height="40" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                {/* Auditorium 3 AC units: South Wall (West, Center, East) */}
                <rect x="190" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                <rect x="280" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                <rect x="370" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                {/* Nadun's Office: South Wall */}
                <rect x="500" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                {/* Main Hall: South Wall (West & East units) */}
                <rect x="640" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                <rect x="750" y="546" width="40" height="12" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />
                {/* Main Hall: East Center Wall */}
                <rect x="844" y="440" width="12" height="40" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1" rx="2" />

                {/* 14. Room Labels */}
                {/* Main Conference Room */}
                <text x="700" y="152" fill="var(--text-primary)" fontSize="13.5" fontWeight="800" textAnchor="middle">
                  Main Conference Room
                </text>
                <text x="700" y="168" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">
                  Boardroom & AV Meetings
                </text>

                {/* Middle Connector */}
                <text x="715" y="325" fill="var(--text-primary)" fontSize="12" fontWeight="800" textAnchor="middle">
                  Middle Connector
                </text>

                {/* Level 1 Badge in Middle Connector */}
                <g transform="translate(800, 318)">
                  <circle cx="0" cy="0" r="16" fill="rgba(0, 163, 255, 0.1)" stroke="#00A3FF" strokeWidth="1.5" />
                  <text x="0" y="5" fill="#00A3FF" fontSize="13" fontWeight="800" textAnchor="middle">1</text>
                  <text x="0" y="24" fill="var(--text-muted)" fontSize="9" fontWeight="700" textAnchor="middle">1st Floor</text>
                </g>

                {/* 1st Floor Main Hall */}
                <text x="760" y="405" fill="var(--text-primary)" fontSize="13" fontWeight="800" textAnchor="middle">
                  1st Floor Main Hall
                </text>
                <text x="760" y="421" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">
                  Operations & Staging
                </text>

                {/* Main Auditorium */}
                <text x="300" y="515" fill="var(--text-primary)" fontSize="13.5" fontWeight="800" textAnchor="middle">
                  Main Auditorium
                </text>
                <text x="300" y="530" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">
                  Conference & Events • 2 Doors • 3 AC Units
                </text>

                {/* Nadun's Office */}
                <text x="520" y="515" fill="var(--text-primary)" fontSize="12.5" fontWeight="800" textAnchor="middle">
                  Nadun's Office
                </text>
                <text x="520" y="530" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="middle">
                  Executive Suite
                </text>
              </g>
            )}

            {/* ======================================================== */}
            {/* ======================================================== */}
            {/* GROUND FLOOR: COMPLETE INTEGRATED PLAN                   */}
            {/* Kitchen, Washrooms, Hall, Reception, Right Wing          */}
            {/* (Fish Tank Gallery & Store Room), Stairs, Boss Washroom, */}
            {/* Corridor & 3 Lower Offices (Boss, HR, Other)             */}
            {/* ======================================================== */}
            {isGroundFloor && (
              <g id="blueprint-ground-floor">
                {/* 1. Outer Building Double Walls */}
                <path
                  d="
                    M 180 60 
                    L 550 60 
                    L 550 170 
                    L 905 170 
                    L 905 570 
                    L 525 570 
                    L 525 920 
                    L 180 920 
                    Z
                  "
                  fill="rgba(241, 245, 249, 0.4)"
                  stroke="#334155"
                  strokeWidth="4.5"
                  strokeLinejoin="round"
                />
                <path
                  d="
                    M 188 68 
                    L 542 68 
                    L 542 178 
                    L 897 178 
                    L 897 562 
                    L 517 562 
                    L 517 912 
                    L 188 912 
                    Z
                  "
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="1.5"
                  opacity="0.5"
                />

                {/* 2. Top Section Partition (Kitchen & Upper Washroom) */}
                <line x1="180" y1="170" x2="430" y2="170" stroke="#334155" strokeWidth="3.5" />
                <line x1="490" y1="170" x2="550" y2="170" stroke="#334155" strokeWidth="3.5" />

                {/* Arched Double Doorway Opening into Main Hall */}
                <g transform="translate(460, 170)">
                  <path d="M -30 0 C -30 35, 30 35, 30 0" fill="none" stroke="#00A3FF" strokeWidth="2" strokeDasharray="3 2" />
                  <line x1="-30" y1="0" x2="-5" y2="24" stroke="#00A3FF" strokeWidth="1.8" />
                  <line x1="30" y1="0" x2="5" y2="24" stroke="#00A3FF" strokeWidth="1.8" />
                </g>

                {/* Partition dividing Kitchen and General Washroom */}
                <line x1="365" y1="60" x2="365" y2="170" stroke="#334155" strokeWidth="3" strokeDasharray="8 4" />

                {/* 3. Reception Section (Middle: x = 480 to 750, y = 350 to 520) */}
                {/* West wall of Reception (stops at y = 520 to allow horizontal corridor) */}
                <line x1="480" y1="350" x2="480" y2="520" stroke="#334155" strokeWidth="3.5" />

                {/* North partition / Reception counter */}
                <line x1="480" y1="350" x2="550" y2="350" stroke="#334155" strokeWidth="3.5" />
                <line x1="680" y1="350" x2="750" y2="350" stroke="#334155" strokeWidth="3.5" />
                {/* Reception Counter Opening */}
                <path
                  d="M 550 350 Q 615 365 680 350"
                  fill="none"
                  stroke="#00A3FF"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <text x="615" y="342" fill="#00A3FF" fontSize="9.5" fontWeight="800" textAnchor="middle">
                  COUNTER
                </text>

                {/* South Wall of Reception with Arched Doorway (y = 520, x = 480 to 750) */}
                <line x1="480" y1="520" x2="595" y2="520" stroke="#334155" strokeWidth="3.5" />
                <line x1="645" y1="520" x2="750" y2="520" stroke="#334155" strokeWidth="3.5" />

                {/* Reception Entrance Door Opening into Reception */}
                <line x1="595" y1="520" x2="645" y2="520" stroke="#FFFFFF" strokeWidth="5" />
                <g transform="translate(620, 520)">
                  <path d="M -25 0 C -25 -28, 25 -28, 25 0" fill="none" stroke="#00A3FF" strokeWidth="2" strokeDasharray="3 2" />
                  <line x1="-25" y1="0" x2="-8" y2="-20" stroke="#00A3FF" strokeWidth="1.8" />
                  <line x1="25" y1="0" x2="8" y2="-20" stroke="#00A3FF" strokeWidth="1.8" />
                </g>

                {/* Reception Desk */}
                <g transform="translate(565, 390)">
                  <rect x="0" y="0" width="105" height="26" rx="4" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.4" />
                  <circle cx="52" cy="40" r="8" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                </g>

                {/* 4. RIGHT SIDE WING: STORE ROOM & FISH TANK GALLERY */}
                {/* West dividing wall of Store Room with Corridor Doorway */}
                <line x1="750" y1="170" x2="750" y2="525" stroke="#334155" strokeWidth="3.5" />
                {/* Store Room Door Opening from Horizontal Corridor */}
                <line x1="750" y1="525" x2="750" y2="565" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M 750 565 A 40 40 0 0 1 790 525" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="750" y1="565" x2="780" y2="535" stroke="#00A3FF" strokeWidth="1.8" />
                <line x1="750" y1="565" x2="750" y2="570" stroke="#334155" strokeWidth="3.5" />

                {/* Horizontal partition dividing Fish Tank Gallery and Hall */}
                <line x1="299" y1="515" x2="480" y2="515" stroke="#334155" strokeWidth="3.5" />

                {/* --- A. FISH TANK GALLERY --- */}
                <g id="ground-fish-tanks">
                  <rect x="335" y="510" width="126" height="52" rx="4" fill="rgba(14, 165, 233, 0.28)" stroke="#00A3FF" strokeWidth="2" />
                  <text x="398" y="534" fill="#00A3FF" fontSize="9.5" fontWeight="800" textAnchor="middle">
                    🐠 FISH TANK GALLERY
                  </text>
                  <text x="398" y="549" fill="var(--text-muted)" fontSize="7.5" fontWeight="600" textAnchor="middle">
                    Aquarium Display Racks
                  </text>
                </g>

                {/* --- B. STORE ROOM (Lower Right: x = 750 to 905, y = 445 to 570) --- */}
                <g id="right-wing-store-room">
                  {/* Store Room Labels */}
                  <text x="830" y="495" fill="var(--text-primary)" fontSize="10.5" fontWeight="800" textAnchor="middle">
                    📦 STORE ROOM
                  </text>
                  <text x="830" y="512" fill="var(--text-muted)" fontSize="7.5" fontWeight="600" textAnchor="middle">
                    IT & Utility Storage
                  </text>

                  {/* Store Room Bottom Outer Door */}
                  <line x1="790" y1="570" x2="850" y2="570" stroke="#00A3FF" strokeWidth="6" />
                  <path d="M 790 570 A 60 60 0 0 1 850 510" fill="none" stroke="#00A3FF" strokeWidth="2" strokeDasharray="3 2" />
                  <line x1="790" y1="570" x2="850" y2="510" stroke="#00A3FF" strokeWidth="2" />
                  <text x="820" y="588" fill="#00A3FF" fontSize="9" fontWeight="800" textAnchor="middle">
                    ▲ DOOR
                  </text>
                </g>

                {/* Main Front Entrance Door on Bottom Wall into Corridor */}
                <line x1="590" y1="570" x2="650" y2="570" stroke="#FFFFFF" strokeWidth="6" />
                <path d="M 590 570 A 50 50 0 0 1 635 528" fill="none" stroke="#00A3FF" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="590" y1="570" x2="635" y2="528" stroke="#00A3FF" strokeWidth="2" />
                <text x="620" y="590" fill="#00A3FF" fontSize="9" fontWeight="800" textAnchor="middle">
                  ▲ MAIN ENTRANCE
                </text>

                {/* 5. STAIRS INSIDE GROUND OPERATIONS HALL (x = 180 to 300, y = 450 to 515) */}
                <g id="ground-hall-stairs">
                  <rect x="180" y="450" width="120" height="65" fill="rgba(148, 163, 184, 0.15)" stroke="#64748B" strokeWidth="1.5" />
                  {/* Vertical Stair Treads inside Ground Operations Hall */}
                  {[195, 210, 225, 240, 255, 270, 285].map(x => (
                    <line key={x} x1={x} y1="450" x2={x} y2="515" stroke="#64748B" strokeWidth="1.5" />
                  ))}
                  <g transform="translate(240, 482)">
                    <line x1="0" y1="15" x2="0" y2="-15" stroke="#F59E0B" strokeWidth="2.2" />
                    <polyline points="-5,-7 0,-15 5,-7" fill="none" stroke="#F59E0B" strokeWidth="2.2" />
                  </g>
                  <text x="240" y="506" fill="#64748B" fontSize="8" fontWeight="800" textAnchor="middle">
                    ▲ STAIRS UP
                  </text>
                </g>

                {/* 6. BOSS PRIVATE WASHROOM (Directly below Stairs, above Boss Office: x = 180 to 300, y = 515 to 570) */}
                {/* Horizontal wall dividing Ground Operations Hall / Stairs from Boss Washroom */}
                <line x1="180" y1="515" x2="300" y2="515" stroke="#334155" strokeWidth="3.5" />
                {/* Vertical wall dividing Boss Washroom from Corridor */}
                <line x1="300" y1="515" x2="300" y2="570" stroke="#334155" strokeWidth="3.5" />

                <g id="ground-boss-washroom">
                  <rect x="180" y="515" width="120" height="55" fill="rgba(6, 182, 212, 0.12)" stroke="#334155" strokeWidth="1.5" />

                  {/* Commode / Toilet Fixture */}
                  <g transform="translate(275, 538)">
                    <rect x="-7" y="-10" width="14" height="6" rx="2" fill="rgba(148, 163, 184, 0.4)" stroke="#64748B" strokeWidth="1" />
                    <ellipse cx="0" cy="3" rx="6" ry="8" fill="rgba(241, 245, 249, 0.8)" stroke="#64748B" strokeWidth="1.2" />
                  </g>

                  {/* Wash Basin / Sink */}
                  <g transform="translate(205, 538)">
                    <rect x="-7" y="-9" width="14" height="10" rx="3" fill="rgba(241, 245, 249, 0.8)" stroke="#64748B" strokeWidth="1.2" />
                    <circle cx="0" cy="-3" r="1.8" fill="#00A3FF" />
                  </g>

                  {/* Labels */}
                  <text x="240" y="536" fill="#00A3FF" fontSize="8.5" fontWeight="800" textAnchor="middle">
                    🚽 BOSS WASHROOM
                  </text>
                  <text x="240" y="549" fill="var(--text-muted)" fontSize="7" fontWeight="600" textAnchor="middle">
                    Private Restroom
                  </text>

                  {/* Private Door connecting down into Boss Office on y = 570 */}
                  <line x1="220" y1="570" x2="265" y2="570" stroke="#FFFFFF" strokeWidth="5" />
                  <path d="M 220 570 A 45 45 0 0 1 265 615" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                  <line x1="220" y1="570" x2="265" y2="615" stroke="#00A3FF" strokeWidth="1.8" />
                </g>

                {/* Wall dividing upper level from Boss Office (y = 570, x = 180 to 470) */}
                <line x1="180" y1="570" x2="220" y2="570" stroke="#334155" strokeWidth="4.5" />
                <line x1="265" y1="570" x2="470" y2="570" stroke="#334155" strokeWidth="4.5" />

                {/* 7. CORRIDOR PATHWAY (Seamless L-shaped corridor connecting Main Entrance, Reception, Store Room & Offices) */}
                <g id="ground-corridor">
                  {/* Horizontal Corridor Under Reception (x = 470 to 750, y = 520 to 570) */}
                  <rect x="470" y="520" width="280" height="50" fill="rgba(0, 163, 255, 0.05)" />
                  {/* Hallway connection between Ground Operations Hall and vertical corridor */}
                  <rect x="300" y="515" width="170" height="55" fill="rgba(0, 163, 255, 0.04)" />
                  {/* Vertical Corridor Fill (x = 470 to 525, y = 570 to 920) */}
                  <rect x="470" y="570" width="55" height="350" fill="rgba(0, 163, 255, 0.05)" />

                  {/* Subtle Floor Tile Grid in Horizontal Corridor */}
                  {[520, 570, 620, 670, 720].map(x => (
                    <line key={`th-${x}`} x1={x} y1="522" x2={x} y2="568" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                  ))}

                  {/* Subtle Floor Tile Grid in Vertical Corridor */}
                  {[620, 670, 720, 770, 820, 870].map(y => (
                    <line key={`tv-${y}`} x1="472" y1={y} x2="523" y2={y} stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.35" />
                  ))}

                  {/* Pathway Directional Flow from Store Room Door past Main Entrance & Reception to 3 Offices */}
                  <path
                    d="M 740 545 L 498 545 L 498 905"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                    opacity="0.9"
                  />
                  <polyline points="494,900 498,908 502,900" fill="none" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Distinct Red Waypoint Dots matching user markup */}
                  {[735, 705, 675, 645, 615, 585, 555, 525, 498].map(x => (
                    <circle key={`dot-h-${x}`} cx={x} cy="545" r="2.8" fill="#EF4444" opacity="0.95" />
                  ))}
                  {[575, 610, 645, 680, 715, 750, 785, 820, 855, 890].map(y => (
                    <circle key={`dot-v-${y}`} cx="498" cy={y} r="2.8" fill="#EF4444" opacity="0.95" />
                  ))}

                  {/* Corridor Label */}
                  <g transform="translate(509, 745) rotate(90)">
                    <text x="0" y="0" fill="#EF4444" fontSize="9.5" fontWeight="800" textAnchor="middle" letterSpacing="4">
                      CORRIDOR
                    </text>
                  </g>
                </g>

                {/* Wall dividing the 3 offices from Corridor (x = 470, y = 570 to 920) */}
                <line x1="470" y1="570" x2="470" y2="595" stroke="#334155" strokeWidth="3.5" />
                <line x1="470" y1="640" x2="470" y2="710" stroke="#334155" strokeWidth="3.5" />
                <line x1="470" y1="755" x2="470" y2="860" stroke="#334155" strokeWidth="3.5" />
                <line x1="470" y1="905" x2="470" y2="920" stroke="#334155" strokeWidth="3.5" />

                {/* Door: Corridor to Boss Office */}
                <line x1="470" y1="595" x2="470" y2="640" stroke="#334155" strokeWidth="5" />


                {/* Door: Corridor to HR Office */}
                <line x1="470" y1="710" x2="470" y2="755" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M 470 755 A 45 45 0 0 1 425 710" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="470" y1="755" x2="425" y2="710" stroke="#00A3FF" strokeWidth="1.8" />

                {/* Door: Corridor to Other Office (Drawn with door swing by user at bottom right) */}
                <line x1="470" y1="860" x2="470" y2="905" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M 470 905 A 45 45 0 0 1 425 860" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="470" y1="905" x2="425" y2="860" stroke="#00A3FF" strokeWidth="1.8" />

                {/* 7. Partitions Between the 3 Lower Offices */}
                {/* Partition between Boss Office & HR Office at y = 685 */}
                <line x1="180" y1="685" x2="295" y2="685" stroke="#334155" strokeWidth="3.5" />
                <line x1="345" y1="685" x2="470" y2="685" stroke="#334155" strokeWidth="3.5" />
                {/* Inter-office Connecting Doorway between Boss & HR */}
                <line x1="295" y1="685" x2="345" y2="685" stroke="#FFFFFF" strokeWidth="5" />
                <path d="M 295 685 A 50 50 0 0 1 345 635" fill="none" stroke="#00A3FF" strokeWidth="1.8" strokeDasharray="3 2" />
                <line x1="295" y1="685" x2="345" y2="635" stroke="#00A3FF" strokeWidth="1.8" />

                {/* Partition between HR Office & Other Office at y = 800 */}
                <line x1="180" y1="800" x2="470" y2="800" stroke="#334155" strokeWidth="3.5" />

                {/* 8. Workstations and Office Furniture */}
                {/* Operations Hall Desks */}
                <g transform="translate(490, 200)">
                  <rect x="0" y="0" width="140" height="26" rx="4" fill="rgba(148, 163, 184, 0.25)" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="45" y1="0" x2="45" y2="26" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="95" y1="0" x2="95" y2="26" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="70" y="16" fill="var(--text-muted)" fontSize="8.5" fontWeight="700" textAnchor="middle">Workstation Desk</text>
                </g>

                <g transform="translate(295, 230)">
                  <rect x="0" y="0" width="26" height="110" rx="4" fill="rgba(148, 163, 184, 0.25)" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="0" y1="55" x2="26" y2="55" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                <g transform="translate(310, 365)">
                  <rect x="0" y="0" width="140" height="26" rx="4" fill="rgba(148, 163, 184, 0.25)" stroke="#64748B" strokeWidth="1.5" />
                  <line x1="45" y1="0" x2="45" y2="26" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="95" y1="0" x2="95" y2="26" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="70" y="16" fill="var(--text-muted)" fontSize="8.5" fontWeight="700" textAnchor="middle">Workstation Desk</text>
                </g>

                {/* Boss Office Executive Furniture */}
                <g transform="translate(245, 605)">
                  <rect x="0" y="0" width="115" height="32" rx="4" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.4" />
                  <rect x="0" y="32" width="28" height="22" rx="3" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.2" />
                  <rect x="42" y="8" width="26" height="11" rx="2" fill="#38BDF8" opacity="0.65" />
                  <circle cx="56" cy="50" r="8.5" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                  <circle cx="28" cy="-10" r="6.5" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                  <circle cx="85" cy="-10" r="6.5" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                </g>

                {/* HR Office Consultation Setup */}
                <g transform="translate(245, 720)">
                  <rect x="0" y="0" width="115" height="30" rx="4" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.4" />
                  <circle cx="58" cy="44" r="8" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                  <circle cx="28" cy="-10" r="6.5" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                  <circle cx="85" cy="-10" r="6.5" fill="rgba(100, 116, 139, 0.2)" stroke="#94A3B8" strokeWidth="1" />
                  <rect x="175" y="-30" width="36" height="16" rx="2" fill="rgba(148, 163, 184, 0.18)" stroke="#94A3B8" strokeWidth="1" />
                  <text x="193" y="-19" fill="var(--text-muted)" fontSize="7" fontWeight="700" textAnchor="middle">FILES</text>
                </g>

                {/* Other Office Workstations */}
                <g transform="translate(240, 840)">
                  <rect x="0" y="0" width="125" height="32" rx="4" fill="rgba(148, 163, 184, 0.2)" stroke="#64748B" strokeWidth="1.4" />
                  <line x1="62" y1="0" x2="62" y2="32" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  <circle cx="31" cy="44" r="7.5" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                  <circle cx="93" cy="44" r="7.5" fill="rgba(100, 116, 139, 0.35)" stroke="#64748B" strokeWidth="1.2" />
                  <rect x="18" y="6" width="24" height="10" rx="2" fill="#38BDF8" opacity="0.65" />
                  <rect x="80" y="6" width="24" height="10" rx="2" fill="#38BDF8" opacity="0.65" />
                </g>

                {/* 9. Physical Wall Mount Boxes for AC Units */}
                <rect x="742" y="413" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="742" y="198" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="182" y="228" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="182" y="388" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="182" y="618" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="182" y="738" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />
                <rect x="182" y="858" width="12" height="45" fill="#E2E8F0" stroke="#00A3FF" strokeWidth="1.2" rx="2" />

                {/* 10. Room Labels */}
                {/* Kitchen */}
                <text x="270" y="115" fill="var(--text-primary)" fontSize="13.5" fontWeight="800" textAnchor="middle">
                  Kitchen
                </text>
                <text x="270" y="133" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">
                  Pantry & Break Area
                </text>

                {/* General Washroom */}
                <text x="455" y="115" fill="var(--text-primary)" fontSize="13.5" fontWeight="800" textAnchor="middle">
                  Wash room
                </text>
                <text x="455" y="133" fill="var(--text-muted)" fontSize="9" fontWeight="600" textAnchor="middle">
                  Restroom Facility
                </text>

                {/* Reception */}
                <text x="620" y="445" fill="var(--text-primary)" fontSize="14" fontWeight="800" textAnchor="middle">
                  Reception
                </text>
                <text x="620" y="465" fill="var(--text-muted)" fontSize="9.5" fontWeight="600" textAnchor="middle">
                  Front Lobby & Counter
                </text>

                {/* Ground Operations Hall */}
                <text x="390" y="280" fill="var(--text-primary)" fontSize="14" fontWeight="800" textAnchor="middle">
                  Ground Operations Hall
                </text>
                <text x="390" y="298" fill="var(--text-muted)" fontSize="10" fontWeight="600" textAnchor="middle">
                  Open Plan Workstations
                </text>

                {/* Boss Office */}
                <text x="355" y="598" fill="var(--text-primary)" fontSize="13" fontWeight="800" textAnchor="middle">
                  Boss Office
                </text>
                <text x="355" y="613" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="middle">
                  Executive Suite
                </text>

                {/* HR Office */}
                <text x="355" y="713" fill="var(--text-primary)" fontSize="13" fontWeight="800" textAnchor="middle">
                  HR Office
                </text>
                <text x="355" y="728" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="middle">
                  Human Resources
                </text>

                {/* Other Office */}
                <text x="355" y="828" fill="var(--text-primary)" fontSize="13" fontWeight="800" textAnchor="middle">
                  Other Office
                </text>
                <text x="355" y="843" fill="var(--text-muted)" fontSize="8.5" fontWeight="600" textAnchor="middle">
                  Accounts & Operations
                </text>
              </g>
            )}

            {/* ======================================================== */}
            {/* WALL-MOUNTED CIRCULAR FAN PIN MARKERS                    */}
            {/* ======================================================== */}
            <g id="komvent-wall-fan-pins">
              {units.map(unit => {
                const coords = getUnitCoordinates(unit);
                const isSelected = selectedUnit && selectedUnit.UnitID === unit.UnitID;
                const statusColor = getStatusColor(unit.Status);

                return (
                  <g
                    key={unit.UnitID}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSelectUnit(unit)}
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                  >
                    {/* Static CAD Highlight Target on Selected Pin (No Animation) */}
                    {isSelected && (
                      <g>
                        <circle
                          cx="0"
                          cy="0"
                          r="24"
                          fill="rgba(0, 163, 255, 0.2)"
                          stroke="#00A3FF"
                          strokeWidth="2"
                        />
                        <circle
                          cx="0"
                          cy="0"
                          r="30"
                          fill="none"
                          stroke="#00A3FF"
                          strokeWidth="1.2"
                          strokeDasharray="4 3"
                          opacity="0.8"
                        />
                      </g>
                    )}

                    {/* Circular Dark / Cyan Base Pin */}
                    <circle
                      cx="0"
                      cy="0"
                      r="16"
                      fill={isSelected ? '#0084FF' : '#0F172A'}
                      stroke={isSelected ? '#FFFFFF' : statusColor}
                      strokeWidth={isSelected ? 2.5 : 2}
                    />

                    {/* Clean Static CAD AC Symbol (Stationary, Clean, Crisp) */}
                    <g>
                      <circle cx="0" cy="0" r="3" fill="#FFFFFF" />
                      <path d="M 0 -3 C 2.5 -7, 6 -7, 4 -3 Z" fill="#FFFFFF" opacity="0.95" />
                      <path d="M 3 0 C 7 2.5, 7 6, 3 4 Z" fill="#FFFFFF" opacity="0.95" />
                      <path d="M 0 3 C -2.5 7, -6 7, -4 3 Z" fill="#FFFFFF" opacity="0.95" />
                      <path d="M -3 0 C -7 -2.5, -7 -6, -3 -4 Z" fill="#FFFFFF" opacity="0.95" />
                    </g>

                    {/* Tooltip Tag Pill matching KOMVENT */}
                    {isSelected ? (
                      <g transform="translate(24, 0)">
                        <line x1="-8" y1="0" x2="0" y2="0" stroke="#00A3FF" strokeWidth="2" />
                        <rect
                          x="0"
                          y="-12"
                          width="116"
                          height="24"
                          rx="12"
                          fill="#FFFFFF"
                          stroke="#00A3FF"
                          strokeWidth="1.8"
                          filter="drop-shadow(0 4px 10px rgba(0,0,0,0.25))"
                        />
                        <text
                          x="58"
                          y="4"
                          fill="#0F172A"
                          fontSize="9.5"
                          fontWeight="800"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          AC Unit - {unit.UnitCode}
                        </text>
                      </g>
                    ) : (
                      <g transform="translate(0, -22)">
                        <rect
                          x="-14"
                          y="-7"
                          width="28"
                          height="14"
                          rx="7"
                          fill="var(--bg-surface, #1E293B)"
                          stroke={statusColor}
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="3.5"
                          fill="var(--text-primary, #FFFFFF)"
                          fontSize="8.5"
                          fontWeight="800"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {unit.UnitNumber || unit.UnitID.slice(-2)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Hover Tooltip */}
        {hoveredUnit && (
          <div
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              background: 'var(--bg-surface-elevated, #0F172A)',
              borderRadius: 12,
              padding: '0.65rem 0.9rem',
              boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-subtle, #334155)',
              zIndex: 30,
              pointerEvents: 'none',
              minWidth: 180
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00A3FF', fontFamily: 'monospace' }}>
                {hoveredUnit.UnitCode}
              </span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: hoveredUnit.Status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: hoveredUnit.Status === 'Active' ? '#10B981' : '#F59E0B'
                }}
              >
                {hoveredUnit.Status}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary, #F8FAFC)', marginTop: 4 }}>
              {hoveredUnit.Brand} {hoveredUnit.Model}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #94A3B8)', marginTop: 2 }}>
              📍 {getUnitRoomName(hoveredUnit)}
            </div>
          </div>
        )}

        {/* Bottom Right Blueprint Tag */}
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            right: 14,
            background: 'var(--bg-surface-translucent, rgba(17, 24, 39, 0.85))',
            border: '1px solid var(--border-subtle, #334155)',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: 'var(--text-muted, #94A3B8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(6px)'
          }}
        >
          <span>BG - {isGroundFloor ? 'Ground Floor' : '1st Floor (Level 1)'}</span>
          <Maximize2 size={11} style={{ opacity: 0.7 }} />
        </div>
      </div>
    </div>
  );
}
