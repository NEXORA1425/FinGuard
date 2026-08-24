import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { loginWithFirebase, loginWithGoogle as googleLoginService, signupWithFirebase, logoutFromFirebase, getMeApi } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session on mount with Firebase onAuthStateChanged & Local Session fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        let role: UserRole = fbUser.email?.includes('admin') ? 'admin' : 'user';
        try {
          const docRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role) {
            role = docSnap.data().role;
          }
        } catch (e) {
          console.warn('Firestore role check notice:', e);
        }

        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          role,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        });
        setLoading(false);
      } else {
        // Fallback check for session token
        try {
          const activeUser = await getMeApi();
          setUser(activeUser);
        } catch (err) {
          console.warn('Session verification error:', err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const u = await loginWithFirebase(email, password);
      setUser(u);
      return true;
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const u = await googleLoginService();
      setUser(u);
      return true;
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'user'
  ): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const u = await signupWithFirebase(email, password, name, role);
      setUser(u);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutFromFirebase();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
