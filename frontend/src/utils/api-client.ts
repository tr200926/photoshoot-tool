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

  // Add request interceptor for token
  apiClient.interceptors.request.use((config) => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken && config.headers) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
    return config;
  });

  // Add response interceptor for error handling
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    },
  );

  return apiClient;
};

export const getApiClient = (): AxiosInstance => {
  if (!apiClient) {
    initializeApiClient();
  }
  return apiClient!;
};

export default getApiClient;
