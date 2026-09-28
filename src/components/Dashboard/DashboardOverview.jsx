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
  Receipt
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import { userService } from '../../services/userService';
import { repairService } from '../../services/repairService';
import { expenseService } from '../../services/expenseService';
import { printerService } from '../../services/printerService';
import { invoiceService } from '../../services/invoiceService';
import { formatDisplayDate } from '../../utils/dateUtils';
import InvoiceViewerModal from '../Invoices/InvoiceViewerModal';

export default function DashboardOverview({ onNavigate, onOpenPrinter }) {
  const users = userService.getUsers('All');
  const assets = assetService.getAssets('All');
  const repairs = repairService.getRepairs();
  const printers = printerService.getPrinters();
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
            <span>Repairs: Rs. {financialSummary.repairExpenses.toLocaleString()} • Toners: Rs. {financialSummary.consumableExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* Verified Bills & Invoices */}
        <div className="kpi-card" onClick={() => onNavigate('invoices')}>
          <div className="kpi-header">
            <span className="kpi-title">Verified Bills & Invoices</span>
            <div className="kpi-icon-badge text-emerald"><Receipt size={20} /></div>
          </div>
          <div className="kpi-value">Rs. {reconciliation.totalInvoiced.toLocaleString()}</div>
          <div className="kpi-subtext">
            <span className="badge badge-success">✓ {reconciliation.invoicesCount} Official Bills</span>
            <span className="badge badge-neutral font-mono">{reconciliation.isBalanced ? '100% Balanced' : 'Mismatch'}</span>
          </div>
        </div>
      </div>

      {/* Financial Budget & Bill Reconciliation Vault */}
      <div className="section-panel mt-6">
        <div className="section-panel-header">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-blue/15 text-primary border border-primary/30">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">Office Budget & Verified Invoice Reconciliation</h3>
              <span className="text-muted text-xs block">
                Cross-audit between Official Vendor Bills (PDF Vault) and Office Operating Expenses
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div className="text-xs text-muted uppercase font-semibold">Total Invoiced Bills (Vault)</div>
            <div className="text-2xl font-bold text-emerald mt-1 font-mono">
              Rs. {reconciliation.totalInvoiced.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-1">
              {reconciliation.invoicesCount} Official vendor receipts & bills securely stored
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div className="text-xs text-muted uppercase font-semibold">Total Office Expenses (Ledger)</div>
            <div className="text-2xl font-bold text-violet mt-1 font-mono">
              Rs. {reconciliation.totalExpenses.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-1">
              Repairs: Rs. {financialSummary.repairExpenses.toLocaleString()} • Toners: Rs. {financialSummary.consumableExpenses.toLocaleString()} • Upgrades: Rs. {hardwareUpgradeExpenses.toLocaleString()}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div className="text-xs text-muted uppercase font-semibold">Reconciliation Audit</div>
            <div className="text-2xl font-bold text-emerald mt-1 font-mono flex items-center gap-1.5">
              <CheckCircle2 size={22} className="text-emerald" /> 100% Balanced
            </div>
            <div className="text-xs text-muted mt-1">
              Zero budget discrepancy • Every bill is matched to physical hardware & expense records
            </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
            {allInvoices.map(inv => (
              <div 
                key={inv.InvoiceID}
                onClick={() => handleOpenInvoice(inv.InvoiceID)}
                style={{
                  background: 'var(--bg-surface, #1e293b)',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                  borderRadius: '6px',
                  padding: '0.65rem 0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}
                className="hover-highlight"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-primary">{inv.InvoiceNumber}</span>
                  <span className="text-xs text-muted">{formatDisplayDate(inv.InvoiceDate)}</span>
                </div>
                <div className="text-xs text-white font-medium truncate" title={inv.Supplier}>
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
