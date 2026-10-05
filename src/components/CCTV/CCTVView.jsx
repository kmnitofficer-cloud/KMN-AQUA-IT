import React, { useState, useEffect } from 'react';
import { 
  Cctv, 
  Plus, 
  Search, 
  Building2, 
  FileText, 
  Eye, 
  Trash2, 
  HardDrive, 
  Wifi, 
  Clock, 
  CheckCircle2,
  Filter,
  ArrowLeftRight
} from 'lucide-react';
import { cctvService, CCTV_BILL_CATEGORIES } from '../../services/cctvService';
import { formatDisplayDate } from '../../utils/dateUtils';
import AddCCTVBillModal from './AddCCTVBillModal';
import CCTVBillViewerModal from './CCTVBillViewerModal';

export default function CCTVView({ selectedLocation = 'All' }) {
  const [officeFilter, setOfficeFilter] = useState(() => selectedLocation); // 'All' | 'Chilaw' | 'Palawiya'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetModalOffice, setTargetModalOffice] = useState(() => selectedLocation !== 'All' ? selectedLocation : 'Chilaw');
  const [selectedBill, setSelectedBill] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    setOfficeFilter(selectedLocation);
    if (selectedLocation !== 'All') {
      setTargetModalOffice(selectedLocation);
    }
  }, [selectedLocation]);

  const bills = cctvService.getCCTVBills(officeFilter, categoryFilter);
  const summary = cctvService.getCCTVSummary();
  const offices = cctvService.getOffices();

  const handleOpenAddModal = (office = selectedLocation !== 'All' ? selectedLocation : 'Chilaw') => {
    setTargetModalOffice(office);
    setIsAddModalOpen(true);
  };

  const handleOpenViewer = (bill) => {
    setSelectedBill(bill);
    setIsViewerOpen(true);
  };

  const handleDeleteBill = async (billId) => {
    await cctvService.deleteCCTVBill(billId);
  };

  const filteredBills = bills.filter(b => {
    const q = search.toLowerCase();
    return (
      (b.BillNumber && b.BillNumber.toLowerCase().includes(q)) ||
      (b.Supplier && b.Supplier.toLowerCase().includes(q)) ||
      (b.Description && b.Description.toLowerCase().includes(q)) ||
      (b.ChilawDescription && b.ChilawDescription.toLowerCase().includes(q)) ||
      (b.PalawiyaDescription && b.PalawiyaDescription.toLowerCase().includes(q)) ||
      (b.BillCategory && b.BillCategory.toLowerCase().includes(q)) ||
      (b.BillPeriod && b.BillPeriod.toLowerCase().includes(q)) ||
      (b.Office && b.Office.toLowerCase().includes(q))
    );
  });

  const totalFilteredAmount = filteredBills.reduce((acc, b) => {
    if (officeFilter === 'Chilaw' && b.Office === 'Split') return acc + (Number(b.ChilawAmount) || 0);
    if (officeFilter === 'Palawiya' && b.Office === 'Split') return acc + (Number(b.PalawiyaAmount) || 0);
    return acc + (Number(b.Amount) || 0);
  }, 0);

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="view-header">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Cctv size={24} />
            </div>
            <h2>CCTV Surveillance & Multi-Office Billing</h2>
          </div>
          <p className="text-muted">
            Dedicated surveillance infrastructure monitoring and itemized bill tracking for <strong>Chilaw Office</strong> and <strong>Palawiya Office</strong>.
          </p>
        </div>

        <div className="view-header-actions">
          <button className="btn btn-outline" onClick={() => handleOpenAddModal('Chilaw')}>
            <Plus size={14} /> Chilaw Bill
          </button>
          <button className="btn btn-outline" onClick={() => handleOpenAddModal('Palawiya')}>
            <Plus size={14} /> Palawiya Bill
          </button>
          <button className="btn btn-outline text-primary border-primary/40" onClick={() => handleOpenAddModal('Split')}>
            <ArrowLeftRight size={14} /> Split Bill (Both)
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenAddModal(officeFilter !== 'All' ? officeFilter : 'Chilaw')}>
            <Plus size={16} /> Add CCTV Bill
          </button>
        </div>
      </div>

      {/* KPI Financial & Infrastructure Summary */}
      <div className="stats-kpi-grid mb-6">
        <div className="kpi-card">
          <span className="kpi-title">Total CCTV Spend (Combined)</span>
          <div className="kpi-value text-emerald font-mono">
            Rs. {summary.totalSpend.toLocaleString()}
          </div>
          <span className="text-muted text-xs font-medium">
            {summary.totalBillsCount} total bills recorded
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-title">Chilaw Office CCTV Total</span>
            <span className="badge badge-primary text-[10px]">Chilaw</span>
          </div>
          <div className="kpi-value text-primary font-mono">
            Rs. {summary.chilawSpend.toLocaleString()}
          </div>
          <span className="text-muted text-xs">
            {summary.chilawBillsCount} bills • 16 Active Channels
          </span>
        </div>

        <div className="kpi-card">
          <div className="flex items-center justify-between">
            <span className="kpi-title">Palawiya Office CCTV Total</span>
            <span className="badge badge-success text-[10px]">Palawiya</span>
          </div>
          <div className="kpi-value text-primary font-mono">
            Rs. {summary.palawiyaSpend.toLocaleString()}
          </div>
          <span className="text-muted text-xs">
            {summary.palawiyaBillsCount} bills • 8 Active Channels
          </span>
        </div>

        <div className="kpi-card">
          <span className="kpi-title">Pending Bills</span>
          <div className="kpi-value text-amber font-mono">
            Rs. {summary.pendingAmount.toLocaleString()}
          </div>
          <span className="text-muted text-xs">
            {summary.pendingBillsCount} awaiting payment clearance
          </span>
        </div>
      </div>

      {/* Office Surveillance Profiles (Chilaw & Palawiya) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {offices.map(office => {
          const isChilaw = office.OfficeID === 'chilaw';
          const officeSpend = isChilaw ? summary.chilawSpend : summary.palawiyaSpend;
          const officeBillsCount = isChilaw ? summary.chilawBillsCount : summary.palawiyaBillsCount;
          const isSelected = officeFilter.toLowerCase() === office.OfficeID;

          return (
            <div 
              key={office.OfficeID} 
              className={`cctv-office-card ${isSelected ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-md ${isChilaw ? 'bg-primary-soft text-primary' : 'bg-surface-2 text-accent'}`}>
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{office.OfficeName} CCTV</h3>
                    <span className="text-xs text-muted font-mono">{office.LocationID} • {office.Building}</span>
                  </div>
                </div>

                <span className="badge badge-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {office.Status || 'Active'}
                </span>
              </div>

              {/* Hardware & Network Details */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-surface-elevated p-2.5 rounded-md border border-subtle">
                <div>
                  <span className="text-muted block">NVR Hardware:</span>
                  <span className="font-semibold text-primary">{office.NVRModel || 'Pending setup'}</span>
                </div>
                <div>
                  <span className="text-muted block">Surveillance Channels:</span>
                  <span className="font-semibold text-primary">{office.ChannelsCount || 0} Channels</span>
                </div>
                <div>
                  <span className="text-muted block">Storage Unit:</span>
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <HardDrive size={12} className="text-amber" /> {office.Storage || 'Surveillance Storage'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Network / Feed:</span>
                  <span className="font-semibold text-primary flex items-center gap-1">
                    <Wifi size={12} className="text-emerald" /> {office.ConnectionType || 'Local Network'}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center pt-2 border-t border-subtle">
                <div>
                  <span className="text-xs text-muted block">Total CCTV Bills</span>
                  <span className="text-base font-bold font-mono text-emerald">
                    Rs. {officeSpend.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-muted ml-1.5">({officeBillsCount} bills)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    className={`btn btn-sm ${officeFilter === (isChilaw ? 'Chilaw' : 'Palawiya') ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setOfficeFilter(officeFilter === (isChilaw ? 'Chilaw' : 'Palawiya') ? 'All' : (isChilaw ? 'Chilaw' : 'Palawiya'))}
                  >
                    <Filter size={12} /> {officeFilter === (isChilaw ? 'Chilaw' : 'Palawiya') ? 'Show All' : 'Filter Office'}
                  </button>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => handleOpenAddModal(isChilaw ? 'Chilaw' : 'Palawiya')}
                  >
                    <Plus size={12} /> Add Bill
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Office Quick Navigation Tabs */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${officeFilter === 'All' ? 'active' : ''}`}
            onClick={() => setOfficeFilter('All')}
          >
            All Offices ({summary.totalBillsCount})
          </button>
          <button 
            className={`filter-tab ${officeFilter === 'Chilaw' ? 'active' : ''}`}
            onClick={() => setOfficeFilter('Chilaw')}
          >
            Chilaw Office CCTV ({summary.chilawBillsCount})
          </button>
          <button 
            className={`filter-tab ${officeFilter === 'Palawiya' ? 'active' : ''}`}
            onClick={() => setOfficeFilter('Palawiya')}
          >
            Palawiya Office CCTV ({summary.palawiyaBillsCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2.5">
          <select
            className="filter-search-input text-xs py-1.5 px-2.5 cursor-pointer max-w-[200px]"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CCTV_BILL_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="search-input-wrapper">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              className="filter-search-input"
              placeholder="Search bill #, vendor, description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CCTV Bills Data Table */}
      <div className="table-card">
        <div className="table-card-header flex justify-between items-center p-3 border-b border-subtle">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {officeFilter === 'All' ? 'All Office CCTV Bills' : `${officeFilter} Office CCTV Bills`}
            </span>
            <span className="badge badge-primary font-mono text-xs">
              {filteredBills.length} Records
            </span>
          </div>

          <div className="text-sm font-semibold">
            Filtered Total: <span className="text-emerald font-mono">Rs. {totalFilteredAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill / Ref #</th>
                <th>Target Office</th>
                <th>Date / Period</th>
                <th>Supplier / Vendor</th>
                <th>Surveillance Category</th>
                <th>Description</th>
                <th>Amount (LKR)</th>
                <th>Status</th>
                <th>Attachment</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-muted">
                    No CCTV bills found matching the selected filters.
                    <div className="mt-2">
                      <button 
                        className="btn btn-primary btn-sm inline-flex items-center gap-1"
                        onClick={() => handleOpenAddModal(officeFilter !== 'All' ? officeFilter : 'Chilaw')}
                      >
                        <Plus size={14} /> Add CCTV Bill Now
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map(b => {
                  const isChilaw = b.Office === 'Chilaw';
                  const isPaid = (b.PaymentStatus || '').toLowerCase() === 'paid';

                  return (
                    <tr 
                      key={b.BillID} 
                      className="cursor-pointer hover-highlight"
                      onClick={() => handleOpenViewer(b)}
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <FileText size={15} className="text-primary flex-shrink-0" />
                          <span className="font-semibold text-primary font-mono text-sm">
                            {b.BillNumber}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted font-mono block ml-5">{b.BillID}</span>
                      </td>

                      <td>
                        {b.Office === 'Split' ? (
                          <div>
                            <span className="badge badge-outline border-primary/60 text-primary flex items-center gap-1 w-fit mb-0.5">
                              <ArrowLeftRight size={11} />
                              Split (Both)
                            </span>
                            <span className="text-[10px] text-muted block">Chilaw & Palawiya</span>
                          </div>
                        ) : (
                          <span className={`badge ${isChilaw ? 'badge-primary' : 'badge-success'}`}>
                            <Building2 size={12} className="inline mr-1" />
                            {b.Office} CCTV
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="font-mono text-xs block">{formatDisplayDate(b.BillDate)}</span>
                        {b.BillPeriod && (
                          <span className="text-[11px] text-muted block">{b.BillPeriod}</span>
                        )}
                      </td>

                      <td>
                        <strong className="text-sm">{b.Supplier}</strong>
                      </td>

                      <td>
                        <span className="badge badge-outline text-xs text-primary">
                          {b.BillCategory}
                        </span>
                      </td>

                      <td>
                        <div className="text-xs text-primary max-w-xs" title={b.Description}>
                          {officeFilter === 'Chilaw' && b.Office === 'Split' && b.ChilawDescription ? (
                            <div>
                              <span className="text-primary font-semibold block text-[10px]">Chilaw Portion:</span>
                              <span className="truncate block">{b.ChilawDescription}</span>
                            </div>
                          ) : officeFilter === 'Palawiya' && b.Office === 'Split' && b.PalawiyaDescription ? (
                            <div>
                              <span className="text-emerald font-semibold block text-[10px]">Palawiya Portion:</span>
                              <span className="truncate block">{b.PalawiyaDescription}</span>
                            </div>
                          ) : (
                            <span className="truncate block">{b.Description}</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {b.Office === 'Split' && officeFilter === 'Chilaw' ? (
                          <div>
                            <span className="font-mono font-bold text-emerald text-sm">
                              Rs. {(Number(b.ChilawAmount) || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted block font-mono">
                              (Chilaw share of {Number(b.Amount || 0).toLocaleString()})
                            </span>
                          </div>
                        ) : b.Office === 'Split' && officeFilter === 'Palawiya' ? (
                          <div>
                            <span className="font-mono font-bold text-emerald text-sm">
                              Rs. {(Number(b.PalawiyaAmount) || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted block font-mono">
                              (Palawiya share of {Number(b.Amount || 0).toLocaleString()})
                            </span>
                          </div>
                        ) : b.Office === 'Split' ? (
                          <div>
                            <span className="font-mono font-bold text-emerald text-sm">
                              Rs. {(Number(b.Amount) || 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-primary block font-mono">
                              CH: {Number(b.ChilawAmount || 0).toLocaleString()} • PAL: {Number(b.PalawiyaAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-bold text-emerald text-sm">
                            Rs. {(Number(b.Amount) || 0).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
                          {isPaid ? <CheckCircle2 size={11} className="inline mr-1" /> : <Clock size={11} className="inline mr-1" />}
                          {b.PaymentStatus || 'Paid'}
                        </span>
                      </td>

                      <td>
                        {b.FileName ? (
                          <span className="badge badge-outline text-[11px] font-mono flex items-center gap-1 text-primary">
                            <FileText size={11} /> {b.FileName.length > 15 ? b.FileName.slice(0, 15) + '...' : b.FileName}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      <td className="text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            className="icon-btn" 
                            title="View Bill Details"
                            onClick={() => handleOpenViewer(b)}
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            className="icon-btn text-rose hover:bg-rose/10" 
                            title="Delete Bill"
                            onClick={() => {
                              if (window.confirm(`Delete bill "${b.BillNumber}"?`)) {
                                handleDeleteBill(b.BillID);
                              }
                            }}
                          >
                            <Trash2 size={15} />
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

      {/* Add CCTV Bill Modal */}
      <AddCCTVBillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultOffice={targetModalOffice}
        onSaved={() => {
          // Handled via reactive dbRepository subscription
        }}
      />

      {/* CCTV Bill Viewer Modal */}
      <CCTVBillViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        bill={selectedBill}
        onDelete={handleDeleteBill}
      />
    </div>
  );
}
