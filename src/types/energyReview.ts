// =============================================================================
// تایپ‌های بازنگری انرژی (ISO 50001:2018 بند ۶.۳)
// =============================================================================

export type EquipmentEnergyType = 'الکتریکی' | 'حرارتی' | 'الکتروترمال (ترکیبی)' | string;

export interface DepartmentEquipmentNestedItem {
  tag: string;
  name: string;
  type: string;
  energyType?: EquipmentEnergyType;
  fuelType?: string;
  powerKw?: number;
  thermalCapacityGjH?: number;
  voltage?: string;
  capacity?: string;
  operatingTempC?: number;
  isSeu?: boolean;
  criticality?: string;
}

export interface DepartmentGroupWithEquipments {
  id: string;
  name: string;
  code: string;
  secBenchmark: number;
  secUnit: string;
  secThermalBenchmark: number;
  secThermalUnit: string;
  sharePct: number;
  thermalSharePct: number;
  seuStatus: string;
  description: string;
  installedPowerKw: number;
  installedThermalGjH: number;
  equipments: DepartmentEquipmentNestedItem[];
}

export interface EnergyDepartmentShareItem {
  department: string;
  electricityMwh: number;
  electricityPct: number;
  naturalGasNm3: number;
  fuelOilLiter: number;
  compressedAirPct: number;
  totalGj: number;
  [key: string]: any;
}

export interface EnergyBreakdownData {
  summary: {
    totalThermalEnergyGj: number;
    totalElectricalEnergyMwh: number;
    totalFuelGasNm3: number;
    totalFuelOilLiter: number;
    totalCompressedAirNm3: number;
  };
  departmentsShare: EnergyDepartmentShareItem[];
}

export interface EquipmentEfficiencyItem {
  tag: string;
  name: string;
  department: string;
  ratedCapacity: string;
  operatingEfficiencyPct: number;
  benchmarkEfficiencyPct: number;
  lossFactors: string;
  actionPlan: string;
  status: string;
}

export interface MonthlyScheduleItem {
  month: string;
  clinkerTon: number;
  cementTon: number;
  secElectricTarget: number;
  secThermalTarget: number;
  electricityMwh: number;
  gasNm3: number;
  fuelOilLiter: number;
  operationConstraint: string;
}

export interface ProductionEnergyForecastData {
  annualSummary: {
    plannedClinkerTon: number;
    plannedCementTon: number;
    budgetedElectricityMwh: number;
    budgetedGasNm3: number;
    budgetedFuelOilLiter: number;
  };
  monthlySchedule: MonthlyScheduleItem[];
}

export interface EnergyReviewKeyPersonnel {
  id: string;
  role: string;
  department: string;
  affectedSeu: string;
  energyImpact: string;
  requiredCompetence: string;
  trainingStatus: 'منطبق' | 'نیازمند بازآموزی' | 'در حال آموزش' | string;
  monitoringMethod: string;
}

export interface RelevantVariableItem {
  id: string;
  variableName: string;
  department: string;
  targetSeu: string;
  variableType: 'متغیر فرآیندی' | 'متغیر کیفی و مواد' | 'متغیر محیطی' | 'عامل استاتیک' | string;
  unit: string;
  typicalRange: string;
  impactOnEnPI: string;
  correlationLevel: 'بسیار قوی' | 'قوی' | 'متوسط' | 'ضعیف' | string;
  monitoringMethod: string;
}

export interface EnergyReviewAdvancedData {
  keyPersonnel?: EnergyReviewKeyPersonnel[];
  relevantVariables?: RelevantVariableItem[];
  energyBreakdown?: EnergyBreakdownData;
  equipmentEfficiency?: EquipmentEfficiencyItem[];
  productionEnergyForecast?: ProductionEnergyForecastData;
  [key: string]: any;
}
