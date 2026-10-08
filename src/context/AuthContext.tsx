import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRole: Role | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => Promise<boolean>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('univault_token'));
  const [activeRoleId, setActiveRoleId] = useState<string | null>(() => localStorage.getItem('univault_role_id'));
  const [isLoading, setIsLoading] = useState(true);

  // Authenticated fetch wrapper
  const apiFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      const currentToken = token || localStorage.getItem('univault_token');
      const currentRole = activeRoleId || localStorage.getItem('univault_role_id');

      if (currentToken) {
        headers.set('Authorization', `Bearer ${currentToken}`);
      }
      if (currentRole) {
        headers.set('x-active-role-id', currentRole);
      }

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401 && !url.includes('/api/auth/login')) {
        // Token expired
        logout();
      }

      return response;
    },
    [token, activeRoleId]
  );

  // Fetch current user on mount if token exists
  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('univault_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          const savedRole = localStorage.getItem('univault_role_id');
          if (savedRole && data.user.roles.some((r: Role) => r.id === savedRole)) {
            setActiveRoleId(savedRole);
          } else {
            setActiveRoleId(data.user.roles[0]?.id || null);
          }
        } else {
          localStorage.removeItem('univault_token');
          localStorage.removeItem('univault_role_id');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load user session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [apiFetch]);

  const login = async (email: string, password = 'password123') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('univault_token', data.token);
      localStorage.setItem('univault_role_id', data.user.activeRoleId);
      setToken(data.token);
      setUser(data.user);
      setActiveRoleId(data.user.activeRoleId);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
      localStorage.removeItem('univault_token');
      localStorage.removeItem('univault_role_id');
      setToken(null);
      setUser(null);
      setActiveRoleId(null);
    }
  };

  const switchRole = async (roleId: string): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRoleId(data.activeRoleId);
        localStorage.setItem('univault_role_id', data.activeRoleId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const activeRole = user?.roles.find(r => r.id === activeRoleId) || user?.roles[0] || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRole,
        isLoading,
        login,
        logout,
        switchRole,
        apiFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
