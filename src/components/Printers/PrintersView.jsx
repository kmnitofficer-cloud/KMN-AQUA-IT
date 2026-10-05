import React, { useState } from 'react';
import { Printer, Plus, Search, Eye, Wifi, AlertTriangle, CheckCircle2, DollarSign } from 'lucide-react';
import { printerService } from '../../services/printerService';
import { locationService } from '../../services/locationService';
import PrinterProfileModal from './PrinterProfileModal';
import TonerModal from './TonerModal';

export default function PrintersView({ selectedLocation = 'All' }) {
  const [search, setSearch] = useState('');
  const [selectedPrinterId, setSelectedPrinterId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTonerModalOpen, setIsTonerModalOpen] = useState(false);
  const [tonerPrinterAssetId, setTonerPrinterAssetId] = useState(null);

  const allPrinters = printerService.getPrinters();
  const locationPrinters = allPrinters.filter(p => locationService.matchesAsset(p, selectedLocation));

  const filteredPrinters = locationPrinters.filter(p => {
    const q = search.toLowerCase();
    return (
      (p.PrinterName && p.PrinterName.toLowerCase().includes(q)) ||
      (p.IPAddress && p.IPAddress.toLowerCase().includes(q)) ||
      (p.LocationName && p.LocationName.toLowerCase().includes(q)) ||
      (p.TonerCartridgeModel && p.TonerCartridgeModel.toLowerCase().includes(q)) ||
      (p.Notes && p.Notes.toLowerCase().includes(q))
    );
  });

  const handleOpenProfile = (printerId) => {
    setSelectedPrinterId(printerId);
    setIsProfileOpen(true);
  };

  const handleOpenTonerModal = (e, assetId) => {
    e.stopPropagation();
    setTonerPrinterAssetId(assetId);
    setIsTonerModalOpen(true);
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2>Office Network Printers & Consumable Management</h2>
          <p className="text-muted">
            Monitoring physical printers, assigned locations, static IP addresses, toner consumption, and cumulative operating costs.
          </p>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-primary" onClick={() => { setTonerPrinterAssetId(null); setIsTonerModalOpen(true); }}>
            <Plus size={16} /> Record Toner / Ink
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="filter-bar">
        <span className="font-medium text-sm text-muted">Active Office Printers ({locationPrinters.length})</span>
        <div className="search-input-wrapper">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search printer name, IP, model..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Printers Card Grid */}
      <div className="printers-grid">
        {filteredPrinters.map(p => {
          const costSummary = printerService.getPrinterCostSummary(p.AssetID);
          const hasError = (p.Status || '').includes('Error') || (p.Notes && p.Notes.toLowerCase().includes('error'));

          return (
            <div
              key={p.PrinterID}
              className={`printer-card cursor-pointer ${hasError ? 'border-warning' : ''}`}
              onClick={() => handleOpenProfile(p.PrinterID)}
            >
              <div className="printer-card-top">
                <div className="printer-avatar">
                  <Printer size={24} />
                </div>
                <div>
                  <span className="printer-card-name">{p.PrinterName}</span>
                  <div className="text-xs text-muted font-mono">Tag: {p.VerifiedNo} • {p.PrinterID}</div>
                </div>
                <span className={`badge ${hasError ? 'badge-danger' : 'badge-success'}`}>
                  {p.Status}
                </span>
              </div>

              <div className="printer-card-specs">
                <div className="printer-spec-row">
                  <span className="text-muted text-xs">IP Address:</span>
                  <span className="font-mono text-primary text-xs font-semibold">{p.IPAddress}</span>
                </div>
                <div className="printer-spec-row">
                  <span className="text-muted text-xs">Location:</span>
                  <span className="text-xs font-medium">{p.LocationName}</span>
                </div>
                <div className="printer-spec-row">
                  <span className="text-muted text-xs">Cartridge Model:</span>
                  <span className="text-xs font-semibold">{p.TonerCartridgeModel}</span>
                </div>
                <div className="printer-spec-row">
                  <span className="text-muted text-xs">Assigned Scope:</span>
                  <span className="text-xs">{p.AssignedUserName !== 'Unassigned' ? p.AssignedUserName : p.DepartmentName}</span>
                </div>
                {p.Notes && (
                  <div className="printer-card-note">
                    <AlertTriangle size={12} className="text-amber" />
                    <span>{p.Notes}</span>
                  </div>
                )}
              </div>

              <div className="printer-card-cost-summary">
                <div className="printer-cost-stat">
                  <span className="text-muted text-xs">Toner Expenses</span>
                  <span className="font-semibold text-emerald">Rs. {costSummary.tonerHistoryCost.toLocaleString()}</span>
                </div>
                <div className="printer-cost-stat">
                  <span className="text-muted text-xs">Total Lifecycle Cost</span>
                  <span className="font-bold text-primary">Rs. {costSummary.totalRecordedCost.toLocaleString()}</span>
                </div>
              </div>

              <div className="printer-card-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="btn btn-outline btn-xs flex-1"
                  onClick={() => handleOpenProfile(p.PrinterID)}
                >
                  <Eye size={12} /> View Full Profile
                </button>
                <button
                  className="btn btn-primary btn-xs flex-1"
                  onClick={(e) => handleOpenTonerModal(e, p.AssetID)}
                >
                  + Add Toner
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Printer Profile Modal */}
      <PrinterProfileModal
        printerId={selectedPrinterId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Toner Modal */}
      <TonerModal
        printerAssetId={tonerPrinterAssetId}
        isOpen={isTonerModalOpen}
        onClose={() => setIsTonerModalOpen(false)}
      />
    </div>
  );
}
