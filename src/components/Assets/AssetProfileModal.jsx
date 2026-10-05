import React, { useState } from 'react';
import { 
  X, 
  Laptop, 
  Calendar, 
  MapPin, 
  User, 
  Wrench, 
  Cpu, 
  FileText, 
  History, 
  ShieldCheck, 
  DollarSign, 
  Tag, 
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { assetService } from '../../services/assetService';

export default function AssetProfileModal({ assetId, isOpen, onClose, onReassign, onLogRepair }) {
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline', 'structure', 'history', 'repairs', 'parts'

  if (!isOpen || !assetId) return null;

  const asset = assetService.getAssetById(assetId);
  if (!asset) return null;

  const timeline = assetService.getAssetTimeline(assetId) || [];
  const components = assetService.getAssetComponents(assetId) || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="profile-modal-header">
          <div className="profile-header-info">
            <div className="asset-type-badge">
              <Laptop size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2>{asset.Brand} {asset.Model}</h2>
                <span className={`badge ${
                  asset.Status === 'Assigned' ? 'badge-success' :
                  asset.Status === 'Under Repair' ? 'badge-danger' :
                  asset.Status === 'Available' || asset.Status === 'In Storage' ? 'badge-warning' : 'badge-neutral'
                }`}>
                  {asset.Status}
                </span>
              </div>
              <div className="profile-sub-badges">
                <span className="tag-pill font-mono">{asset.VerifiedNo}</span>
                <span className="badge badge-neutral">{asset.AssetID}</span>
                <span className="text-muted text-sm">{asset.AssetType}</span>
                {asset.SerialNumber && (
                  <span className="text-muted text-sm font-mono">S/N: {asset.SerialNumber}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onReassign && (
              <button className="btn btn-outline btn-sm" onClick={() => onReassign(asset.AssetID)}>
                Reassign / Handover
              </button>
            )}
            {onLogRepair && (
              <button className="btn btn-outline btn-sm" onClick={() => onLogRepair(asset.AssetID)}>
                <Wrench size={14} /> Log Repair
              </button>
            )}
            <button className="icon-btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Key Information Cards */}
        <div className="profile-meta-grid">
          <div className="meta-card">
            <User size={16} className="text-cyan" />
            <div>
              <span className="meta-label">Current Assignment</span>
              <span className="meta-val font-semibold">{asset.AssignedUserName}</span>
            </div>
          </div>
          <div className="meta-card">
            <MapPin size={16} className="text-emerald" />
            <div>
              <span className="meta-label">Current Location</span>
              <span className="meta-val">{asset.LocationName}</span>
            </div>
          </div>
          <div className="meta-card">
            <DollarSign size={16} className="text-amber" />
            <div>
              <span className="meta-label">Purchase Value</span>
              <span className="meta-val">Rs. {Number(asset.PurchaseCost || 0).toLocaleString()}</span>
            </div>
          </div>
          <div className="meta-card">
            <ShieldCheck size={16} className="text-violet" />
            <div>
              <span className="meta-label">Warranty Status</span>
              <span className="meta-val">{asset.WarrantyEnd ? `Until ${asset.WarrantyEnd}` : 'Standard Warranty'}</span>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        {asset.Specifications && (
          <div className="spec-card mt-4">
            <span className="spec-label">Technical Specs:</span>
            <span className="spec-value">{asset.Specifications}</span>
          </div>
        )}

        {/* Active Warning & Observation Banner */}
        {(asset.HealthStatus === 'Warning' || asset.WarningNote || (asset.Notes && (asset.Notes.toLowerCase().includes('warning') || asset.Notes.toLowerCase().includes('low performance') || asset.Notes.toLowerCase().includes('beep') || asset.Notes.toLowerCase().includes('error')))) && (
          <div className="asset-warning-active-banner mt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="warning-pulse-icon">
                  <AlertTriangle size={22} className="text-amber" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber text-sm">⚠️ ACTIVE WARNING / UNDER DAILY MONITORING</span>
                    <span className="badge badge-warning">Still In Use</span>
                  </div>
                  <p className="text-sm font-semibold mt-1 text-primary">
                    {asset.WarningNote || asset.Notes}
                  </p>
                  <span className="text-xs text-muted block mt-0.5">
                    Device is operational at station, but requires daily physical checks by IT staff.
                  </span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-xs shrink-0"
                title="Mark this machine as fully resolved and healthy"
                onClick={async () => {
                  if (confirm('Mark this device as resolved and clear the daily check warning?')) {
                    await assetService.clearAssetWarning(asset.AssetID);
                  }
                }}
              >
                <ShieldCheck size={12} className="text-emerald" /> Clear Warning (Mark Healthy)
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="profile-nav-tabs mt-4">
          <button
            className={`profile-nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock size={16} /> Complete Chronological Timeline ({timeline.length})
          </button>
          <button
            className={`profile-nav-tab ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            <Layers size={16} /> Computer Structure & Bundles ({components.length})
          </button>
        </div>

        {/* Tab 1: Chronological Timeline */}
        {activeTab === 'timeline' && (
          <div className="timeline-container mt-4">
            {timeline.length === 0 ? (
              <div className="empty-panel">
                <p>No historical events logged yet for this asset.</p>
              </div>
            ) : (
              <div className="unified-timeline">
                {timeline.map((event, idx) => (
                  <div key={event.id || idx} className={`timeline-node timeline-node-${event.type}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content-card">
                      <div className="timeline-header-row">
                        <span className="timeline-date">{event.date || 'Undated'}</span>
                        <span className={`badge ${
                          event.type === 'purchase' ? 'badge-primary' :
                          event.type === 'assignment' ? 'badge-success' :
                          event.type === 'repair' ? 'badge-danger' :
                          event.type === 'part' ? 'badge-warning' :
                          event.type === 'invoice' ? 'badge-neutral' : 'badge-info'
                        }`}>
                          {event.badge}
                        </span>
                      </div>
                      <h4 className="timeline-title">{event.title}</h4>
                      <p className="timeline-desc">{event.description}</p>
                      {event.notes && (
                        <div className="timeline-note-callout">
                          <strong>Note:</strong> {event.notes}
                        </div>
                      )}
                      {event.invoiceFile && (
                        <a
                          href={event.invoiceFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="timeline-file-link"
                        >
                          <FileText size={14} /> Open Verified Invoice PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Computer Structure & Bundles */}
        {activeTab === 'structure' && (
          <div className="structure-container mt-4">
            <div className="structure-hero">
              <h3>Workstation Component Architecture</h3>
              <p className="text-muted text-sm">
                Computers may consist of multiple physical components (CPU, Monitors, Keyboards, Mice, UPS).
                Components are tracked independently with their own asset tags and serials while remaining linked to this workstation.
              </p>
            </div>

            {components.length === 0 ? (
              <div className="empty-panel mt-4">
                <p>This asset does not currently have sub-components bundled under it.</p>
                <span className="text-muted text-xs">
                  (If this is a Desktop workstation, peripherals like keyboards and monitors can be linked under it).
                </span>
              </div>
            ) : (
              <div className="components-list mt-4">
                {components.map(cmp => (
                  <div key={cmp.ComponentID} className="component-row-card">
                    <div className="component-role-badge">
                      <Cpu size={16} />
                      <span>{cmp.ComponentRole}</span>
                    </div>
                    <div className="component-details">
                      <span className="font-semibold">{cmp.ChildAsset.Brand} {cmp.ChildAsset.Model}</span>
                      <span className="text-muted text-xs">
                        Tag: <strong className="text-cyan">{cmp.ChildAsset.VerifiedNo}</strong> • {cmp.ChildAsset.AssetID}
                      </span>
                    </div>
                    <div className="component-status">
                      <span className="badge badge-success">{cmp.Status}</span>
                      <span className="text-muted text-xs">Installed: {cmp.InstalledDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
