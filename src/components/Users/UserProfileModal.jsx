import React, { useState, useEffect } from 'react';
import { X, User, Laptop, Clock, DollarSign, Shield, Phone, Mail, MapPin, Building, Printer, Plus, RefreshCw, Archive, CheckCircle2, Key, Eye, EyeOff, Copy, Check, Edit2 } from 'lucide-react';
import { userService } from '../../services/userService';
import { assetService } from '../../services/assetService';
import { dbRepository } from '../../services/dbRepository';
import { authService } from '../../services/authService';
import ReassignModal from '../Assignments/ReassignModal';
import UserFormModal from './UserFormModal';

export default function UserProfileModal({ userId, isOpen, onClose, onSelectAsset, role }) {
  const isAdmin = (role || authService.getCurrentUser()?.role) === 'admin';
  const [refreshKey, setRefreshKey] = useState(0);
  const [reassignAssetId, setReassignAssetId] = useState(null);
  const [reassignMode, setReassignMode] = useState('return');
  const [preselectedUserId, setPreselectedUserId] = useState('');
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [historyTab, setHistoryTab] = useState('all'); // 'all', 'returned', 'current'

  useEffect(() => {
    const unsub = dbRepository.subscribe(() => {
      setRefreshKey(k => k + 1);
    });
    return unsub;
  }, []);

  if (!isOpen || !userId) return null;

  const user = userService.getUserById(userId);
  if (!user) return null;

  const currentAssets = userService.getUserCurrentAssets(userId);
  const assignmentHistory = userService.getUserAssignmentHistory(userId);
  const costs = userService.getUserCosts(userId);
  const allAssets = assetService.getAssets('All');
  const sharedBranchPrinters = allAssets.filter(a =>
    (a.AssetType === 'Printer' || a.IsSharedNetwork) &&
    (a.CurrentLocationID === user.OfficeLocationID || a.CurrentUserID === 'SHARED_NETWORK')
  );

  const returnedHistory = assignmentHistory.filter(a => a.AssignmentStatus === 'Returned' || a.ReturnedDate);
  const activeHistory = assignmentHistory.filter(a => a.AssignmentStatus === 'Current' && !a.ReturnedDate);

  const displayedHistory = historyTab === 'returned' 
    ? returnedHistory 
    : historyTab === 'current' 
    ? activeHistory 
    : assignmentHistory;

  const handleOpenReturn = (assetId) => {
    setReassignAssetId(assetId);
    setReassignMode('return');
    setPreselectedUserId('');
    setIsReassignOpen(true);
  };

  const handleOpenAssignNew = () => {
    setReassignAssetId(null);
    setReassignMode('reassign');
    setPreselectedUserId(userId);
    setIsReassignOpen(true);
  };

  const handleCopyPassword = (pwd) => {
    if (!pwd) return;
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="profile-modal-header">
          <div className="profile-header-info">
            <div className="avatar-circle">{user.Name.charAt(0) || 'U'}</div>
            <div>
              <h2>{user.Name}</h2>
              <div className="profile-sub-badges">
                <span className="badge badge-primary">{user.UserID}</span>
                <span className="badge badge-neutral">{user.EmployeeID || 'N/A'}</span>
                <span className={`badge ${user.Status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {user.Status}
                </span>
                <span className="text-muted text-sm">{user.JobTitle}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                className="btn btn-outline btn-sm flex items-center gap-1.5"
                onClick={() => setIsEditUserOpen(true)}
                title="Edit Employee & Password"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
            <button className="icon-btn" onClick={onClose} title="Close Profile">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="profile-modal-body">
          {/* Metadata Grid */}
          <div className="profile-meta-grid">
            <div className="meta-card">
              <Mail size={16} className="text-muted" />
              <div>
                <span className="meta-label">Email</span>
                <span className="meta-val">{user.Email || 'None'}</span>
              </div>
            </div>
            <div className="meta-card">
              <Phone size={16} className="text-muted" />
              <div>
                <span className="meta-label">Phone</span>
                <span className="meta-val">{user.Phone || 'None'}</span>
              </div>
            </div>
            <div className="meta-card">
              <Building size={16} className="text-muted" />
              <div>
                <span className="meta-label">Department</span>
                <span className="meta-val">{user.DepartmentID || 'General'}</span>
              </div>
            </div>
            <div className="meta-card">
              <MapPin size={16} className="text-muted" />
              <div>
                <span className="meta-label">Office Location</span>
                <span className="meta-val">{user.OfficeLocationID === 'LOC-0001' ? 'Chilaw Office' : user.OfficeLocationID === 'LOC-0002' ? 'Palaviya Office' : 'HR Lobby'}</span>
              </div>
            </div>
            {/* Machine / PC Password Card */}
            <div className="meta-card" style={{ gridColumn: 'span 2', backgroundColor: 'var(--bg-surface-elevated, #f8fafc)', border: '1px solid var(--border-subtle, #e2e8f0)' }}>
              <Key size={18} className="text-primary" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="meta-label" style={{ fontWeight: 600 }}>Machine / PC Login Password</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {user.PCPassword && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => setShowPassword(v => !v)}
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                          <span>{showPassword ? "Hide" : "Show"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          onClick={() => handleCopyPassword(user.PCPassword)}
                          title="Copy password to clipboard"
                        >
                          {copiedPassword ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                          <span>{copiedPassword ? "Copied!" : "Copy"}</span>
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--brand-primary)' }}
                        onClick={() => setIsEditUserOpen(true)}
                        title="Update PC Password"
                      >
                        <Edit2 size={12} />
                        <span>{user.PCPassword ? "Change" : "Set Password"}</span>
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {user.PCPassword ? (
                    <span className="font-mono font-bold text-sm" style={{ letterSpacing: showPassword ? 'normal' : '0.18em', color: showPassword ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
                      {showPassword ? user.PCPassword : '••••••••••••'}
                    </span>
                  ) : (
                    <span className="text-muted text-xs italic">
                      {isAdmin ? 'No PC password recorded for this user. Click "Set Password" to add.' : 'No PC password recorded for this user.'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Financial & Cost Attribution Card */}
          <div className="profile-cost-box mt-6">
            <div className="cost-box-header">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald" />
                <h3>Financial & Equipment Cost Attribution</h3>
              </div>
              <span className="cost-box-total">
                Total Associated: <strong>Rs. {costs.totalCost.toLocaleString()}</strong>
              </span>
            </div>
            <div className="cost-box-breakdown">
              <div className="cost-item">
                <span className="cost-item-label">Currently Held Assets</span>
                <span className="cost-item-val">{costs.currentAssetsCount} items</span>
              </div>
              <div className="cost-item">
                <span className="cost-item-label">Historical Handovers</span>
                <span className="cost-item-val">{costs.historicalAssetsCount} records</span>
              </div>
              <div className="cost-item">
                <span className="cost-item-label">Repairs on Assigned Devices</span>
                <span className="cost-item-val text-amber">Rs. {costs.repairCosts.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-item-label">Accessories (Peripherals)</span>
                <span className="cost-item-val">Rs. {costs.accessoriesCost.toLocaleString()}</span>
              </div>
              <div className="cost-item">
                <span className="cost-item-label">Direct User Expenses</span>
                <span className="cost-item-val">Rs. {costs.directExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Current Assigned Assets */}
          <div className="profile-section mt-6">
            <div className="section-title-bar">
              <div className="flex items-center gap-2">
                <Laptop size={18} className="text-primary" />
                <h3>Current Active Assets ({currentAssets.length})</h3>
              </div>
              {isAdmin && (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                  onClick={handleOpenAssignNew}
                >
                  <Plus size={15} /> Hand Over / Assign Equipment
                </button>
              )}
            </div>

            {currentAssets.length === 0 ? (
              <div className="empty-panel">
                <p>No active hardware devices currently assigned to this user.</p>
              </div>
            ) : (
              <div className="current-assets-grid">
                {currentAssets.map(a => (
                  <div key={a.AssetID} className="current-asset-card" onClick={() => onSelectAsset(a.AssetID)}>
                    <div className="asset-card-top">
                      <span className="asset-card-type">{a.AssetType}</span>
                      <span className="asset-card-tag">{a.VerifiedNo || 'UNTAGGED'}</span>
                    </div>
                    <span className="asset-card-model">{assetService.getCleanHardwareName(a)}</span>
                    <span className="asset-card-id">{a.AssetID}</span>
                    <div className="asset-card-footer flex justify-between items-center mt-3 pt-2 border-t border-slate-700/30">
                      <span>Status: <strong className="text-emerald">{a.Status}</strong></span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs flex items-center gap-1 text-cyan hover:bg-cyan/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReturn(a.AssetID);
                            }}
                            title="Remove desktop/device, return to storage, and make available for others"
                          >
                            <RefreshCw size={12} /> Return / Swap
                          </button>
                        )}
                        <span className="text-cyan text-xs cursor-pointer hover:underline">Timeline ➔</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 1b: Branch Network Printers & Shared Equipment */}
          {sharedBranchPrinters.length > 0 && (
            <div className="profile-section mt-6">
              <div className="section-title-bar">
                <div className="flex items-center gap-2">
                  <Printer size={18} className="text-cyan" />
                  <h3>Branch Network Printers & Shared Equipment ({sharedBranchPrinters.length})</h3>
                </div>
                <span className="badge badge-primary">🌐 Shared in Branch</span>
              </div>

              <div className="current-assets-grid">
                {sharedBranchPrinters.map(a => (
                  <div key={a.AssetID} className="current-asset-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }} onClick={() => onSelectAsset(a.AssetID)}>
                    <div className="asset-card-top">
                      <span className="asset-card-type text-cyan">🌐 Network Shared</span>
                      <span className="asset-card-tag">{a.VerifiedNo || 'Shared'}</span>
                    </div>
                    <span className="asset-card-model">{assetService.getCleanHardwareName(a)}</span>
                    <span className="asset-card-id">{a.AssetID} • {a.LocationName}</span>
                    <div className="asset-card-footer">
                      <span className="text-emerald">Status: <strong>Network Active</strong></span>
                      <span className="text-cyan">View Printer ➔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Complete Historical Record (Never Overwritten) */}
          <div className="profile-section mt-6">
            <div className="section-title-bar">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-violet" />
                <h3>Assignment History & Audit Trail ({assignmentHistory.length})</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="filter-tabs" style={{ margin: 0, padding: 0 }}>
                  <button
                    type="button"
                    className={`filter-tab text-xs py-1 px-2.5 ${historyTab === 'all' ? 'active' : ''}`}
                    onClick={() => setHistoryTab('all')}
                  >
                    All ({assignmentHistory.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-tab text-xs py-1 px-2.5 ${historyTab === 'returned' ? 'active' : ''}`}
                    onClick={() => setHistoryTab('returned')}
                  >
                    Past Equipment ({returnedHistory.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-tab text-xs py-1 px-2.5 ${historyTab === 'current' ? 'active' : ''}`}
                    onClick={() => setHistoryTab('current')}
                  >
                    Active Holdings ({activeHistory.length})
                  </button>
                </div>
                <span className="badge badge-neutral">Permanent Log</span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset Details</th>
                    <th>Tag / Verified No</th>
                    <th>Assigned Date</th>
                    <th>Returned Date</th>
                    <th>Custody Status</th>
                    <th>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-muted">
                        No records found in this category.
                      </td>
                    </tr>
                  ) : (
                    displayedHistory.map(asgn => (
                      <tr key={asgn.AssignmentID}>
                        <td>
                          <strong>{asgn.Brand} {asgn.Model}</strong>
                          <div className="text-muted text-xs">{asgn.AssetID} • {asgn.AssetType}</div>
                        </td>
                        <td>
                          <span className="tag-pill font-mono">{asgn.VerifiedNo || 'UNTAGGED'}</span>
                        </td>
                        <td><span className="font-mono text-xs">{asgn.AssignedDate || 'N/A'}</span></td>
                        <td>
                          {asgn.ReturnedDate ? (
                            <span className="badge badge-warning font-mono text-xs">
                              Returned: {asgn.ReturnedDate}
                            </span>
                          ) : (
                            <span className="badge badge-success text-xs">
                              Currently in Custody
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${asgn.AssignmentStatus === 'Current' ? 'badge-primary' : 'badge-neutral'}`}>
                            {asgn.AssignmentStatus === 'Returned' ? '📦 Returned to Storage' : asgn.AssignmentStatus}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm font-medium">{asgn.Reason || 'Assigned'}</div>
                          {asgn.ConditionWhenReturned && (
                            <div className="text-xs text-muted">Return condition: {asgn.ConditionWhenReturned}</div>
                          )}
                          {asgn.Notes && (
                            <div className="text-xs text-amber">{asgn.Notes}</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal-embedded Reassignment / Return Tool */}
        <ReassignModal
          assetId={reassignAssetId}
          initialMode={reassignMode}
          preselectedUserId={preselectedUserId}
          isOpen={isReassignOpen}
          onClose={() => setIsReassignOpen(false)}
          onCompleted={() => setRefreshKey(k => k + 1)}
        />

        {/* Modal-embedded User Edit Form */}
        <UserFormModal
          isOpen={isEditUserOpen}
          onClose={() => setIsEditUserOpen(false)}
          user={user}
          onSaved={() => setRefreshKey(k => k + 1)}
          defaultLocationId={user.OfficeLocationID || 'LOC-0001'}
        />
      </div>
    </div>
  );
}
