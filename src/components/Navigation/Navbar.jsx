import React from 'react';
import { Search, Moon, Sun, Database, Shield, Menu, Laptop, Cloud } from 'lucide-react';
import { dbRepository } from '../../services/dbRepository';

export default function Navbar({
  theme,
  onToggleTheme,
  role,
  onToggleRole,
  onOpenSearch,
  onOpenDatabaseHub,
  onToggleMobileMenu
}) {
  const storageSource = dbRepository.getStorageSource();
  const isGoogleDrive = storageSource === 'google_drive';
  const isLocalDisk = storageSource === 'local_disk';

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button className="mobile-menu-btn icon-btn" onClick={onToggleMobileMenu} title="Toggle Sidebar">
          <Menu size={20} />
        </button>
        <div className="navbar-brand">
          <div className="navbar-logo-badge">
            <Laptop size={20} className="text-white" />
          </div>
          <div>
            <h1 className="navbar-title">KMN AQUA SERVICES</h1>
            <span className="navbar-subtitle">Office IT Asset & Relational System</span>
          </div>
        </div>
      </div>

      <div className="navbar-center">
        <div className="navbar-search-trigger" onClick={onOpenSearch}>
          <Search size={16} className="text-muted" />
          <span className="search-placeholder">Global Search (Ctrl+K)...</span>
          <kbd className="search-kbd">Ctrl K</kbd>
        </div>
      </div>

      <div className="navbar-right">
        {/* Database Hub Status Pill */}
        <button 
          className="db-status-pill" 
          onClick={onOpenDatabaseHub} 
          title={isGoogleDrive ? "Connected to Google Drive Cloud Database" : "View Relational Database Status"}
        >
          <span className="status-dot-pulse"></span>
          {isGoogleDrive ? (
            <>
              <Cloud size={14} className="text-cyan" />
              <span className="text-xs font-semibold">Google Drive Active</span>
            </>
          ) : (
            <>
              <Database size={14} className={isLocalDisk ? "text-emerald" : "text-amber"} />
              <span className="text-xs font-semibold">{isLocalDisk ? "Excel DB Active" : "Local Mode"}</span>
            </>
          )}
        </button>

        {/* Role Toggle */}
        <button
          className="role-toggle-btn"
          onClick={onToggleRole}
          title={`Switch Role (Current: ${role.toUpperCase()})`}
        >
          <Shield size={14} className={role === 'admin' ? 'text-cyan' : 'text-muted'} />
          <span className="text-xs capitalize font-medium">{role} Mode</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber" /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
