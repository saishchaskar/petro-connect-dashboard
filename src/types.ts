// src/types.ts
import { Dayjs } from 'dayjs';

// --- CONFIGURATION TYPES ---
export interface NozzleConfig {
  id: string; // e.g., "A1", "V1"
  productType: 'Petrol' | 'Diesel';
}

export interface DispensingUnit {
  id: number;
  name: string; // e.g., "DU 1"
  nozzles: NozzleConfig[];
}

export interface StationConfig {
  stationName: string;
  dispensingUnits: DispensingUnit[];
  shifts: string[]; // e.g., ["Day", "Night"]
  isConfigured: boolean;
}

// --- DSR DATA TYPES ---

export interface NozzleEntry {
  key: string; // Changed to string to combine "DUId_NozzleId"
  duName: string; // For grouping in display
  productType: 'Petrol' | 'Diesel';
  nozzleId: string;
  startingReading: number;
  endingReading: number;
  testingSample: number;
  rate: number;
  
  // Calculated fields
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
  totalAmountPetrol: number;
  onlinePetrol: number;
  cardPetrol: number;
  creditPetrol: number;
  netCashPetrol: number;
  coinsPetrol: number;
  receivedCashPetrol: number;
  balancePetrol: number;
  
  // Diesel Side
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
export interface AnalyticsData {
  date: string;
  petrolVolume: number;
  petrolAmount: number;
  dieselVolume: number;
  dieselAmount: number;
  totalRevenue: number;
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
  shiftType: string; // NEW: "Day" or "Night"
  isClubbed?: boolean;
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