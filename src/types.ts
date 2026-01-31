// src/types.ts
import { Dayjs } from 'dayjs';

export interface NozzleEntry {
  key: number;
  productType: 'Petrol' | 'Diesel';
  nozzleId: 'A1' | 'A2' | 'V1' | 'V2';
  startingReading: number;
  endingReading: number;
  testingSample: number;
  rate: number;
  
  // Calculated fields for display
  readingDiff?: number;
  netSale?: number;
  amount?: number;
}

export interface NoteEntry {
  denomination: number;
  countPetrol: number;
  amountPetrol?: number;
  countDiesel: number;
  amountDiesel?: number;
}

export interface FinancialSummary {
  // Petrol Side
  totalAmountPetrol: number; // Calculated from nozzles
  onlinePetrol: number;
  cardPetrol: number;
  creditPetrol: number;
  netCashPetrol: number; // (Total - Online - Card - Credit)
  receivedCashPetrol: number; // Actual cash in drawer
  balancePetrol: number; // Shortage/Excess
  
  // Diesel Side
  totalAmountDiesel: number;
  onlineDiesel: number;
  cardDiesel: number;
  creditDiesel: number;
  netCashDiesel: number;
  receivedCashDiesel: number;
  balanceDiesel: number;
  
  // Cash Denominations Totals
  cashTotalPetrol: number;
  cashTotalDiesel: number;
}

export interface DipEntry {
  productType: 'Petrol' | 'Diesel';
  startingDip: number;
  endingDip: number;
  dipDifference?: number;
  density: number;
  temperature: number;
  stock?: number;
}

export interface DsrShift {
  id?: number;
  date: Dayjs | string;
  salesman1: string; // Petrol Salesman
  salesman2: string; // Diesel Salesman
  nozzles: NozzleEntry[];
  notes: NoteEntry[];
  summary: FinancialSummary;
  dips: DipEntry[];
}

export interface PetrolStationProfile {
  id?: number;
  stationName: string;
  stationCode: string;
  email: string;
  contactNumber: string;
  address: string;
  dealerName: string;
}

export interface AuthResponse {
  token: string;
  user: {
    username: string;
    role: string;
  };
  stationProfile?: PetrolStationProfile;
}