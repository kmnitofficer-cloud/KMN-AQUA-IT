import React from 'react';
import { 
  Laptop, 
  ShieldCheck, 
  Eye, 
  Sun, 
  Moon, 
  Database, 
  Lock, 
  Unlock 
} from 'lucide-react';

export default function Navbar({
  role,
  onSwitchRole,
  theme,
  onToggleTheme,
  isCloudConnected,
  onOpenCloudSettings,
  onOpenAdminPin,
}) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Laptop size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-title">
              KMN AQUA SERVICES
              <span className="brand-subtitle">(PVT) LTD</span>
            </div>
            <div className="brand-subtitle">
              IT Asset & Computer Dashboard
            </div>
          </div>
        </div>

        {/* Actions & Role Switcher */}
        <div className="nav-actions">
          {/* Cloud Supabase Status Pill */}
          <button 
            type="button" 
            className="cloud-status-pill"
            onClick={onOpenCloudSettings}
            title="Configure Supabase Database"
          >
            <span className={`status-dot ${isCloudConnected ? 'connected' : 'disconnected'}`}></span>
            <Database size={14} />
            <span>{isCloudConnected ? 'Supabase Connected' : 'Local Mode (Offline)'}</span>
          </button>

          {/* Role Switcher */}
          <div className="role-badge-switcher">
            <button
              type="button"
              className={`role-btn ${role === 'viewer' ? 'active' : ''}`}
              onClick={() => onSwitchRole('viewer')}
              title="Viewer Mode: Read-only Excel display"
            >
              <Eye size={14} />
              <span>Viewer</span>
            </button>

            <button
              type="button"
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => {
                if (role === 'admin') {
                  // Switch to viewer
                  onSwitchRole('viewer');
                } else {
                  // Request PIN or unlock
                  onOpenAdminPin();
                }
              }}
              title="Admin Mode: Insert, edit and manage machines"
            >
              {role === 'admin' ? <ShieldCheck size={14} /> : <Lock size={14} />}
              <span>{role === 'admin' ? 'Admin Active' : 'Admin'}</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="btn-icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
