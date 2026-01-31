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
  // Petrol Side (Used as GLOBAL/COMBINED in Clubbed mode)
  totalAmountPetrol: number;
  onlinePetrol: number;
  cardPetrol: number;
  creditPetrol: number;
  netCashPetrol: number;
  coinsPetrol: number;
  receivedCashPetrol: number;
  balancePetrol: number;
  
  // Diesel Side (Ignored in Clubbed mode)
  totalAmountDiesel: number;
  onlineDiesel: number;
  cardDiesel: number;
  creditDiesel: number;
  netCashDiesel: number;
  coinsDiesel: number;
  receivedCashDiesel: number;
  balanceDiesel: number;
  
  cashTotalPetrol: number;
  cashTotalDiesel: number;
}

export interface DipEntry {
  productType: 'Petrol' | 'Diesel';
  startingDip: number;
  endingDip: number;
  density: number;
  temperature: number;
  saleOrStock: number;
}

export interface DsrShift {
  id?: number;
  date: Dayjs | string;
  isClubbed?: boolean; // NEW FIELD: Toggle for Combined Accounting
  salesman1: string;
  salesman2: string;
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