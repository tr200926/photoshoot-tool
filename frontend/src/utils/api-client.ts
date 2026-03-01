import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let apiClient: AxiosInstance | null = null;

export const initializeApiClient = (token?: string) => {
  apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  apiClient.interceptors.request.use((config) => {
    const storedToken =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (storedToken && config.headers) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return apiClient;
};

export const getApiClient = (): AxiosInstance => {
  if (!apiClient) initializeApiClient();
  return apiClient!;
};

export default getApiClient;
