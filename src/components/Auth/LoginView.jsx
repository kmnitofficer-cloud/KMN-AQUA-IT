import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Laptop, 
  CheckCircle2, 
  Sun, 
  Moon,
  KeyRound,
  Shield
} from 'lucide-react';
import { authService } from '../../services/authService';

export default function LoginView({ onLoginSuccess, theme, onToggleTheme }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('admin'); // 'admin' | 'user'

  const handleProfileSelect = (profileType) => {
    setActiveProfileTab(profileType);
    setError('');
    if (profileType === 'admin') {
      setUsername('admin');
      setPassword('');
    } else {
      setUsername('user');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.login(username, password, rememberMe);
      if (res.success) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setError(res.error || 'Invalid credentials. Access denied.');
      }
    } catch (err) {
      setError('An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-screen-wrapper">
      {/* Background Ambience & Cyber Grid */}
      <div className="login-ambient-glow login-glow-1"></div>
      <div className="login-ambient-glow login-glow-2"></div>
      <div className="login-cyber-grid"></div>

      {/* Top Controls Bar */}
      <div className="login-top-bar">
        <div className="flex items-center gap-2 text-xs text-muted font-mono">
          <ShieldCheck size={14} className="text-cyan-400" />
          <span>KMN SECURE GATEWAY v2.6</span>
        </div>
        {onToggleTheme && (
          <button 
            type="button" 
            className="icon-btn theme-toggle-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>
        )}
      </div>

      {/* Main Glass Card */}
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-header">
          <div className="login-logo-container">
            <div className="login-logo-halo"></div>
            <div className="login-logo-badge">
              <Laptop size={28} className="text-cyan-400" />
            </div>
          </div>
          <h1 className="login-title">KMN AQUA SERVICES</h1>
          <p className="login-subtitle">
            Office IT Asset & Cloud Database Management System
          </p>
        </div>

        {/* Profile Switcher Tabs */}
        <div className="login-profile-tabs">
          <button
            type="button"
            className={`login-profile-tab ${activeProfileTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleProfileSelect('admin')}
          >
            <Shield size={14} />
            <span>Admin Profile</span>
            {activeProfileTab === 'admin' && <span className="tab-pill-badge">Full Control</span>}
          </button>
          <button
            type="button"
            className={`login-profile-tab ${activeProfileTab === 'user' ? 'active' : ''}`}
            onClick={() => handleProfileSelect('user')}
          >
            <User size={14} />
            <span>User Profile</span>
            {activeProfileTab === 'user' && <span className="tab-pill-badge">Viewer Mode</span>}
          </button>
        </div>

        {/* Profile Description Pill */}
        <div className="login-profile-hint">
          {activeProfileTab === 'admin' ? (
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <CheckCircle2 size={13} />
              <span>Full administrator access: Assets, AC Blueprints, DB Sync, Bills</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-indigo-300">
              <CheckCircle2 size={13} />
              <span>Read-only staff access: View hardware, AC Floor Map, view documents</span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="login-error-alert animate-shake">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="login-input-label">Username</label>
            <div className="login-input-wrapper">
              <User size={16} className="login-input-icon text-muted" />
              <input
                type="text"
                className="login-input"
                placeholder={activeProfileTab === 'admin' ? 'admin' : 'user'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="login-input-label">Password</label>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter password..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(prev => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs my-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-muted hover:text-foreground">
              <input
                type="checkbox"
                className="checkbox-custom"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <span>Remember session on this device</span>
            </label>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            className="login-submit-btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner-border spinner-border-sm"></span>
                <span>Authenticating...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <KeyRound size={16} />
                <span>Sign In as {activeProfileTab === 'admin' ? 'Administrator' : 'User'}</span>
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Security Trust Badges */}
        <div className="login-security-footer">
          <div className="flex items-center justify-center gap-2 text-xs text-muted">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>SHA-256 Encrypted Session • Authorized Access Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
