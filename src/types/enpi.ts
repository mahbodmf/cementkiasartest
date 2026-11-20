export interface EnergyPerformanceEnPI {
  Date: string;
  Year: number;
  Month: number;
  MonthName: string;
  SEC_Electric_Actual: number;
  SEC_Electric_Target: number;
  SEC_Thermal_Actual: number;
  SEC_Thermal_Target: number;
  Natural_Gas_Nm3: number;
  Electric_Deviation: number;
  Thermal_Deviation: number;
  CUSUM_Electric: number;
  CUSUM_Thermal: number;
}

export interface ElectricalEnergy {
  Date: string;
  Year: number;
  Month: number;
  Crusher_Total_kWh: number;
  RawMill_Total_kWh: number;
  Kiln_Total_kWh: number;
  CementMill_Total_kWh: number;
  Factory_Total_kWh: number;
}

export interface ProductionOperations {
  Date: string;
  Year: number;
  Month: number;
  Kiln_Run_Hours: number;
  Kiln_Stop_Hours: number;
  CementMill_Run_Hours: number;
  CementMill_Stop_Hours: number;
  Clinker_Prod_ton: number;
  Cement_Prod_ton: number;
  Department: string;
  Stop_Reason: string;
  Stop_Category:
    | 'محدودیت برق'
    | 'عیوب مکانیکی'
    | 'عیوب برقی'
    | 'خطاهای فرایندی و نوار'
    | 'تعمیرات دوره‌ای'
    | 'عادی';
  Downtime_Duration_Hours: number;
}

export interface DispatchSales {
  Date: string;
  Year: number;
  Month: number;
  Bulk_Type2_42_5: number;
  Bagged_Type2_42_5: number;
  Bulk_Type2_32_5: number;
  Bagged_Type2_32_5: number;
  Dispatch_Total: number;
  Daily_Target: number;
}

export interface InventorySilos {
  Date: string;
  Year: number;
  Month: number;
  Raw_Meal_Silo_Pct: number;
  Clinker_Main_Silo_Pct: number;
  Cement_Silo_1_Pct: number;
  Cement_Silo_2_Pct: number;
  Clinker_Depot_Stock_ton: number;
}

export interface EnMSMasterDataset {
  energyPerformance: EnergyPerformanceEnPI[];
  electricalEnergy: ElectricalEnergy[];
  productionOperations: ProductionOperations[];
  dispatchSales: DispatchSales[];
  inventorySilos: InventorySilos[];
}

export interface EnMSBaselines {
  target_thermal_kcal_kg: number;
  target_electric_kwh_ton: number;
  clinker_depot_min_safe_stock_ton: number;
  daily_dispatch_target_ton: number;
  kiln_availability_target_pct: number;
  tolerance_electric_pct: number;
  tolerance_thermal_pct: number;
  units: Record<string, string>;
  critical_alert_thresholds: {
    electric_high_kwh_ton: number;
    thermal_high_kcal_kg: number;
    silo_critical_high_pct: number;
    silo_critical_low_pct: number;
  };
  department_electric_benchmarks: Record<
    string,
    { name: string; benchmark_kwh_ton: number; share_pct: number }
  >;
}