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
  X
} from 'lucide-react';

export default function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
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

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map(sec => (
            <div key={sec.title} className="sidebar-section">
              <span className="sidebar-section-title">{sec.title}</span>
              <div className="sidebar-items">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        if (onClose) onClose();
                      }}
                    >
                      <Icon size={18} className="sidebar-item-icon" />
                      <span className="sidebar-item-label">{item.label}</span>
                      {isActive && <div className="sidebar-active-indicator"></div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-db-badge">
            <div className="flex items-center gap-2">
              <span className="pulse-dot"></span>
              <span className="text-xs font-semibold">IT_Asset_Database.xlsx</span>
            </div>
            <span className="text-xs text-muted block mt-0.5">Relational Engine (14 Sheets)</span>
          </div>
        </div>
      </aside>
    </>
  );
}
