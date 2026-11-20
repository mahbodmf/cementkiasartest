import {
  EnergyPerformanceEnPI,
  ElectricalEnergy,
  ProductionOperations,
  DispatchSales,
  InventorySilos,
  EnMSMasterDataset,
} from '../types';
import { PERSIAN_MONTH_NAMES } from '../utils/persianUtils';
import { DEFAULT_BASELINES as baselinesConfig } from '../services/configService';

// تولید ۹۰ روز داده‌های به هم پیوسته صنعتی با کلید اصلی «تاریخ» خورشیدی (۱۴۰۵/۰۴/۰۱ تا ۱۴۰۵/۰۶/۲۹)
export function generateEnMSDataset(): EnMSMasterDataset {
  const energyPerformance: EnergyPerformanceEnPI[] = [];
  const electricalEnergy: ElectricalEnergy[] = [];
  const productionOperations: ProductionOperations[] = [];
  const dispatchSales: DispatchSales[] = [];
  const inventorySilos: InventorySilos[] = [];

  const totalDays = 90;
  let cumulativeElectricDev = 0;
  let cumulativeThermalDev = 0;
  let clinkerDepotStock = 43200; // baseline ton

  const stopReasons: {
    reason: string;
    category: 'محدودیت برق' | 'عیوب مکانیکی' | 'عیوب برقی' | 'خطاهای فرایندی و نوار' | 'تعمیرات دوره‌ای' | 'عادی';
    dept: string;
    prob: number;
  }[] = [
    {
      reason: 'محدودیت پیک بار برق شبکه (پیک‌سایی تابستانه دیسپاچینگ)',
      category: 'محدودیت برق',
      dept: 'آسیاب سیمان',
      prob: 0.32,
    },
    {
      reason: 'نقص مکانیکی گیربکس اصلی و یاتاقان آسیاب',
      category: 'عیوب مکانیکی',
      dept: 'آسیاب مواد خام',
      prob: 0.22,
    },
    {
      reason: 'تریپ رله حفاظتی ترانسفورماتور پست ۶۳ کیلوولت',
      category: 'عیوب برقی',
      dept: 'کوره و خنک‌کن',
      prob: 0.16,
    },
    {
      reason: 'گرفتگی سیکلون پری‌هیتر کوره و تشکیل رینگ',
      category: 'خطاهای فرایندی و نوار',
      dept: 'کوره و خنک‌کن',
      prob: 0.14,
    },
    {
      reason: 'پارگی تسمه و خطای الکتروپمپ نوار نقاله انتقال',
      category: 'خطاهای فرایندی و نوار',
      dept: 'سنگ‌شکن',
      prob: 0.08,
    },
    {
      reason: 'سرویس پیشگیرانه و تعویض لاینرهای سنگ‌شکن',
      category: 'تعمیرات دوره‌ای',
      dept: 'سنگ‌شکن',
      prob: 0.08,
    },
  ];

  // شروع از ۱ تیر ۱۴۰۵ (ماه ۴)
  let currentYear = 1405;
  let currentMonth = 4; // تیر
  let currentDay = 1;

  for (let i = 0; i < totalDays; i++) {
    const formattedDate = `${currentYear}/${String(currentMonth).padStart(2, '0')}/${String(currentDay).padStart(2, '0')}`;
    const monthName = PERSIAN_MONTH_NAMES[currentMonth - 1];

    // دوره اوج مصرف تابستان (مردادماه: روزهای ۳۱ تا ۶۲)
    const isPeakSummer = i >= 30 && i <= 65;
    const peakPowerPenalty = isPeakSummer ? (Math.sin((i - 30) / 6) * 4.2 + 3.1) : 0;

    // ۱. کارایی انرژی (EnPI) بر اساس خطوط مبنای مرجع پویا
    const electricTarget = baselinesConfig.target_electric_kwh_ton; // خط مبنای پویا (۱۰۴)
    const thermalTarget = baselinesConfig.target_thermal_kcal_kg; // خط مبنای پویا (۸۸۸)

    const electricActual = Number((101.2 + Math.sin(i / 6) * 4.6 + (Math.random() * 2.8 - 1.4) + (peakPowerPenalty > 2 ? 2.4 : -0.7)).toFixed(2));
    const thermalActual = Math.round(876 + Math.cos(i / 7) * 20 + (Math.random() * 18 - 9) + (isPeakSummer ? 14 : -6));

    const naturalGasNm3 = Math.round((thermalActual * 3650 * 0.94) / 8250 + (Math.random() * 2400 - 1200));

    const electricDev = Number((electricActual - electricTarget).toFixed(2));
    const thermalDev = Number((thermalActual - thermalTarget).toFixed(1));

    cumulativeElectricDev = Number((cumulativeElectricDev + electricDev).toFixed(2));
    cumulativeThermalDev = Number((cumulativeThermalDev + thermalDev).toFixed(1));

    energyPerformance.push({
      Date: formattedDate,
      Year: currentYear,
      Month: currentMonth,
      MonthName: monthName,
      SEC_Electric_Actual: electricActual,
      SEC_Electric_Target: electricTarget,
      SEC_Thermal_Actual: thermalActual,
      SEC_Thermal_Target: thermalTarget,
      Natural_Gas_Nm3: naturalGasNm3,
      Electric_Deviation: electricDev,
      Thermal_Deviation: thermalDev,
      CUSUM_Electric: cumulativeElectricDev,
      CUSUM_Thermal: cumulativeThermalDev,
    });

    // ۲. عملیات تولید و ساعات کارکرد
    const hasMajorStop = Math.random() < 0.24;
    let stopHours = 0;
    let stopItem = stopReasons[0];

    if (hasMajorStop) {
      stopHours = Number((2.5 + Math.random() * 5.5).toFixed(1));
      const randVal = Math.random();
      let cumProb = 0;
      for (const item of stopReasons) {
        cumProb += item.prob;
        if (randVal <= cumProb) {
          stopItem = item;
          break;
        }
      }
    } else {
      stopHours = Number((Math.random() * 1.2).toFixed(1));
      stopItem = {
        reason: 'بازرسی و روان‌کاری معمول تجهیزات (بدون توقف بحرانی)',
        category: 'عادی',
        dept: 'کوره و خنک‌کن',
        prob: 1,
      };
    }

    const kilnRunHours = Number((24 - stopHours).toFixed(1));
    const cementMillRunHours = Number(
      Math.max(13, 24 - stopHours - (isPeakSummer ? 3.5 : 0) + (Math.random() * 1.8 - 0.9)).toFixed(1)
    );
    const cementMillStopHours = Number((24 - cementMillRunHours).toFixed(1));

    const clinkerProdTon = Math.round((kilnRunHours / 24) * 3900 + (Math.random() * 180 - 90));
    const cementProdTon = Math.round((cementMillRunHours / 24) * 4400 + (Math.random() * 220 - 110));

    productionOperations.push({
      Date: formattedDate,
      Year: currentYear,
      Month: currentMonth,
      Kiln_Run_Hours: kilnRunHours,
      Kiln_Stop_Hours: stopHours,
      CementMill_Run_Hours: cementMillRunHours,
      CementMill_Stop_Hours: cementMillStopHours,
      Clinker_Prod_ton: clinkerProdTon,
      Cement_Prod_ton: cementProdTon,
      Department: stopItem.dept,
      Stop_Reason: stopItem.reason,
      Stop_Category: stopItem.category,
      Downtime_Duration_Hours: stopHours,
    });

    // ۳. مصارف تفکیکی برق دپارتمان‌ها (کیلووات ساعت)
    const crusherKWh = Math.round(21000 + (Math.random() * 5000 - 2500));
    const rawMillKWh = Math.round(89000 + (clinkerProdTon * 21.5) * 0.5 + (Math.random() * 7000 - 3500));
    const kilnKWh = Math.round(83000 + (kilnRunHours * 3450) + (Math.random() * 5000 - 2500));
    const cementMillKWh = Math.round(138000 + (cementProdTon * 31.8) * 0.45 + (Math.random() * 10000 - 5000));
    const factoryTotalKWh = crusherKWh + rawMillKWh + kilnKWh + cementMillKWh + 19000;

    electricalEnergy.push({
      Date: formattedDate,
      Year: currentYear,
      Month: currentMonth,
      Crusher_Total_kWh: crusherKWh,
      RawMill_Total_kWh: rawMillKWh,
      Kiln_Total_kWh: kilnKWh,
      CementMill_Total_kWh: cementMillKWh,
      Factory_Total_kWh: factoryTotalKWh,
    });

    // ۴. آمار تحویل محصول (فروش روزانه و مقایسه با تارگت مصوب)
    const dailyTarget = baselinesConfig.daily_dispatch_target_ton;
    const baseDispatch = Math.round(4180 + Math.sin(i / 5) * 520 + (Math.random() * 380 - 190));

    const bulk42 = Math.round(baseDispatch * 0.41);
    const bagged42 = Math.round(baseDispatch * 0.29);
    const bulk32 = Math.round(baseDispatch * 0.18);
    const bagged32 = baseDispatch - (bulk42 + bagged42 + bulk32);
    const dispatchTotal = bulk42 + bagged42 + bulk32 + bagged32;

    dispatchSales.push({
      Date: formattedDate,
      Year: currentYear,
      Month: currentMonth,
      Bulk_Type2_42_5: bulk42,
      Bagged_Type2_42_5: bagged42,
      Bulk_Type2_32_5: bulk32,
      Bagged_Type2_32_5: bagged32,
      Dispatch_Total: dispatchTotal,
      Daily_Target: dailyTarget,
    });

    // ۵. موجودی سیلوها و دپوی کلینکر (سیلو مواد، کلینکر، سیلو سیمان ۱ و سیلو سیمان ۲)
    const rawMealSiloPct = Math.min(95, Math.max(35, Math.round(70 + Math.sin(i / 4) * 16 + (Math.random() * 6 - 3))));
    const clinkerMainSiloPct = Math.min(96, Math.max(32, Math.round(75 + Math.cos(i / 5) * 15 + (Math.random() * 6 - 3))));
    const cementSilo1Pct = Math.min(94, Math.max(38, Math.round(68 + Math.sin((i + 2) / 5) * 14 + (Math.random() * 5 - 2.5))));
    const cementSilo2Pct = Math.min(92, Math.max(40, Math.round(64 + Math.cos((i + 4) / 5) * 15 + (Math.random() * 5 - 2.5))));

    const netClinkerDelta = clinkerProdTon - (cementProdTon * 0.92);
    clinkerDepotStock = Math.max(22000, Math.min(68000, Math.round(clinkerDepotStock + netClinkerDelta * 0.3)));

    inventorySilos.push({
      Date: formattedDate,
      Year: currentYear,
      Month: currentMonth,
      Raw_Meal_Silo_Pct: rawMealSiloPct,
      Clinker_Main_Silo_Pct: clinkerMainSiloPct,
      Cement_Silo_1_Pct: cementSilo1Pct,
      Cement_Silo_2_Pct: cementSilo2Pct,
      Clinker_Depot_Stock_ton: clinkerDepotStock,
    });

    // افزایش تقویم شمسی (تیر، مرداد، شهریور دارای ۳۱ روز در تیر و مرداد، و ۳۱ روز در شهریور)
    currentDay++;
    if (currentMonth <= 6 && currentDay > 31) {
      currentDay = 1;
      currentMonth++;
    } else if (currentMonth > 6 && currentDay > 30) {
      currentDay = 1;
      currentMonth++;
    }
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return {
    energyPerformance,
    electricalEnergy,
    productionOperations,
    dispatchSales,
    inventorySilos,
  };
}

export const masterDataset = generateEnMSDataset();
