import { useState, useEffect, useMemo, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { aiService } from '../../../../../services/ai/aiService';
import { AIResponsePayload } from '../../../../../services/ai/types';

export interface UseOperationsDataReturn {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  availablePeriods: string[];
  isLoading: boolean;
  integratedDailyRecords: any[];
  analyticsSummary: any;
  paretoStopCauses: any[];
  handleExportExcel: () => void;
  handleGenerateAiDiagnostic: () => Promise<void>;
  isAiLoading: boolean;
  aiAnalysis: AIResponsePayload | null;
}

export const useOperationsData = (externalPeriodKey?: string): UseOperationsDataReturn => {
  const [productionLogs, setProductionLogs] = useState<Record<string, any>>({});
  const [stopsLogs, setStopsLogs] = useState<Record<string, any>>({});
  const [dispatchLogs, setDispatchLogs] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // وضعیت‌های مربوط به تحلیل تشخیصی هوش مصنوعی مرکزی
  const [aiAnalysis, setAiAnalysis] = useState<AIResponsePayload | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // ۱. بارگذاری داده‌های پایه سه فایل
  useEffect(() => {
    const loadDatasets = async () => {
      setIsLoading(true);
      try {
        const fetchOrCache = async (key: string, path: string) => {
          const cached = localStorage.getItem(key);
          if (cached) {
            try {
              return JSON.parse(cached);
            } catch {
              // در صورت بروز خطا از شبکه خوانده می‌شود
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

        const [prod, stops, dispatch] = await Promise.all([
          fetchOrCache('cement_production_logs', '/data/02-5-operations/daily-production-report.json'),
          fetchOrCache('cement_stops_logs', '/data/02-5-operations/department-stops-log.json'),
          fetchOrCache('cement_dispatch_logs', '/data/02-5-operations/cement-dispatch-log.json'),
        ]);

        setProductionLogs(prod);
        setStopsLogs(stops);
        setDispatchLogs(dispatch);

        const availableKeys = Array.from(
          new Set([
            ...Object.keys(prod || {}),
            ...Object.keys(stops || {}),
            ...Object.keys(dispatch || {}),
          ])
        ).sort();

        if (availableKeys.length > 0) {
          const defaultKey =
            externalPeriodKey && availableKeys.includes(externalPeriodKey)
              ? externalPeriodKey
              : availableKeys[availableKeys.length - 1];
          setSelectedPeriod(defaultKey);
        }
      } catch (err) {
        console.error('Error loading operations datasets in hook:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDatasets();
  }, [externalPeriodKey]);

  useEffect(() => {
    if (externalPeriodKey) {
      setSelectedPeriod(externalPeriodKey);
    }
  }, [externalPeriodKey]);

  // ۲. دوره‌های در دسترس
  const availablePeriods = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.keys(productionLogs || {}),
        ...Object.keys(stopsLogs || {}),
        ...Object.keys(dispatchLogs || {}),
      ])
    ).sort();
  }, [productionLogs, stopsLogs, dispatchLogs]);

  // ۳. تجمیع داده‌های روزانه ماه انتخابی
  const integratedDailyRecords = useMemo(() => {
    if (!selectedPeriod) return [];

    const prodDays: any[] =
      productionLogs[selectedPeriod]?.days ||
      productionLogs[selectedPeriod]?.dailyRecords ||
      [];
    const stopDays: any[] = stopsLogs[selectedPeriod]?.days || [];
    const dispDays: any[] = dispatchLogs[selectedPeriod]?.days || [];

    const dayNumbers = Array.from(
      new Set([
        ...prodDays.map((d) => d.dayNumber),
        ...stopDays.map((d) => d.dayNumber),
        ...dispDays.map((d) => d.dayNumber),
      ])
    ).sort((a, b) => a - b);

    const parseTimeToHours = (timeStr?: string): number => {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const parts = timeStr.split(':').map(Number);
      return (parts[0] || 0) + (parts[1] || 0) / 60;
    };

    return dayNumbers.map((dayNum) => {
      const p = prodDays.find((d) => d.dayNumber === dayNum) || {};
      const s = stopDays.find((d) => d.dayNumber === dayNum) || {};
      const d = dispDays.find((d) => d.dayNumber === dayNum) || {};

      const prod = p.productionTon || {};
      const spec = p.specificEnergy || {};

      const clinkerTon = Number(p.clinkerTon ?? prod.clinker ?? 0);
      const cementTon = Number(p.totalCementTon ?? prod.cement ?? 0);
      const feedTon = Number(p.kilnFeedTon ?? prod.kilnFeed ?? 0);
      const dispatchTon = Number(
        d.dispatch?.totalDispatchTon ?? prod.cementDispatch ?? 0
      );

      const secThermal = Number(p.secThermalKcalKg ?? spec.secThermalKcalKg ?? 0);
      const secElectrical = Number(
        p.secElectricalKwhTon ?? spec.secElectricKwhTon ?? 0
      );

      const kilnRunHours = parseTimeToHours(s.departments?.kiln?.runHours);
      const kilnStopHours = parseTimeToHours(s.departments?.kiln?.stopHours);
      const millRunHours = parseTimeToHours(s.departments?.cementMill?.runHours);
      const millStopHours = parseTimeToHours(s.departments?.cementMill?.stopHours);
      const rawMillRunHours = parseTimeToHours(s.departments?.rawMill?.runHours);
      const rawMillStopHours = parseTimeToHours(s.departments?.rawMill?.stopHours);
      const crusherRunHours = parseTimeToHours(s.departments?.crusher?.runHours);
      const crusherStopHours = parseTimeToHours(s.departments?.crusher?.stopHours);

      // محاسبه OEE کوره پخت
      const kilnAvailability = (kilnRunHours / 24) * 100;
      const kilnHourlyFeedRate = kilnRunHours > 0 ? clinkerTon / kilnRunHours : 0;
      const kilnPerformance = Math.min(100, (kilnHourlyFeedRate / 83.33) * 100);
      const kilnQuality = 95;
      const kilnOEE = (kilnAvailability * kilnPerformance * kilnQuality) / 10000;

      const clinkerStockTon = d.stocks?.clinkerDepoTon || 66200;
      const mainClinkerSiloPct = d.siloLevelsPercent?.clinkerMainSilo || 0;
      const cementSilo1Pct = d.siloLevelsPercent?.cementSilo1 || 0;
      const cementSilo2Pct = d.siloLevelsPercent?.cementSilo2 || 0;
      const thermalDeviation = secThermal > 0 ? secThermal - 820 : 0;
      const electricDeviation = secElectrical > 0 ? secElectrical - 105 : 0;
      const clinkerDeficit = clinkerTon - 2000;

      return {
        dayNumber: dayNum,
        jalaliDate: p.jalaliDate || s.jalaliDate || d.jalaliDate || `روز ${dayNum}`,
        clinkerTon,
        cementTon,
        feedTon,
        dispatchTon,
        secThermal,
        secElectrical,
        kilnRunHours,
        kilnStopHours,
        millRunHours,
        millStopHours,
        rawMillRunHours,
        rawMillStopHours,
        crusherRunHours,
        crusherStopHours,
        kilnAvailability,
        kilnPerformance,
        kilnQuality,
        kilnOEE,
        clinkerStockTon,
        mainClinkerSiloPct,
        cementSilo1Pct,
        cementSilo2Pct,
        thermalDeviation,
        electricDeviation,
        clinkerDeficit,
        kilnStopCauses: s.departments?.kiln?.stopCauses || '',
        millStopCauses: s.departments?.cementMill?.stopCauses || '',
        rawMillStopCauses: s.departments?.rawMill?.stopCauses || '',
        crusherStopCauses: s.departments?.crusher?.stopCauses || '',
      };
    });
  }, [productionLogs, stopsLogs, dispatchLogs, selectedPeriod]);

  // ۴. خلاصه شاخص‌های کلی
  const analyticsSummary = useMemo(() => {
    if (integratedDailyRecords.length === 0) {
      return {
        avgKilnOEE: 0,
        avgAvailability: 0,
        avgPerformance: 0,
        avgQuality: 0,
        totalClinker: 0,
        totalCement: 0,
        totalDispatch: 0,
        totalKilnRunHours: 0,
        totalKilnStopHours: 0,
        avgSecThermal: 0,
        avgSecElectrical: 0,
        inventoryRunwayDays: 0,
        downtimeEnergyImpactKcal: 0,
        totalDays: 1,
      };
    }

    const totalClinker = integratedDailyRecords.reduce((s, r) => s + r.clinkerTon, 0);
    const totalCement = integratedDailyRecords.reduce((s, r) => s + r.cementTon, 0);
    const totalDispatch = integratedDailyRecords.reduce((s, r) => s + r.dispatchTon, 0);
    const totalKilnRunHours = integratedDailyRecords.reduce((s, r) => s + r.kilnRunHours, 0);
    const totalKilnStopHours = integratedDailyRecords.reduce((s, r) => s + r.kilnStopHours, 0);

    const validOee = integratedDailyRecords.filter((r) => r.kilnOEE > 0);
    const avgKilnOEE =
      validOee.length > 0
        ? validOee.reduce((s, r) => s + r.kilnOEE, 0) / validOee.length
        : 0;
    const avgAvailability =
      validOee.length > 0
        ? validOee.reduce((s, r) => s + r.kilnAvailability, 0) / validOee.length
        : 0;
    const avgPerformance =
      validOee.length > 0
        ? validOee.reduce((s, r) => s + r.kilnPerformance, 0) / validOee.length
        : 0;
    const avgQuality = 95;

    const validSecTh = integratedDailyRecords.filter((r) => r.secThermal > 0);
    const avgSecThermal =
      validSecTh.length > 0
        ? validSecTh.reduce((s, r) => s + r.secThermal, 0) / validSecTh.length
        : 0;

    const validSecEl = integratedDailyRecords.filter((r) => r.secElectrical > 0);
    const avgSecElectrical =
      validSecEl.length > 0
        ? validSecEl.reduce((s, r) => s + r.secElectrical, 0) / validSecEl.length
        : 0;

    const latestStock =
      integratedDailyRecords[integratedDailyRecords.length - 1]?.clinkerStockTon || 66500;
    const avgDailyDispatch = totalDispatch / integratedDailyRecords.length || 1;
    const inventoryRunwayDays = Math.round(latestStock / (avgDailyDispatch || 1));

    const highStop = integratedDailyRecords.filter((r) => r.kilnStopHours >= 4 && r.secThermal > 0);
    const lowStop = integratedDailyRecords.filter((r) => r.kilnStopHours < 4 && r.secThermal > 0);
    const avgHigh =
      highStop.length > 0
        ? highStop.reduce((s, r) => s + r.secThermal, 0) / highStop.length
        : 0;
    const avgLow =
      lowStop.length > 0
        ? lowStop.reduce((s, r) => s + r.secThermal, 0) / lowStop.length
        : 0;
    const downtimeEnergyImpactKcal = avgHigh > avgLow ? Math.round(avgHigh - avgLow) : 0;

    return {
      avgKilnOEE,
      avgAvailability,
      avgPerformance,
      avgQuality,
      totalClinker,
      totalCement,
      totalDispatch,
      totalKilnRunHours,
      totalKilnStopHours,
      avgSecThermal,
      avgSecElectrical,
      inventoryRunwayDays,
      downtimeEnergyImpactKcal,
      totalDays: integratedDailyRecords.length,
    };
  }, [integratedDailyRecords]);

  // ۵. پارتوی علل توقفات
  const paretoStopCauses = useMemo(() => {
    const causeCountMap: Record<string, { count: number; hours: number; dept: string }> = {};

    integratedDailyRecords.forEach((r) => {
      const inspectCause = (causeStr: string, deptName: string, stopHours: number) => {
        if (!causeStr || causeStr === '-') return;
        const items = causeStr.split(/[-–,،]/).map((c) => c.trim()).filter(Boolean);
        items.forEach((cause) => {
          if (!causeCountMap[cause]) {
            causeCountMap[cause] = { count: 0, hours: 0, dept: deptName };
          }
          causeCountMap[cause].count += 1;
          causeCountMap[cause].hours += Number((stopHours / (items.length || 1)).toFixed(1));
        });
      };

      inspectCause(r.kilnStopCauses, 'کوره پخت', r.kilnStopHours);
      inspectCause(r.millStopCauses, 'آسیاب سیمان', r.millStopHours);
      inspectCause(r.rawMillStopCauses, 'آسیاب مواد', r.rawMillStopHours);
      inspectCause(r.crusherStopCauses, 'سنگ‌شکن', r.crusherStopHours);
    });

    const totalHours = Object.values(causeCountMap).reduce((s, x) => s + x.hours, 0) || 1;

    return Object.entries(causeCountMap)
      .map(([cause, data]) => ({
        cause,
        ...data,
        pct: Math.round((data.hours / totalHours) * 100),
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [integratedDailyRecords]);

  // ۶. فراخوانی هوش مصنوعی متصل به موتور RAG مرکزی سیستم (اصلاح‌شده)
  const handleGenerateAiDiagnostic = useCallback(async () => {
    setIsAiLoading(true);
    try {
      const promptText = `تحلیل تقاطعی داده‌های عملکرد کوره و آسیاب سیمان کیاسر دوره ${selectedPeriod}:
- تولید کلینکر: ${Math.round(analyticsSummary.totalClinker)} تن | تولید سیمان: ${Math.round(analyticsSummary.totalCement)} تن | دیسپاچ: ${Math.round(analyticsSummary.totalDispatch)} تن
- OEE کوره دوار: ${analyticsSummary.avgKilnOEE.toFixed(1)}% (دسترسی: ${analyticsSummary.avgAvailability.toFixed(1)}% | عملکرد: ${analyticsSummary.avgPerformance.toFixed(1)}%)
- مجموع توقفات کوره: ${analyticsSummary.totalKilnStopHours.toFixed(1)} ساعت
- SEC حرارتی کوره: ${analyticsSummary.avgSecThermal.toFixed(0)} kcal/kg (انحراف ناشی از توقفات: +${analyticsSummary.downtimeEnergyImpactKcal} kcal/kg)
- تاب‌آوری دپوی کلینکر: ${analyticsSummary.inventoryRunwayDays} روز
بر اساس الزامات بند ۶.۴ و ۹.۱ استاندارد ISO 50001:2018 و بنچ‌مارک BAT سیمان، گزارش ممیزی تشخیصی را استخراج کنید.`;

      const response = await aiService.executePrompt({
        scope: 'enpi-forecast',
        departmentContext: 'کوره و خنک‌کن',
        targetEquipment: 'کوره دوار (SEU-01)',
        prompt: promptText,
      });

      if (response && response.success) {
        setAiAnalysis(response);
      } else {
        console.error('AI Service Error:', response?.error);
      }
    } catch (err) {
      console.error('Failed to execute central AI prompt:', err);
    } finally {
      setIsAiLoading(false);
    }
  }, [selectedPeriod, analyticsSummary]);

  // ۷. خروجی اکسل تجمیعی
  const handleExportExcel = useCallback(() => {
    if (integratedDailyRecords.length === 0) return;
    const rows = integratedDailyRecords.map((r) => ({
      'روز': r.dayNumber,
      'تاریخ شمسی': r.jalaliDate,
      'تولید کلینکر (تن)': r.clinkerTon,
      'تولید سیمان (تن)': r.cementTon,
      'دیسپاچینگ (تن)': r.dispatchTon,
      'کارکرد کوره (ساعت)': Number(r.kilnRunHours.toFixed(1)),
      'توقف کوره (ساعت)': Number(r.kilnStopHours.toFixed(1)),
      'OEE کوره (٪)': Number(r.kilnOEE.toFixed(1)),
      'SEC حرارتی (kcal/kg)': r.secThermal,
      'SEC برق (kWh/t)': r.secElectrical,
      'موجودی دپو کلینکر (تن)': r.clinkerStockTon,
      'علت توقف کوره': r.kilnStopCauses || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'داشبورد_عملیات');
    XLSX.writeFile(wb, `گزارش_تحلیلی_عملیات_سیمان_کیاسر_${selectedPeriod}.xlsx`);
  }, [integratedDailyRecords, selectedPeriod]);

  return {
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    isLoading,
    integratedDailyRecords,
    analyticsSummary,
    paretoStopCauses,
    handleExportExcel,
    handleGenerateAiDiagnostic,
    isAiLoading,
    aiAnalysis,
  };
};

export default useOperationsData;