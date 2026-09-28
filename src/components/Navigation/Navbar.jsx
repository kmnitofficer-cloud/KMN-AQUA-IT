import React from 'react';
import { Search, Moon, Sun, Database, Shield, Menu, Laptop, Cloud, LogOut, User as UserIcon } from 'lucide-react';
import { dbRepository } from '../../services/dbRepository';

export default function Navbar({
  theme,
  onToggleTheme,
  role,
  onToggleRole,
  onOpenSearch,
  onOpenDatabaseHub,
  onToggleMobileMenu,
  currentUser,
  onLogout
}) {
  const storageSource = dbRepository.getStorageSource();
  const isGoogleDrive = storageSource === 'google_drive';
  const isLocalDisk = storageSource === 'local_disk';
  const isAdmin = (currentUser?.role || role) === 'admin';

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button 
          className="mobile-menu-btn icon-btn" 
          onClick={onToggleMobileMenu} 
          title="Toggle Navigation Menu"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="navbar-brand">
          <div className="navbar-logo-badge">
            <Laptop size={20} className="brand-logo-icon" />
          </div>
          <div className="navbar-brand-text">
            <h1 className="navbar-title">KMN AQUA SERVICES</h1>
            <span className="navbar-subtitle">Office IT Asset & Relational System</span>
          </div>
        </div>
      </div>

      <div className="navbar-center">
        <button 
          type="button"
          className="navbar-search-trigger" 
          onClick={onOpenSearch}
          aria-label="Global Search"
        >
          <Search size={16} className="search-icon-muted" />
          <span className="search-placeholder">Global Search...</span>
          <kbd className="search-kbd">Ctrl K</kbd>
        </button>
      </div>

      <div className="navbar-right">
        {/* Mobile search quick icon */}
        <button 
          className="mobile-search-btn icon-btn" 
          onClick={onOpenSearch} 
          title="Search assets and users (Ctrl+K)"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Database Hub Status Pill */}
        <button 
          className="db-status-pill" 
          onClick={onOpenDatabaseHub} 
          title={isGoogleDrive ? "Connected to Google Drive Cloud Database" : "View Relational Database Status"}
          aria-label="Database Hub"
        >
          <span className="status-dot-pulse"></span>
          {isGoogleDrive ? (
            <>
              <Cloud size={14} className="status-pill-icon" />
              <span className="status-pill-text">Google Drive</span>
            </>
          ) : (
            <>
              <Database size={14} className="status-pill-icon" />
              <span className="status-pill-text">{isLocalDisk ? "Excel DB" : "Local Mode"}</span>
            </>
          )}
        </button>

        {/* User Profile Chip */}
        <div 
          className={`navbar-user-chip ${isAdmin ? 'chip-admin' : 'chip-user'}`}
          title={`Signed in as ${currentUser?.displayName || (isAdmin ? 'Administrator' : 'Staff User')} (${isAdmin ? 'Admin Profile' : 'User Profile'})`}
        >
          <div className="user-chip-avatar">
            {isAdmin ? <Shield size={13} /> : <UserIcon size={13} />}
          </div>
          <div className="user-chip-info">
            <span className="user-chip-name">{currentUser?.displayName || (isAdmin ? 'Admin' : 'Staff')}</span>
            <span className="user-chip-role">{isAdmin ? 'Admin' : 'Viewer'}</span>
          </div>
        </div>

        {/* Role Preview Switcher (Available to Admin) */}
        {isAdmin && (
          <button
            className="role-toggle-btn"
            onClick={onToggleRole}
            title={`Switch Role View (Current: ${role.toUpperCase()})`}
            aria-label="Toggle Admin/Viewer Mode"
          >
            <Shield size={14} className={role === 'admin' ? 'role-active-icon' : 'role-inactive-icon'} />
            <span className="role-btn-text capitalize">{role}</span>
          </button>
        )}

        {/* Theme Toggle */}
        <button
          className="icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Color Theme"
        >
          {theme === 'dark' ? <Sun size={18} className="theme-sun-icon" /> : <Moon size={18} className="theme-moon-icon" />}
        </button>

        {/* Logout / Lock Button */}
        <button
          className="icon-btn logout-header-btn"
          onClick={onLogout}
          title="Sign Out & Lock System"
          aria-label="Sign Out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
