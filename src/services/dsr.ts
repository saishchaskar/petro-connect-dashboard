// src/services/dsr.ts
import apiClient from './api';
import type { DsrShift } from '../types';

/**
 * Saves the entire shift object to the backend.
 */
export const saveDsrShift = async (shift: any): Promise<DsrShift> => {
  try {
    const response = await apiClient.post('/dsr', shift);
    return response.data;
  } catch (error) {
    console.error('Error saving DSR shift:', error);
    throw error;
  }
};

/**
 * Fetches all DSR shifts from the backend.
 */
export const getDsrShifts = async (): Promise<DsrShift[]> => {
  try {
    const response = await apiClient.get('/dsr');
    return response.data;
  } catch (error) {
    console.error('Error fetching DSR shifts:', error);
    throw error;
  }
};