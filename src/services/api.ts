import axios, { AxiosError } from 'axios';
import { notification } from 'antd';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include the auth token on every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Don't show toast for cancellation
    if (axios.isCancel(error)) {
        return Promise.reject(error);
    }

    console.error('API Error:', error.response?.status, error.response?.data);

    if (error.response) {
      const { status, data } = error.response;
      const apiData = data as any;

      let message = `Error: ${status}`;
      let description = 'An unexpected error occurred.';

      if (apiData) {
        if (typeof apiData === 'string' && apiData.length < 200) {
          description = apiData;
        } else if (typeof apiData.message === 'string') {
          description = apiData.message;
        } else if (typeof apiData.error === 'string') {
          description = apiData.error;
        }
      }

      if (status === 401) {
        // If 401 occurs on any page other than login, it's an expired session.
        if (window.location.pathname !== '/login') {
          message = 'Unauthorized';
          description = 'Your session has expired. Please log in again.';
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
          localStorage.removeItem('station_name');
          localStorage.removeItem('station_configured');
          localStorage.removeItem('station_createdAt');
          window.location.href = '/login';
        } else {
          // If 401 on login page, it's a failed login attempt.
          message = 'Login Failed';
          // The description is already set from the API response data.
        }
      }

      // Do not show a global notification for 404s, they are handled locally.
      if (status !== 404) {
        notification.error({
          message,
          description,
          placement: 'topRight',
          // duration: 6,
        });
      }
    } else if (error.request) {
      // Network error
      notification.error({
        message: 'Network Error',
        description: 'Could not connect to the server. Please check your network connection.',
        placement: 'topRight',
        duration: 6,
      });
    } else {
      // Other errors
      notification.error({
        message: 'Request Error',
        description: error.message,
        placement: 'topRight',
        duration: 6,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// We will move the DSR functions to their own service file later for better organization.