"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AdminData {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminContextType {
  admin: AdminData | null;
  token: string | null;
  login: (adminData: AdminData, token: string) => void;
  updateAdminData: (adminData: AdminData) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Only run admin verification on admin routes to avoid 401 noise on public pages
    if (!pathname?.startsWith('/cbprotected-admin-register')) {
      setIsLoading(false);
      return;
    }

    const verifyAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated && data.admin) {
            setAdmin(data.admin);
            setIsAuthenticated(true);
            localStorage.setItem('adminData', JSON.stringify(data.admin));
          } else {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            setAdmin(null);
            setToken(null);
            setIsAuthenticated(false);
          }
        } else {
          // Silently ignore 401s; user is simply not logged in as admin
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          setAdmin(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch {
        // Network or other error; treat as unauthenticated without logging noise
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setAdmin(null);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [pathname]);

  const login = (adminData: AdminData, token: string) => {
    setAdmin(adminData);
    setToken(token);
    setIsAuthenticated(true);
    // Store admin data in localStorage for UI purposes (token is in HttpOnly cookie)
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  const updateAdminData = (adminData: AdminData) => {
    setAdmin(adminData);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  return (
    <AdminContext.Provider value={{ admin, token, login, updateAdminData, logout, isAuthenticated, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
