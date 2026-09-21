import React, { useState } from 'react';
import { Cpu, Search, ArrowRight } from 'lucide-react';
import { repairService } from '../../services/repairService';

export default function PartsView() {
  const [search, setSearch] = useState('');
  const parts = repairService.getParts();

  const filteredParts = parts.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.PartType && p.PartType.toLowerCase().includes(q)) ||
      (p.OldPartDetails && p.OldPartDetails.toLowerCase().includes(q)) ||
      (p.NewPartDetails && p.NewPartDetails.toLowerCase().includes(q)) ||
      (p.Model && p.Model.toLowerCase().includes(q)) ||
      (p.VerifiedNo && p.VerifiedNo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h2>Component & Part Replacement History</h2>
          <p className="text-muted">
            Tracking old vs new component specifications, memory upgrades, storage swaps, and hardware serials without overwriting baseline records.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <span className="font-medium text-sm text-muted">Replacement Records ({parts.length})</span>
        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search part type, old/new specs, asset..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Part ID</th>
                <th>Installed Date</th>
                <th>Target Asset</th>
                <th>Verified Tag</th>
                <th>Component Category</th>
                <th>Old Removed Component</th>
                <th>New Installed Component</th>
                <th>Cost (LKR)</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-muted">
                    No hardware component replacements found.
                  </td>
                </tr>
              ) : (
                filteredParts.map(p => (
                  <tr key={p.PartID}>
                    <td><span className="id-pill">{p.PartID}</span></td>
                    <td>{p.NewPartInstalledDate || p.OldPartRemovedDate}</td>
                    <td>
                      <div>
                        <span className="font-semibold">{p.Brand} {p.Model}</span>
                        <div className="text-xs text-muted">{p.AssetID}</div>
                      </div>
                    </td>
                    <td><span className="tag-pill font-mono">{p.VerifiedNo}</span></td>
                    <td>
                      <span className="type-badge">{p.PartType}</span>
                    </td>
                    <td>
                      <div className="text-rose font-medium">{p.OldPartDetails}</div>
                      {p.OldPartSerial && <div className="text-xs text-muted font-mono">S/N: {p.OldPartSerial}</div>}
                    </td>
                    <td>
                      <div className="text-emerald font-medium flex items-center gap-1">
                        <ArrowRight size={14} className="text-muted" /> {p.NewPartDetails}
                      </div>
                      {p.NewPartSerial && <div className="text-xs text-muted font-mono">S/N: {p.NewPartSerial}</div>}
                    </td>
                    <td><strong>Rs. {Number(p.Cost || 0).toLocaleString()}</strong></td>
                    <td>{p.Supplier || 'KMN IT Solution'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
