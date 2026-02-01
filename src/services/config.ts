// src/services/config.ts
import type { StationConfig } from '../types';

const CONFIG_KEY = 'petro_station_config';

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

export const getStationConfig = (): StationConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
};

export const saveStationConfig = (config: StationConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...config, isConfigured: true }));
};

export const isStationConfigured = (): boolean => {
  const config = getStationConfig();
  return config.isConfigured;
};