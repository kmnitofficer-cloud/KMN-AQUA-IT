/**
 * ============================================================================
 * KMN AQUA SERVICES - AUTHENTICATION & SECURITY SERVICE
 * ============================================================================
 * Handles encrypted authentication with Admin and User profiles.
 * Credentials are set in .env and hashed with SHA-256 + Salt during Vite build.
 * No plain text passwords are ever stored in the built production bundle.
 */

// Fallback configuration if __AUTH_CONFIG__ is not defined
const DEFAULT_AUTH_CONFIG = {
  adminUser: 'admin',
  adminHash: 'a73d85d3990d9e9b739be41cdd1bff15e280d193f5530fffef4dec415b084a58', // 'admin123' + salt
  userUser: 'user',
  userHash: 'cf53926b5dd032019e24ecfb12fc851f4789c9932baaa1a95ffd907873c9e005', // 'user123' + salt
  salt: 'KMN_AQUA_SECURE_AUTH_2026'
};

const getAuthConfig = () => {
  if (typeof __AUTH_CONFIG__ !== 'undefined') {
    return __AUTH_CONFIG__;
  }
  return DEFAULT_AUTH_CONFIG;
};

const STORAGE_KEY = 'kmn_auth_user';
const listeners = new Set();

/**
 * Computes SHA-256 hash using browser's native Web Crypto API
 */
async function hashInput(text, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(text || '').trim() + salt);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authService = {
  /**
   * Subscribes to authentication state changes (login / logout)
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  notify(user) {
    listeners.forEach(cb => {
      try {
        cb(user);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  },

  /**
   * Retrieves the currently authenticated user from session or local storage
   */
  getCurrentUser() {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (e) {
      console.warn('Failed to parse auth session:', e);
    }
    return null;
  },

  /**
   * Checks whether a user is currently authenticated
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Authenticates against the build-time hashed credentials
   */
  async login(username, password, rememberMe = true) {
    const config = getAuthConfig();
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    try {
      const typedHash = await hashInput(cleanPass, config.salt);

      // Check Administrator profile
      if (
        cleanUser.toLowerCase() === config.adminUser.toLowerCase() &&
        typedHash === config.adminHash
      ) {
        const user = {
          username: config.adminUser,
          role: 'admin',
          displayName: 'Administrator',
          avatarTitle: 'AD',
          loginTime: new Date().toISOString()
        };
        this.saveSession(user, rememberMe);
        this.notify(user);
        return { success: true, user };
      }

      // Check Standard User profile (Viewer Mode)
      if (
        cleanUser.toLowerCase() === config.userUser.toLowerCase() &&
        typedHash === config.userHash
      ) {
        const user = {
          username: config.userUser,
          role: 'viewer',
          displayName: 'Staff User',
          avatarTitle: 'US',
          loginTime: new Date().toISOString()
        };
        this.saveSession(user, rememberMe);
        this.notify(user);
        return { success: true, user };
      }

      return { success: false, error: 'Invalid username or password. Access denied.' };
    } catch (err) {
      console.error('Authentication error:', err);
      return { success: false, error: 'An error occurred during authentication.' };
    }
  },

  saveSession(user, rememberMe) {
    const data = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, data);
    } else {
      sessionStorage.setItem(STORAGE_KEY, data);
    }
  },

  /**
   * Terminates the active session and locks the application
   */
  logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    this.notify(null);
  }
};
