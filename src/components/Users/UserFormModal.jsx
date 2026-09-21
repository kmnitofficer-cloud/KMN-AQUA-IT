import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { userService } from '../../services/userService';

export default function UserFormModal({ isOpen, onClose, user = null, onSaved }) {
  const [formData, setFormData] = useState({
    Name: '',
    EmployeeID: '',
    DepartmentID: 'DEP-0001',
    JobTitle: '',
    Phone: '',
    Email: '',
    OfficeLocationID: 'LOC-0001',
    Status: 'Active',
    JoinDate: new Date().toISOString().split('T')[0],
    Notes: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        UserID: user.UserID,
        Name: user.Name || '',
        EmployeeID: user.EmployeeID || '',
        DepartmentID: user.DepartmentID || 'DEP-0001',
        JobTitle: user.JobTitle || '',
        Phone: user.Phone || '',
        Email: user.Email || '',
        OfficeLocationID: user.OfficeLocationID || 'LOC-0001',
        Status: user.Status || 'Active',
        JoinDate: user.JoinDate || '',
        Notes: user.Notes || ''
      });
    } else {
      setFormData({
        Name: '',
        EmployeeID: '',
        DepartmentID: 'DEP-0001',
        JobTitle: '',
        Phone: '',
        Email: '',
        OfficeLocationID: 'LOC-0001',
        Status: 'Active',
        JoinDate: new Date().toISOString().split('T')[0],
        Notes: ''
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.Name.trim()) {
      alert('Please enter a user or employee name.');
      return;
    }
    await userService.saveUser(formData);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="form-modal-container" onClick={e => e.stopPropagation()}>
        <div className="form-modal-header">
          <div className="flex items-center gap-2">
            <UserPlus size={20} className="text-primary" />
            <h2>{user ? 'Edit Employee / User Profile' : 'Register New Employee / User'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="form-modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Mr. Sampath or Ms. Dilini"
                value={formData.Name}
                onChange={e => setFormData({ ...formData, Name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Employee ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. EMP-025"
                value={formData.EmployeeID}
                onChange={e => setFormData({ ...formData, EmployeeID: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select
                className="form-input"
                value={formData.DepartmentID}
                onChange={e => setFormData({ ...formData, DepartmentID: e.target.value })}
              >
                <option value="DEP-0001">Executive & Administration</option>
                <option value="DEP-0002">Human Resources</option>
                <option value="DEP-0003">Finance & Accounts</option>
                <option value="DEP-0004">IT & Technical Solutions</option>
                <option value="DEP-0005">Quality Control & Lab</option>
                <option value="DEP-0006">Operations & Field Services</option>
              </select>
            </div>

            <div className="form-group">
              <label>Job Title / Designation</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Operations Executive"
                value={formData.JobTitle}
                onChange={e => setFormData({ ...formData, JobTitle: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Primary Office Location</label>
              <select
                className="form-input"
                value={formData.OfficeLocationID}
                onChange={e => setFormData({ ...formData, OfficeLocationID: e.target.value })}
              >
                <option value="LOC-0001">Chilaw Office (Headquarters)</option>
                <option value="LOC-0002">Palaviya Office (Branch)</option>
                <option value="LOC-0003">HR Lobby</option>
                <option value="LOC-0004">IT Store / Storage</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="form-input"
                value={formData.Status}
                onChange={e => setFormData({ ...formData, Status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Past Employee / Decommissioned)</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="user@kmnaqua.com"
                value={formData.Email}
                onChange={e => setFormData({ ...formData, Email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+94 77 123 4567"
                value={formData.Phone}
                onChange={e => setFormData({ ...formData, Phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Join Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.JoinDate}
                onChange={e => setFormData({ ...formData, JoinDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group mt-4">
            <label>Internal Notes</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Additional notes, station notes, or legacy information..."
              value={formData.Notes}
              onChange={e => setFormData({ ...formData, Notes: e.target.value })}
            ></textarea>
          </div>

          <div className="form-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Save Employee Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
