// src/services/auth.ts
import apiClient from './api';

export const getStationName = (): string => {
  return localStorage.getItem('station_name') || 'PetroConnect';
};

export const isAppConfigured = (): boolean => {
  return localStorage.getItem('station_configured') === 'true';
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('auth_token');
};

export const logoutUser = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('username');
  // Force a reload to clear all state and redirect to login
  window.location.href = '/login';
};

export const loginUser = async (values: any): Promise<any> => {
  // Make a real API call to the backend's /login endpoint
  const response = await apiClient.post('/auth/login', values);
  console.log('Login response:', response.data);
  return response.data;
};

export const registerStation = async (values: any): Promise<any> => {
  // Make a real API call to the backend's /register endpoint
  const response = await apiClient.post('/auth/register', values);
  console.log('Register response:', response.data);
  return response.data;
};
