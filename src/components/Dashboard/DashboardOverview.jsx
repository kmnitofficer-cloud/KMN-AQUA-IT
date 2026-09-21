import React, { useMemo } from 'react';
import { 
  Users, 
  Laptop, 
  Monitor, 
  Printer, 
  Wrench, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldAlert, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { repairService } from '../../services/repairService';
import { expenseService } from '../../services/expenseService';
import { printerService } from '../../services/printerService';

export default function DashboardOverview({ onNavigate, onOpenPrinter }) {
  const users = userService.getUsers('All');
  const assets = assetService.getAssets('All');
  const repairs = repairService.getRepairs();
  const printers = printerService.getPrinters();
  const financialSummary = expenseService.getFinancialSummary();

  // Metrics calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.Status === 'Active').length;
  const inactiveUsers = users.filter(u => u.Status === 'Inactive').length;

  const totalAssets = assets.length;
  const assignedAssets = assets.filter(a => a.CurrentUserID && a.Status === 'Assigned').length;
  const unassignedAssets = assets.filter(a => !a.CurrentUserID || a.Status === 'Available' || a.Status === 'In Storage').length;
  const underRepairAssets = assets.filter(a => a.Status === 'Under Repair').length;

  const computersCount = assets.filter(a => ['Desktop', 'CPU', 'All-in-One'].includes(a.AssetType)).length;
  const laptopsCount = assets.filter(a => a.AssetType === 'Laptop').length;
  const monitorsCount = assets.filter(a => a.AssetType === 'Monitor').length;
  const printersCount = assets.filter(a => a.AssetType === 'Printer').length;
  const otherDevicesCount = assets.filter(a => !['Desktop', 'CPU', 'All-in-One', 'Laptop', 'Monitor', 'Printer'].includes(a.AssetType)).length;

  // Alerts computation
  const alerts = useMemo(() => {
    const list = [];

    // 0. Devices under daily warning / observation (Still working, but requires checking)
    const warningAssets = assets.filter(a => 
      a.HealthStatus === 'Warning' || 
      (a.WarningNote && a.WarningNote.length > 0) ||
      (a.Notes && (a.Notes.toLowerCase().includes('warning') || a.Notes.toLowerCase().includes('low performance') || a.Notes.toLowerCase().includes('beep') || a.Notes.toLowerCase().includes('error')))
    );
    if (warningAssets.length > 0) {
      list.push({
        id: 'alert-daily-warnings',
        type: 'warning',
        icon: AlertTriangle,
        title: `⚠️ ${warningAssets.length} Machine(s) Under Daily Warning & Observation`,
        description: warningAssets.map(a => `${a.Brand} ${a.Model} (${a.AssignedUserName || 'Storage'}): ${a.WarningNote || a.Notes}`).slice(0, 3).join(' • ') + (warningAssets.length > 3 ? '...' : ''),
        action: () => onNavigate('assets')
      });
    }

    // 1. Assets under repair
    const underRepairList = assets.filter(a => a.Status === 'Under Repair');
    if (underRepairList.length > 0) {
      list.push({
        id: 'alert-repair',
        type: 'danger',
        icon: Wrench,
        title: `${underRepairList.length} Asset(s) Under Repair / Maintenance`,
        description: underRepairList.map(a => `${a.Brand} ${a.Model} (${a.VerifiedNo})`).slice(0, 3).join(', ') + (underRepairList.length > 3 ? '...' : ''),
        action: () => onNavigate('repairs')
      });
    }

    // 2. Printers requiring attention
    const printerAttention = printers.filter(p => p.Status.includes('Error') || p.Notes.toLowerCase().includes('error'));
    if (printerAttention.length > 0) {
      list.push({
        id: 'alert-printers',
        type: 'warning',
        icon: AlertTriangle,
        title: `${printerAttention.length} Printer(s) Requiring Attention`,
        description: printerAttention.map(p => `${p.PrinterName}: ${p.Notes}`).join('; '),
        action: () => onNavigate('printers')
      });
    }

    // 3. Unassigned Assets available in storage
    const unassignedList = assets.filter(a => (!a.CurrentUserID || a.Status === 'Available') && a.Status !== 'Under Repair' && a.Status !== 'Disposed');
    if (unassignedList.length > 0) {
      list.push({
        id: 'alert-unassigned',
        type: 'info',
        icon: Laptop,
        title: `${unassignedList.length} Unassigned Asset(s) In Storage`,
        description: 'Available for immediate reassignment to new or relocating employees.',
        action: () => onNavigate('assets')
      });
    }

    // 4. Missing Serial Numbers
    const missingSerials = assets.filter(a => !a.SerialNumber && a.VerifiedNo && !a.VerifiedNo.includes('UNTAGGED'));
    if (missingSerials.length > 0) {
      list.push({
        id: 'alert-serials',
        type: 'warning',
        icon: HelpCircle,
        title: `${missingSerials.length} Hardware Devices Missing Factory Serial Numbers`,
        description: 'Tagged with Verified No, but OEM factory serials not yet recorded.',
        action: () => onNavigate('assets')
      });
    }

    // 5. Untagged / Missing Verified No
    const untaggedAssets = assets.filter(a => !a.VerifiedNo || a.VerifiedNo.includes('UNTAGGED'));
    if (untaggedAssets.length > 0) {
      list.push({
        id: 'alert-untagged',
        type: 'info',
        icon: ShieldAlert,
        title: `${untaggedAssets.length} Assets Missing Company Verified Number`,
        description: 'Legacy items requiring physical barcode/tag application.',
        action: () => onNavigate('assets')
      });
    }

    return list;
  }, [assets, printers, onNavigate]);

  return (
    <div className="dashboard-overview-container">
      {/* Top Banner */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h2>KMN Office IT Asset & Relational Management</h2>
          <p>
            Connected to <strong>database/IT_Asset_Database.xlsx</strong> • Complete audit trail preserved across all 14 relational tables.
          </p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-outline" onClick={() => onNavigate('database')}>
            <FileSpreadsheet size={16} /> Relational DB Hub
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('assignments')}>
            <ArrowUpRight size={16} /> Asset Handovers
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="stats-kpi-grid">
        {/* Total Users */}
        <div className="kpi-card" onClick={() => onNavigate('users')}>
          <div className="kpi-header">
            <span className="kpi-title">Staff & Users</span>
            <div className="kpi-icon-badge text-blue"><Users size={20} /></div>
          </div>
          <div className="kpi-value">{totalUsers}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">{activeUsers} Active</span>
            <span className="badge badge-neutral">{inactiveUsers} Inactive / Vacant</span>
          </div>
        </div>

        {/* Total Assets */}
        <div className="kpi-card" onClick={() => onNavigate('assets')}>
          <div className="kpi-header">
            <span className="kpi-title">Physical Assets</span>
            <div className="kpi-icon-badge text-emerald"><Laptop size={20} /></div>
          </div>
          <div className="kpi-value">{totalAssets}</div>
          <div className="kpi-subtext">
            <span className="text-emerald">{assignedAssets} Assigned</span> • 
            <span className="text-amber"> {unassignedAssets} Available</span> • 
            <span className="text-rose"> {underRepairAssets} In Repair</span>
          </div>
        </div>

        {/* Total Repairs & Maintenance */}
        <div className="kpi-card" onClick={() => onNavigate('repairs')}>
          <div className="kpi-header">
            <span className="kpi-title">Service & Repairs</span>
            <div className="kpi-icon-badge text-amber"><Wrench size={20} /></div>
          </div>
          <div className="kpi-value">{repairs.length}</div>
          <div className="kpi-subtext">
            <span>Total Logged: <strong>Rs. {financialSummary.repairExpenses.toLocaleString()}</strong></span>
          </div>
        </div>

        {/* Total Recorded Expenses */}
        <div className="kpi-card" onClick={() => onNavigate('expenses')}>
          <div className="kpi-header">
            <span className="kpi-title">Total Office Expenses</span>
            <div className="kpi-icon-badge text-violet"><DollarSign size={20} /></div>
          </div>
          <div className="kpi-value">Rs. {financialSummary.totalExpenses.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span>Toners: Rs. {financialSummary.consumableExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Equipment Type Breakdown */}
      <div className="section-panel mt-6">
        <div className="section-panel-header">
          <h3>Hardware Fleet Distribution</h3>
          <span className="text-muted text-sm">Categorized IT inventory</span>
        </div>
        <div className="fleet-distribution-grid">
          <div className="fleet-item" onClick={() => onNavigate('assets')}>
            <div className="fleet-icon"><Laptop size={18} /></div>
            <div className="fleet-details">
              <span className="fleet-count">{laptopsCount}</span>
              <span className="fleet-label">Laptops</span>
            </div>
          </div>
          <div className="fleet-item" onClick={() => onNavigate('assets')}>
            <div className="fleet-icon"><Monitor size={18} /></div>
            <div className="fleet-details">
              <span className="fleet-count">{monitorsCount}</span>
              <span className="fleet-label">Monitors</span>
            </div>
          </div>
          <div className="fleet-item" onClick={() => onNavigate('assets')}>
            <div className="fleet-icon"><Laptop size={18} /></div>
            <div className="fleet-details">
              <span className="fleet-count">{computersCount}</span>
              <span className="fleet-label">Desktops & AIO</span>
            </div>
          </div>
          <div className="fleet-item" onClick={() => onNavigate('printers')}>
            <div className="fleet-icon"><Printer size={18} /></div>
            <div className="fleet-details">
              <span className="fleet-count">{printersCount}</span>
              <span className="fleet-label">Printers</span>
            </div>
          </div>
          <div className="fleet-item" onClick={() => onNavigate('assets')}>
            <div className="fleet-icon"><CheckCircle2 size={18} /></div>
            <div className="fleet-details">
              <span className="fleet-count">{otherDevicesCount}</span>
              <span className="fleet-label">UPS & Peripherals</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts & Quick Action Panel */}
      <div className="dashboard-two-col mt-6">
        {/* Left: Active System Alerts */}
        <div className="section-panel">
          <div className="section-panel-header">
            <h3>Office IT Alerts & Attention Items</h3>
            <span className="badge badge-warning">{alerts.length} Warnings</span>
          </div>
          <div className="alerts-feed">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-feed-item alert-${alert.type}`} onClick={alert.action}>
                <div className="alert-icon-wrapper">
                  <alert.icon size={18} />
                </div>
                <div className="alert-info">
                  <span className="alert-title">{alert.title}</span>
                  <p className="alert-desc">{alert.description}</p>
                </div>
                <ArrowUpRight size={16} className="alert-action-arrow" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Printers Live Status */}
        <div className="section-panel">
          <div className="section-panel-header">
            <h3>Printer Network & Consumable Status</h3>
            <button className="btn-link" onClick={() => onNavigate('printers')}>View All ({printers.length})</button>
          </div>
          <div className="printers-live-feed">
            {printers.map(p => (
              <div key={p.PrinterID} className="printer-feed-card" onClick={() => onOpenPrinter(p.PrinterID)}>
                <div className="printer-feed-top">
                  <div>
                    <span className="printer-feed-name">{p.PrinterName}</span>
                    <span className="printer-feed-meta">IP: {p.IPAddress} • {p.LocationName}</span>
                  </div>
                  <span className={`badge ${p.Status.includes('Error') ? 'badge-danger' : 'badge-success'}`}>
                    {p.Status}
                  </span>
                </div>
                <div className="printer-feed-bottom">
                  <span>Cartridge: <strong>{p.TonerCartridgeModel}</strong></span>
                  {p.Notes && <span className="printer-feed-note">{p.Notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
