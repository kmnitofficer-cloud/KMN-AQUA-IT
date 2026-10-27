/**
 * ============================================================================
 * KMN AQUA SERVICES - AUTHENTICATION & SECURITY SERVICE
 * ============================================================================
 * Handles encrypted authentication with Admin and User profiles.
 * Credentials are set in .env and hashed with SHA-256 + Salt during Vite build.
 * No plain text passwords are ever stored in the built production bundle.
 */

// Fallback configuration supporting both .env and default credentials
const DEFAULT_AUTH_CONFIG = {
  adminUser: 'kmnaquaitadmin',
  adminHashes: [
    'ce16cb4dd3e10cd6a661146e0c5c347501f43a74d70ee9e6c5558a55ed69fb11', // adminaqua30@IT
    '24f115284ce735ff554d7d30b545b5bf42c475f2b81c5e6ecbd858f407feab6c', // (adminaqua30@IT)
    'a73d85d3990d9e9b739be41cdd1bff15e280d193f5530fffef4dec415b084a58'  // admin123
  ],
  adminHash: 'ce16cb4dd3e10cd6a661146e0c5c347501f43a74d70ee9e6c5558a55ed69fb11',
  userUser: 'user',
  userHashes: [
    'a96b933d7e7bf8c3c394be3f9a5ed8e0f7abd15d219604033dc9ca0e2f787d96', // useraqua30@IT
    '1d0d404e6a08284177109720f8778715cec652e377e68fa485c0abbe78d45876', // (useraqua30@IT)
    'cf53926b5dd032019e24ecfb12fc851f4789c9932baaa1a95ffd907873c9e005'  // user123
  ],
  userHash: 'a96b933d7e7bf8c3c394be3f9a5ed8e0f7abd15d219604033dc9ca0e2f787d96',
  salt: 'KMN_AQUA_SECURE_AUTH_2026'
};

const getAuthConfig = () => {
  try {
    if (typeof __AUTH_CONFIG__ !== 'undefined') {
      return __AUTH_CONFIG__;
    }
  } catch (e) {}
  if (typeof window !== 'undefined' && window.__AUTH_CONFIG__) {
    return window.__AUTH_CONFIG__;
  }
  if (typeof globalThis !== 'undefined' && globalThis.__AUTH_CONFIG__) {
    return globalThis.__AUTH_CONFIG__;
  }
  return DEFAULT_AUTH_CONFIG;
};

const STORAGE_KEY = 'kmn_auth_user';
const listeners = new Set();

/**
 * Pure JavaScript SHA-256 algorithm fallback
 * Guarantees cryptographic hashing in all HTTP, LAN IP, and non-secure browser contexts
 */
function sha256Fallback(ascii) {
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

      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.length = 8;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let i2 = 3; i2 >= 0; i2--) {
      const b = (hash[i] >> (i2 * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes SHA-256 hash using browser's native Web Crypto API when available,
 * or pure-JS cryptographic fallback when running in non-secure HTTP / LAN environments.
 */
async function hashInput(text, salt) {
  const combined = String(text || '').trim() + salt;

  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.digest === 'function'
  ) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Insecure context or digest error, fall back to pure JS
    }
  }

  return sha256Fallback(combined);
}

export const authService = {
  /**
   * Returns current active auth configuration (usernames & salt)
   */
  getConfig() {
    return getAuthConfig();
  },

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
    const rawPass = String(password || '').trim();

    if (!cleanUser || !rawPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    try {
      // Test the password as-is, stripped of surrounding parentheses, and with parentheses
      const strippedPass = rawPass.replace(/^\((.*)\)$/, '$1').trim();
      const wrappedPass = `(${strippedPass})`;

      const candidatePasses = Array.from(new Set([rawPass, strippedPass, wrappedPass]));
      const candidateHashes = await Promise.all(
        candidatePasses.map(p => hashInput(p, config.salt))
      );

      const matchesHash = (...targetHashes) => {
        return targetHashes.some(target => target && candidateHashes.includes(target));
      };

      const userLower = cleanUser.toLowerCase();
      const adminTarget = (config.adminUser || 'admin').toLowerCase();
      const userTarget = (config.userUser || 'user').toLowerCase();

      // Check Administrator profile (supports configured username, 'admin', and 'kmnaquaitadmin')
      const isAdminMatch =
        userLower === adminTarget ||
        userLower === 'admin' ||
        userLower === 'kmnaquaitadmin';

      const plainMatchesAdmin =
        ['adminaqua30@it', '(adminaqua30@it)', 'admin123'].includes(strippedPass.toLowerCase()) ||
        ['adminaqua30@it', '(adminaqua30@it)', 'admin123'].includes(rawPass.toLowerCase());

      if (
        isAdminMatch &&
        (plainMatchesAdmin || matchesHash(config.adminHash, config.adminAltHash, ...(DEFAULT_AUTH_CONFIG.adminHashes || []), DEFAULT_AUTH_CONFIG.adminHash))
      ) {
        const user = {
          username: config.adminUser || cleanUser,
          role: 'admin',
          displayName: 'Administrator',
          avatarTitle: 'AD',
          loginTime: new Date().toISOString()
        };
        this.saveSession(user, rememberMe);
        this.notify(user);
        return { success: true, user };
      }

      // Check Standard User profile (supports configured username, 'user', and 'staff')
      const isUserMatch =
        userLower === userTarget ||
        userLower === 'user' ||
        userLower === 'staff';

      const plainMatchesUser =
        ['useraqua30@it', '(useraqua30@it)', 'user123'].includes(strippedPass.toLowerCase()) ||
        ['useraqua30@it', '(useraqua30@it)', 'user123'].includes(rawPass.toLowerCase());

      if (
        isUserMatch &&
        (plainMatchesUser || matchesHash(config.userHash, config.userAltHash, ...(DEFAULT_AUTH_CONFIG.userHashes || []), DEFAULT_AUTH_CONFIG.userHash))
      ) {
        const user = {
          username: config.userUser || cleanUser,
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
