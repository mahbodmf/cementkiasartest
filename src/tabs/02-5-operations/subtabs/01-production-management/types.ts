export type DepartmentFilterMode = 'all' | 'crusher' | 'rawMill' | 'kiln' | 'cementMill';

export type ProductionViewDisplayMode = 'table' | 'chart' | 'both';

export interface DailyProductionRecord {
  dayNumber: number;
  jalaliDate: string;

  // تولیدات (خروجی هر واحد بر حسب تن)
  crusherTon: number;
  rawMealTon: number;
  kilnFeedTon: number;
  clinkerTon: number;
  cementType2Ton: number;
  cementPuzzolanicTon: number;
  totalCementTon: number;
  dispatchTon: number;

  // ورودی‌های مواد اولیه و افزودنی‌ها (تن)
  crusherClayTon: number;
  rawMillLimestoneTon: number;
  rawMillClayTon: number;
  gypsumTon: number;

  // مصرف برق تفکیکی هر واحد (kWh)
  crusherKwh: number;
  rawMillKwh: number;
  kilnKwh: number;
  cementMillKwh: number;

  // شاخص‌های SEC تفکیکی روزانه
  crusherSecKwhTon: number;
  rawMillSecKwhTon: number;
  kilnElecSecKwhTon: number;
  cementMillSecKwhTon: number;
  secThermalKcalKg: number;
  secElectricalKwhTon: number;

  fuelGasM3: number;
  kilnEfficiencyPct: number;
  cementMillEfficiencyPct: number;
  notes?: string;
}

export interface DepartmentalTargetKpi {
  id: 'crusher' | 'rawMill' | 'kilnElec' | 'cementMill' | 'kilnThermal';
  title: string;
  unit: string;
  actualValue: number;
  targetValue: number;
  variancePct: number;
  isCompliant: boolean;
  totalProductionTon: number;
  totalEnergyUsed: number;
}

export interface ProductionSummary {
  totalClinkerTon: number;
  totalCementTon: number;
  totalKilnFeedTon: number;
  totalCrusherTon: number;
  totalRawMealTon: number;
  avgClinkerPerDay: number;
  avgCementPerDay: number;
  avgSecThermalKcalKg: number;
  avgSecElectricalKwhTon: number;
  operatingDays: number;
  feedToClinkerFactor: number;
  clinkerToCementFactor: number;
  avgKilnEfficiencyPct?: number;
  avgMillEfficiencyPct?: number;
  departmentalKpis: DepartmentalTargetKpi[];
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