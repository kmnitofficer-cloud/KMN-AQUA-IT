import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  FileSpreadsheet, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Wrench, 
  CheckSquare, 
  Square,
  Building,
  Monitor,
  Cpu,
  Laptop as LaptopIcon,
  Printer,
  MousePointer,
  Keyboard as KeyboardIcon,
  BatteryCharging,
  Users
} from 'lucide-react';
import { exportMachinesToExcel } from '../utils/excelHelper';

export default function ExcelGrid({
  machines,
  role,
  onAddMachine,
  onEditMachine,
  onDeleteMachine,
  onViewMachine,
  onAddServiceForMachine,
  onOpenImportModal,
  officeFilter,
  setOfficeFilter,
  statusFilter,
  setStatusFilter,
  showToast
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [groupByUser, setGroupByUser] = useState(true);
  const [sortField, setSortField] = useState('verified_no');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Distinct categories from data
  const categories = useMemo(() => {
    const set = new Set(machines.map(m => m.category).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [machines]);

  // Distinct assigned users from data
  const distinctUsers = useMemo(() => {
    const set = new Set(machines.map(m => (m.assigned_to || '').trim()).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [machines]);

  // Filtering
  const filteredMachines = useMemo(() => {
    return machines.filter(m => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery = 
          (m.verified_no && m.verified_no.toLowerCase().includes(query)) ||
          (m.item_name && m.item_name.toLowerCase().includes(query)) ||
          (m.assigned_to && m.assigned_to.toLowerCase().includes(query)) ||
          (m.office && m.office.toLowerCase().includes(query)) ||
          (m.remarks && m.remarks.toLowerCase().includes(query)) ||
          (m.category && m.category.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Office
      if (officeFilter !== 'All' && m.office !== officeFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'All' && m.status !== statusFilter) {
        return false;
      }

      // Category
      if (categoryFilter !== 'All' && m.category !== categoryFilter) {
        return false;
      }

      // Assigned User Filter
      if (userFilter !== 'All' && (m.assigned_to || '').trim() !== userFilter) {
        return false;
      }

      return true;
    });
  }, [machines, searchQuery, officeFilter, statusFilter, categoryFilter, userFilter]);

  // Sorting & Group Clustering
  const sortedMachines = useMemo(() => {
    const list = [...filteredMachines];
    list.sort((a, b) => {
      // When grouped by user, cluster by assigned_to first
      if (groupByUser) {
        const uA = (a.assigned_to || 'zzz').toLowerCase();
        const uB = (b.assigned_to || 'zzz').toLowerCase();
        if (uA < uB) return -1;
        if (uA > uB) return 1;
      }

      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      // Clean comparisons
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredMachines, sortField, sortDirection, groupByUser]);

  // Grouped by Assigned User
  const groupedMachines = useMemo(() => {
    if (!groupByUser) return [];
    const groups = new Map();
    sortedMachines.forEach(m => {
      const user = (m.assigned_to || 'Unassigned / Spare Assets').trim() || 'Unassigned / Spare Assets';
      if (!groups.has(user)) {
        groups.set(user, {
          user,
          office: m.office || 'Main Branch',
          items: []
        });
      }
      groups.get(user).items.push(m);
    });
    return Array.from(groups.values());
  }, [sortedMachines, groupByUser]);

  // Handle Sort header click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    return sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  };

  // Selection for bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedMachines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedMachines.map(m => m.id)));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected items?`)) {
      selectedIds.forEach(id => onDeleteMachine(id));
      setSelectedIds(new Set());
      showToast(`Deleted ${selectedIds.size} items`, 'info');
    }
  };

  const handleExportExcel = () => {
    exportMachinesToExcel(sortedMachines, `KMN_Machines_${officeFilter.replace(/\s+/g, '_')}.xlsx`);
    showToast('Exported to Excel successfully!', 'success');
  };

  // Category Icon helper
  const getCategoryIcon = (category) => {
    const c = (category || '').toLowerCase();
    if (c.includes('cpu') || c.includes('desktop')) return <Cpu size={13} />;
    if (c.includes('laptop')) return <LaptopIcon size={13} />;
    if (c.includes('monitor')) return <Monitor size={13} />;
    if (c.includes('printer')) return <Printer size={13} />;
    if (c.includes('mouse')) return <MousePointer size={13} />;
    if (c.includes('keyboard')) return <KeyboardIcon size={13} />;
    if (c.includes('ups')) return <BatteryCharging size={13} />;
    return null;
  };

  const getStatusClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('work') && !s.includes('not')) return 'working';
    if (s.includes('service')) return 'service';
    if (s.includes('not in use')) return 'not-in-use';
    return 'not-working';
  };

  const renderRow = (machine, index) => {
    const isSelected = selectedIds.has(machine.id);
    return (
      <tr 
        key={machine.id || index}
        className="clickable-row"
        onClick={() => {
          if (role === 'viewer') onViewMachine(machine);
        }}
      >
        {/* Admin Checkbox */}
        {role === 'admin' && (
          <td 
            style={{ textAlign: 'center' }} 
            onClick={(e) => { e.stopPropagation(); toggleSelectOne(machine.id); }}
          >
            <span style={{ cursor: 'pointer', display: 'inline-flex' }}>
              {isSelected ? (
                <CheckSquare size={16} color="var(--brand-primary)" />
              ) : (
                <Square size={16} />
              )}
            </span>
          </td>
        )}

        {/* Row Index */}
        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {index + 1}
        </td>

        {/* Verified No (Asset Tag) */}
        <td>
          {machine.verified_no ? (
            <span className="tag-verified">{machine.verified_no}</span>
          ) : (
            <span className="tag-verified empty">—</span>
          )}
        </td>

        {/* Item Name */}
        <td style={{ maxWidth: '190px' }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={machine.item_name}>
            {machine.item_name}
          </div>
        </td>

        {/* Category Badge */}
        <td>
          <span className="badge-cat">
            {getCategoryIcon(machine.category)}
            <span>{machine.category || 'Accessory'}</span>
          </span>
        </td>

        {/* Office Branch */}
        <td>
          <span className="badge-office">
            <Building size={12} />
            <span>{machine.office}</span>
          </span>
        </td>

        {/* Assigned User */}
        <td style={{ maxWidth: '130px' }}>
          <div style={{ fontWeight: 600, color: 'var(--brand-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={machine.assigned_to || 'Unassigned'}>
            {machine.assigned_to || 'Unassigned'}
          </div>
        </td>

        {/* Status Badge */}
        <td style={{ textAlign: 'center' }}>
          <span className={`badge-status ${getStatusClass(machine.status)}`}>
            <span className="status-dot connected" style={{ 
              width: '6px', 
              height: '6px',
              background: machine.status === 'Working' ? 'var(--accent-emerald)' : 
                          machine.status === 'Under Service' ? 'var(--accent-amber)' : 'var(--text-muted)'
            }}></span>
            {machine.status || 'Working'}
          </span>
        </td>

        {/* Remarks / Specs */}
        <td style={{ maxWidth: '170px' }}>
          <span style={{ 
            color: machine.remarks ? 'var(--text-secondary)' : 'var(--text-muted)',
            fontSize: '0.8rem',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={machine.remarks || ''}>
            {machine.remarks || '—'}
          </span>
        </td>

        {/* Row Actions */}
        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
          {role === 'admin' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '26px', height: '26px' }}
                onClick={() => onViewMachine(machine)}
                title="View Full Profile"
              >
                <Eye size={13} />
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '26px', height: '26px' }}
                onClick={() => onEditMachine(machine)}
                title="Edit Record"
              >
                <Edit size={13} />
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '26px', height: '26px' }}
                onClick={() => onAddServiceForMachine(machine)}
                title="Log Service / Repair"
              >
                <Wrench size={13} />
              </button>
              <button
                type="button"
                className="btn-icon"
                style={{ width: '26px', height: '26px', color: 'var(--accent-rose)' }}
                onClick={() => {
                  if (window.confirm(`Delete ${machine.item_name} (${machine.verified_no || 'No tag'})?`)) {
                    onDeleteMachine(machine.id);
                  }
                }}
                title="Delete Record"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-icon"
              style={{ width: '28px', height: '28px', margin: '0 auto' }}
              onClick={() => onViewMachine(machine)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="table-wrapper">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          {/* Search box */}
          <div className="search-box">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search by Verified No, Item, User, Specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Office pills */}
          <div className="office-filter-pills">
            {['All', 'Chilaw Office', 'Palavi Office'].map(off => (
              <button
                key={off}
                type="button"
                className={`office-pill ${officeFilter === off ? 'active' : ''}`}
                onClick={() => setOfficeFilter(off)}
              >
                {off === 'All' ? 'All Offices' : off}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            className="select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories ({categories.length - 1})</option>
            {categories.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Working">Operational (Working)</option>
            <option value="Under Service">Under Service / Repair</option>
            <option value="Not in use">Not in Use / Scrap</option>
            <option value="Not Working">Not Working</option>
          </select>

          {/* Assigned User Dropdown */}
          <select
            className="select-filter"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            title="Filter machines by assigned user"
          >
            <option value="All">All Users ({distinctUsers.length - 1})</option>
            {distinctUsers.filter(u => u !== 'All').map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Toolbar Right: Action Buttons */}
        <div className="toolbar-right">
          {/* Group by User Toggle */}
          <button
            type="button"
            className={`btn ${groupByUser ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setGroupByUser(prev => !prev)}
            title="Organize all machines grouped under their assigned user"
          >
            <Users size={14} />
            <span>{groupByUser ? 'Grouped by User' : 'Group by User'}</span>
          </button>

          {/* Bulk actions for admin */}
          {role === 'admin' && selectedIds.size > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} />
              <span>Delete ({selectedIds.size})</span>
            </button>
          )}

          {/* Export to Excel (both Viewer and Admin) */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            title="Download formatted Excel (.xlsx) file"
          >
            <FileSpreadsheet size={15} />
            <span>Export Excel</span>
          </button>

          {/* Admin Only Actions */}
          {role === 'admin' && (
            <>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenImportModal}
                title="Upload Excel or CSV file"
              >
                <Upload size={14} />
                <span>Import</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onAddMachine}
                title="Add new computer or hardware asset"
              >
                <Plus size={15} />
                <span>Add Computer</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="table-container">
        <table className="excel-table">
          <thead>
            <tr>
              {role === 'admin' && (
                <th style={{ width: '36px', textAlign: 'center' }}>
                  <span 
                    onClick={toggleSelectAll} 
                    style={{ cursor: 'pointer', display: 'inline-flex', verticalAlign: 'middle' }}
                  >
                    {selectedIds.size > 0 && selectedIds.size === sortedMachines.length ? (
                      <CheckSquare size={16} color="var(--brand-primary)" />
                    ) : (
                      <Square size={16} />
                    )}
                  </span>
                </th>
              )}
              <th style={{ width: '38px', textAlign: 'center' }}>#</th>
              <th className="sortable" onClick={() => handleSort('verified_no')} style={{ width: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Verified No</span>
                  {getSortIcon('verified_no')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('item_name')} style={{ minWidth: '130px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Item / Computer Name</span>
                  {getSortIcon('item_name')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('category')} style={{ width: '115px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Category</span>
                  {getSortIcon('category')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('office')} style={{ width: '110px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Office</span>
                  {getSortIcon('office')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('assigned_to')} style={{ width: '120px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Assigned User</span>
                  {getSortIcon('assigned_to')}
                </div>
              </th>
              <th className="sortable" onClick={() => handleSort('status')} style={{ width: '105px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th style={{ minWidth: '110px' }}>Remarks / Specs</th>
              {role === 'admin' ? (
                <th style={{ width: '110px', textAlign: 'center' }}>Actions</th>
              ) : (
                <th style={{ width: '70px', textAlign: 'center' }}>Details</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedMachines.length === 0 ? (
              <tr>
                <td colSpan={role === 'admin' ? 10 : 9} className="table-empty-state">
                  <FileSpreadsheet className="empty-icon" />
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>No computer records found</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try clearing filters or search query</p>
                </td>
              </tr>
            ) : groupByUser ? (
              groupedMachines.map((group, gIdx) => (
                <React.Fragment key={group.user || gIdx}>
                  {/* User Section Header Row */}
                  <tr className="user-group-header-row">
                    <td colSpan={role === 'admin' ? 10 : 9}>
                      <div className="user-group-banner">
                        <div className="user-group-left">
                          <div className="user-group-avatar">
                            <Users size={14} />
                          </div>
                          <span className="user-group-name">{group.user}</span>
                          <span className="user-group-office">{group.office}</span>
                        </div>
                        <div className="user-group-right">
                          <span className="user-group-count-badge">
                            {group.items.length} {group.items.length === 1 ? 'Asset' : 'Assets'} Assigned
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Items for this user */}
                  {group.items.map((machine, mIdx) => renderRow(machine, mIdx))}
                </React.Fragment>
              ))
            ) : (
              sortedMachines.map((machine, index) => renderRow(machine, index))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="table-footer">
        <div>
          Showing <strong>{sortedMachines.length}</strong> of <strong>{machines.length}</strong> items
          {officeFilter !== 'All' && ` in ${officeFilter}`}
          {statusFilter !== 'All' && ` (${statusFilter})`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Tip: Click any row to inspect complete details</span>
        </div>
      </div>
    </div>
  );
}
