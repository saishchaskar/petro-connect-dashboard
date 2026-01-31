// src/services/dsr.ts
import apiClient from './api'; // Ensure this path is correct
import dayjs from 'dayjs';
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
 * Fetches a single DSR shift for a given date from the backend.
 */
export const getDsrShift = async (date: string): Promise<DsrShift | null> => {
  try {
    const response = await apiClient.get(`/dsr/${date}`);
    if (response.data) {
      return { ...response.data, date: dayjs(response.data.date) };
    }
    return null;
  } catch (error) {
    console.error('Error fetching DSR shift for date ' + date, error);
    return null; // Return null on 404 or other errors
  }
};