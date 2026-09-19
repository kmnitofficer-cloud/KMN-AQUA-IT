import React, { useState } from 'react';
import { 
  X, 
  Wrench, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Save, 
  Calendar, 
  DollarSign 
} from 'lucide-react';
import { exportFullWorkbook } from '../utils/excelHelper';

export default function ServiceLogsModal({
  isOpen,
  onClose,
  services,
  machines,
  role,
  onSaveService,
  onDeleteService,
  prefillMachine,
  showToast
}) {
  const [isAddingOrEditing, setIsAddingOrEditing] = useState(Boolean(prefillMachine));
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [formData, setFormData] = useState({
    device_name: prefillMachine?.item_name || '',
    verified_no: prefillMachine?.verified_no || '',
    assigned_to: prefillMachine?.assigned_to || '',
    service_details: '',
    charges: '',
    vendor_remarks: 'KMN IT Solution',
    service_date: new Date().toISOString().substring(0, 10),
    next_service: ''
  });

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingServiceId(null);
    setFormData({
      device_name: prefillMachine?.item_name || '',
      verified_no: prefillMachine?.verified_no || '',
      assigned_to: prefillMachine?.assigned_to || '',
      service_details: '',
      charges: '',
      vendor_remarks: 'KMN IT Solution',
      service_date: new Date().toISOString().substring(0, 10),
      next_service: ''
    });
    setIsAddingOrEditing(true);
  };

  const handleStartEdit = (srv) => {
    setEditingServiceId(srv.id);
    setFormData({
      device_name: srv.device_name || '',
      verified_no: srv.verified_no || '',
      assigned_to: srv.assigned_to || '',
      service_details: srv.service_details || '',
      charges: srv.charges || '',
      vendor_remarks: srv.vendor_remarks || 'KMN IT Solution',
      service_date: srv.service_date || new Date().toISOString().substring(0, 10),
      next_service: srv.next_service || ''
    });
    setIsAddingOrEditing(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.device_name.trim() || !formData.service_details.trim()) {
      alert('Please provide device name and service details.');
      return;
    }

    const payload = {
      id: editingServiceId || `srv-${Date.now()}`,
      ...formData,
      charges: formData.charges ? Number(formData.charges) : 0,
    };

    onSaveService(payload);
    setIsAddingOrEditing(false);
    setEditingServiceId(null);
    showToast(editingServiceId ? 'Service record updated' : 'New service logged', 'success');
  };

  const handleExportServices = () => {
    exportFullWorkbook(machines, services, 'KMN_IT_Asset_and_Services_Master.xlsx');
    showToast('Exported Master Workbook to Excel!', 'success');
  };

  const totalSpend = services.reduce((sum, s) => sum + (Number(s.charges) || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Wrench size={18} color="var(--accent-amber)" />
            <span>IT Service & Maintenance Records</span>
          </h3>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Summary Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            background: 'var(--bg-surface-elevated)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Maintenance Spend</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                Rs. {totalSpend.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleExportServices}
                title="Download complete multi-sheet Excel report"
              >
                <FileSpreadsheet size={14} />
                <span>Export Master Report (.xlsx)</span>
              </button>

              {role === 'admin' && !isAddingOrEditing && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleStartAdd}
                >
                  <Plus size={14} />
                  <span>Log New Service</span>
                </button>
              )}
            </div>
          </div>

          {/* Form for adding/editing */}
          {isAddingOrEditing && (
            <form onSubmit={handleSubmit} style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--brand-primary)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={16} color="var(--brand-primary)" />
                <span>{editingServiceId ? 'Edit Service Record' : 'Record New Repair / Maintenance'}</span>
              </h4>

              <div className="form-grid">
                <div className="form-group">
                  <label>Device Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Canon imageCLASS MF249dw, HP Laptop, UNA UPS"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Verified No / Asset Tag</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. KMN/CH/CP/005"
                    value={formData.verified_no}
                    onChange={(e) => setFormData({ ...formData, verified_no: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Assigned User / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. HR Lobby, Mr. Shenash, Ms. Hiruni"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Service / Repair Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Service Details / Work Done *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Replaced toner cartridge, Installed 8GB DDR4 RAM, Sent to agent for power issue"
                    value={formData.service_details}
                    onChange={(e) => setFormData({ ...formData, service_details: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Charges / Cost (Rs.)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 9500"
                    value={formData.charges}
                    onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Serviced By / Vendor Remarks</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. KMN IT Solution, External Agent"
                    value={formData.vendor_remarks}
                    onChange={(e) => setFormData({ ...formData, vendor_remarks: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Next Service Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.next_service}
                    onChange={(e) => setFormData({ ...formData, next_service: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsAddingOrEditing(false);
                    setEditingServiceId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Save size={14} />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          )}

          {/* Service Records Table */}
          <div className="table-container">
            <table className="excel-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Date</th>
                  <th style={{ width: '140px' }}>Verified No</th>
                  <th>Device Name</th>
                  <th style={{ width: '130px' }}>Location / User</th>
                  <th>Service Details</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>Charges (Rs)</th>
                  <th style={{ width: '130px' }}>Vendor</th>
                  {role === 'admin' && <th style={{ width: '80px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'admin' ? 8 : 7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No service records logged yet.
                    </td>
                  </tr>
                ) : (
                  services.map((srv) => (
                    <tr key={srv.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {srv.service_date || '—'}
                      </td>
                      <td>
                        {srv.verified_no ? (
                          <span className="tag-verified">{srv.verified_no}</span>
                        ) : '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{srv.device_name}</td>
                      <td>{srv.assigned_to || 'General'}</td>
                      <td>{srv.service_details}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                        {srv.charges ? Number(srv.charges).toLocaleString() : '0.00'}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{srv.vendor_remarks || '—'}</td>
                      {role === 'admin' && (
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ width: '26px', height: '26px' }}
                              onClick={() => handleStartEdit(srv)}
                              title="Edit"
                            >
                              <Wrench size={12} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              style={{ width: '26px', height: '26px', color: 'var(--accent-rose)' }}
                              onClick={() => {
                                if (window.confirm(`Delete service record for ${srv.device_name}?`)) {
                                  onDeleteService(srv.id);
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
