import React, { useState } from 'react';
import { History, Search, RefreshCw, Filter, CheckCircle2, User, Laptop, CornerDownLeft } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { formatDisplayDate } from '../../utils/dateUtils';
import ReassignModal from './ReassignModal';

export default function AssignmentsView() {
  const [filter, setFilter] = useState('All'); // 'All', 'Current', 'Returned'
  const [search, setSearch] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [reassignMode, setReassignMode] = useState('reassign');
  const [isReassignOpen, setIsReassignOpen] = useState(false);

  const assignments = assignmentService.getAssignments();

  const filteredAssignments = assignments.filter(asgn => {
    if (filter === 'Current' && asgn.AssignmentStatus !== 'Current') return false;
    if (filter === 'Returned' && asgn.AssignmentStatus !== 'Returned') return false;

    const q = search.toLowerCase();
    return (
      (asgn.UserName && asgn.UserName.toLowerCase().includes(q)) ||
      (asgn.Model && asgn.Model.toLowerCase().includes(q)) ||
      (asgn.VerifiedNo && asgn.VerifiedNo.toLowerCase().includes(q)) ||
      (asgn.AssetID && asgn.AssetID.toLowerCase().includes(q)) ||
      (asgn.AssignmentID && asgn.AssignmentID.toLowerCase().includes(q)) ||
      (asgn.Reason && asgn.Reason.toLowerCase().includes(q))
    );
  });

  const handleOpenReassign = (assetId) => {
    setSelectedAssetId(assetId);
    setReassignMode('reassign');
    setIsReassignOpen(true);
  };

  const handleOpenReturn = (assetId) => {
    setSelectedAssetId(assetId);
    setReassignMode('return');
    setIsReassignOpen(true);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Chain of Custody & Assignment History</h2>
          <p className="text-muted">
            Complete, immutable audit trail of every device handover, reassignment, and return since office inception.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenReassign(null)}>
            <RefreshCw size={16} /> + Hand Over / Assign Equipment to Staff
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Logs ({assignments.length})
          </button>
          <button
            className={`filter-tab ${filter === 'Current' ? 'active' : ''}`}
            onClick={() => setFilter('Current')}
          >
            Active Holdings ({assignments.filter(a => a.AssignmentStatus === 'Current').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Returned' ? 'active' : ''}`}
            onClick={() => setFilter('Returned')}
          >
            Historical / Handed Over ({assignments.filter(a => a.AssignmentStatus === 'Returned').length})
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by employee, tag, device, or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Assignment ID</th>
                <th>Device / Hardware</th>
                <th>Verified Tag</th>
                <th>Assigned Staff</th>
                <th>Location</th>
                <th>Assigned Date</th>
                <th>Returned Date</th>
                <th>Status</th>
                <th>Reason & Remarks</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-8 text-muted">
                    No assignment records found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map(asgn => (
                  <tr key={asgn.AssignmentID}>
                    <td><span className="id-pill">{asgn.AssignmentID}</span></td>
                    <td>
                      <div>
                        <span className="font-semibold">{asgn.Brand} {asgn.Model}</span>
                        <div className="text-xs text-muted">{asgn.AssetID} • {asgn.AssetType}</div>
                      </div>
                    </td>
                    <td>
                      <span className="tag-pill font-mono">{asgn.VerifiedNo || 'UNTAGGED'}</span>
                    </td>
                    <td>
                      <span className="font-medium text-primary">{asgn.UserName}</span>
                    </td>
                    <td><span className="location-pill">{asgn.LocationName}</span></td>
                    <td><span className="font-mono text-xs">{formatDisplayDate(asgn.AssignedDate)}</span></td>
                    <td>
                      {asgn.ReturnedDate ? (
                        <span className="text-muted font-mono text-xs">{formatDisplayDate(asgn.ReturnedDate)}</span>
                      ) : (
                        <span className="badge badge-success">Currently Held</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${asgn.AssignmentStatus === 'Current' ? 'badge-primary' : 'badge-neutral'}`}>
                        {asgn.AssignmentStatus}
                      </span>
                    </td>
                    <td>
                      <div>{asgn.Reason || 'Standard Handover'}</div>
                      {asgn.ConditionWhenReturned && (
                        <div className="text-xs text-muted">Returned condition: {asgn.ConditionWhenReturned}</div>
                      )}
                      {asgn.Notes && <div className="text-xs text-amber">{asgn.Notes}</div>}
                    </td>
                    <td className="text-right">
                      {asgn.AssignmentStatus === 'Current' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            className="btn btn-outline btn-xs flex items-center gap-1 text-cyan hover:bg-cyan/10"
                            onClick={() => handleOpenReturn(asgn.AssetID)}
                            title="Return device to storage & make available for new staff"
                          >
                            <CornerDownLeft size={12} /> Return
                          </button>
                          <button
                            className="btn btn-outline btn-xs flex items-center gap-1"
                            onClick={() => handleOpenReassign(asgn.AssetID)}
                            title="Transfer custody to another employee"
                          >
                            <RefreshCw size={12} /> Reassign
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Modal */}
      <ReassignModal
        assetId={selectedAssetId}
        initialMode={reassignMode}
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
      />
    </div>
  );
}
