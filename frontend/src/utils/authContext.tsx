'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@utils/auth-store';
import { initializeApiClient } from '@utils/api-client';

const AuthContext = createContext(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      initializeApiClient(token);
    }
  }, [token]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
