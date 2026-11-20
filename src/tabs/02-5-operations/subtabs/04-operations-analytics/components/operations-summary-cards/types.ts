export interface OperationsTargets {
  secThermalMax: number;          // سقف مجاز مصرف ویژه حرارتی خط پخت (kcal/kg clinker)
  secElectricMax: number;         // سقف مجاز مصرف ویژه برق کارخانه (kWh/ton cement)
  targetKilnOee: number;          // حداقل OEE هدف کوره دوار (درصد)
  minClinkerSafetyStock: number;  // کف دپوی اطمینان کلینکر (تن)
  targetDailyDispatch: number;    // کف تعهد تحویل و دیسپاچینگ روزانه (تن)
}

export const DEFAULT_TARGETS: OperationsTargets = {
  secThermalMax: 820,
  secElectricMax: 105,
  targetKilnOee: 75,
  minClinkerSafetyStock: 40000,
  targetDailyDispatch: 1000,
};

// اضافه شدن حالت 'all-quad' برای نمایش همزمان ۴ نمودار
export type ModalType = 'oee' | 'thermal' | 'runway' | 'dispatch' | 'all-quad' | null;

export type QuickFilterType = 'current' | 'last3m' | 'last6m' | 'all';

export interface MultiMonthDailyRecord {
  periodKey: string;
  dayNumber: number;
  jalaliDate: string;
  clinkerTon: number;
  cementTon: number;
  dispatchTon: number;
  secThermal: number;
  secElectrical: number;
  kilnRunHours: number;
  kilnStopHours: number;
  clinkerStockTon: number;
  oee: number;
  kilnStopCauses?: string;
}

export interface CalculatedSummary {
  avgKilnOEE: number;
  avgAvailability: number;
  avgPerformance: number;
  totalKilnStopHours: number;
  downtimeEnergyImpactKcal: number;
  inventoryRunwayDays: number;
  totalDispatch: number;
  totalClinker: number;
}

export interface DateRangeSelectorProps {
  quickFilter: QuickFilterType;
  onQuickFilterChange: (type: QuickFilterType) => void;
  startPeriod: string;
  endPeriod: string;
  onStartPeriodChange: (val: string) => void;
  onEndPeriodChange: (val: string) => void;
  availableMonthKeys: string[];
  onExportExcel?: () => void;
  onClose?: () => void;
}