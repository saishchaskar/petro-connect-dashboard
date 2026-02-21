// src/services/config.ts
import type { StationConfig } from '../types';
import apiClient from './api';

const DEFAULT_CONFIG: StationConfig = {
  stationName: 'My Petrol Station',
  dispensingUnits: [
    {
      id: 1,
      name: 'DU 1',
      nozzles: [
        { id: 'A1', productType: 'Petrol' },
        { id: 'A2', productType: 'Petrol' }
      ]
    },
    {
      id: 2,
      name: 'DU 2',
      nozzles: [
        { id: 'V1', productType: 'Diesel' },
        { id: 'V2', productType: 'Diesel' }
      ]
    }
  ],
  shifts: ['Day', 'Night'],
  isConfigured: false,
};

export const getStationConfig = async (): Promise<StationConfig> => {
    try {
        const username = localStorage.getItem('username');
        if (!username) throw new Error('Username not found in localStorage');
        const response = await apiClient.get('/station/config', { params: { username } });
        const stationData = response.data;

        if (stationData && stationData.configuration) {
            const config = JSON.parse(stationData.configuration);
            return { ...config, stationName: stationData.stationName, isConfigured: true };
        }

        // If no config on backend, return default, allowing user to configure it.
        return { ...DEFAULT_CONFIG, stationName: stationData.stationName || 'My Petrol Station', isConfigured: false };
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return DEFAULT_CONFIG;
        }
        console.error('Error fetching station config:', error);
        // Fallback for network errors etc.
        return DEFAULT_CONFIG;
    }
};

export const saveStationConfig = async (config: StationConfig) => {
    const username = localStorage.getItem('username');
    if (!username) throw new Error('Username not found in localStorage');
    const payload = { ...config, isConfigured: true };
    const requestBody = { configuration: JSON.stringify(payload) };
    try {
        await apiClient.put('/station/config', requestBody, { params: { username } });
        localStorage.setItem('station_configured', 'true');
    } catch (error) {
        console.error('Failed to save config:', error);
        throw new Error('Failed to save config');
    }
};

export const isStationConfigured = (): boolean => {
  // This sync function is now unreliable and deprecated.
  // Configuration status should be checked asynchronously or on login.
  return localStorage.getItem('station_configured') === 'true';
};