import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Laptop, 
  RefreshCw, 
  Printer, 
  Wrench, 
  Cpu, 
  DollarSign, 
  FileText, 
  FileSpreadsheet, 
  MapPin, 
  Database,
  Cctv,
  Wind,
  X,
  LogOut,
  Shield,
  User as UserIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  onSelectTab, 
  isOpen, 
  onClose, 
  isCollapsed = false, 
  onToggleCollapse, 
  currentUser, 
  onLogout 
}) {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'ASSETS & USERS',
      items: [
        { id: 'users', label: 'Staff & Users', icon: Users },
        { id: 'assets', label: 'Hardware Assets', icon: Laptop },
        { id: 'assignments', label: 'Assignments & Custody', icon: RefreshCw },
        { id: 'printers', label: 'Printers & Toners', icon: Printer }
      ]
    },
    {
      title: 'MAINTENANCE & FINANCIALS',
      items: [
        { id: 'ac', label: 'AC & Floor Plan', icon: Wind },
        { id: 'repairs', label: 'Repairs & Services', icon: Wrench },
        { id: 'parts', label: 'Part Replacements', icon: Cpu },
        { id: 'cctv', label: 'CCTV Surveillance', icon: Cctv },
        { id: 'expenses', label: 'Office Expenses', icon: DollarSign },
        { id: 'invoices', label: 'Bills & Invoices', icon: FileText }
      ]
    },
    {
      title: 'SYSTEM & AUDIT',
      items: [
        { id: 'reports', label: 'Reports Center', icon: FileSpreadsheet },
        { id: 'locations', label: 'Locations & Depts', icon: MapPin },
        { id: 'database', label: 'Excel Database Hub', icon: Database }
      ]
    }
  ];

  const isAdmin = (currentUser?.role || 'admin') === 'admin';

  return (
    <>
      {/* Mobile dimmed backdrop */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`app-sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label="Main Navigation"
      >
        {/* Sticky Sidebar Header with Logo & Desktop Collapse Toggle */}
        <div className="sidebar-top-bar">
          <div className="sidebar-brand-group">
            <div 
              className="sidebar-logo-icon"
              onClick={isCollapsed && onToggleCollapse ? onToggleCollapse : undefined}
              role={isCollapsed ? "button" : undefined}
              title={isCollapsed ? "Click to expand sidebar" : undefined}
              style={{ cursor: isCollapsed ? 'pointer' : 'default' }}
            >
              <Laptop size={18} className="text-primary-emerald" />
            </div>
            {!isCollapsed && (
              <div className="sidebar-brand-info">
                <span className="sidebar-brand-title">KMN IT System</span>
                <span className="sidebar-brand-version">v2.6 Enterprise</span>
              </div>
            )}
          </div>

          {/* Desktop/Tablet Collapse Rail Button */}
          {onToggleCollapse && (
            <button
              type="button"
              className="sidebar-collapse-toggle desktop-only"
              onClick={onToggleCollapse}
              title={isCollapsed ? "Expand Sidebar (260px)" : "Collapse Sidebar (72px)"}
              aria-label={isCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}

          {/* Mobile Close Button */}
          <button 
            type="button" 
            className="sidebar-close-btn mobile-only" 
            onClick={onClose} 
            title="Close Menu"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Independent Scrollable Navigation Area */}
        <nav className="sidebar-nav">
          {navSections.map(sec => (
            <div key={sec.title} className="sidebar-section">
              {!isCollapsed && (
                <span className="sidebar-section-title">{sec.title}</span>
              )}
              <div className="sidebar-items">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onClose) onClose();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {isActive && <div className="sidebar-active-indicator" />}
                      <Icon size={19} className="sidebar-item-icon" />
                      {!isCollapsed && (
                        <span className="sidebar-item-label">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sticky Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Active User Session Card */}
          <div className={`sidebar-user-card ${isCollapsed ? 'compact' : ''}`}>
            <div 
              className={`sidebar-user-avatar ${isAdmin ? 'admin' : 'user'}`}
              title={isCollapsed ? (currentUser?.displayName || (isAdmin ? 'Administrator' : 'Staff')) : undefined}
            >
              {isAdmin ? <Shield size={14} /> : <UserIcon size={14} />}
            </div>
            {!isCollapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">
                  {currentUser?.displayName || (isAdmin ? 'Administrator' : 'Staff User')}
                </span>
                <span className="sidebar-user-role">
                  {isAdmin ? 'Admin Profile' : 'User Profile'}
                </span>
              </div>
            )}
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={onLogout}
              title="Lock System & Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Database Badge */}
          {!isCollapsed && (
            <div className="sidebar-db-badge">
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <span className="text-xs font-semibold">IT_Asset_Database.xlsx</span>
              </div>
              <span className="text-xs text-muted block mt-0.5">Relational Engine (14 Sheets)</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
