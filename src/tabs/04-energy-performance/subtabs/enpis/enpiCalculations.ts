export type EnpiComplianceStatus = 'compliant' | 'warning' | 'non-compliant' | 'no-data';

export type EnpiFilterMode = 'monthly' | 'seasonal' | 'yearly' | 'all';

export interface DepartmentTargetConfig {
  id: string;
  name: string;
  carrier: string;
  carrierType: 'electric' | 'thermal';
  productionBasisLabel: string;
  productionField: 'crusher' | 'rawMeal' | 'clinker' | 'cement';
  energyFields: string[];
  targetSec: number;
  unit: string;
  energyUnit: string;
}

export interface RegressionModelSpec {
  id: string;
  title: string;
  formulaText: string;
  coeffCCD: number;
  coeffCement: number;
  totalUnit: string;
  specificUnit: string;
}

export interface EnpiConfig {
  version: string;
  standardReference: string;
  plantName: string;
  dataSources: {
    productionReportPath: string;
    energyConsumptionPath: string;
  };
  calorificFactors: {
    naturalGasKcalPerNm3: number;
    fuelOilKcalPerLiter: number;
  };
  toleranceWarningPct: number;
  stage1DepartmentTargets: DepartmentTargetConfig[];
  regressionModels: {
    variables: {
      ccd: { symbol: string; title: string; formula: string; unit: string };
      cement: { symbol: string; title: string; formula: string; unit: string };
    };
    electrical: RegressionModelSpec;
    thermal: RegressionModelSpec;
  };
}

export interface DepartmentSecResult {
  id: string;
  name: string;
  carrier: string;
  carrierType: 'electric' | 'thermal';
  productionBasisLabel: string;
  totalProductionTon: number;
  totalEnergy: number;
  energyUnit: string;
  actualSec: number | null;
  targetSec: number;
  unit: string;
  deviationAbs: number | null;
  deviationPct: number | null;
  status: EnpiComplianceStatus;
}

export interface RegressionOutcome {
  actualTotal: number;
  expectedTotal: number;
  diffTotal: number;
  diffPct: number | null;
  actualSpecific: number | null;
  expectedSpecific: number | null;
  diffSpecific: number | null;
  status: EnpiComplianceStatus;
}

export interface PeriodEnpiSummary {
  periodKey: string;
  label: string;
  year: number;
  month: number;
  daysCount: number;
  clinkerTon: number;
  cementTon: number;
  ccdTon: number;
  crusherTon: number;
  rawMealTon: number;
  gasNm3: number;
  fuelOilLiter: number;
  departments: DepartmentSecResult[];
  electricalRegression: RegressionOutcome;
  thermalRegression: RegressionOutcome;
}

export const DEFAULT_ENPI_CONFIG: EnpiConfig = {
  version: '1.0.0',
  standardReference: 'ISO 50001:2018 - Clause 6.4 (EnPIs) & Clause 6.5 (EnB)',
  plantName: 'شرکت صنایع سیمان کیاسر (مانیستان)',
  dataSources: {
    productionReportPath: '/data/02-5-operations/daily-production-report.json',
    energyConsumptionPath: '/data/03-energy-review/energy-consumption-log.json',
  },
  calorificFactors: {
    naturalGasKcalPerNm3: 8588.9,
    fuelOilKcalPerLiter: 8600.0,
  },
  toleranceWarningPct: 5.0,
  stage1DepartmentTargets: [
    {
      id: 'crusher',
      name: 'سنگ‌شکن',
      carrier: 'برق',
      carrierType: 'electric',
      productionBasisLabel: 'مواد خردشده',
      productionField: 'crusher',
      energyFields: ['substation1_Crusher', 'crusherMotor'],
      targetSec: 1.14,
      unit: 'kWh/t',
      energyUnit: 'kWh',
    },
    {
      id: 'rawMill',
      name: 'آسیاب مواد خام',
      carrier: 'برق',
      carrierType: 'electric',
      productionBasisLabel: 'مواد تولیدی ثبت‌شده',
      productionField: 'rawMeal',
      energyFields: ['substation2_RawMill', 'rawMillMainMotor', 'rawMillFanMotor'],
      targetSec: 24.0,
      unit: 'kWh/t',
      energyUnit: 'kWh',
    },
    {
      id: 'kilnElectric',
      name: 'پخت - برق کل واحد',
      carrier: 'برق',
      carrierType: 'electric',
      productionBasisLabel: 'کلینکر',
      productionField: 'clinker',
      energyFields: [
        'substation3_Kiln',
        'kilnMainDrive',
        'kilnIdFan',
        'baghouseMotor',
        'substation4_EP',
        'epFanMotor',
      ],
      targetSec: 34.0,
      unit: 'kWh/t',
      energyUnit: 'kWh',
    },
    {
      id: 'cementMill',
      name: 'آسیاب سیمان',
      carrier: 'برق',
      carrierType: 'electric',
      productionBasisLabel: 'سیمان',
      productionField: 'cement',
      energyFields: [
        'substation5_CementMill',
        'cementMill1Motor',
        'cementMill2Motor',
        'cementMillFan',
      ],
      targetSec: 38.0,
      unit: 'kWh/t',
      energyUnit: 'kWh',
    },
    {
      id: 'kilnThermal',
      name: 'پخت - انرژی حرارتی',
      carrier: 'حرارت (گاز و مازوت)',
      carrierType: 'thermal',
      productionBasisLabel: 'کلینکر',
      productionField: 'clinker',
      energyFields: ['naturalGasNm3', 'fuelOilLiter'],
      targetSec: 900.0,
      unit: 'kcal/kg',
      energyUnit: 'Mcal',
    },
  ],
  regressionModels: {
    variables: {
      ccd: {
        symbol: 'CCD',
        title: 'اختلاف تولید کلینکر و سیمان',
        formula: 'Clinker - Cement',
        unit: 'تن',
      },
      cement: {
        symbol: 'C.',
        title: 'تناژ تولیدی سیمان تیپ ۲ (۳۲.۵)',
        formula: 'Cement Type 2 (32.5)',
        unit: 'تن',
      },
    },
    electrical: {
      id: 'org_electrical',
      title: 'شاخص رگرسیونی برق کل سازمان',
      formulaText: 'Y_elec = (-57.08 × CCD) + (108.31 × C.)',
      coeffCCD: -57.08,
      coeffCement: 108.31,
      totalUnit: 'kWh',
      specificUnit: 'kWh/t',
    },
    thermal: {
      id: 'org_thermal',
      title: 'شاخص رگرسیونی حرارتی کل سازمان',
      formulaText: 'Y_thermal = (-98.89 × CCD) + (114.38 × C.)',
      coeffCCD: -98.89,
      coeffCement: 114.38,
      totalUnit: 'Nm³ معادل گاز',
      specificUnit: 'Nm³/t',
    },
  },
};

export const SEASONS_MAP: Record<string, { label: string; months: string[] }> = {
  spring: { label: 'بهار', months: ['01', '02', '03'] },
  summer: { label: 'تابستان', months: ['04', '05', '06'] },
  autumn: { label: 'پاییز', months: ['07', '08', '09'] },
  winter: { label: 'زمستان', months: ['10', '11', '12'] },
};

const PERSIAN_MONTH_NAMES: Record<number, string> = {
  1: 'فروردین',
  2: 'اردیبهشت',
  3: 'خرداد',
  4: 'تیر',
  5: 'مرداد',
  6: 'شهریور',
  7: 'مهر',
  8: 'آبان',
  9: 'آذر',
  10: 'دی',
  11: 'بهمن',
  12: 'اسفند',
};

export function getComplianceStatus(
  actual: number | null,
  target: number,
  toleranceWarningPct: number
): EnpiComplianceStatus {
  if (actual === null || !Number.isFinite(actual) || target <= 0) {
    return 'no-data';
  }
  if (actual <= target) {
    return 'compliant';
  }
  const overPct = ((actual - target) / target) * 100;
  return overPct <= toleranceWarningPct ? 'warning' : 'non-compliant';
}

export function getRegressionComplianceStatus(
  actual: number,
  expected: number,
  toleranceWarningPct: number
): EnpiComplianceStatus {
  if (!Number.isFinite(actual) || !Number.isFinite(expected) || expected <= 0) {
    return 'no-data';
  }
  if (actual <= expected) {
    return 'compliant';
  }
  const overPct = ((actual - expected) / expected) * 100;
  return overPct <= toleranceWarningPct ? 'warning' : 'non-compliant';
}

export function formatPeriodLabel(periodKey: string, prodMonth?: any, energyMonth?: any): string {
  const [yStr, mStr] = periodKey.split('_');
  const mNum = Number(mStr);
  const monthName =
    prodMonth?.monthName || energyMonth?.monthName || PERSIAN_MONTH_NAMES[mNum] || mStr;
  return `${monthName} ${yStr}`;
}

export function computeRegressionForInputs(
  clinkerTon: number,
  cementTon: number,
  actualElecKwh: number,
  actualThermalGasEqNm3: number,
  config: EnpiConfig
): {
  ccdTon: number;
  electrical: RegressionOutcome;
  thermal: RegressionOutcome;
} {
  const ccdTon = clinkerTon - cementTon;
  const elecModel = config.regressionModels.electrical;
  const thModel = config.regressionModels.thermal;

  const expectedElec = elecModel.coeffCCD * ccdTon + elecModel.coeffCement * cementTon;
  const diffElec = actualElecKwh - expectedElec;
  const diffElecPct =
    expectedElec > 0 ? (diffElec / expectedElec) * 100 : null;

  const actualElecSec = cementTon > 0 ? actualElecKwh / cementTon : null;
  const expectedElecSec = cementTon > 0 ? expectedElec / cementTon : null;
  const diffElecSec =
    actualElecSec !== null && expectedElecSec !== null
      ? actualElecSec - expectedElecSec
      : null;

  const expectedThermal = thModel.coeffCCD * ccdTon + thModel.coeffCement * cementTon;
  const diffThermal = actualThermalGasEqNm3 - expectedThermal;
  const diffThermalPct =
    expectedThermal > 0 ? (diffThermal / expectedThermal) * 100 : null;

  const actualThermalSec = cementTon > 0 ? actualThermalGasEqNm3 / cementTon : null;
  const expectedThermalSec = cementTon > 0 ? expectedThermal / cementTon : null;
  const diffThermalSec =
    actualThermalSec !== null && expectedThermalSec !== null
      ? actualThermalSec - expectedThermalSec
      : null;

  return {
    ccdTon,
    electrical: {
      actualTotal: actualElecKwh,
      expectedTotal: expectedElec,
      diffTotal: diffElec,
      diffPct: diffElecPct,
      actualSpecific: actualElecSec,
      expectedSpecific: expectedElecSec,
      diffSpecific: diffElecSec,
      status: getRegressionComplianceStatus(
        actualElecKwh,
        expectedElec,
        config.toleranceWarningPct
      ),
    },
    thermal: {
      actualTotal: actualThermalGasEqNm3,
      expectedTotal: expectedThermal,
      diffTotal: diffThermal,
      diffPct: diffThermalPct,
      actualSpecific: actualThermalSec,
      expectedSpecific: expectedThermalSec,
      diffSpecific: diffThermalSec,
      status: getRegressionComplianceStatus(
        actualThermalGasEqNm3,
        expectedThermal,
        config.toleranceWarningPct
      ),
    },
  };
}

export function aggregatePeriodsEnpi(
  periodKeys: string[],
  prodLogs: Record<string, any>,
  energyLogs: Record<string, any>,
  config: EnpiConfig,
  customLabel?: string
): PeriodEnpiSummary {
  const gasKcal = config.calorificFactors.naturalGasKcalPerNm3;
  const oilKcal = config.calorificFactors.fuelOilKcalPerLiter;

  let daysCount = 0;
  let crusherTon = 0;
  let rawMealTon = 0;
  let clinkerTon = 0;
  let cementTon = 0;
  let totalPlantElecKwh = 0;
  let gasNm3 = 0;
  let fuelOilLiter = 0;

  const electricFieldTotals: Record<string, number> = {};

  for (const key of periodKeys) {
    const pMonth = prodLogs[key];
    const eMonth = energyLogs[key];

    const pDays: any[] = pMonth?.days || pMonth?.dailyRecords || [];
    const eDays: any[] = eMonth?.days || [];
    daysCount += Math.max(pDays.length, eDays.length);

    if (pDays.length > 0) {
      for (const d of pDays) {
        const pr = d.productionTon || {};
        crusherTon += Number(pr.crusher || 0);
        rawMealTon += Number(pr.rawMeal || 0);
        clinkerTon += Number(pr.clinker || 0);
        cementTon += Number(pr.cement || 0);
      }
    } else if (pMonth?.totals) {
      crusherTon += Number(pMonth.totals.crusherTon || 0);
      rawMealTon += Number(pMonth.totals.rawMealTon || 0);
      clinkerTon += Number(pMonth.totals.clinkerTon || 0);
      cementTon += Number(pMonth.totals.cementTon || 0);
    }

    if (eDays.length > 0) {
      for (const d of eDays) {
        const el = d.electricityKwh || {};
        totalPlantElecKwh += Number(el.totalPlant || 0);
        for (const [field, val] of Object.entries(el)) {
          electricFieldTotals[field] = (electricFieldTotals[field] || 0) + Number(val || 0);
        }
        const fuels = d.fuels || {};
        gasNm3 += Number(fuels.naturalGasNm3 || 0);
        fuelOilLiter += Number(fuels.fuelOilLiter || 0);
      }
    } else if (eMonth) {
      totalPlantElecKwh += Number(eMonth.totalElectricityKwh || 0);
      gasNm3 += Number(eMonth.totalGasNm3 || 0);
      fuelOilLiter += Number(eMonth.totalFuelOilLiter || 0);
    }
  }

  const productionMap: Record<'crusher' | 'rawMeal' | 'clinker' | 'cement', number> = {
    crusher: crusherTon,
    rawMeal: rawMealTon,
    clinker: clinkerTon,
    cement: cementTon,
  };

  const totalThermalKcal = gasNm3 * gasKcal + fuelOilLiter * oilKcal;
  const totalThermalMcal = totalThermalKcal / 1000;
  const totalThermalGasEqNm3 = gasKcal > 0 ? totalThermalKcal / gasKcal : gasNm3;

  const departments: DepartmentSecResult[] = config.stage1DepartmentTargets.map((dept) => {
    const prodTon = productionMap[dept.productionField] || 0;

    if (dept.carrierType === 'thermal') {
      const actualSec = prodTon > 0 ? totalThermalKcal / (prodTon * 1000) : null;
      const deviationAbs = actualSec !== null ? actualSec - dept.targetSec : null;
      const deviationPct =
        deviationAbs !== null && dept.targetSec > 0
          ? (deviationAbs / dept.targetSec) * 100
          : null;
      return {
        id: dept.id,
        name: dept.name,
        carrier: dept.carrier,
        carrierType: dept.carrierType,
        productionBasisLabel: dept.productionBasisLabel,
        totalProductionTon: prodTon,
        totalEnergy: totalThermalMcal,
        energyUnit: dept.energyUnit,
        actualSec,
        targetSec: dept.targetSec,
        unit: dept.unit,
        deviationAbs,
        deviationPct,
        status: getComplianceStatus(actualSec, dept.targetSec, config.toleranceWarningPct),
      };
    }

    const deptKwh = dept.energyFields.reduce(
      (sum, field) => sum + (electricFieldTotals[field] || 0),
      0
    );
    const actualSec = prodTon > 0 && deptKwh > 0 ? deptKwh / prodTon : null;
    const deviationAbs = actualSec !== null ? actualSec - dept.targetSec : null;
    const deviationPct =
      deviationAbs !== null && dept.targetSec > 0
        ? (deviationAbs / dept.targetSec) * 100
        : null;

    return {
      id: dept.id,
      name: dept.name,
      carrier: dept.carrier,
      carrierType: dept.carrierType,
      productionBasisLabel: dept.productionBasisLabel,
      totalProductionTon: prodTon,
      totalEnergy: deptKwh,
      energyUnit: dept.energyUnit,
      actualSec,
      targetSec: dept.targetSec,
      unit: dept.unit,
      deviationAbs,
      deviationPct,
      status: getComplianceStatus(actualSec, dept.targetSec, config.toleranceWarningPct),
    };
  });

  const regression = computeRegressionForInputs(
    clinkerTon,
    cementTon,
    totalPlantElecKwh,
    totalThermalGasEqNm3,
    config
  );

  const firstKey = periodKeys[0] || '';
  const [yStr, mStr] = firstKey.split('_');

  return {
    periodKey: periodKeys.length === 1 ? firstKey : `${firstKey}_${periodKeys[periodKeys.length - 1]}`,
    label:
      customLabel ||
      (periodKeys.length === 1
        ? formatPeriodLabel(firstKey, prodLogs[firstKey], energyLogs[firstKey])
        : `${periodKeys.length} دوره`),
    year: Number(yStr || 0),
    month: Number(mStr || 0),
    daysCount,
    clinkerTon,
    cementTon,
    ccdTon: regression.ccdTon,
    crusherTon,
    rawMealTon,
    gasNm3,
    fuelOilLiter,
    departments,
    electricalRegression: regression.electrical,
    thermalRegression: regression.thermal,
  };
}
