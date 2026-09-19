import React from 'react';
import { 
  LayoutDashboard, 
  Monitor, 
  Wrench, 
  Users, 
  Database, 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck, 
  Lock, 
  Zap, 
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  role,
  onSwitchRole,
  theme,
  onToggleTheme,
  isCloudConnected,
  onOpenCloudSettings,
  onOpenAdminPin,
  machinesCount = 0,
  servicesCount = 0
}) {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-gem">
          <Sparkles size={18} className="gem-svg" />
        </div>
        <div className="brand-text">
          <span className="brand-title-primary">HireWise</span>
          <span className="brand-title-badge">IT ASSET</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="sidebar-nav">
        <button
          type="button"
          className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          id="nav-overview"
        >
          <div className="nav-item-icon">
            <LayoutDashboard size={18} />
          </div>
          <span className="nav-item-label">Overview</span>
          {activeTab === 'dashboard' && <span className="nav-active-pill" />}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeTab === 'workstations' ? 'active' : ''}`}
          onClick={() => setActiveTab('workstations')}
          id="nav-workstations"
        >
          <div className="nav-item-icon">
            <Users size={18} />
          </div>
          <span className="nav-item-label">Employees & PCs</span>
          {activeTab === 'workstations' && <span className="nav-active-pill" />}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeTab === 'machines' ? 'active' : ''}`}
          onClick={() => setActiveTab('machines')}
          id="nav-machines"
        >
          <div className="nav-item-icon">
            <Monitor size={18} />
          </div>
          <span className="nav-item-label">Machines & Assets</span>
          <span className="sidebar-counter-chip">{machinesCount}</span>
          {activeTab === 'machines' && <span className="nav-active-pill" />}
        </button>

        <button
          type="button"
          className={`sidebar-nav-item ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
          id="nav-services"
        >
          <div className="nav-item-icon">
            <Wrench size={18} />
          </div>
          <span className="nav-item-label">Service & Bills</span>
          <span className="sidebar-counter-chip">{servicesCount}</span>
          {activeTab === 'services' && <span className="nav-active-pill" />}
        </button>

        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onOpenCloudSettings}
          id="nav-cloud"
        >
          <div className="nav-item-icon">
            <Database size={18} />
          </div>
          <span className="nav-item-label">Cloud Sync</span>
          <span className={`cloud-status-dot-mini ${isCloudConnected ? 'online' : 'offline'}`} />
        </button>
      </nav>

      {/* Promo / Quick Card matching "Get Premium" card in screenshot */}
      <div className="sidebar-promo-card">
        <div className="promo-deco-circle" />
        <div className="promo-badge-tag">
          <Zap size={13} />
          <span>PRO HUB</span>
        </div>
        <h4 className="promo-title">Cloud Auto-Sync</h4>
        <p className="promo-desc">Real-time Supabase sync & automated Excel maintenance reports</p>
        <button
          type="button"
          className="promo-btn"
          onClick={onOpenCloudSettings}
        >
          <span>{isCloudConnected ? 'CONNECTED' : 'SYNC NOW'}</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Bottom Settings & Controls */}
      <div className="sidebar-footer">
        {/* Role Toggle */}
        <button
          type="button"
          className={`sidebar-footer-btn ${role === 'admin' ? 'admin-active' : ''}`}
          onClick={() => {
            if (role === 'admin') {
              onSwitchRole('viewer');
            } else {
              onOpenAdminPin();
            }
          }}
          title={role === 'admin' ? 'Admin Mode (Unlocked)' : 'Unlock Admin Mode'}
        >
          <div className="footer-btn-icon">
            {role === 'admin' ? <ShieldCheck size={16} /> : <Lock size={16} />}
          </div>
          <span className="footer-btn-text">{role === 'admin' ? 'Admin Mode' : 'Viewer Mode'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          className="sidebar-footer-btn theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <div className="footer-btn-icon">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </div>
          <span className="footer-btn-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
