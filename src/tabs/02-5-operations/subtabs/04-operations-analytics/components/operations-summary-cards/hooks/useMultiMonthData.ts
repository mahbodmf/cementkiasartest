import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  MultiMonthDailyRecord,
  CalculatedSummary,
  QuickFilterType,
  OperationsTargets,
} from '../types';

export interface UseMultiMonthDataParams {
  externalPeriodKey?: string;
  propDailyRecords?: any[];
  providedDailyRecords?: any[];
  propSummary?: any;
  providedSummary?: any;
  targets?: OperationsTargets;
}

export const useMultiMonthData = (
  param1?: string | UseMultiMonthDataParams,
  providedDailyRecords?: any[],
  providedSummary?: any,
  targets?: OperationsTargets
) => {
  const isObjectCall = typeof param1 === 'object' && param1 !== null;
  const externalPeriodKey = isObjectCall ? param1.externalPeriodKey : param1;
  const effectiveDailyRecords = isObjectCall
    ? (param1.providedDailyRecords || param1.propDailyRecords)
    : providedDailyRecords;
  const effectiveProvidedSummary = isObjectCall
    ? (param1.providedSummary || param1.propSummary)
    : providedSummary;
  const effectiveTargets = isObjectCall ? param1.targets : targets;
  const [allMonthsData, setAllMonthsData] = useState<{
    prod: Record<string, any>;
    stops: Record<string, any>;
    disp: Record<string, any>;
  }>({ prod: {}, stops: {}, disp: {} });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ۱. بارگذاری همزمان کل تاریخچه ۲۵ ماهه
  useEffect(() => {
    const loadAllHistory = async () => {
      setIsLoading(true);
      try {
        const fetchOrCache = async (key: string, path: string) => {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              return JSON.parse(cached);
            } catch {
              // fallback to fetch
            }
          }
          const res = await fetch(path).catch(() => null);
          if (res && res.ok) {
            const data = await res.json();
            localStorage.setItem(key, JSON.stringify(data));
            return data;
          }
          return {};
        };

        const [prod, stops, disp] = await Promise.all([
          fetchOrCache('cement_production_logs', '/data/02-5-operations/daily-production-report.json'),
          fetchOrCache('cement_stops_logs', '/data/02-5-operations/department-stops-log.json'),
          fetchOrCache('cement_dispatch_logs', '/data/02-5-operations/cement-dispatch-log.json'),
        ]);

        setAllMonthsData({ prod, stops, disp });
      } catch (err) {
        console.error('Error loading multi-month operational data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllHistory();
  }, []);

  // ۲. استخراج تمامی ماه‌های معتبر
  const availableMonthKeys = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.keys(allMonthsData.prod || {}),
        ...Object.keys(allMonthsData.stops || {}),
        ...Object.keys(allMonthsData.disp || {}),
      ])
    ).sort();
  }, [allMonthsData]);

  // ۳. مدیریت انتخابگر بازه زمانی
  const [startPeriod, setStartPeriod] = useState<string>('');
  const [endPeriod, setEndPeriod] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('current');

  useEffect(() => {
    if (availableMonthKeys.length > 0) {
      const activeMonth =
        externalPeriodKey && availableMonthKeys.includes(externalPeriodKey)
          ? externalPeriodKey
          : availableMonthKeys[availableMonthKeys.length - 1];

      setStartPeriod(activeMonth);
      setEndPeriod(activeMonth);
    }
  }, [availableMonthKeys, externalPeriodKey]);

  const handleQuickFilter = (type: QuickFilterType) => {
    setQuickFilter(type);
    if (availableMonthKeys.length === 0) return;
    const latest = availableMonthKeys[availableMonthKeys.length - 1];
    setEndPeriod(latest);

    if (type === 'current') {
      const cur = externalPeriodKey || latest;
      setStartPeriod(cur);
      setEndPeriod(cur);
    } else if (type === 'last3m') {
      const idx = Math.max(0, availableMonthKeys.length - 3);
      setStartPeriod(availableMonthKeys[idx]);
    } else if (type === 'last6m') {
      const idx = Math.max(0, availableMonthKeys.length - 6);
      setStartPeriod(availableMonthKeys[idx]);
    } else if (type === 'all') {
      setStartPeriod(availableMonthKeys[0]);
    }
  };

  // ۴. موتور تجمیع داده‌های روزانه در بازه زمانی تعیین‌شده
  const multiMonthDailyRecords = useMemo((): MultiMonthDailyRecord[] => {
    if (availableMonthKeys.length === 0 || !startPeriod || !endPeriod) {
      return (effectiveDailyRecords as MultiMonthDailyRecord[]) || [];
    }

    const startIdx = availableMonthKeys.indexOf(startPeriod);
    const endIdx = availableMonthKeys.indexOf(endPeriod);
    const validRange = availableMonthKeys.slice(
      Math.min(startIdx, endIdx),
      Math.max(startIdx, endIdx) + 1
    );

    const parseH = (str?: string) => {
      if (!str) return 0;
      const pts = str.split(':').map(Number);
      return (pts[0] || 0) + (pts[1] || 0) / 60;
    };

    const combined: MultiMonthDailyRecord[] = [];

    validRange.forEach((mKey) => {
      const pMonth = allMonthsData.prod[mKey] || {};
      const sMonth = allMonthsData.stops[mKey] || {};
      const dMonth = allMonthsData.disp[mKey] || {};

      const pDays: any[] = pMonth.days || pMonth.dailyRecords || [];
      const sDays: any[] = sMonth.days || [];
      const dDays: any[] = dMonth.days || [];

      pDays.forEach((p) => {
        const s = sDays.find((x: any) => x.dayNumber === p.dayNumber) || {};
        const d = dDays.find((x: any) => x.dayNumber === p.dayNumber) || {};

        const clinker = Number(p.clinkerTon ?? p.productionTon?.clinker ?? 0);
        const cement = Number(p.totalCementTon ?? p.productionTon?.cement ?? 0);
        const dispatch = Number(
          d.dispatch?.totalDispatchTon ?? p.productionTon?.cementDispatch ?? 0
        );
        const secTh = Number(
          p.secThermalKcalKg ?? p.specificEnergy?.secThermalKcalKg ?? 0
        );
        const secEl = Number(
          p.secElectricalKwhTon ?? p.specificEnergy?.secElectricKwhTon ?? 0
        );

        const runH = parseH(s.departments?.kiln?.runHours);
        const stopH = parseH(s.departments?.kiln?.stopHours);

        // OEE خط پخت (ظرفیت نامی کوره: ۸۳.۳۳ تن در ساعت معادل ۲۰۰۰ تن در روز)
        const availability = (runH / 24) * 100;
        const performance =
          runH > 0 ? Math.min(100, (clinker / runH / 83.33) * 100) : 0;
        const quality = 95;
        const oee = (availability * performance * quality) / 10000;

        combined.push({
          periodKey: mKey,
          dayNumber: p.dayNumber,
          jalaliDate: p.jalaliDate,
          clinkerTon: clinker,
          cementTon: cement,
          dispatchTon: dispatch,
          secThermal: secTh,
          secElectrical: secEl,
          kilnRunHours: runH,
          kilnStopHours: stopH,
          clinkerStockTon: d.stocks?.clinkerDepoTon || 66200,
          oee: oee,
          kilnStopCauses: s.departments?.kiln?.stopCauses || '',
        });
      });
    });

    return combined.length > 0
      ? combined
      : (effectiveDailyRecords as MultiMonthDailyRecord[]) || [];
  }, [
    allMonthsData,
    availableMonthKeys,
    startPeriod,
    endPeriod,
    effectiveDailyRecords,
  ]);

  // ۵. محاسبه شاخص‌های خلاصه بر اساس داده‌های دوره انتخابی
  const calculatedSummary = useMemo((): CalculatedSummary => {
    if (effectiveProvidedSummary && Object.keys(effectiveProvidedSummary).length > 0) {
      return effectiveProvidedSummary;
    }

    const recs = multiMonthDailyRecords;
    if (recs.length === 0) {
      return {
        avgKilnOEE: 76.5,
        avgAvailability: 88,
        avgPerformance: 91,
        totalKilnStopHours: 42,
        downtimeEnergyImpactKcal: 38,
        inventoryRunwayDays: 62,
        totalDispatch: 32000,
        totalClinker: 38000,
      };
    }

    const totalClinker = recs.reduce((s, r) => s + (r.clinkerTon || 0), 0);
    const totalDispatch = recs.reduce((s, r) => s + (r.dispatchTon || 0), 0);
    const totalStopH = recs.reduce((s, r) => s + (r.kilnStopHours || 0), 0);
    const validOee = recs.filter((r) => r.oee > 0);
    const avgOee =
      validOee.length > 0
        ? validOee.reduce((s, r) => s + r.oee, 0) / validOee.length
        : 75;

    // اثر توقف بر افزایش مصرف حرارتی
    const highStop = recs.filter(
      (r) => r.kilnStopHours >= 4 && r.secThermal > 0
    );
    const lowStop = recs.filter((r) => r.kilnStopHours < 4 && r.secThermal > 0);
    const avgHigh =
      highStop.length > 0
        ? highStop.reduce((s, r) => s + r.secThermal, 0) / highStop.length
        : 0;
    const avgLow =
      lowStop.length > 0
        ? lowStop.reduce((s, r) => s + r.secThermal, 0) / lowStop.length
        : 0;
    const downtimeEnergyImpactKcal =
      avgHigh > avgLow ? Math.round(avgHigh - avgLow) : 28;

    const latestStock = recs[recs.length - 1]?.clinkerStockTon || 66000;
    const runwayDays = Math.round(
      latestStock / (totalDispatch / recs.length || 1)
    );

    return {
      avgKilnOEE: avgOee,
      avgAvailability: 85,
      avgPerformance: 90,
      totalKilnStopHours: totalStopH,
      downtimeEnergyImpactKcal,
      inventoryRunwayDays: runwayDays,
      totalDispatch,
      totalClinker,
    };
  }, [effectiveProvidedSummary, multiMonthDailyRecords]);

  // ۶. خروجی اکسل جامع دوره انتخابی
  const handleExportModalExcel = () => {
    if (multiMonthDailyRecords.length === 0) return;
    const rows = multiMonthDailyRecords.map((r) => ({
      'دوره': r.periodKey,
      'روز': r.dayNumber,
      'تاریخ شمسی': r.jalaliDate,
      'تولید کلینکر (تن)': r.clinkerTon,
      'تولید سیمان (تن)': r.cementTon,
      'توقف کوره (ساعت)': Number(r.kilnStopHours.toFixed(1)),
      'OEE کوره (٪)': Number(r.oee.toFixed(1)),
      'SEC حرارتی (kcal/kg)': r.secThermal,
      'SEC برق (kWh/t)': r.secElectrical,
      'موجودی دپو کلینکر (تن)': r.clinkerStockTon,
      'دیسپاچینگ (تن)': r.dispatchTon,
      'علت توقف': r.kilnStopCauses || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'روند_عملیات');
    XLSX.writeFile(wb, `روند_عملیات_${startPeriod || 'شروع'}_تا_${endPeriod || 'پایان'}.xlsx`);
  };

  return {
    isLoading,
    availableMonthKeys,
    startPeriod,
    setStartPeriod,
    endPeriod,
    setEndPeriod,
    quickFilter,
    handleQuickFilter,
    multiMonthDailyRecords,
    calculatedSummary,
    effectiveSummary: calculatedSummary,
    handleExportModalExcel,
  };
};