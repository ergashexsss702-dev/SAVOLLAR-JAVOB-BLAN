import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSession } from '../../shared/types.ts';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  loginStepA: (fullName: string, phone: string) => Promise<{
    success: boolean;
    message?: string;
    price?: string;
    telegramUrl?: string;
    normalizedPhone?: string;
    fullName?: string;
  }>;
  loginStepB: (fullName: string, phone: string, accessCode: string) => Promise<{ success: boolean; message?: string }>;
  adminLogin: (adminKey: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'savollar_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/session', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          // Token expired or invalid
          setToken(null);
          sessionStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
        }
      } catch {
        // network or server error
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [token]);

  const loginStepA = async (fullName: string, phone: string) => {
    try {
      const res = await fetch('/api/auth/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: 'Server bilan bog\'lanishda xatolik yuz berdi.' };
    }
  };

  const loginStepB = async (fullName: string, phone: string, accessCode: string) => {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, accessCode }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        try {
          sessionStorage.setItem(TOKEN_KEY, data.token);
        } catch {}
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Kod noto\'g\'ri' };
    } catch {
      return { success: false, message: 'Server bilan bog\'lanishda xatolik yuz berdi.' };
    }
  };

  const adminLogin = async (adminKey: string) => {
    return loginStepB('Administrator', '+998900000000', adminKey);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginStepA,
        loginStepB,
        adminLogin,
        logout,
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
