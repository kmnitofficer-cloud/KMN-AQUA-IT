import React, { useState } from 'react';
import { Wrench, Plus, Search, Filter, ShieldCheck, Cpu, FileText } from 'lucide-react';
import { repairService } from '../../services/repairService';
import RepairModal from './RepairModal';

export default function RepairsView({ onOpenAsset }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  const repairs = repairService.getRepairs();

  const filteredRepairs = repairs.filter(r => {
    if (filter === 'Completed' && r.Status !== 'Completed') return false;
    if (filter === 'Warnings' && !r.Status.includes('Warning') && !r.Status.includes('Observation')) return false;
    if (filter === 'Under Repair' && (r.Status === 'Completed' || r.Status.includes('Warning'))) return false;

    const q = search.toLowerCase();
    return (
      (r.ProblemDescription && r.ProblemDescription.toLowerCase().includes(q)) ||
      (r.ActionTaken && r.ActionTaken.toLowerCase().includes(q)) ||
      (r.Model && r.Model.toLowerCase().includes(q)) ||
      (r.VerifiedNo && r.VerifiedNo.toLowerCase().includes(q)) ||
      (r.RepairSupplier && r.RepairSupplier.toLowerCase().includes(q)) ||
      (r.RepairID && r.RepairID.toLowerCase().includes(q))
    );
  });

  const totalCost = filteredRepairs.reduce((sum, r) => sum + (Number(r.RepairCost) || 0), 0);

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Hardware Maintenance & Repair Registry</h2>
          <p className="text-muted">
            Permanent, immutable ledger of all equipment breakdowns, vendor services, actions taken, and component replacements.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => { setSelectedAssetId(null); setIsModalOpen(true); }}>
            <Plus size={16} /> Log Repair / Issue
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'All' ? 'active' : ''}`}
            onClick={() => setFilter('All')}
          >
            All Services ({repairs.length})
          </button>
          <button
            className={`filter-tab ${filter === 'Warnings' ? 'active' : ''}`}
            onClick={() => setFilter('Warnings')}
          >
            ⚠️ Warnings & Checks ({repairs.filter(r => r.Status && (r.Status.includes('Warning') || r.Status.includes('Observation'))).length})
          </button>
          <button
            className={`filter-tab ${filter === 'Completed' ? 'active' : ''}`}
            onClick={() => setFilter('Completed')}
          >
            Completed ({repairs.filter(r => r.Status === 'Completed').length})
          </button>
          <button
            className={`filter-tab ${filter === 'Under Repair' ? 'active' : ''}`}
            onClick={() => setFilter('Under Repair')}
          >
            Active In Repair ({repairs.filter(r => r.Status !== 'Completed' && !r.Status.includes('Warning')).length})
          </button>
        </div>

        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search problem, device, vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary KPI Pill */}
      <div className="summary-banner mb-4">
        <div className="flex items-center gap-3">
          <Wrench size={18} className="text-amber" />
          <span>Showing <strong>{filteredRepairs.length}</strong> repair records</span>
        </div>
        <div className="font-semibold text-primary">
          Total Maintenance Cost: <strong className="text-emerald">Rs. {totalCost.toLocaleString()}</strong>
        </div>
      </div>

      {/* Repairs Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Repair ID</th>
                <th>Date</th>
                <th>Hardware Device</th>
                <th>Tag / No</th>
                <th>Problem Description</th>
                <th>Resolution / Action</th>
                <th>Parts Replaced</th>
                <th>Invoice / Bill</th>
                <th>Supplier / Tech</th>
                <th>Cost (LKR)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center py-8 text-muted">
                    No repair records found matching this criteria.
                  </td>
                </tr>
              ) : (
                filteredRepairs.map(r => (
                  <tr key={r.RepairID}>
                    <td><span className="id-pill">{r.RepairID}</span></td>
                    <td>{r.RepairDate}</td>
                    <td>
                      <div>
                        <span className="font-semibold text-primary">{r.Brand} {r.Model}</span>
                        <div className="text-xs text-muted">{r.AssetID} • {r.AssignedUserName}</div>
                      </div>
                    </td>
                    <td><span className="tag-pill font-mono">{r.VerifiedNo}</span></td>
                    <td><strong className="text-rose">{r.ProblemDescription}</strong></td>
                    <td>{r.ActionTaken}</td>
                    <td>
                      {r.PartsReplaced && r.PartsReplaced !== 'N/A' && r.PartsReplaced !== 'None' ? (
                        <div className="flex flex-col gap-1 max-w-xs">
                          {r.PartsReplaced.split('; ').map((pt, i) => (
                            <span key={i} className="text-xs bg-violet/10 text-violet border border-violet/20 px-2 py-0.5 rounded">
                              {pt}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted italic">None</span>
                      )}
                    </td>
                    <td>
                      {r.InvoiceID ? (
                        <span className="id-pill bg-cyan/15 text-cyan border border-cyan/30 flex items-center gap-1 font-mono text-xs">
                          <FileText size={12} /> {r.InvoiceID}
                        </span>
                      ) : (
                        <span className="text-xs text-muted italic">N/A</span>
                      )}
                    </td>
                    <td>
                      <div>{r.RepairSupplier}</div>
                      <div className="text-xs text-muted">{r.Technician}</div>
                    </td>
                    <td>
                      <strong className="text-emerald">Rs. {Number(r.RepairCost).toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className={`badge ${
                        r.Status === 'Completed' ? 'badge-success' :
                        (r.Status && (r.Status.includes('Warning') || r.Status.includes('Observation'))) ? 'badge-warning font-semibold' :
                        'badge-danger'
                      }`}>
                        {r.Status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repair Modal */}
      <RepairModal
        assetId={selectedAssetId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
