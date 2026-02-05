// src/services/dsr.ts
import apiClient from './api';
import type { DsrShift, AnalyticsData } from '../types';

// Check if a specific shift exists (for locking logic)
export const checkShiftCompletion = async (date: string, shift: string): Promise<boolean> => {
  try {
    const response = await apiClient.get(`/dsr/exists`, {
      params: { date, shift }
    });
    return response.data; // Expecting boolean
  } catch (e) {
    console.error('Error checking shift completion:', e);
    return false;
  }
};

// Get a single shift
export const getDsrShift = async (date: string, shift: string): Promise<DsrShift | null> => {
  try {
    const res = await apiClient.get('/dsr', {
      params: { date, shift }
    });
    return res.data;
  } catch (error) {
    // If 404, return null so the UI can create a blank shift
    return null;
  }
};

// Save a shift
export const saveDsrShift = async (dsr: DsrShift) => {
  return apiClient.post('/dsr', dsr);
};

// Get Monthly Report
export const getConsolidatedReport = async (month: number, year: number) => {
  return apiClient.get('/dsr/consolidated', {
    params: { month, year }
  });
};

export const getAnalyticsData = async (startDate: string, endDate: string): Promise<AnalyticsData[]> => {
  const res = await apiClient.get('/dsr/analytics', {
    params: { startDate, endDate }
  });
  return res.data;
};



