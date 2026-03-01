import { useEffect, useState } from 'react';
import { useAuthStore } from '@utils/auth-store';
import { useRouter } from 'next/navigation';
import apiClient from '@utils/api-client';

export const useRequireAuth = () => {
  const router = useRouter();
  const { token, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Check for stored token
    const storedToken = localStorage.getItem('auth_token');
    if (!token && !storedToken) {
      router.push('/login');
    } else if (!token && storedToken) {
      useAuthStore.setState({ token: storedToken });
      setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, [token, router, isLoading]);

  return isReady;
};

export const useApi = () => {
  return apiClient;
};
