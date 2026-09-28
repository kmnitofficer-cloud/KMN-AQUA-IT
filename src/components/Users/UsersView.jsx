import React, { useState } from 'react';
import { Users, UserPlus, Search, Shield, Laptop, Eye, Power } from 'lucide-react';
import { userService } from '../../services/userService';
import UserProfileModal from './UserProfileModal';
import UserFormModal from './UserFormModal';

export default function UsersView({ onSelectAsset }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const users = userService.getUsers(filter);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      (u.Name && u.Name.toLowerCase().includes(q)) ||
      (u.EmployeeID && u.EmployeeID.toLowerCase().includes(q)) ||
      (u.UserID && u.UserID.toLowerCase().includes(q)) ||
      (u.JobTitle && u.JobTitle.toLowerCase().includes(q)) ||
      (u.Email && u.Email.toLowerCase().includes(q))
    );
  });

  const handleOpenProfile = (userId) => {
    setSelectedUserId(userId);
    setIsProfileOpen(true);
  };

  const handleToggleStatus = async (e, userId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to toggle this user status? Historical records will remain intact.')) {
      await userService.toggleStatus(userId);
    }
  };

  return (
    <div className="view-container">
      {/* Header Bar */}
      <div className="view-header">
        <div>
          <h2>Staff & User Directory</h2>
          <p className="text-muted">
            Managing company employees, assigned workstations, and permanent assignment histories.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => { setEditingUser(null); setIsFormOpen(true); }}>
            <UserPlus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Users ({userService.getUsers('All').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Active' ? 'active' : ''}`}
            onClick={() => setFilter('Active')}
          >
            Active ({userService.getUsers('Active').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Inactive' ? 'active' : ''}`}
            onClick={() => setFilter('Inactive')}
          >
            Inactive ({userService.getUsers('Inactive').length})
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by name, EMP ID, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Users Data Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Employee</th>
                <th>User ID</th>
                <th>Employee ID</th>
                <th>Role / Designation</th>
                <th>Branch Location</th>
                <th>Current Assets</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted">
                    No matching employees or users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const currentAssets = userService.getUserCurrentAssets(u.UserID);
                  const costs = userService.getUserCosts(u.UserID);

                  return (
                    <tr
                      key={u.UserID}
                      className="cursor-pointer hover-highlight"
                      onClick={() => handleOpenProfile(u.UserID)}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar-small">{u.Name.charAt(0) || 'U'}</div>
                          <div>
                            <span className="font-semibold text-primary">{u.Name}</span>
                            <div className="text-muted text-xs">{u.Email || 'No email registered'}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="id-pill">{u.UserID}</span></td>
                      <td><span className="text-muted font-mono">{u.EmployeeID || 'N/A'}</span></td>
                      <td>{u.JobTitle || 'Office Associate'}</td>
                      <td>
                        <span className="location-pill">
                          {u.OfficeLocationID === 'LOC-0001' ? 'Chilaw Office' : u.OfficeLocationID === 'LOC-0002' ? 'Palaviya' : 'HR Lobby'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Laptop size={14} className="text-primary" />
                          <span className="font-medium">{currentAssets.length}</span>
                          <span className="text-muted text-xs">({costs.historicalAssetsCount} historical)</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.Status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          {u.Status}
                        </span>
                      </td>
                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="table-actions">
                          <button
                            className="icon-btn"
                            title="View Full Profile & Timeline"
                            onClick={() => handleOpenProfile(u.UserID)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="icon-btn"
                            title={u.Status === 'Active' ? 'Deactivate User' : 'Activate User'}
                            onClick={(e) => handleToggleStatus(e, u.UserID)}
                          >
                            <Power size={16} className={u.Status === 'Active' ? 'text-muted' : 'text-emerald'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSelectAsset={(assetId) => {
          setIsProfileOpen(false);
          if (onSelectAsset) onSelectAsset(assetId);
        }}
      />

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={editingUser}
      />
    </div>
  );
}
