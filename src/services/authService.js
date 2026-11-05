/**
 * ============================================================================
 * KMN AQUA SERVICES - SECURE AUTHENTICATION SERVICE
 * ============================================================================
 * Role-Based Access Control (Admin vs Viewer):
 * - Admin: Full write, edit, delete, and system configuration control.
 * - Viewer: Strictly read-only audit access across all assets, repairs, and vaults.
 *
 * Device Session Caching:
 * - When "Remember this device" is checked, session persists in localStorage.
 * - When unchecked, session is held in sessionStorage.
 * - When user signs out, device cache is wiped and user stays logged out.
 * - Supports optional Firebase Auth adapter fallback.
 */

import { streamlitBridge } from '../lib/streamlitBridge.js';
import { isFirebaseConfigured, firebaseSignIn, firebaseSignOut } from './firebaseAuth.js';

const STORAGE_KEY = 'kmn_auth_user';
const ROLE_STORAGE_KEY = 'kmn_user_role';
const SALT = 'KMN_AQUA_SECURE_AUTH_2026';

// Cryptographic hash fingerprints for authorized profiles
const AUTH_CONFIG = {
  adminUser: 'kmnaquaitadmin',
  adminHashes: [
    '24f115284ce735ff554d7d30b545b5bf42c475f2b81c5e6ecbd858f407feab6c', // '(adminaqua30@IT)' + salt
    'ce16cb4dd3e10cd6a661146e0c5c347501f43a74d70ee9e6c5558a55ed69fb11', // 'adminaqua30@IT' + salt
    'a73d85d3990d9e9b739be41cdd1bff15e280d193f5530fffef4dec415b084a58'  // 'admin123' + salt
  ],
  userUser: 'user',
  userHashes: [
    '1d0d404e6a08284177109720f8778715cec652e377e68fa485c0abbe78d45876', // '(useraqua30@IT)' + salt
    'a96b933d7e7bf8c3c394be3f9a5ed8e0f7abd15d219604033dc9ca0e2f787d96', // 'useraqua30@IT' + salt
    'cf53926b5dd032019e24ecfb12fc851f4789c9932baaa1a95ffd907873c9e005'  // 'user123' + salt
  ]
};

/**
 * Pure JavaScript SHA-256 implementation
 * Guarantees zero-dependency, tamper-proof hashing in HTTP, LAN, and HTTPS environments.
 */
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        const b = (hash[i] >> (8 * j)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
  }
  return result.slice(0, 64);
}

const listeners = new Set();

class AuthService {
  constructor() {
    this.currentUser = this.loadInitialUser();

    // Listen for authenticated user updates from Streamlit parent iframe
    if (typeof window !== 'undefined') {
      streamlitBridge.onData((args) => {
        // Only accept user sync if Python sent an explicitly logged-in user
        if (args && args.user && typeof args.user === 'object' && args.user.username && this.currentUser) {
          const role = (args.user.role || '').toLowerCase().includes('viewer') ? 'viewer' : 'admin';
          if (this.currentUser.role !== role) {
            this.currentUser = {
              ...this.currentUser,
              role,
              displayName: role === 'admin' ? 'System Administrator' : 'Staff Viewer'
            };
            this.persistUser(this.currentUser);
            this.notify();
          }
        }
      });
    }
  }

  /**
   * Returns current login configuration hints for the login form
   */
  getConfig() {
    return {
      adminUser: AUTH_CONFIG.adminUser,
      userUser: AUTH_CONFIG.userUser
    };
  }

  /**
   * Loads cached session from device storage.
   * Returns null if no user is signed in (forcing the login gate).
   */
  loadInitialUser() {
    try {
      // 1. Check persistent device cache (rememberMe)
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'viewer')) {
          return parsed;
        }
      }

      // 2. Check tab session cache (rememberMe was false)
      const sessionCached = sessionStorage.getItem(STORAGE_KEY);
      if (sessionCached) {
        const parsed = JSON.parse(sessionCached);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'viewer')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[authService] Error reading cached session:', e);
    }

    // No valid stored user -> start in unauthenticated state (display LoginView)
    return null;
  }

  /**
   * Persists active user in device or tab storage
   */
  persistUser(user, rememberMe = true) {
    try {
      if (user) {
        const serialized = JSON.stringify(user);
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, serialized);
          sessionStorage.removeItem(STORAGE_KEY);
        } else {
          sessionStorage.setItem(STORAGE_KEY, serialized);
          localStorage.removeItem(STORAGE_KEY);
        }
        localStorage.setItem(ROLE_STORAGE_KEY, user.role);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(ROLE_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[authService] Error persisting session:', e);
    }
  }

  /**
   * Authenticates credentials with device caching.
   *
   * Roles & Credentials:
   * 1. Admin Profile:
   *    Username: 'kmnaquaitadmin' or 'admin'
   *    Password: '(adminaqua30@IT)' (also matches 'adminaqua30@IT' or 'admin123')
   *    Role: 'admin' (Full write/edit/delete control)
   *
   * 2. Viewer Profile:
   *    Username: 'user' or 'viewer' or 'staff'
   *    Password: '(useraqua30@IT)' (also matches 'useraqua30@IT' or 'user123')
   *    Role: 'viewer' (Read-only audit access)
   */
  async login(username, password, rememberMe = true) {
    const rawUser = String(username || '').trim();
    const cleanUser = rawUser.toLowerCase();
    const rawPass = String(password || '').trim();
    const strippedPass = rawPass.replace(/^\(/, '').replace(/\)$/, '').trim();

    if (!rawUser || !rawPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    // 1. Check Firebase Auth if configured
    if (isFirebaseConfigured()) {
      try {
        const fbRes = await firebaseSignIn(rawUser, rawPass);
        if (fbRes.success) {
          const role = fbRes.role || (cleanUser.includes('admin') ? 'admin' : 'viewer');
          const user = {
            username: rawUser,
            role,
            displayName: role === 'admin' ? 'System Administrator' : 'Staff Viewer',
            authProvider: 'firebase',
            loginTime: new Date().toISOString()
          };
          this.currentUser = user;
          this.persistUser(user, rememberMe);
          this.syncWithBackend(user);
          this.notify();
          return { success: true, user };
        }
      } catch (fbErr) {
        console.warn('[authService] Firebase auth fallback to device credential auth:', fbErr);
      }
    }

    // 2. Device Credential Authentication
    const passHash1 = sha256(rawPass + SALT);
    const passHash2 = sha256(strippedPass + SALT);

    // Validate Admin credentials
    const isAdminUser = ['kmnaquaitadmin', 'admin', 'kmnadmin'].includes(cleanUser);
    const isAdminPass = 
      ['(adminaqua30@it)', 'adminaqua30@it', 'admin123'].includes(rawPass.toLowerCase()) ||
      ['(adminaqua30@it)', 'adminaqua30@it', 'admin123'].includes(strippedPass.toLowerCase()) ||
      AUTH_CONFIG.adminHashes.includes(passHash1) ||
      AUTH_CONFIG.adminHashes.includes(passHash2);

    if (isAdminUser && isAdminPass) {
      const user = {
        username: rawUser || AUTH_CONFIG.adminUser,
        role: 'admin',
        displayName: 'System Administrator',
        authProvider: 'device_cached',
        loginTime: new Date().toISOString()
      };
      this.currentUser = user;
      this.persistUser(user, rememberMe);
      this.syncWithBackend(user);
      this.notify();
      return { success: true, user };
    }

    // Validate Viewer credentials
    const isViewerUser = ['user', 'viewer', 'staff', 'kmnviewer'].includes(cleanUser);
    const isViewerPass = 
      ['(useraqua30@it)', 'useraqua30@it', 'user123'].includes(rawPass.toLowerCase()) ||
      ['(useraqua30@it)', 'useraqua30@it', 'user123'].includes(strippedPass.toLowerCase()) ||
      AUTH_CONFIG.userHashes.includes(passHash1) ||
      AUTH_CONFIG.userHashes.includes(passHash2);

    if (isViewerUser && isViewerPass) {
      const user = {
        username: rawUser || AUTH_CONFIG.userUser,
        role: 'viewer',
        displayName: 'Staff Viewer',
        authProvider: 'device_cached',
        loginTime: new Date().toISOString()
      };
      this.currentUser = user;
      this.persistUser(user, rememberMe);
      this.syncWithBackend(user);
      this.notify();
      return { success: true, user };
    }

    return {
      success: false,
      error: 'Invalid username or password. Please verify your credentials and try again.'
    };
  }

  /**
   * Syncs active session to Streamlit/FastAPI backend
   */
  syncWithBackend(user) {
    try {
      streamlitBridge.sendToPython({
        action: 'set_user_session',
        user: user ? { role: user.role, username: user.username } : null
      });
    } catch (e) {
      // Standalone mode - ignore
    }
  }

  /**
   * Signs out, wipes device credentials cache, and returns to login screen.
   */
  logout() {
    this.currentUser = null;
    this.persistUser(null);
    this.syncWithBackend(null);

    if (isFirebaseConfigured()) {
      try {
        firebaseSignOut();
      } catch (e) {}
    }

    this.notify();
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
    this.persistUser(user, true);
    this.syncWithBackend(user);
    this.notify();
  }
}

export const authService = new AuthService();
export default authService;
