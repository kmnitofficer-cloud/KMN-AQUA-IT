/**
 * ============================================================================
 * FIREBASE AUTHENTICATION ADAPTER (OPTIONAL CLOUD AUTH)
 * ============================================================================
 * Pluggable Firebase Auth module.
 * If Firebase configuration is detected in environment variables,
 * users can authenticate via Firebase Cloud Auth.
 * If not configured, the system seamlessly falls back to device-cached
 * credential authentication.
 */

export function getFirebaseConfig() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || ''
  };
}

export function isFirebaseConfigured() {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
}

export async function firebaseSignIn(emailOrUsername, password) {
  if (!isFirebaseConfigured()) {
    return { success: false, configured: false };
  }

  try {
    // Dynamic import to avoid build errors if firebase package is not installed
    const { initializeApp, getApps } = await import(/* @vite-ignore */ 'firebase/app');
    const { getAuth, signInWithEmailAndPassword } = await import(/* @vite-ignore */ 'firebase/auth');

    const config = getFirebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    const auth = getAuth(app);

    // Format email if plain username passed
    const email = emailOrUsername.includes('@') 
      ? emailOrUsername 
      : `${emailOrUsername.toLowerCase()}@kmnaqua.internal`;

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    const role = (emailOrUsername.toLowerCase().includes('admin') || fbUser.email?.toLowerCase().includes('admin')) 
      ? 'admin' 
      : 'viewer';

    return {
      success: true,
      configured: true,
      user: {
        username: emailOrUsername,
        role,
        uid: fbUser.uid,
        email: fbUser.email
      }
    };
  } catch (error) {
    console.warn('[firebaseAuth] Sign-in error:', error);
    return {
      success: false,
      configured: true,
      error: error.message || 'Firebase authentication failed'
    };
  }
}

export async function firebaseSignOut() {
  if (!isFirebaseConfigured()) return;
  try {
    const { getApps } = await import(/* @vite-ignore */ 'firebase/app');
    const { getAuth, signOut } = await import(/* @vite-ignore */ 'firebase/auth');
    if (getApps().length > 0) {
      const auth = getAuth();
      await signOut(auth);
    }
  } catch (e) {
    console.warn('[firebaseAuth] Sign-out error:', e);
  }
}

