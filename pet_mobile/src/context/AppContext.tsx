import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserInfo } from '../types';
import * as mockApi from '../api/mock';

type AppContextValue = {
  user: UserInfo | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
  setUser: (u: UserInfo | null) => void;
  loginSuccess: (u: UserInfo) => void;
  logout: () => Promise<void>;
  toggleDarkMode: () => void;
  refreshUser: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const refreshUser = useCallback(async () => {
    const u = await mockApi.getCurrentUser();
    setUser(u);
    setIsLoggedIn(!!u);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const u = await mockApi.getCurrentUser();
      setUser(u);
      setIsLoggedIn(!!u);
      setIsLoading(false);
    })();
  }, []);

  const loginSuccess = useCallback((u: UserInfo) => {
    setUser(u);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await mockApi.logout();
    setUser(null);
    setIsLoggedIn(false);
  }, []);

  const toggleDarkMode = useCallback(() => setIsDarkMode((v) => !v), []);

  const value: AppContextValue = {
    user,
    isLoggedIn,
    isLoading,
    isDarkMode,
    setUser,
    loginSuccess,
    logout,
    toggleDarkMode,
    refreshUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
