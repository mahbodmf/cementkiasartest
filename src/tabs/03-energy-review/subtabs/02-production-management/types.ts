export interface DailyProductionRecord {
  dayNumber: number;
  jalaliDate: string;
  kilnFeedTon: number;
  clinkerTon: number;
  cementType2Ton: number;
  cementPuzzolanicTon: number;
  totalCementTon: number;
  crusherTon?: number;
  rawMealTon?: number;
  dispatchTon?: number;
  fuelGasM3: number;
  secThermalKcalKg: number;
  secElectricalKwhTon: number;
  kilnEfficiencyPct: number;
  cementMillEfficiencyPct: number;
  notes?: string;
}

export interface ProductionSummary {
  totalClinkerTon: number;
  totalCementTon: number;
  totalKilnFeedTon: number;
  avgClinkerPerDay: number;
  avgCementPerDay: number;
  avgSecThermalKcalKg: number;
  avgSecElectricalKwhTon: number;
  operatingDays: number;
  feedToClinkerFactor: number;
  clinkerToCementFactor: number; // نسبت کلینکر به سیمان
  avgKilnEfficiencyPct?: number; // میانگین راندمان کوره
  avgMillEfficiencyPct?: number; // میانگین راندمان آسیاب سیمان
}

export interface PeriodProductionData {
  period: string;
  year: number;
  month: number;
  monthName: string;
  plantName: string;
  summary: ProductionSummary;
  dailyRecords: DailyProductionRecord[];
}

export type TimeFilterMode = 'monthly' | 'seasonal' | 'yearly';