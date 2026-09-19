import React from 'react';
import { 
  Server, 
  CheckCircle2, 
  Wrench, 
  AlertOctagon, 
  Building2, 
  DollarSign 
} from 'lucide-react';

export default function StatsCards({ machines, services, onFilterByStatus, onFilterByOffice }) {
  const total = machines.length;
  const workingCount = machines.filter(m => m.status === 'Working').length;
  const serviceCount = machines.filter(m => m.status === 'Under Service').length;
  const notInUseCount = machines.filter(m => m.status === 'Not in use' || m.status === 'Not Working').length;

  const chilawCount = machines.filter(m => m.office === 'Chilaw Office').length;
  const palaviCount = machines.filter(m => m.office === 'Palavi Office').length;

  const totalCharges = services.reduce((sum, s) => sum + (Number(s.charges) || 0), 0);
  const workingPct = total > 0 ? Math.round((workingCount / total) * 100) : 0;

  return (
    <div className="stats-grid">
      {/* Total Computers */}
      <div 
        className="stat-card blue" 
        onClick={() => onFilterByStatus('All')} 
        style={{ cursor: 'pointer' }}
        title="Show all assets"
      >
        <div className="stat-icon-wrapper blue">
          <Server size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total Assets</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">Across 2 Branches</span>
        </div>
      </div>

      {/* Operational / Working */}
      <div 
        className="stat-card green" 
        onClick={() => onFilterByStatus('Working')} 
        style={{ cursor: 'pointer' }}
        title="Filter by Working assets"
      >
        <div className="stat-icon-wrapper green">
          <CheckCircle2 size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Operational</span>
          <span className="stat-value">{workingCount}</span>
          <span className="stat-sub">{workingPct}% Health Rate</span>
        </div>
      </div>

      {/* Under Service */}
      <div 
        className="stat-card amber" 
        onClick={() => onFilterByStatus('Under Service')} 
        style={{ cursor: 'pointer' }}
        title="Filter by Under Service assets"
      >
        <div className="stat-icon-wrapper amber">
          <Wrench size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">In Service / Repair</span>
          <span className="stat-value">{serviceCount}</span>
          <span className="stat-sub">Maintenance ongoing</span>
        </div>
      </div>

      {/* Not in use */}
      <div 
        className="stat-card rose" 
        onClick={() => onFilterByStatus('Not in use')} 
        style={{ cursor: 'pointer' }}
        title="Filter by Inactive / Not in use assets"
      >
        <div className="stat-icon-wrapper rose">
          <AlertOctagon size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Not In Use / Scrap</span>
          <span className="stat-value">{notInUseCount}</span>
          <span className="stat-sub">Storage / Defective</span>
        </div>
      </div>

      {/* Branches Breakdown */}
      <div 
        className="stat-card cyan" 
        style={{ cursor: 'pointer' }}
        title="Office Distribution"
      >
        <div className="stat-icon-wrapper cyan">
          <Building2 size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Branches</span>
          <span className="stat-value">{chilawCount + palaviCount}</span>
          <span className="stat-sub">
            <span onClick={(e) => { e.stopPropagation(); onFilterByOffice('Chilaw Office'); }} style={{ textDecoration: 'underline' }}>
              Chilaw: {chilawCount}
            </span>
            {' | '}
            <span onClick={(e) => { e.stopPropagation(); onFilterByOffice('Palavi Office'); }} style={{ textDecoration: 'underline' }}>
              Palavi: {palaviCount}
            </span>
          </span>
        </div>
      </div>

      {/* Service Spend */}
      <div className="stat-card purple" title="Total recorded maintenance expenses">
        <div className="stat-icon-wrapper purple">
          <DollarSign size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Maintenance Spend</span>
          <span className="stat-value">Rs. {totalCharges.toLocaleString()}</span>
          <span className="stat-sub">{services.length} Service Logs</span>
        </div>
      </div>
    </div>
  );
}
