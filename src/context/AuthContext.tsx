import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authService } from '../services/api';

export type AuthUser = {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
};

type LoginResult = {
  success: boolean;
  user?: AuthUser;
  error?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setUserDirectly: (userData: AuthUser | null) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError("Une erreur est survenue lors de la vérification de l'authentification");
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login(email, password);

      if (result.success) {
        const userData: AuthUser = { ...(result.user || {}) };
        if (!userData.id) {
          userData.id = userData.email || email;
        }

        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        return { success: true, user: userData };
      }

      setError(result.error);
      return { success: false, error: result.error };
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err?.message || 'Erreur de connexion';
      setError(message);
      return { success: false, error: message || 'Identifiants incorrects' };
    } finally {
      setLoading(false);
    }
  };

  const setUserDirectly = (userData: AuthUser | null) => {
    if (userData && !userData.id) {
      userData.id = userData.email || userData.id;
    }
    setUser(userData);
    if (userData) {
      sessionStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.removeItem('user');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
    } finally {
      setUser(null);
      sessionStorage.removeItem('user');
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    setUserDirectly,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
