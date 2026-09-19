import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Play, 
  Pause, 
  Mail, 
  Phone, 
  Keyboard, 
  Monitor, 
  Cpu, 
  MousePointer, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon, 
  Wrench, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  ShieldAlert, 
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  CheckCircle
} from 'lucide-react';

export default function DashboardHome({
  machines = [],
  services = [],
  onSelectTab,
  onOpenServiceModal,
  onViewMachine,
  onEditMachine,
  onOpenAdminPin,
  role
}) {
  // 1. Group machines by user
  const usersList = useMemo(() => {
    const map = new Map();
    machines.forEach(m => {
      const name = (m.assigned_to || 'Unassigned').trim();
      if (!map.has(name)) {
        map.set(name, {
          name,
          office: m.office || 'Main Branch',
          machines: [],
          keyboard: null,
          mouse: null,
          monitor: null,
          cpu: null,
          ups: null,
          lastUpdate: null,
          nextServiceDate: null,
          daysToNextCheckup: 0,
          totalSpend: 0
        });
      }
      const entry = map.get(name);
      entry.machines.push(m);

      const cat = (m.category || m.item_name || '').toLowerCase();
      if (cat.includes('key') || cat.includes('board')) {
        entry.keyboard = m;
      } else if (cat.includes('mouse')) {
        entry.mouse = m;
      } else if (cat.includes('monitor') || cat.includes('screen')) {
        entry.monitor = m;
      } else if (cat.includes('cpu') || cat.includes('desktop') || cat.includes('laptop') || cat.includes('vostro') || cat.includes('dell')) {
        entry.cpu = m;
      } else if (cat.includes('ups')) {
        entry.ups = m;
      }
    });

    // Calculate total spend, latest update date, and next service date per user
    services.forEach(s => {
      const uName = (s.assigned_to || '').trim();
      if (map.has(uName)) {
        const entry = map.get(uName);
        entry.totalSpend += Number(s.charges) || 0;
        if (s.service_date) {
          if (!entry.lastUpdate || new Date(s.service_date) > new Date(entry.lastUpdate)) {
            entry.lastUpdate = s.service_date;
          }
        }
        if (s.next_service) {
          if (!entry.nextServiceDate || new Date(s.next_service) < new Date(entry.nextServiceDate)) {
            entry.nextServiceDate = s.next_service;
          }
        }
      }
    });

    // Compute days to next checkup
    const today = new Date('2026-09-19');
    for (const entry of map.values()) {
      if (!entry.nextServiceDate) {
        if (entry.lastUpdate) {
          const d = new Date(entry.lastUpdate);
          d.setDate(d.getDate() + 90); // 90-day preventive maintenance cycle
          entry.nextServiceDate = d.toISOString().substring(0, 10);
        } else {
          entry.nextServiceDate = '2026-10-15';
        }
      }
      const target = new Date(entry.nextServiceDate);
      entry.daysToNextCheckup = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    }

    return Array.from(map.values()).filter(u => u.name !== 'Unassigned' && u.name !== '-');
  }, [machines, services]);

  // Selected featured user for showcase card
  const [selectedUserName, setSelectedUserName] = useState(() => {
    return usersList.length > 0 ? usersList[0].name : '';
  });

  useEffect(() => {
    if (usersList.length > 0 && !usersList.some(u => u.name === selectedUserName)) {
      setSelectedUserName(usersList[0].name);
    }
  }, [usersList, selectedUserName]);

  const activeUser = useMemo(() => {
    return usersList.find(u => u.name === selectedUserName) || usersList[0] || null;
  }, [usersList, selectedUserName]);

  // Timer counter simulation for "API Development / Maintenance run"
  const [timerSeconds, setTimerSeconds] = useState(12109); // 03:21:49 equivalent
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Metrics computation
  const totalAssets = machines.length;
  const inProgressCount = machines.filter(m => m.status === 'Under Service').length || 3;
  const completedCount = machines.filter(m => m.status === 'Working').length;
  const totalSpend = useMemo(() => {
    const sum = services.reduce((acc, s) => acc + (Number(s.charges) || 0), 0);
    return sum > 0 ? sum : 28500;
  }, [services]);

  // Office percentage ratio
  const chilawCount = machines.filter(m => (m.office || '').includes('Chilaw')).length || 31;
  const palaviCount = machines.filter(m => (m.office || '').includes('Palavi')).length || 20;
  const chilawPct = Math.round((chilawCount / (chilawCount + palaviCount || 1)) * 100);
  const palaviPct = 100 - chilawPct;

  // Calendar State (September 2026)
  const [calMonth, setCalMonth] = useState(8); // 0-indexed: 8 = September
  const [calYear, setCalYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(19);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar days generator
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      // Check if this date has any service record
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasService = services.some(s => s.service_date === dateStr);
      days.push({ day: d, hasService });
    }
    return days;
  }, [calYear, calMonth, services]);

  // Recent program updates & maintenance bills
  const recentUpdates = useMemo(() => {
    if (services.length > 0) {
      return [...services]
        .sort((a, b) => new Date(b.service_date || 0) - new Date(a.service_date || 0))
        .slice(0, 5);
    }
    return [
      {
        id: 'mock-1',
        service_date: '2026-09-19',
        time: '12:00 PM',
        service_details: 'OS & Security Drivers Update',
        assigned_to: 'Ms. Mishel',
        charges: 0,
        status: 'Completed',
        type: 'software'
      },
      {
        id: 'mock-2',
        service_date: '2026-09-07',
        time: '01:30 PM',
        service_details: 'UNA 650VA UPS Replacement',
        assigned_to: 'Mr. Shenash',
        charges: 9500,
        status: 'Invoiced',
        type: 'hardware'
      },
      {
        id: 'mock-3',
        service_date: '2026-06-15',
        time: '02:45 PM',
        service_details: 'Replacement New UPS & Battery',
        assigned_to: 'Mr. Indika',
        charges: 9500,
        status: 'Paid',
        type: 'hardware'
      },
      {
        id: 'mock-4',
        service_date: '2026-06-01',
        time: '04:00 PM',
        service_details: 'Update 4GB RAM & Clean Tuning',
        assigned_to: 'Ms. Prishani',
        charges: 4200,
        status: 'Completed',
        type: 'ram'
      }
    ];
  }, [services]);

  return (
    <div className="dashboard-hirewise">
      {/* Top Metric Cards Row (HireWise Style) */}
      <div className="hw-kpi-row">
        {/* Card 1: In Progress */}
        <div className="hw-kpi-card" onClick={() => onSelectTab('services')}>
          <div className="hw-kpi-header">
            <span className="hw-kpi-title">In Progress</span>
            <button className="hw-kpi-action-btn" title="View in progress">
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="hw-kpi-body">
            <div className="hw-kpi-value-row">
              <span className="hw-kpi-big-number">{inProgressCount}</span>
              <span className="hw-kpi-unit">updates</span>
            </div>
            <div className="hw-kpi-trend positive">
              <span>+1 last week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="hw-kpi-card" onClick={() => onSelectTab('machines')}>
          <div className="hw-kpi-header">
            <span className="hw-kpi-title">Completed</span>
            <button className="hw-kpi-action-btn" title="View operational systems">
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="hw-kpi-body">
            <div className="hw-kpi-value-row">
              <span className="hw-kpi-big-number">{completedCount || 28}</span>
              <span className="hw-kpi-unit">systems</span>
            </div>
            <div className="hw-kpi-trend positive">
              <span>+2 last week</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Spend / Bill (like $4,890 in screenshot) */}
        <div className="hw-kpi-card hw-kpi-highlight" onClick={() => onSelectTab('services')}>
          <div className="hw-kpi-header">
            <span className="hw-kpi-title">Update Spend</span>
            <button className="hw-kpi-action-btn" title="View service bills">
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="hw-kpi-body">
            <div className="hw-kpi-value-row">
              <span className="hw-kpi-currency">Rs.</span>
              <span className="hw-kpi-big-number">{totalSpend.toLocaleString()}</span>
            </div>
            <div className="hw-kpi-footer-flex">
              <span className="hw-kpi-subtext">total bills logged</span>
              <span className="hw-kpi-trend positive">+12% this qtr</span>
            </div>
          </div>
        </div>

        {/* Card 4: Fleet Assets */}
        <div className="hw-kpi-card" onClick={() => onSelectTab('machines')}>
          <div className="hw-kpi-header">
            <span className="hw-kpi-title">Fleet Assets</span>
            <button className="hw-kpi-action-btn" title="Open asset spreadsheet">
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="hw-kpi-body">
            <div className="hw-kpi-value-row">
              <span className="hw-kpi-big-number">{totalAssets}</span>
              <span className="hw-kpi-unit">devices</span>
            </div>
            <div className="hw-kpi-trend neutral">
              <span>Chilaw & Palavi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left/Center 2 Columns + Right Column */}
      <div className="hw-main-grid">
        {/* Left & Center Section */}
        <div className="hw-center-col">
          {/* Top Row: User Showcase Card & Weekly Activity Gauge */}
          <div className="hw-two-col-row">
            {/* User & Machine Showcase Card (Matching Dominik Grob card) */}
            <div className="hw-user-showcase-card">
              <div className="hw-user-avatar-container">
                <img 
                  src="/user_avatar.jpg" 
                  alt="Staff Workstation User" 
                  className="hw-user-photo" 
                  onError={(e) => { e.target.src = '/hero.png'; }}
                />
                <div className="hw-user-online-badge" title="Active Workstation" />
              </div>

              {/* User Selection & Identity */}
              <div className="hw-user-floating-pill">
                <div className="hw-user-info-left">
                  <div className="hw-user-selector-wrapper">
                    <select
                      className="hw-user-select"
                      value={activeUser?.name || ''}
                      onChange={(e) => setSelectedUserName(e.target.value)}
                      title="Select staff member to inspect workstation & keyboard"
                    >
                      {usersList.map(u => (
                        <option key={u.name} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <span className="hw-user-role-label">
                    {activeUser?.office || 'Executive'} &bull; {activeUser?.machines.length || 0} Assets
                  </span>
                </div>

                <div className="hw-user-quick-actions">
                  <button className="hw-pill-icon-btn" title="Contact User">
                    <Mail size={14} />
                  </button>
                  <button className="hw-pill-icon-btn" title="Direct Phone">
                    <Phone size={14} />
                  </button>
                </div>
              </div>

              {/* Hardware & Peripherals Breakdown */}
              <div className="hw-user-specs-grid">
                {/* 1. What Keyboard */}
                <div className="hw-spec-item highlighted">
                  <div className="hw-spec-icon-box purple">
                    <Keyboard size={16} />
                  </div>
                  <div className="hw-spec-text">
                    <span className="hw-spec-label">Assigned Keyboard</span>
                    <span className="hw-spec-value">
                      {activeUser?.keyboard ? (activeUser.keyboard.verified_no || activeUser.keyboard.item_name) : 'Standard Key Board'}
                    </span>
                    <span className="hw-spec-badge working">
                      {activeUser?.keyboard?.status || 'Working'}
                    </span>
                  </div>
                </div>

                {/* 2. User Computer / CPU */}
                <div className="hw-spec-item">
                  <div className="hw-spec-icon-box blue">
                    <Cpu size={16} />
                  </div>
                  <div className="hw-spec-text">
                    <span className="hw-spec-label">User Machine (CPU)</span>
                    <span className="hw-spec-value">
                      {activeUser?.cpu ? (activeUser.cpu.item_name || activeUser.cpu.verified_no) : 'Dell Vostro / Intel i3'}
                    </span>
                    <span className="hw-spec-sub">
                      {activeUser?.cpu?.verified_no || 'Verified Asset'}
                    </span>
                  </div>
                </div>

                {/* 3. Last Update Date */}
                <div className="hw-spec-item">
                  <div className="hw-spec-icon-box amber">
                    <Clock size={16} />
                  </div>
                  <div className="hw-spec-text">
                    <span className="hw-spec-label">Last Service / Update</span>
                    <span className="hw-spec-value">
                      {activeUser?.lastUpdate || '2026-09-07'}
                    </span>
                    <span className="hw-spec-sub">
                      Status: Up-to-date
                    </span>
                  </div>
                </div>

                {/* 4. Money Spent on Updates / Bills */}
                <div className="hw-spec-item">
                  <div className="hw-spec-icon-box green">
                    <DollarSign size={16} />
                  </div>
                  <div className="hw-spec-text">
                    <span className="hw-spec-label">Workstation Update Bill</span>
                    <span className="hw-spec-value">
                      Rs. {(activeUser?.totalSpend || 9500).toLocaleString()}
                    </span>
                    <span className="hw-spec-sub">
                      Billed for Maintenance
                    </span>
                  </div>
                </div>

                {/* 5. Days to Next Service / Checkup */}
                <div className={`hw-spec-item full-width-spec ${activeUser?.daysToNextCheckup <= 7 ? 'due-soon' : 'healthy'}`}>
                  <div className={`hw-spec-icon-box ${activeUser?.daysToNextCheckup <= 7 ? 'amber' : 'cyan'}`}>
                    <CalendarIcon size={16} />
                  </div>
                  <div className="hw-spec-text">
                    <span className="hw-spec-label">Next Service / Checkup</span>
                    <div className="hw-countdown-badge-row">
                      <span className="hw-spec-value">
                        {activeUser?.daysToNextCheckup > 0 
                          ? `In ${activeUser.daysToNextCheckup} Days` 
                          : activeUser?.daysToNextCheckup === 0 
                            ? 'Due Today!' 
                            : `Overdue by ${Math.abs(activeUser.daysToNextCheckup)} Days`}
                      </span>
                      <span className={`hw-status-pill-mini ${activeUser?.daysToNextCheckup <= 7 ? 'warn' : 'ok'}`}>
                        {activeUser?.daysToNextCheckup <= 7 ? 'Checkup Due Soon' : 'Scheduled'}
                      </span>
                    </div>
                    <span className="hw-spec-sub">
                      Target Checkup: {activeUser?.nextServiceDate || '2026-10-15'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit PC Specs & Log Checkup Bill */}
              <div className="hw-user-card-actions">
                <button
                  type="button"
                  className="hw-user-btn edit"
                  onClick={() => {
                    if (role === 'admin') {
                      if (activeUser?.cpu) {
                        onEditMachine(activeUser.cpu);
                      } else if (activeUser?.machines && activeUser.machines.length > 0) {
                        onEditMachine(activeUser.machines[0]);
                      } else {
                        onSelectTab('machines');
                      }
                    } else {
                      onOpenAdminPin();
                    }
                  }}
                  title={role === 'admin' ? 'Edit this PC / Laptop details' : 'Unlock Admin to edit PC details (PIN: 1234)'}
                >
                  <Edit3 size={14} />
                  <span>{role === 'admin' ? 'Edit PC Specs' : 'Unlock to Edit PC'}</span>
                </button>

                <button
                  type="button"
                  className="hw-user-btn service"
                  onClick={() => {
                    onOpenServiceModal({
                      assigned_to: activeUser?.name || '',
                      device_name: activeUser?.cpu?.item_name || 'PC Workstation',
                      verified_no: activeUser?.cpu?.verified_no || '',
                      service_date: new Date().toISOString().substring(0, 10),
                      next_service: activeUser?.nextServiceDate || ''
                    });
                  }}
                  title="Log new checkup, update, or maintenance bill"
                >
                  <Wrench size={14} />
                  <span>Log Checkup & Bill</span>
                </button>
              </div>
            </div>

            {/* Weekly Activity & Health Semi-Circle Gauge Card */}
            <div className="hw-activity-gauge-card">
              <div className="hw-card-header">
                <span className="hw-card-title">Weekly Activity</span>
                <button className="hw-card-mini-opt" title="Options">•••</button>
              </div>

              {/* Semi-Circle SVG Gauge matching 72% in screenshot */}
              <div className="hw-gauge-wrapper">
                <svg className="hw-gauge-svg" viewBox="0 0 200 120">
                  {/* Gauge background track */}
                  <path
                    d="M 25 110 A 75 75 0 0 1 175 110"
                    fill="none"
                    stroke="var(--hw-gauge-bg, #f1f0f7)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  {/* Gauge active purple arc (72%) */}
                  <path
                    d="M 25 110 A 75 75 0 0 1 175 110"
                    fill="none"
                    stroke="url(#gaugePurpleGradient)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray="235.6"
                    strokeDashoffset="65.9"
                  />
                  <defs>
                    <linearGradient id="gaugePurpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="hw-gauge-center-text">
                  <span className="hw-gauge-pct">72%</span>
                </div>
              </div>

              {/* Task timer matching "API Development 03:21:49" */}
              <div className="hw-timer-box">
                <div className="hw-timer-info">
                  <span className="hw-timer-label">Fleet Maintenance Run</span>
                  <span className="hw-timer-clock">{formatTimer(timerSeconds)}</span>
                </div>

                <button 
                  className={`hw-timer-play-btn ${isTimerRunning ? 'running' : ''}`}
                  onClick={() => setIsTimerRunning(prev => !prev)}
                  title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                >
                  {isTimerRunning ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Working Format & Top Projects / Update Bills Bar Chart */}
          <div className="hw-two-col-row">
            {/* Working Format Card (matches 39% / 61% card in screenshot) */}
            <div className="hw-format-card">
              <div className="hw-card-header">
                <span className="hw-card-title">Working Format</span>
                <button 
                  className="hw-kpi-action-btn"
                  onClick={() => onSelectTab('machines')}
                  title="View Office distribution"
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="hw-format-bars-container">
                {/* 39% Palavi Office */}
                <div className="hw-format-bar-col light-pattern">
                  <span className="hw-format-pct">{palaviPct}%</span>
                  <span className="hw-format-sub">Palavi Branch</span>
                </div>

                {/* 61% Chilaw Office */}
                <div className="hw-format-bar-col purple-gradient">
                  <span className="hw-format-pct">{chilawPct}%</span>
                  <span className="hw-format-sub">Chilaw HQ</span>
                </div>
              </div>
            </div>

            {/* Spend Breakdown & Top Updates Bar Chart (matches "Top projects" in screenshot) */}
            <div className="hw-top-projects-card">
              <div className="hw-card-header">
                <span className="hw-card-title">Top Update Programs & Bills</span>
                <div className="hw-chart-pill-legend">
                  <span className="hw-legend-badge">
                    <span className="hw-legend-dot dot-deep-purple" />
                    Hardware
                  </span>
                  <span className="hw-legend-badge">
                    <span className="hw-legend-dot dot-lavender" />
                    RAM & OS
                  </span>
                </div>
              </div>

              {/* Stacked Bars representing money spent per program */}
              <div className="hw-chart-bars-wrap">
                {/* Bar 1: Mon - UPS & Power */}
                <div className="hw-chart-bar-group">
                  <div className="hw-stacked-bar-track">
                    <div className="hw-bar-chunk chunk-deep-purple" style={{ height: '70%' }} title="UPS Replacement: Rs. 9,500" />
                    <div className="hw-bar-chunk chunk-lavender" style={{ height: '15%' }} title="Power Cable: Rs. 1,500" />
                  </div>
                  <span className="hw-bar-label">Mon</span>
                </div>

                {/* Bar 2: Tue - RAM Upgrade */}
                <div className="hw-chart-bar-group">
                  <div className="hw-stacked-bar-track">
                    <div className="hw-bar-chunk chunk-deep-purple" style={{ height: '35%' }} title="4GB RAM: Rs. 4,200" />
                    <div className="hw-bar-chunk chunk-lavender" style={{ height: '10%' }} title="Tuning: Rs. 800" />
                  </div>
                  <span className="hw-bar-label">Tue</span>
                </div>

                {/* Bar 3: Wed - OS & Security */}
                <div className="hw-chart-bar-group">
                  <div className="hw-stacked-bar-track">
                    <div className="hw-bar-chunk chunk-deep-purple" style={{ height: '55%' }} title="OS License: Rs. 6,000" />
                    <div className="hw-bar-chunk chunk-lavender" style={{ height: '20%' }} title="Antivirus: Rs. 2,000" />
                  </div>
                  <span className="hw-bar-label">Wed</span>
                </div>

                {/* Bar 4: Thu - Highest spend */}
                <div className="hw-chart-bar-group">
                  <div className="hw-stacked-bar-track">
                    <div className="hw-bar-chunk chunk-deep-purple" style={{ height: '85%' }} title="New Motherboard: Rs. 12,000" />
                    <div className="hw-bar-chunk chunk-lavender" style={{ height: '10%' }} title="Thermal Paste: Rs. 1,000" />
                  </div>
                  <span className="hw-bar-label">Thu</span>
                </div>

                {/* Bar 5: Fri - Peripherals & Keyboards */}
                <div className="hw-chart-bar-group">
                  <div className="hw-stacked-bar-track">
                    <div className="hw-bar-chunk chunk-deep-purple" style={{ height: '40%' }} title="Keyboards & Mice: Rs. 4,500" />
                    <div className="hw-bar-chunk chunk-lavender" style={{ height: '25%' }} title="Mouse Pads: Rs. 1,200" />
                  </div>
                  <span className="hw-bar-label">Fri</span>
                </div>
              </div>

              {/* Legend row matching screenshot bottom */}
              <div className="hw-chart-bottom-legends">
                <div className="hw-legend-item">
                  <span className="hw-legend-sq sq-1" />
                  <span>Hardware & UPS Bills</span>
                </div>
                <div className="hw-legend-item">
                  <span className="hw-legend-sq sq-2" />
                  <span>RAM / Memory</span>
                </div>
                <div className="hw-legend-item">
                  <span className="hw-legend-sq sq-3" />
                  <span>OS & Software</span>
                </div>
                <div className="hw-legend-item">
                  <span className="hw-legend-sq sq-4" />
                  <span>Keyboards / Peripherals</span>
                </div>
              </div>
            </div>
          </div>

          {/* Blue Trendline & Area Chart Card (Matches User's Reference Image) */}
          <div className="hw-trendline-card">
            <div className="hw-card-header">
              <div>
                <span className="hw-card-title">Maintenance Spend & Checkup Trends</span>
                <p className="hw-card-subtitle">Monthly expenditure & upcoming preventative checkup cycle</p>
              </div>
              <div className="hw-trend-badges-group">
                <span className="hw-trend-pill cyan">
                  <CalendarIcon size={12} />
                  <span>Next Fleet Checkup: In 14 Days (Oct 03)</span>
                </span>
                <span className="hw-trend-pill purple">
                  <DollarSign size={12} />
                  <span>Total Bills: Rs. {totalSpend.toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div className="hw-trendline-chart-area">
              <svg className="hw-trend-svg" viewBox="0 0 700 190" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="hwBlueAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.38" />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                <line x1="20" y1="35" x2="680" y2="35" stroke="var(--border-subtle)" strokeDasharray="5,5" strokeWidth="1" />
                <line x1="20" y1="80" x2="680" y2="80" stroke="var(--border-subtle)" strokeDasharray="5,5" strokeWidth="1" />
                <line x1="20" y1="125" x2="680" y2="125" stroke="var(--border-subtle)" strokeDasharray="5,5" strokeWidth="1" />
                <line x1="20" y1="165" x2="680" y2="165" stroke="var(--border-strong)" strokeWidth="1.5" />

                {/* Area fill */}
                <polygon
                  points="35,165 35,140 160,75 285,130 410,110 535,45 665,130 665,165"
                  fill="url(#hwBlueAreaGradient)"
                />

                {/* Glowing Blue Stroke Line (Matches user's reference) */}
                <polyline
                  points="35,140 160,75 285,130 410,110 535,45 665,130"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                <circle cx="35" cy="140" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="160" cy="75" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="285" cy="130" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="410" cy="110" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <circle cx="535" cy="45" r="5.5" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx="665" cy="130" r="4.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
              </svg>

              {/* Axis markers matching the uploaded screenshot */}
              <div className="hw-trend-x-axis">
                <div className="hw-axis-node"><span>May 2026</span><small>Rs. 0</small></div>
                <div className="hw-axis-node"><span>Jun 2026</span><small>Rs. 13,700</small></div>
                <div className="hw-axis-node"><span>Jul 2026</span><small>Rs. 3,500</small></div>
                <div className="hw-axis-node"><span>Aug 2026</span><small>Rs. 9,500</small></div>
                <div className="hw-axis-node active"><span>Sep 2026 (Now)</span><small>Rs. 28,500</small></div>
                <div className="hw-axis-node future"><span>Oct 2026</span><small>Next Checkup</small></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Calendar & Today's Program Updates */}
        <div className="hw-right-col">
          {/* Calendar Widget matching screenshot */}
          <div className="hw-calendar-card">
            <div className="hw-calendar-header">
              <button 
                className="hw-cal-nav-btn"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(prev => prev - 1);
                  } else {
                    setCalMonth(prev => prev - 1);
                  }
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <span className="hw-cal-month-title">
                {monthNames[calMonth]} {calYear}
              </span>

              <button 
                className="hw-cal-nav-btn"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(prev => prev + 1);
                  } else {
                    setCalMonth(prev => prev + 1);
                  }
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekdays */}
            <div className="hw-cal-weekdays">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Days Grid */}
            <div className="hw-cal-days-grid">
              {calendarDays.map((item, idx) => {
                if (!item.day) {
                  return <div key={`empty-${idx}`} className="hw-cal-day empty" />;
                }
                const isSelected = item.day === selectedDay;
                return (
                  <div
                    key={`day-${item.day}`}
                    className={`hw-cal-day ${isSelected ? 'selected' : ''} ${item.hasService ? 'has-event' : ''}`}
                    onClick={() => setSelectedDay(item.day)}
                  >
                    <span className="hw-cal-day-num">{item.day}</span>
                    {item.hasService && <span className="hw-cal-event-dot" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Events / Recent Program Updates matching screenshot */}
          <div className="hw-events-card">
            <div className="hw-card-header">
              <span className="hw-card-title">Recent Updates & Bills</span>
              <button 
                className="hw-view-all-link"
                onClick={() => onSelectTab('services')}
              >
                View all
              </button>
            </div>

            <div className="hw-events-list">
              {recentUpdates.map((ev, index) => {
                const cost = Number(ev.charges) || 0;
                return (
                  <div 
                    key={ev.id || index}
                    className="hw-event-row"
                    onClick={() => onOpenServiceModal(ev)}
                    title="Click to view update details and bill invoice"
                  >
                    <div className="hw-event-time-col">
                      <span className="hw-event-time">{ev.time || '10:00 AM'}</span>
                      <span className="hw-event-date">{ev.service_date}</span>
                    </div>

                    <div className="hw-event-divider" />

                    <div className="hw-event-info-col">
                      <div className="hw-event-title-line">
                        <span className="hw-event-title">{ev.service_details || 'Routine Service'}</span>
                      </div>
                      <div className="hw-event-sub-line">
                        <span className="hw-event-user">{ev.assigned_to}</span>
                        <span className="hw-event-cost-tag">
                          {cost > 0 ? `Rs. ${cost.toLocaleString()}` : 'Free / In-House'}
                        </span>
                      </div>
                    </div>

                    <div className="hw-event-icon-badge">
                      {cost > 5000 ? (
                        <div className="hw-app-icon green" title="Hardware invoice">
                          <DollarSign size={14} />
                        </div>
                      ) : (
                        <div className="hw-app-icon purple" title="Software / RAM update">
                          <Wrench size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Button to log new update */}
            <button
              type="button"
              className="hw-quick-add-service-btn"
              onClick={() => onOpenServiceModal(null)}
            >
              <Wrench size={15} />
              <span>Log New Update / Repair Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
