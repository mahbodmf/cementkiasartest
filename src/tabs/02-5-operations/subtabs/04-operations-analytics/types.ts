// =============================================================================
// تایپ‌ها، اینترفیس‌ها و شاخص‌های پذیرش ثابت تحلیل عملیات و OEE
// استاندارد ISO 50001:2018 بند ۶.۴، ۸.۱ و ۹.۱
// =============================================================================

export const ACCEPTANCE_CRITERIA = {
  secThermalMax: 820,       // حداکثر مصرف ویژه حرارتی مجاز استاندارد (kcal/kg clinker)
  secElectricMax: 105,      // حداکثر مصرف ویژه الکتریکی مجاز (kWh/ton cement)
  nominalClinkerDaily: 2000, // ظرفیت نامی تولید روزانه کلینکر (ton/day)
  nominalCementDaily: 2300,  // ظرفیت نامی سایش روزانه سیمان (ton/day)
  targetDailyDispatch: 1000, // کف هدف فروش و دیسپاچ روزانه (ton/day)
  maxAllowedStopHours: 2.0,  // حداکثر توقف مجاز روزانه کوره (ساعت)
};

export interface DailyIntegratedRecord {
  dayNumber: number;
  jalaliDate: string;
  clinkerTon: number;
  cementTon: number;
  feedTon: number;
  dispatchTon: number;
  secThermal: number;
  secElectrical: number;
  kilnRunHours: number;
  kilnStopHours: number;
  millRunHours: number;
  millStopHours: number;
  rawMillRunHours: number;
  rawMillStopHours: number;
  crusherRunHours: number;
  crusherStopHours: number;
  kilnAvailability: number;
  kilnPerformance: number;
  kilnQuality: number;
  kilnOEE: number;
  clinkerStockTon: number;
  mainClinkerSiloPct: number;
  cementSilo1Pct: number;
  cementSilo2Pct: number;
  thermalDeviation: number;
  electricDeviation: number;
  clinkerDeficit: number;
  kilnStopCauses: string;
  millStopCauses: string;
  rawMillStopCauses: string;
  crusherStopCauses: string;
}

export interface AnalyticsSummary {
  avgKilnOEE: number;
  avgAvailability: number;
  avgPerformance: number;
  avgQuality: number;
  totalClinker: number;
  totalCement: number;
  totalDispatch: number;
  totalKilnRunHours: number;
  totalKilnStopHours: number;
  avgSecThermal: number;
  avgSecElectrical: number;
  inventoryRunwayDays: number;
  downtimeEnergyImpactKcal: number;
  nonCompliantThermalDays: number;
  nonCompliantElectricDays: number;
  totalDays: number;
}

export interface ParetoCauseItem {
  cause: string;
  count: number;
  hours: number;
  dept: string;
  pct: number;
}

export type DepartmentFilter = 'all' | 'kiln' | 'cementMill' | 'rawMill' | 'crusher';

export type ChartTabType = 'thermal' | 'production' | 'electrical' | 'dispatch';

export interface OperationsAnalyticsDashboardProps {
  externalPeriodKey?: string;
}
