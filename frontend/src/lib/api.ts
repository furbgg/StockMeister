import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Backend Error Format: {timestamp, status, error, message, path}
 */
export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/**
 * Customized API Error Class
 */
export class ApiError extends Error {
  public readonly status?: number;
  public readonly backendError?: ApiErrorResponse;

  constructor(message: string, backendError?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiError';
    this.status = backendError?.status;
    this.backendError = backendError;
  }
}

const API_CONFIG = {
  baseURL: '/api',
};

// Instance Definitions
export const api = axios.create({ ...API_CONFIG, headers: { 'Content-Type': 'application/json' } });
export const apiMultipart = axios.create({ ...API_CONFIG, headers: { 'Content-Type': 'multipart/form-data' } });

/**
 * Request Interceptor: Attach Bearer Token + Debug Logging
 */
const requestHandler = (config: InternalAxiosRequestConfig) => {
  const authToken = localStorage.getItem('authToken');

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  return config;
};

/**
 * Response Interceptor: 401 Unauthorized & Error Management
 */
const errorHandler = (error: AxiosError<ApiErrorResponse>) => {
  const status = error.response?.status;

  if (status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.clear();
    window.location.href = '/login';
  }

  // 403 is handled by the UI (unauthorized page redirect)

  const backendError = error.response?.data;
  return Promise.reject(new ApiError(backendError?.message || error.message, backendError));
};

// Apply interceptors to both instances
[api, apiMultipart].forEach(instance => {
  instance.interceptors.request.use(requestHandler as any);
  instance.interceptors.response.use(res => res, errorHandler);
});

export default api;