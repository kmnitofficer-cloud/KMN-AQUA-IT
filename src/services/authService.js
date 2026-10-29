/**
 * ============================================================================
 * KMN AQUA SERVICES - AUTHENTICATION STATE
 * ============================================================================
 * Login and role enforcement are managed exclusively by Streamlit (Python backend).
 * Zero passwords, hashes, or secret tokens are bundled into the client application.
 */

import { streamlitBridge } from '../lib/streamlitBridge';

const STORAGE_KEY = 'kmn_auth_user';
const listeners = new Set();

class AuthService {
  constructor() {
    this.currentUser = this.loadInitialUser();

    // Listen for authenticated user data from Streamlit host
    if (typeof window !== 'undefined') {
      streamlitBridge.onData((args) => {
        if (args && args.user && typeof args.user === 'object') {
          const role = (args.user.role || '').toLowerCase().includes('viewer') ? 'viewer' : 'admin';
          const updatedUser = {
            username: args.user.username || 'User',
            role,
            loginTime: new Date().toISOString()
          };
          this.currentUser = updatedUser;
          this.persistUser(updatedUser);
          this.notify();
        }
      });
    }
  }

  loadInitialUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore
    }
    // Default session inside Streamlit iframe
    return {
      username: 'Streamlit Operator',
      role: 'admin',
      loginTime: new Date().toISOString()
    };
  }

  persistUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }

  notify() {
    for (const cb of listeners) {
      try {
        cb(this.currentUser);
      } catch (e) {
        console.error('[authService] Error notifying listener:', e);
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return Boolean(this.currentUser);
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.persistUser(user);
    this.notify();
  }

  logout() {
    this.currentUser = null;
    this.persistUser(null);
    this.notify();
  }
}

export const authService = new AuthService();
