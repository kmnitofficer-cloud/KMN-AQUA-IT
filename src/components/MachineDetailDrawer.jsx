import React from 'react';
import { 
  X, 
  Printer, 
  Wrench, 
  Edit, 
  Calendar, 
  User, 
  Building2, 
  Tag, 
  HardDrive, 
  Clock 
} from 'lucide-react';

export default function MachineDetailDrawer({
  isOpen,
  onClose,
  machine,
  services = [],
  role,
  onEditMachine,
  onAddService
}) {
  if (!isOpen || !machine) return null;

  // Filter services related to this machine
  const machineServices = services.filter(s => {
    if (machine.verified_no && s.verified_no && machine.verified_no.toLowerCase() === s.verified_no.toLowerCase()) {
      return true;
    }
    if (machine.item_name && s.device_name && machine.item_name.toLowerCase() === s.device_name.toLowerCase()) {
      return true;
    }
    return false;
  });

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Label - ${machine.verified_no || machine.item_name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; text-align: center; }
            .label { border: 2px solid #000; padding: 15px; width: 300px; margin: 0 auto; border-radius: 8px; }
            .co { font-size: 11px; font-weight: bold; letter-spacing: 1px; color: #16A34A; }
            .tag { font-size: 20px; font-family: monospace; font-weight: bold; margin: 8px 0; }
            .name { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
            .user { font-size: 11px; color: #555; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="co">KMN AQUA SERVICES (PVT) LTD</div>
            <div class="tag">${machine.verified_no || 'NO ASSET TAG'}</div>
            <div class="name">${machine.item_name}</div>
            <div class="user">Location: ${machine.office} | ${machine.assigned_to || 'Unassigned'}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('work') && !s.includes('not')) return 'working';
    if (s.includes('service')) return 'service';
    if (s.includes('not in use')) return 'not-in-use';
    return 'not-working';
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <span className="brand-subtitle" style={{ fontSize: '0.7rem' }}>ASSET PROFILE</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>{machine.item_name}</h2>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="drawer-body">
          {/* Asset Card Preview */}
          <div className="asset-card-preview">
            <div className="company-name">KMN AQUA SERVICES (PVT) LTD</div>
            <div className="asset-barcode">{machine.verified_no || 'NO-ASSET-TAG'}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{machine.item_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {machine.office} &bull; {machine.assigned_to || 'General Pool'}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrintLabel}
              style={{ position: 'absolute', top: '12px', right: '12px' }}
              title="Print Asset Label Sticker"
            >
              <Printer size={13} />
              <span>Print Label</span>
            </button>
          </div>

          {/* Machine Details Grid */}
          <div className="detail-section" style={{ marginTop: '1.5rem' }}>
            <div className="detail-section-title">Hardware & Location Details</div>
            <div className="detail-kv-grid">
              <div className="detail-kv-item">
                <span className="detail-key">Asset Tag / Verified No</span>
                <span className="detail-val">
                  {machine.verified_no ? (
                    <span className="tag-verified">{machine.verified_no}</span>
                  ) : 'Unassigned'}
                </span>
              </div>

              <div className="detail-kv-item">
                <span className="detail-key">Current Status</span>
                <span className="detail-val">
                  <span className={`badge-status ${getStatusClass(machine.status)}`}>
                    {machine.status || 'Working'}
                  </span>
                </span>
              </div>

              <div className="detail-kv-item">
                <span className="detail-key">Branch / Office</span>
                <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={14} color="var(--text-muted)" />
                  {machine.office}
                </span>
              </div>

              <div className="detail-kv-item">
                <span className="detail-key">Assigned User / Department</span>
                <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} color="var(--text-muted)" />
                  {machine.assigned_to || 'Unassigned'}
                </span>
              </div>

              <div className="detail-kv-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-key">Hardware Category</span>
                <span className="detail-val">{machine.category || 'Accessory'}</span>
              </div>
            </div>
          </div>

          {/* Specifications & Remarks */}
          <div className="detail-section">
            <div className="detail-section-title">Specifications & Remarks</div>
            <div style={{
              background: 'var(--bg-surface-elevated)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {machine.remarks || 'No specific hardware notes or remarks provided for this device.'}
            </div>
          </div>

          {/* Service & Maintenance History */}
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div className="detail-section-title" style={{ margin: 0 }}>Service & Maintenance History</div>
              {role === 'admin' && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onAddService(machine)}
                  style={{ color: 'var(--brand-primary)', padding: '2px 8px' }}
                >
                  <Wrench size={12} />
                  <span>Log Service</span>
                </button>
              )}
            </div>

            {machineServices.length === 0 ? (
              <div style={{
                background: 'var(--bg-surface-elevated)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                No maintenance records logged for this computer yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {machineServices.map(srv => (
                  <div
                    key={srv.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {srv.service_date || 'Date N/A'}
                      </span>
                      <strong style={{ color: 'var(--accent-emerald)' }}>
                        {srv.charges ? `Rs. ${Number(srv.charges).toLocaleString()}` : 'Free / Under Warranty'}
                      </strong>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{srv.service_details}</div>
                    {srv.vendor_remarks && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Vendor: {srv.vendor_remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        {role === 'admin' && (
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onEditMachine(machine);
              }}
            >
              <Edit size={14} />
              <span>Edit Details</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onAddService(machine);
              }}
            >
              <Wrench size={14} />
              <span>Log Service Record</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
