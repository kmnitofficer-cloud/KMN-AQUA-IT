import React, { useState } from 'react';
import { 
  Laptop, 
  Plus, 
  Search, 
  Eye, 
  RefreshCw, 
  Wrench, 
  Filter, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Archive
} from 'lucide-react';
import { assetService } from '../../services/assetService';
import AssetProfileModal from './AssetProfileModal';
import AssetFormModal from './AssetFormModal';
import ReassignModal from '../Assignments/ReassignModal';
import RepairModal from '../Repairs/RepairModal';

export default function AssetsView({ onSelectUser }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Quick Action Modals
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [reassignAssetId, setReassignAssetId] = useState(null);

  const [isRepairOpen, setIsRepairOpen] = useState(false);
  const [repairAssetId, setRepairAssetId] = useState(null);

  const assets = assetService.getAssets(filter);

  const filteredAssets = assets.filter(a => {
    const q = search.toLowerCase();
    return (
      (a.Model && a.Model.toLowerCase().includes(q)) ||
      (a.Brand && a.Brand.toLowerCase().includes(q)) ||
      (a.VerifiedNo && a.VerifiedNo.toLowerCase().includes(q)) ||
      (a.AssetID && a.AssetID.toLowerCase().includes(q)) ||
      (a.SerialNumber && a.SerialNumber.toLowerCase().includes(q)) ||
      (a.AssignedUserName && a.AssignedUserName.toLowerCase().includes(q))
    );
  });

  const handleOpenProfile = (assetId) => {
    setSelectedAssetId(assetId);
    setIsProfileOpen(true);
  };

  const handleOpenReassign = (assetId) => {
    setReassignAssetId(assetId);
    setIsReassignOpen(true);
  };

  const handleOpenRepair = (assetId) => {
    setRepairAssetId(assetId);
    setIsRepairOpen(true);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Physical IT Assets & Inventory</h2>
          <p className="text-muted">
            Tracking individual devices with unique Asset IDs, tags, specs, and complete historical timelines.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => { setEditingAsset(null); setIsFormOpen(true); }}>
            <Plus size={16} /> Register New Asset
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <div className="filter-tabs-scrollable">
          {[
            { id: 'All', label: 'All Assets', count: assetService.getAssets('All').length },
            { id: 'Computers', label: 'Computers & AIO', count: assetService.getAssets('Computers').length },
            { id: 'Laptops', label: 'Laptops', count: assetService.getAssets('Laptops').length },
            { id: 'Monitors', label: 'Monitors', count: assetService.getAssets('Monitors').length },
            { id: 'Printers', label: 'Printers', count: assetService.getAssets('Printers').length },
            { id: 'Shared', label: '🌐 Shared / Network', count: assetService.getAssets('Shared').length },
            { id: 'Accessories', label: 'Accessories', count: assetService.getAssets('Accessories').length },
            { id: 'Unassigned', label: 'Unassigned (Storage)', count: assetService.getAssets('Unassigned').length },
            { id: 'Warnings', label: '⚠️ Daily Warnings', count: assetService.getAssets('Warnings').length },
            { id: 'Under Repair', label: 'Under Repair', count: assetService.getAssets('Under Repair').length },
          ].map(tab => (
            <button
              key={tab.id}
              className={`filter-tab ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by tag (KMN/CH/...), model, serial, user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Assets Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Hardware / Model</th>
                <th>Verified Tag</th>
                <th>Asset ID</th>
                <th>Category</th>
                <th>Assigned User</th>
                <th>Branch Location</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-muted">
                    No hardware assets found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(a => (
                  <tr
                    key={a.AssetID}
                    className="cursor-pointer hover-highlight"
                    onClick={() => handleOpenProfile(a.AssetID)}
                  >
                    <td>
                      <div>
                        <span className="font-semibold text-primary">{assetService.getCleanHardwareName(a)}</span>
                        {a.SerialNumber && (
                          <div className="text-muted text-xs font-mono">S/N: {a.SerialNumber}</div>
                        )}
                        {a.Notes && (
                          <div className="text-xs text-amber truncate max-w-xs">{a.Notes}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="tag-pill font-mono">{a.VerifiedNo || 'UNTAGGED'}</span>
                    </td>
                    <td>
                      <span className="id-pill">{a.AssetID}</span>
                    </td>
                    <td>
                      <span className="type-badge">{a.AssetType}</span>
                    </td>
                    <td>
                      {a.IsSharedNetwork || a.CurrentUserID === 'SHARED_NETWORK' || a.Status === 'Shared / Networked' ? (
                        <span className="badge badge-primary flex items-center gap-1 font-semibold text-xs" style={{ width: 'fit-content' }}>
                          🌐 Shared Network (All Staff)
                        </span>
                      ) : (
                        <span className={a.CurrentUserID ? 'font-medium' : 'text-muted italic'}>
                          {a.AssignedUserName}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="location-pill">{a.LocationName}</span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <span className={`badge ${
                          a.Status === 'Assigned' ? 'badge-success' :
                          a.Status === 'Shared / Networked' ? 'badge-primary' :
                          a.Status === 'Under Repair' ? 'badge-danger' :
                          a.Status === 'Available' || a.Status === 'In Storage' ? 'badge-warning' : 'badge-neutral'
                        }`}>
                          {a.Status}
                        </span>
                        {(a.HealthStatus === 'Warning' || a.WarningNote || (a.Notes && (a.Notes.toLowerCase().includes('warning') || a.Notes.toLowerCase().includes('low performance') || a.Notes.toLowerCase().includes('beep') || a.Notes.toLowerCase().includes('error')))) && (
                          <span className="badge badge-warning flex items-center gap-1 font-semibold" title={a.WarningNote || a.Notes}>
                            <AlertCircle size={10} /> Needs Daily Check
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="table-actions">
                        <button
                          className="icon-btn"
                          title="View Complete Timeline"
                          onClick={() => handleOpenProfile(a.AssetID)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Reassign / Handover to User"
                          onClick={() => handleOpenReassign(a.AssetID)}
                        >
                          <RefreshCw size={16} className="text-primary" />
                        </button>
                        <button
                          className="icon-btn"
                          title="Log Repair / Service"
                          onClick={() => handleOpenRepair(a.AssetID)}
                        >
                          <Wrench size={16} className="text-amber" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Asset Profile & Timeline Modal */}
      <AssetProfileModal
        assetId={selectedAssetId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onReassign={(assetId) => {
          setIsProfileOpen(false);
          handleOpenReassign(assetId);
        }}
        onLogRepair={(assetId) => {
          setIsProfileOpen(false);
          handleOpenRepair(assetId);
        }}
      />

      {/* Asset Form Modal */}
      <AssetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        asset={editingAsset}
      />

      {/* Reassign Modal */}
      <ReassignModal
        assetId={reassignAssetId}
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
      />

      {/* Repair Modal */}
      <RepairModal
        assetId={repairAssetId}
        isOpen={isRepairOpen}
        onClose={() => setIsRepairOpen(false)}
      />
    </div>
  );
}
