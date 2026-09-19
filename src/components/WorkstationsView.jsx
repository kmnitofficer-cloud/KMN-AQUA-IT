import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Keyboard, 
  Cpu, 
  Monitor, 
  MousePointer, 
  Clock, 
  DollarSign, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function WorkstationsView({
  machines = [],
  services = [],
  onOpenServiceModal,
  onViewMachine,
  onAddMachine,
  role
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [officeFilter, setOfficeFilter] = useState('All');

  // Group machines and services by assigned_to
  const workstations = useMemo(() => {
    const map = new Map();

    machines.forEach(m => {
      const user = (m.assigned_to || 'Unassigned').trim();
      if (!map.has(user)) {
        map.set(user, {
          user,
          office: m.office || 'Main Branch',
          items: [],
          keyboard: null,
          mouse: null,
          monitor: null,
          cpu: null,
          ups: null,
          lastUpdate: null,
          services: [],
          totalSpend: 0
        });
      }
      const entry = map.get(user);
      entry.items.push(m);

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

    // Attach services and bills
    services.forEach(s => {
      const user = (s.assigned_to || '').trim();
      if (map.has(user)) {
        const entry = map.get(user);
        entry.services.push(s);
        entry.totalSpend += Number(s.charges) || 0;
        if (s.service_date) {
          if (!entry.lastUpdate || new Date(s.service_date) > new Date(entry.lastUpdate)) {
            entry.lastUpdate = s.service_date;
          }
        }
      }
    });

    return Array.from(map.values()).filter(w => w.user !== 'Unassigned' && w.user !== '-');
  }, [machines, services]);

  // Filtered workstations
  const filtered = useMemo(() => {
    return workstations.filter(w => {
      const matchesSearch = 
        w.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.keyboard?.verified_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.cpu?.item_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesOffice = officeFilter === 'All' || w.office === officeFilter;
      return matchesSearch && matchesOffice;
    });
  }, [workstations, searchTerm, officeFilter]);

  return (
    <div className="workstations-container">
      {/* Header & Filter Controls */}
      <div className="workstations-header">
        <div>
          <h2 className="workstations-title">Employee Workstations & Peripherals</h2>
          <p className="workstations-subtitle">
            Inspect each user's assigned computer, keyboard model, update history, and total maintenance bills.
          </p>
        </div>

        <div className="workstations-toolbar">
          {/* Search Box */}
          <div className="ws-search-box">
            <Search size={16} className="ws-search-icon" />
            <input
              type="text"
              placeholder="Search user, keyboard tag, or PC model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ws-search-input"
            />
          </div>

          {/* Office Filter */}
          <select
            value={officeFilter}
            onChange={(e) => setOfficeFilter(e.target.value)}
            className="ws-filter-select"
          >
            <option value="All">All Branches</option>
            <option value="Chilaw Office">Chilaw Office</option>
            <option value="Palavi Office">Palavi Office</option>
          </select>
        </div>
      </div>

      {/* Grid of Workstations */}
      <div className="workstations-grid">
        {filtered.map(w => (
          <div key={w.user} className="ws-card">
            {/* Card Header: User & Branch */}
            <div className="ws-card-header">
              <div className="ws-user-avatar-badge">
                <span>{w.user.replace('Ms. ', '').replace('Mr. ', '').substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="ws-user-details">
                <h3 className="ws-user-name">{w.user}</h3>
                <span className="ws-office-tag">
                  <Building2 size={12} />
                  {w.office}
                </span>
              </div>

              <div className="ws-total-spend-pill" title="Total maintenance bills for this user">
                <DollarSign size={13} />
                <span>Rs. {w.totalSpend.toLocaleString()}</span>
              </div>
            </div>

            {/* Workstation Hardware List */}
            <div className="ws-specs-list">
              {/* Computer / CPU */}
              <div className="ws-spec-row">
                <div className="ws-spec-icon cpu">
                  <Cpu size={15} />
                </div>
                <div className="ws-spec-content">
                  <span className="ws-spec-title">Computer / Machine</span>
                  <span className="ws-spec-val">
                    {w.cpu ? (w.cpu.item_name || w.cpu.verified_no) : 'Not assigned'}
                  </span>
                  {w.cpu?.verified_no && (
                    <span className="ws-tag-verified">{w.cpu.verified_no}</span>
                  )}
                </div>
              </div>

              {/* What Keyboard */}
              <div className="ws-spec-row highlighted-keyboard">
                <div className="ws-spec-icon keyboard">
                  <Keyboard size={15} />
                </div>
                <div className="ws-spec-content">
                  <span className="ws-spec-title">Keyboard Model</span>
                  <span className="ws-spec-val">
                    {w.keyboard ? (w.keyboard.verified_no ? `${w.keyboard.item_name || 'Key Board'} (${w.keyboard.verified_no})` : w.keyboard.item_name) : 'Standard Keyboard'}
                  </span>
                  <span className={`ws-status-badge ${w.keyboard?.status === 'Working' ? 'working' : 'repair'}`}>
                    {w.keyboard?.status || 'Working'}
                  </span>
                </div>
              </div>

              {/* Monitor & Mouse */}
              <div className="ws-spec-row">
                <div className="ws-spec-icon monitor">
                  <Monitor size={15} />
                </div>
                <div className="ws-spec-content">
                  <span className="ws-spec-title">Screen & Mouse</span>
                  <span className="ws-spec-val">
                    {w.monitor ? (w.monitor.item_name || w.monitor.verified_no) : 'Monitor'} &bull; {w.mouse ? (w.mouse.verified_no || 'Mouse') : 'Optical Mouse'}
                  </span>
                </div>
              </div>

              {/* Last Update Date & Latest Program */}
              <div className="ws-spec-row">
                <div className="ws-spec-icon clock">
                  <Clock size={15} />
                </div>
                <div className="ws-spec-content">
                  <span className="ws-spec-title">Last Service / Update Date</span>
                  <span className="ws-spec-val">
                    {w.lastUpdate ? w.lastUpdate : '2026-09-07'}
                  </span>
                  <span className="ws-spec-meta">
                    {w.services.length > 0 ? `${w.services[0].service_details}` : 'Routine check performed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="ws-card-footer">
              <button
                type="button"
                className="ws-btn-action"
                onClick={() => onOpenServiceModal({ assigned_to: w.user, verified_no: w.cpu?.verified_no || '' })}
              >
                <Wrench size={14} />
                <span>Log Update Bill</span>
              </button>

              {w.cpu && (
                <button
                  type="button"
                  className="ws-btn-icon"
                  onClick={() => onViewMachine(w.cpu)}
                  title="View complete machine history"
                >
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
