import React, { useState, useMemo } from 'react';
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
  ShieldCheck,
  Cpu,
  Clock,
  FileText,
  HelpCircle,
  FileSpreadsheet,
  Receipt,
  Wind
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { repairService } from '../../services/repairService';
import { expenseService } from '../../services/expenseService';
import { printerService } from '../../services/printerService';
import { invoiceService } from '../../services/invoiceService';
import { acService } from '../../services/acService';
import { locationService } from '../../services/locationService';
import { formatDisplayDate } from '../../utils/dateUtils';
import InvoiceViewerModal from '../Invoices/InvoiceViewerModal';

export default function DashboardOverview({ onNavigate, onOpenPrinter, selectedLocation = 'All' }) {
  const allUsers = userService.getUsers('All');
  const users = allUsers.filter(u => locationService.matchesUser(u, selectedLocation));

  const allAssets = assetService.getAssets('All');
  const assets = allAssets.filter(a => locationService.matchesAsset(a, selectedLocation));

  const repairs = repairService.getRepairs();
  const printers = printerService.getPrinters().filter(p => locationService.matchesAsset(p, selectedLocation));
  const financialSummary = expenseService.getFinancialSummary();
  const warrantySummary = useMemo(() => repairService.getWarrantySummary(), []);
  const reconciliation = useMemo(() => invoiceService.getReconciliationSummary(), []);
  const allInvoices = useMemo(() => invoiceService.getInvoices(), []);
  const hardwareUpgradeExpenses = Math.max(0, financialSummary.totalExpenses - financialSummary.repairExpenses - financialSummary.consumableExpenses);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const handleOpenInvoice = (invoiceId) => {
    if (!invoiceId) return;
    const inv = invoiceService.getInvoiceById(invoiceId);
    if (inv) {
      setSelectedInvoice(inv);
      setIsInvoiceModalOpen(true);
    }
  };

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
    const printerAttention = printers.filter(p => (p.Status || '').includes('Error') || (p.Notes && p.Notes.toLowerCase().includes('error')));
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

    // 6. Hardware Part Warranties Expiring Soon
    if (warrantySummary.expiringSoonCount > 0) {
      list.push({
        id: 'alert-warranty-expiring',
        type: 'warning',
        icon: ShieldCheck,
        title: `🛡️ ${warrantySummary.expiringSoonCount} Installed Part(s) Warranty Expiring Soon (≤ 60 Days)`,
        description: warrantySummary.warrantyParts
          .filter(p => p.WarrantyBadgeType === 'expiring-soon')
          .map(p => `${p.PartType} (${p.NewPartDetails}) on ${p.Brand} ${p.Model} - ${p.WarrantyRemainingDays} days left`)
          .join('; '),
        action: () => onNavigate('parts')
      });
    }

    return list;
  }, [assets, printers, onNavigate, warrantySummary]);

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

      {/* Location Filter Indicator Banner */}
      {selectedLocation !== 'All' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          background: selectedLocation === 'Palawiya' ? 'rgba(6, 182, 212, 0.08)' : 'rgba(16, 185, 129, 0.08)',
          border: `1px solid ${selectedLocation === 'Palawiya' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: selectedLocation === 'Palawiya' ? '#06B6D4' : '#10B981',
              boxShadow: `0 0 8px ${selectedLocation === 'Palawiya' ? '#06B6D4' : '#10B981'}`
            }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Viewing Operational Metrics for: <strong style={{ color: selectedLocation === 'Palawiya' ? '#06B6D4' : '#10B981' }}>{selectedLocation === 'Palawiya' ? 'Palawiya Branch Office' : 'Chilaw Office (Headquarters)'}</strong> ({users.length} staff, {assets.length} machines)
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline"
            onClick={() => locationService.setSelectedLocation('All')}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
          >
            Show All Facilities
          </button>
        </div>
      )}

      {/* KPI Stat Cards Grid (Desktop 4 cols, Tablet 2 cols, Mobile 1 col) */}
      <div className="stats-kpi-grid">
        {/* 1. Total Users */}
        <div className="kpi-card" onClick={() => onNavigate('users')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Staff & Users</span>
            <div className="kpi-icon-badge"><Users size={20} /></div>
          </div>
          <div className="kpi-value">{totalUsers}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">{activeUsers} Active</span>
            <span className="badge badge-neutral">{inactiveUsers} Inactive</span>
          </div>
        </div>

        {/* 2. Total Assets */}
        <div className="kpi-card" onClick={() => onNavigate('assets')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Physical Assets</span>
            <div className="kpi-icon-badge"><Laptop size={20} /></div>
          </div>
          <div className="kpi-value">{totalAssets}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">{assignedAssets} Assigned</span>
            <span className="badge badge-neutral">{unassignedAssets} Available</span>
          </div>
        </div>

        {/* 3. Printers Fleet */}
        <div className="kpi-card" onClick={() => onNavigate('printers')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Printers & Toners</span>
            <div className="kpi-icon-badge"><Printer size={20} /></div>
          </div>
          <div className="kpi-value">{printers.length}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">{printers.filter(p => !p.Status.includes('Error')).length} Online</span>
            <span className="badge badge-neutral">{printersCount} Fleet</span>
          </div>
        </div>

        {/* 4. Total Repairs & Maintenance */}
        <div className="kpi-card" onClick={() => onNavigate('repairs')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Service & Repairs</span>
            <div className="kpi-icon-badge"><Wrench size={20} /></div>
          </div>
          <div className="kpi-value">{repairs.length}</div>
          <div className="kpi-subtext">
            <span className="badge badge-neutral">Rs. {financialSummary.repairExpenses.toLocaleString()}</span>
            <span className="badge badge-warning">{underRepairAssets} In Repair</span>
          </div>
        </div>

        {/* 5. Total Recorded Expenses */}
        <div className="kpi-card" onClick={() => onNavigate('expenses')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Total Office Expenses</span>
            <div className="kpi-icon-badge"><DollarSign size={20} /></div>
          </div>
          <div className="kpi-value">Rs. {financialSummary.totalExpenses.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span className="badge badge-neutral">Repairs & Consumables</span>
          </div>
        </div>

        {/* 6. Verified Bills & Invoices */}
        <div className="kpi-card" onClick={() => onNavigate('invoices')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Verified Bills & Invoices</span>
            <div className="kpi-icon-badge"><Receipt size={20} /></div>
          </div>
          <div className="kpi-value">Rs. {reconciliation.totalInvoiced.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">✓ {reconciliation.invoicesCount} Official Bills</span>
            <span className="badge badge-neutral font-mono">{reconciliation.isBalanced ? '100% Balanced' : 'Mismatch'}</span>
          </div>
        </div>

        {/* 7. Hardware Part Warranties */}
        <div className="kpi-card" onClick={() => onNavigate('parts')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">Component Warranties</span>
            <div className="kpi-icon-badge"><ShieldCheck size={20} /></div>
          </div>
          <div className="kpi-value">{warrantySummary.activeCount}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">Active Cover</span>
            {warrantySummary.expiringSoonCount > 0 ? (
              <span className="badge badge-warning">⚠️ {warrantySummary.expiringSoonCount} Expiring</span>
            ) : (
              <span className="badge badge-neutral">0 Expiring</span>
            )}
          </div>
        </div>

        {/* 8. HVAC & Facilities */}
        <div className="kpi-card" onClick={() => onNavigate('ac')} role="button" tabIndex={0}>
          <div className="kpi-header">
            <span className="kpi-title">HVAC & Floor Plan</span>
            <div className="kpi-icon-badge"><Wind size={20} /></div>
          </div>
          <div className="kpi-value">{acService.getACUnits().length}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">Interactive Blueprint</span>
            <span className="badge badge-neutral">Chilaw Office</span>
          </div>
        </div>
      </div>

      {/* Financial Budget & Bill Reconciliation Vault */}
      <div className="section-panel mt-6">
        <div className="section-panel-header">
          <div className="flex items-center gap-2.5">
            <div className="reconciliation-header-icon">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Office Budget & Verified Invoice Reconciliation</h3>
              <span className="text-muted text-xs block">
                Cross-audit between Official Vendor Bills (PDF Vault) and Office Operating Expenses
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {reconciliation.isBalanced ? (
              <span className="badge badge-success font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> 100% Balanced & Reconciled (Rs. 0 Discrepancy)
              </span>
            ) : (
              <span className="badge badge-danger font-semibold flex items-center gap-1">
                <AlertTriangle size={13} /> Discrepancy: Rs. {Math.abs(reconciliation.discrepancy).toLocaleString()}
              </span>
            )}
            <button className="btn-link text-xs" onClick={() => onNavigate('invoices')}>
              Open Invoices Vault ({reconciliation.invoicesCount})
            </button>
          </div>
        </div>

        {/* 3 Metrics comparison cards */}
        <div className="reconciliation-cards-grid">
          <div className="reconciliation-metric-card">
            <div className="reconciliation-card-title">Total Invoiced Bills (Vault)</div>
            <div className="reconciliation-card-value text-emerald">
              Rs. {reconciliation.totalInvoiced.toLocaleString()}
            </div>
            <div className="reconciliation-card-sub">
              {reconciliation.invoicesCount} Official vendor receipts & bills securely stored
            </div>
          </div>

          <div className="reconciliation-metric-card">
            <div className="reconciliation-card-title">Total Office Expenses (Ledger)</div>
            <div className="reconciliation-card-value text-emerald">
              Rs. {reconciliation.totalExpenses.toLocaleString()}
            </div>
            <div className="reconciliation-card-sub">
              Repairs: Rs. {financialSummary.repairExpenses.toLocaleString()} • Toners: Rs. {financialSummary.consumableExpenses.toLocaleString()} • Upgrades: Rs. {hardwareUpgradeExpenses.toLocaleString()}
            </div>
          </div>

          <div className="reconciliation-metric-card">
            <div className="reconciliation-card-title">Reconciliation Audit</div>
            {reconciliation.isBalanced ? (
              <>
                <div className="reconciliation-card-value text-emerald flex items-center gap-1.5">
                  <CheckCircle2 size={22} className="text-emerald" /> 100% Balanced
                </div>
                <div className="reconciliation-card-sub">
                  Zero budget discrepancy • Every bill is matched to physical hardware & expense records
                </div>
              </>
            ) : (
              <>
                <div className="reconciliation-card-value text-amber flex items-center gap-1.5">
                  <AlertTriangle size={22} className="text-amber" /> Rs. {Math.abs(reconciliation.discrepancy).toLocaleString()} Mismatch
                </div>
                <div className="reconciliation-card-sub text-amber">
                  Discrepancy detected • Vault bills (Rs. {reconciliation.totalInvoiced.toLocaleString()}) vs Ledger (Rs. {reconciliation.totalExpenses.toLocaleString()})
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Access Bill Strip */}
        <div className="mt-4 pt-3 border-t border-subtle">
          <div className="text-xs font-semibold text-muted mb-2 flex items-center justify-between">
            <span>Verified Official PDF Bills & Invoices</span>
            <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => onNavigate('invoices')}>
              View All Bills in Vault ({allInvoices.length}) →
            </span>
          </div>
          <div className="vault-bills-strip-grid">
            {allInvoices.map(inv => (
              <div 
                key={inv.InvoiceID}
                onClick={() => handleOpenInvoice(inv.InvoiceID)}
                className="vault-bill-chip hover-highlight"
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{inv.InvoiceNumber}</span>
                  <span className="text-xs text-muted">{formatDisplayDate(inv.InvoiceDate)}</span>
                </div>
                <div className="text-xs text-primary-heading font-medium truncate" title={inv.Supplier}>
                  {inv.Supplier}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="font-mono font-bold text-emerald">Rs. {Number(inv.Amount).toLocaleString()}</span>
                  <span className="text-xs text-primary flex items-center gap-0.5">
                    <FileText size={11} /> View PDF
                  </span>
                </div>
              </div>
            ))}
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

      {/* Hardware Component Warranties & Expiration Tracker */}
      <div className="section-panel mt-6">
        <div className="section-panel-header">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-emerald/15 text-emerald border border-emerald/30">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Hardware Component Warranties & Days Remaining</h3>
              <span className="text-muted text-xs block">
                Warranty duration tracking for replaced & installed hardware parts (RAM, SSD, Batteries, etc.)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success font-semibold">
              {warrantySummary.activeCount} Active Warranties
            </span>
            {warrantySummary.expiringSoonCount > 0 && (
              <span className="badge badge-warning font-semibold">
                ⚠️ {warrantySummary.expiringSoonCount} Expiring Soon
              </span>
            )}
            <button className="btn-link text-xs" onClick={() => onNavigate('parts')}>
              Open Parts Registry ({warrantySummary.totalWarrantiedParts})
            </button>
          </div>
        </div>

        {warrantySummary.totalWarrantiedParts === 0 ? (
          <div className="p-6 text-center text-muted text-sm">
            No component warranty records logged yet. Use "Log Repair / Issue" to add parts with warranty tracking.
          </div>
        ) : (
          <div className="warranty-parts-grid">
            {warrantySummary.warrantyParts.map(part => {
              const days = part.WarrantyRemainingDays;
              const isExpiring = part.WarrantyBadgeType === 'expiring-soon';

              return (
                <div 
                  key={part.PartID} 
                  className={`warranty-part-card ${isExpiring ? 'expiring-soon' : ''}`}
                >
                  <div>
                    {/* Top Row: Component Type & Days Remaining Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="part-tag-item">
                        <Cpu size={12} /> {part.PartType}
                      </span>
                      {days !== null ? (
                        <span className={`warranty-countdown-pill ${
                          days > 60 ? 'active' : days >= 0 ? 'expiring' : 'expired'
                        }`}>
                          <Clock size={12} />
                          {days > 60 
                            ? `${days.toLocaleString()} Days Left`
                            : days >= 0
                              ? `⚠️ ${days} Days Left`
                              : `Expired`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">No Expiry</span>
                      )}
                    </div>

                    {/* Installed Part Specifications */}
                    <div className="font-semibold text-white text-sm">
                      {part.NewPartDetails}
                    </div>
                    {part.NewPartSerial && part.NewPartSerial !== 'N/A' && (
                      <div className="text-xs text-muted font-mono mt-0.5">
                        S/N: {part.NewPartSerial}
                      </div>
                    )}

                    {/* Host Machine & Assigned Employee */}
                    <div className="text-xs text-secondary mt-2 flex flex-col gap-0.5">
                      <div>
                        Installed on: <strong className="text-primary">{part.Brand} {part.Model}</strong> ({part.VerifiedNo})
                      </div>
                      <div className="text-muted">
                        User: <span className="text-primary font-medium">{part.AssignedUserName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Provider & Invoice Link */}
                  <div className="pt-2 border-t border-subtle flex items-center justify-between text-xs">
                    <span className="text-muted">
                      🛡️ {part.WarrantyPeriod} ({part.WarrantyProvider || 'Vendor'})
                    </span>
                    {part.InvoiceID ? (
                      <button 
                        type="button" 
                        className="invoice-clickable-btn" 
                        title={`View Invoice ${part.InvoiceNumber || part.InvoiceID}`}
                        onClick={() => handleOpenInvoice(part.InvoiceID)}
                      >
                        <FileText size={12} /> {part.InvoiceNumber || part.InvoiceID}
                      </button>
                    ) : (
                      <span className="text-xs text-muted italic">No invoice</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal for instant document viewing */}
      <InvoiceViewerModal
        invoice={selectedInvoice}
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
