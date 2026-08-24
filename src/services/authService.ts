import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, db, googleProvider } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

export async function loginWithGoogle(): Promise<User> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const fbUser = userCredential.user;
    const cleanEmail = (fbUser.email || '').toLowerCase();
    let role: UserRole = cleanEmail.includes('admin') ? 'admin' : 'user';

    try {
      const docRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role) {
        role = docSnap.data().role;
      } else {
        await setDoc(docRef, {
          uid: fbUser.uid,
          email: cleanEmail,
          name: fbUser.displayName || 'Google User',
          role,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Firestore Google signin doc update notice:', e);
    }

    return {
      id: fbUser.uid,
      email: cleanEmail,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
      role,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    throw new Error(err.message || 'Google Sign-In failed.');
  }
}


export async function loginWithFirebase(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  // Special Demo Account Handling if Firebase fails or for offline fallback
  if (cleanEmail === 'admin@finguard.com' && password === 'Admin123!') {
    return {
      id: 'usr-demo-admin',
      email: 'admin@finguard.com',
      name: 'Compliance Admin (Risk Officer)',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
  }

  if (cleanEmail === 'user@finguard.com' && password === 'User123!') {
    return {
      id: 'usr-demo-user',
      email: 'user@finguard.com',
      name: 'Alex Morgan',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    // Fetch user role from Firestore if available, default to 'admin' if admin email or 'user'
    let role: UserRole = cleanEmail.includes('admin') ? 'admin' : 'user';
    try {
      const docRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().role) {
        role = docSnap.data().role;
      }
    } catch (e) {
      console.warn('Firestore role fetch notice:', e);
    }

    return {
      id: fbUser.uid,
      email: fbUser.email || cleanEmail,
      name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
      role,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Firebase Auth Error:', err);
    // Fallback to local server API if firebase network fails or is blocked
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(err.message || data.error || 'Failed to sign in.');
    }

    localStorage.setItem('finguard_auth_token_v1', data.token);
    return data.user;
  }
}

export async function signupWithFirebase(
  email: string,
  password: string,
  name: string,
  role: UserRole = 'user'
): Promise<User> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fbUser = userCredential.user;

    // Set display name in Firebase auth profile
    await updateProfile(fbUser, { displayName: name });

    // Store user metadata and role in Firestore
    try {
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        email: email.trim().toLowerCase(),
        name,
        role,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Firestore doc save notice:', e);
    }

    return {
      id: fbUser.uid,
      email: fbUser.email || email,
      name: name,
      role,
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error('Firebase Signup Error:', err);
    // Fallback to local backend API
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(err.message || data.error || 'Failed to create account.');
    }

    localStorage.setItem('finguard_auth_token_v1', data.token);
    return data.user;
  }
}

export async function logoutFromFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('Firebase logout notice:', e);
  }

  const token = localStorage.getItem('finguard_auth_token_v1');
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn('Backend logout notification error', e);
    }
  }
  localStorage.removeItem('finguard_auth_token_v1');
}

export function getStoredToken(): string | null {
  return localStorage.getItem('finguard_auth_token_v1');
}

export async function getMeApi(): Promise<User | null> {
  const token = localStorage.getItem('finguard_auth_token_v1');
  if (!token) return null;

  try {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem('finguard_auth_token_v1');
      return null;
    }

    const data = await response.json();
    return data.user || null;
  } catch (err) {
    console.warn('Failed to verify session token', err);
    return null;
  }
}

