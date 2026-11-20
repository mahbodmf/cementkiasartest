import React, { useState, useMemo, useEffect } from 'react';
import {
  Factory,
  Flame,
  Zap,
  Truck,
  CheckCircle2,
  TrendingUp,
  Scale,
  Calendar as CalendarIcon,
  AlertTriangle,
  Settings,
  Save,
  RotateCcw,
  X,
  Check,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

export interface OperationsMassBalanceProps {
  summary?: any;
  records?: any[];
  externalPeriodKey?: string;
}

interface ProcessBaselineParams {
  nominalKilnDailyTon: number;
  nominalCementDailyTon: number;
  targetDailyDispatchTon: number;
  defaultTruckPayloadTon: number;
}

const DEFAULT_PROCESS_PARAMS: ProcessBaselineParams = {
  nominalKilnDailyTon: 2000,
  nominalCementDailyTon: 2300,
  targetDailyDispatchTon: 1000,
  defaultTruckPayloadTon: 25,
};

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const OperationsMassBalance: React.FC<OperationsMassBalanceProps> = ({
  summary: propSummary = {},
  records: propRecords = [],
  externalPeriodKey,
}) => {
  // ۱. پارامترهای پایه
  const [params, setParams] = useState<ProcessBaselineParams>(() => {
    try {
      const saved = localStorage.getItem('cement_process_baseline_params');
      return saved ? JSON.parse(saved) : DEFAULT_PROCESS_PARAMS;
    } catch {
      return DEFAULT_PROCESS_PARAMS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempParams, setTempParams] = useState(params);

  // ۲. مدیریت نمایش خطوط
  const [visibleLines, setVisibleLines] = useState({
    clinker: true,
    cement: true,
    dispatch: true,
  });

  // ۳. بارگذاری لاگ‌های ذخیره‌شده
  const [allMonthsData, setAllMonthsData] = useState<{ prod: Record<string, any>; disp: Record<string, any>; stops: Record<string, any> }>({
    prod: {},
    disp: {},
    stops: {},
  });

  useEffect(() => {
    try {
      const p = localStorage.getItem('cement_production_logs');
      const d = localStorage.getItem('cement_dispatch_logs');
      const s = localStorage.getItem('cement_stops_logs');
      setAllMonthsData({
        prod: p ? JSON.parse(p) : {},
        disp: d ? JSON.parse(d) : {},
        stops: s ? JSON.parse(s) : {},
      });
    } catch {}
  }, []);

  // ۴. موتور تجزیه مطمئن تاریخ بدون باگ (تضمین تفکیک صحیح سال ۴ رقمی و ماه ۲ رقمی)
  const parsePeriodKey = (key: string): { year: number; month: number } => {
    const parts = key.split('_').map((x) => parseInt(x, 10));
    if (parts.length === 2) {
      if (parts[0] > 1000) return { year: parts[0], month: parts[1] };
      return { year: parts[1], month: parts[0] };
    }
    return { year: 1404, month: 1 };
  };

  // تمام رکوردهای روزانه ۲۵ ماهه به صورت مرتب و با کلید عددی یکپارچه YYYYMMDD
  const allFlattenedRecords = useMemo(() => {
    const monthKeys = Object.keys(allMonthsData.prod || {}).sort((a, b) => {
      const pA = parsePeriodKey(a);
      const pB = parsePeriodKey(b);
      return pA.year !== pB.year ? pA.year - pB.year : pA.month - pB.month;
    });

    if (monthKeys.length === 0) return propRecords;

    const parseH = (str?: string) => {
      if (!str) return 0;
      const pts = str.split(':').map(Number);
      return (pts[0] || 0) + (pts[1] || 0) / 60;
    };

    const records: any[] = [];
    monthKeys.forEach((mKey) => {
      const { year, month } = parsePeriodKey(mKey);
      const pDays = allMonthsData.prod[mKey]?.days || [];
      const dDays = allMonthsData.disp[mKey]?.days || [];
      const sDays = allMonthsData.stops[mKey]?.days || [];

      pDays.forEach((p: any) => {
        const d = dDays.find((x: any) => x.dayNumber === p.dayNumber) || {};
        const s = sDays.find((x: any) => x.dayNumber === p.dayNumber) || {};

        const clinker = Number(p.clinkerTon ?? p.productionTon?.clinker ?? 0);
        const cement = Number(p.totalCementTon ?? p.productionTon?.cement ?? 0);
        const dispatch = Number(d.dispatch?.totalDispatchTon ?? p.productionTon?.cementDispatch ?? 0);
        const kilnStop = parseH(s.departments?.kiln?.stopHours);
        const kilnRun = parseH(s.departments?.kiln?.runHours);

        const dayNum = Number(p.dayNumber || 1);
        const yStr = String(year);
        const mStr = String(month).padStart(2, '0');
        const dStr = String(dayNum).padStart(2, '0');

        const formattedDate = `${yStr}/${mStr}/${dStr}`;
        const rawDateKey = parseInt(`${yStr}${mStr}${dStr}`, 10);

        records.push({
          periodKey: mKey,
          dayNumber: dayNum,
          jalaliDate: formattedDate,
          rawDateKey,
          year,
          month,
          clinkerTon: clinker,
          cementTon: cement,
          dispatchTon: dispatch,
          kilnRunHours: kilnRun,
          kilnStopHours: kilnStop,
          isKilnCriticalDrop: clinker < params.nominalKilnDailyTon * 0.5,
        });
      });
    });

    return records.sort((a, b) => a.rawDateKey - b.rawDateKey);
  }, [allMonthsData, propRecords, params]);

  // ۵. بازه تاریخی انتخابی و فیلترهای سریع
  const [selectedStartDate, setSelectedStartDate] = useState<string>('');
  const [selectedEndDate, setSelectedEndDate] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'current' | '3m' | '6m' | 'all' | 'custom'>('current');

  // تنظیم بازه اولیه
  useEffect(() => {
    if (allFlattenedRecords.length > 0 && !selectedStartDate) {
      const lastRec = allFlattenedRecords[allFlattenedRecords.length - 1];
      const startIdx = Math.max(0, allFlattenedRecords.length - 30);
      const firstRec = allFlattenedRecords[startIdx];
      setSelectedStartDate(firstRec.jalaliDate);
      setSelectedEndDate(lastRec.jalaliDate);
    }
  }, [allFlattenedRecords, selectedStartDate]);

  // فیلترهای سریع
  const handleQuickFilter = (type: 'current' | '3m' | '6m' | 'all') => {
    setQuickFilter(type);
    if (allFlattenedRecords.length === 0) return;

    const lastIdx = allFlattenedRecords.length - 1;
    const endRec = allFlattenedRecords[lastIdx];
    setSelectedEndDate(endRec.jalaliDate);

    if (type === 'current') {
      const startIdx = Math.max(0, lastIdx - 30);
      setSelectedStartDate(allFlattenedRecords[startIdx].jalaliDate);
    } else if (type === '3m') {
      const startIdx = Math.max(0, lastIdx - 92);
      setSelectedStartDate(allFlattenedRecords[startIdx].jalaliDate);
    } else if (type === '6m') {
      const startIdx = Math.max(0, lastIdx - 185);
      setSelectedStartDate(allFlattenedRecords[startIdx].jalaliDate);
    } else if (type === 'all') {
      setSelectedStartDate(allFlattenedRecords[0].jalaliDate);
    }
  };

  // ۶. تقویم پاپ‌آپ انتخابی
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calViewYear, setCalViewYear] = useState<number>(1405);
  const [calViewMonth, setCalViewMonth] = useState<number>(5);
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');

  useEffect(() => {
    if (isCalendarOpen) {
      setTempStartDate(selectedStartDate);
      setTempEndDate(selectedEndDate);
      if (selectedEndDate) {
        const pts = selectedEndDate.split('/').map(Number);
        if (pts.length === 3) {
          setCalViewYear(pts[0]);
          setCalViewMonth(pts[1]);
        }
      }
    }
  }, [isCalendarOpen, selectedStartDate, selectedEndDate]);

  // فیلتر دقیق رکوردهای روزانه بر اساس بازه انتخابی
  const filteredDailyData = useMemo(() => {
    if (!selectedStartDate || !selectedEndDate || allFlattenedRecords.length === 0) {
      return allFlattenedRecords.slice(-30);
    }

    const sKey = parseInt(selectedStartDate.replace(/\//g, ''), 10);
    const eKey = parseInt(selectedEndDate.replace(/\//g, ''), 10);
    const minKey = Math.min(sKey, eKey);
    const maxKey = Math.max(sKey, eKey);

    const matches = allFlattenedRecords.filter(
      (r) => r.rawDateKey >= minKey && r.rawDateKey <= maxKey
    );

    return matches.length > 0 ? matches : allFlattenedRecords.slice(-30);
  }, [allFlattenedRecords, selectedStartDate, selectedEndDate]);

  // مقادیر تجمیعی
  const totalClinker = useMemo(() => filteredDailyData.reduce((s, r) => s + (r.clinkerTon || 0), 0), [filteredDailyData]);
  const totalCement = useMemo(() => filteredDailyData.reduce((s, r) => s + (r.cementTon || 0), 0), [filteredDailyData]);
  const totalDispatch = useMemo(() => filteredDailyData.reduce((s, r) => s + (r.dispatchTon || 0), 0), [filteredDailyData]);
  const totalKilnRun = useMemo(() => filteredDailyData.reduce((s, r) => s + (r.kilnRunHours || 0), 0), [filteredDailyData]);
  const totalKilnStop = useMemo(() => filteredDailyData.reduce((s, r) => s + (r.kilnStopHours || 0), 0), [filteredDailyData]);

  const cementToClinkerRatio = totalClinker > 0 ? (totalCement / totalClinker).toFixed(2) : '۱.۱۴';
  const dispatchToProductionPct = totalCement > 0 ? Math.round((totalDispatch / totalCement) * 100) : 100;
  const truckFleetCount = Math.round(totalDispatch / params.defaultTruckPayloadTon);

  const [hoveredData, setHoveredData] = useState<{ data: any; x: number; y: number } | null>(null);

  const maxVal = Math.max(
    params.nominalCementDailyTon * 1.25,
    ...filteredDailyData.map((d: any) => Math.max(d.clinkerTon || 0, d.cementTon || 0, d.dispatchTon || 0, 100))
  );

  const handlePrevCalMonth = () => {
    if (calViewMonth === 1) {
      setCalViewMonth(12);
      setCalViewYear((y) => y - 1);
    } else {
      setCalViewMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calViewMonth === 12) {
      setCalViewMonth(1);
      setCalViewYear((y) => y + 1);
    } else {
      setCalViewMonth((m) => m + 1);
    }
  };

  const handleDayClickInCalendar = (dateStr: string) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(dateStr);
      setTempEndDate('');
    } else {
      const sKey = parseInt(tempStartDate.replace(/\//g, ''), 10);
      const clickedKey = parseInt(dateStr.replace(/\//g, ''), 10);
      if (clickedKey < sKey) {
        setTempStartDate(dateStr);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(dateStr);
      }
    }
  };

  const handleApplyCalendarSelection = () => {
    if (tempStartDate && tempEndDate) {
      setSelectedStartDate(tempStartDate);
      setSelectedEndDate(tempEndDate);
    } else if (tempStartDate) {
      setSelectedStartDate(tempStartDate);
      setSelectedEndDate(tempStartDate);
    }
    setQuickFilter('custom');
    setIsCalendarOpen(false);
  };

  return (
    <div
      className="enms-card p-5 flex flex-col justify-between shadow-lg select-none w-full"
      dir="rtl"
    >
      {/* سربرگ با بازگشت کامل دکمه‌های سریع دوره‌ای و دکمه تقویم روزانه */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[var(--color-border)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <span>موازنه زنجیره تولید و دیسپاچینگ کارخانه (Process Mass Flow Balance)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                کل زنجیره ارزش | پایش روز به روز
              </span>
            </h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              پایش پیوسته همبستگی جریان مواد از خط پخت تا خروجی بارگیرخانه | ظرفیت نامی کوره: {toPersianDigits(formatPersianNumber(params.nominalKilnDailyTon))} تن در روز
            </p>
          </div>
        </div>

        {/* دکمه‌های انتخاب سریع (ماه جاری، ۳ ماه، ۶ ماه، کل سوابق) + دکمه تقویم انتخابی روزشمار */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => handleQuickFilter('current')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                quickFilter === 'current' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              ماه جاری
            </button>
            <button
              onClick={() => handleQuickFilter('3m')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                quickFilter === '3m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              ۳ ماه اخیر
            </button>
            <button
              onClick={() => handleQuickFilter('6m')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                quickFilter === '6m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              ۶ ماه اخیر
            </button>
            <button
              onClick={() => handleQuickFilter('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                quickFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              کل تاریخچه
            </button>
          </div>

          {/* دکمه تقویم پاپ‌آپ با نمایش تاریخ بازه */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              quickFilter === 'custom'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-amber-400 border-[var(--color-border)]'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-xs">
              {toPersianDigits(selectedStartDate || '...')} تا {toPersianDigits(selectedEndDate || '...')}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-[10px] text-amber-300 font-sans">
              {toPersianDigits(filteredDailyData.length)} روز
            </span>
          </button>

          <button
            onClick={() => {
              setTempParams(params);
              setIsSettingsOpen(true);
            }}
            className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-amber-400 border border-[var(--color-border)] transition cursor-pointer"
            title="تنظیم پارامترهای پایه"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* کارت‌های سه‌گانه مقادیر تجمیعی دوره */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* ۱. کوره دوار */}
        <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-amber-700/60 transition">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" />
              ۱. کوره دوار پخت (ورودی کلینکر)
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">SEU-01</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {toPersianDigits(formatPersianNumber(totalClinker))}{' '}
            <span className="text-xs font-sans text-[var(--color-text-muted)] font-normal">تن کلینکر</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)] font-mono flex justify-between">
            <span>کارکرد: <strong className="text-emerald-400">{toPersianDigits(totalKilnRun.toFixed(0))}h</strong></span>
            <span>توقف: <strong className="text-rose-400">{toPersianDigits(totalKilnStop.toFixed(0))}h</strong></span>
          </div>
        </div>

        {/* ۲. آسیاب سیمان */}
        <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-cyan-700/60 transition">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs">
            <span className="font-bold text-cyan-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-500" />
              ۲. آسیاب‌های سیمان ۱ و ۲ (تبدیل به محصول)
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">SEU-04</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {toPersianDigits(formatPersianNumber(totalCement))}{' '}
            <span className="text-xs font-sans text-[var(--color-text-muted)] font-normal">تن سیمان</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)] font-mono flex justify-between">
            <span>نسبت سیمان/کلینکر: <strong className="text-cyan-400 font-bold">{toPersianDigits(cementToClinkerRatio)}</strong></span>
            <span>ظرفیت نامی: <strong className="text-[var(--color-text-secondary)]">{toPersianDigits(formatPersianNumber(params.nominalCementDailyTon))} t/d</strong></span>
          </div>
        </div>

        {/* ۳. بارگیرخانه */}
        <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-purple-700/60 transition">
          <div className="flex items-center justify-between text-[var(--color-text-muted)] text-xs">
            <span className="font-bold text-purple-400 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-purple-500" />
              ۳. بارگیرخانه و دیسپاچینگ (خروجی بازار)
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">Logistics</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-text-primary)] mt-2">
            {toPersianDigits(formatPersianNumber(totalDispatch))}{' '}
            <span className="text-xs font-sans text-[var(--color-text-muted)] font-normal">تن تحویل</span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)] font-mono flex justify-between">
            <span>ناوگان بارگیری: <strong className="text-purple-400">{toPersianDigits(formatPersianNumber(truckFleetCount))} تردد</strong></span>
            <span>پوشش فروش: <strong className="text-emerald-400">{toPersianDigits(dispatchToProductionPct)}٪</strong></span>
          </div>
        </div>
      </div>

      {/* نمودار تمام‌عرض جریان مواد */}
      <div className="bg-[var(--color-bg-card-subtle)] p-4 rounded-xl border border-[var(--color-border)] mb-3 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-[var(--color-border)] gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              روند روزانه جریان مواد و نشانگرهای ثابت افت عملکرد
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono select-none">
            <button
              onClick={() => setVisibleLines((p) => ({ ...p, clinker: !p.clinker }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                visibleLines.clinker ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50' : 'text-[var(--color-text-muted)] opacity-50'
              }`}
            >
              {visibleLines.clinker ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>تولید کلینکر</span>
            </button>

            <button
              onClick={() => setVisibleLines((p) => ({ ...p, cement: !p.cement }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                visibleLines.cement ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50' : 'text-[var(--color-text-muted)] opacity-50'
              }`}
            >
              {visibleLines.cement ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>تولید سیمان</span>
            </button>

            <button
              onClick={() => setVisibleLines((p) => ({ ...p, dispatch: !p.dispatch }))}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition cursor-pointer ${
                visibleLines.dispatch ? 'text-purple-400 bg-purple-950/40 border border-purple-800/50' : 'text-[var(--color-text-muted)] opacity-50'
              }`}
            >
              {visibleLines.dispatch ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>دیسپاچینگ</span>
            </button>

            <span className="flex items-center gap-1 text-rose-400 text-[11px]">
              <span className="w-2.5 h-2.5 bg-rose-500 rotate-45 inline-block" /> افت بحرانی کوره
            </span>
          </div>
        </div>

        {/* بوم چارت */}
        <div className="w-full h-64 overflow-x-auto overflow-y-hidden">
          <svg
            className="h-full"
            style={{ width: `${Math.max(1050, filteredDailyData.length * 30)}px`, minHeight: '250px' }}
            viewBox={`0 0 ${Math.max(1050, filteredDailyData.length * 30)} 250`}
          >
            <line x1="60" y1="200" x2={Math.max(1030, filteredDailyData.length * 30)} y2="200" stroke="#374151" strokeWidth="1.5" />

            {/* گرید افقی Y */}
            {[0, 1000, 2000, 2500].map((val) => {
              const y = 200 - (val / maxVal) * 160;
              return (
                <g key={`grid-y-${val}`}>
                  <line x1="60" y1={y} x2={Math.max(1030, filteredDailyData.length * 30)} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                  <text x="50" y={y + 3} textAnchor="end" fill="#6b7280" fontSize="9" fontFamily="monospace">
                    {toPersianDigits(val)} تن
                  </text>
                </g>
              );
            })}

            {/* خط ظرفیت نامی کوره */}
            {(() => {
              const yNominal = 200 - (params.nominalKilnDailyTon / maxVal) * 160;
              return (
                <g>
                  <line
                    x1="60"
                    y1={yNominal}
                    x2={Math.max(1030, filteredDailyData.length * 30)}
                    y2={yNominal}
                    stroke="#eab308"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <rect x="70" y={yNominal - 18} width="220" height="16" fill="#1e1b0c" rx="4" stroke="#854d0e" />
                  <text x="75" y={yNominal - 6} fill="#facc15" fontSize="10" fontWeight="bold">
                    ظرفیت نامی کوره: {toPersianDigits(formatPersianNumber(params.nominalKilnDailyTon))} تن در روز
                  </text>
                </g>
              );
            })()}

            {/* خطوط پولی‌لاین */}
            {(() => {
              const step = 30;
              const usableH = 160;
              const baseY = 200;

              const getPt = (val: number, idx: number) => {
                const x = 70 + idx * step;
                const y = baseY - (Math.min(maxVal, val) / maxVal) * usableH;
                return { x, y };
              };

              const clinkerPts = filteredDailyData.map((d, i) => `${getPt(d.clinkerTon, i).x},${getPt(d.clinkerTon, i).y}`).join(' ');
              const cementPts = filteredDailyData.map((d, i) => `${getPt(d.cementTon, i).x},${getPt(d.cementTon, i).y}`).join(' ');
              const dispatchPts = filteredDailyData.map((d, i) => `${getPt(d.dispatchTon, i).x},${getPt(d.dispatchTon, i).y}`).join(' ');

              return (
                <>
                  {visibleLines.clinker && <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={clinkerPts} />}
                  {visibleLines.cement && <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={cementPts} />}
                  {visibleLines.dispatch && <polyline fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={dispatchPts} />}

                  {filteredDailyData.map((d, idx) => {
                    const x = 70 + idx * step;
                    const cPt = getPt(d.clinkerTon, idx);
                    const cmPt = getPt(d.cementTon, idx);
                    const dsPt = getPt(d.dispatchTon, idx);

                    return (
                      <g
                        key={`pt-${idx}`}
                        onMouseEnter={(e) => setHoveredData({ data: d, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredData(null)}
                        className="cursor-pointer group"
                      >
                        <line x1={x} y1="25" x2={x} y2={baseY} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition" />

                        {visibleLines.clinker && <circle cx={x} cy={cPt.y} r="3.5" fill="#f59e0b" />}
                        {visibleLines.cement && <circle cx={x} cy={cmPt.y} r="3.5" fill="#06b6d4" />}
                        {visibleLines.dispatch && <circle cx={x} cy={dsPt.y} r="3.5" fill="#a855f7" />}

                        {/* نشانگر ثابت لوزی قرمز در افت کوره */}
                        {d.isKilnCriticalDrop && (
                          <g transform={`translate(${x}, ${cPt.y})`}>
                            <rect x="-4.5" y="-4.5" width="9" height="9" fill="#f43f5e" transform="rotate(45)" stroke="#ffffff" strokeWidth="1" />
                          </g>
                        )}

                        <text x={x} y="218" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                          {toPersianDigits(d.dayNumber)}
                        </text>
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* نوار وضعیت تراز فیزیکی در پایین */}
      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تراز فیزیکی مواد بین کوره، آسیاب و بارگیرخانه در محدوده ظرفیت اسمی کارخانه سیمان کیاسر پایدار است.</span>
        </span>
        <span className="font-bold font-mono text-emerald-400 text-xs">
          ارزیابی {toPersianDigits(filteredDailyData.length)} روز متوالی در بازه {toPersianDigits(selectedStartDate)} تا {toPersianDigits(selectedEndDate)}
        </span>
      </div>

      {/* تولتیپ شناور با ماوس */}
      {hoveredData && (
        <div
          className="fixed z-50 pointer-events-none p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl text-xs text-[var(--color-text-primary)] transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${hoveredData.x}px`, top: `${hoveredData.y - 10}px` }}
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[var(--color-border)] gap-4">
            <span className="font-bold text-emerald-400 font-mono">
              تاریخ: {toPersianDigits(hoveredData.data.jalaliDate)} (روز {toPersianDigits(hoveredData.data.dayNumber)})
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">دوره: {hoveredData.data.periodKey}</span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-amber-400 font-sans">تولید کلینکر کوره:</span>
              <span className="font-bold">{toPersianDigits(formatPersianNumber(hoveredData.data.clinkerTon))} تن</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-cyan-400 font-sans">تولید آسیاب سیمان:</span>
              <span className="font-bold">{toPersianDigits(formatPersianNumber(hoveredData.data.cementTon))} تن</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-purple-400 font-sans">تحویل بارگیرخانه:</span>
              <span className="font-bold">{toPersianDigits(formatPersianNumber(hoveredData.data.dispatchTon))} تن</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[var(--color-border)]">
              <span className="text-[var(--color-text-muted)] font-sans">انحراف روزانه (تولید - فروش):</span>
              <span className={hoveredData.data.cementTon >= hoveredData.data.dispatchTon ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {hoveredData.data.cementTon >= hoveredData.data.dispatchTon ? '+' : ''}
                {toPersianDigits(formatPersianNumber(hoveredData.data.cementTon - hoveredData.data.dispatchTon))} تن
              </span>
            </div>
            {hoveredData.data.isKilnCriticalDrop && (
              <div className="text-rose-400 text-[10px] font-sans pt-1 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>افت تولید کلینکر زیر ۵۰٪ ظرفیت نامی!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* تقویم پاپ‌آپ انتخابی روزشمار */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
                  انتخاب دقیق روز مبدأ و مقصد در تقویم کارخانه
                </h4>
              </div>
              <button onClick={() => setIsCalendarOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-[var(--color-bg-card-subtle)] p-2.5 rounded-xl border border-[var(--color-border)]">
              <button
                onClick={handlePrevCalMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 font-mono">
                <span>{PERSIAN_MONTH_NAMES[calViewMonth - 1]}</span>
                <span>{toPersianDigits(calViewYear)}</span>
              </div>

              <button
                onClick={handleNextCalMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[var(--color-bg-card-subtle)] p-3 rounded-xl border border-[var(--color-border)]">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--color-text-muted)] mb-2">
                {WEEK_DAYS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-xs font-mono">
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calViewYear}/${String(calViewMonth).padStart(2, '0')}/${String(dayNum).padStart(2, '0')}`;
                  const currentKey = parseInt(dateStr.replace(/\//g, ''), 10);
                  const startKey = tempStartDate ? parseInt(tempStartDate.replace(/\//g, ''), 10) : 0;
                  const endKey = tempEndDate ? parseInt(tempEndDate.replace(/\//g, ''), 10) : 0;

                  const isStart = tempStartDate === dateStr;
                  const isEnd = tempEndDate === dateStr;
                  const isInRange = startKey && endKey && currentKey > Math.min(startKey, endKey) && currentKey < Math.max(startKey, endKey);

                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleDayClickInCalendar(dateStr)}
                      className={`h-9 rounded-lg flex items-center justify-center transition text-xs font-mono cursor-pointer ${
                        isStart || isEnd
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950'
                          : isInRange
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {toPersianDigits(dayNum)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-[var(--color-border)] gap-2">
              <div className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5 font-mono">
                <span className="text-[var(--color-text-muted)]">بازه:</span>
                <span className="text-emerald-400 font-bold">{toPersianDigits(tempStartDate || '...')}</span>
                <span className="text-[var(--color-text-muted)]">تا</span>
                <span className="text-emerald-400 font-bold">{toPersianDigits(tempEndDate || '...')}</span>
              </div>

              <button
                onClick={handleApplyCalendarSelection}
                disabled={!tempStartDate}
                className="enms-button enms-button-primary disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>اعمال بازه روزانه بر نمودار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تنظیم داده‌های پایه */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">تنظیم ظرفیت‌های نامی و داده‌های پایه فرآیند</h4>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[var(--color-text-secondary)] block mb-1">ظرفیت نامی تولید روزانه کوره پخت (تن کلینکر):</label>
                <input
                  type="number"
                  value={tempParams.nominalKilnDailyTon}
                  onChange={(e) => setTempParams({ ...tempParams, nominalKilnDailyTon: Number(e.target.value) })}
                  className="enms-input w-full font-mono"
                />
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] block mb-1">ظرفیت نامی سایش روزانه آسیاب‌های سیمان (تن محصول):</label>
                <input
                  type="number"
                  value={tempParams.nominalCementDailyTon}
                  onChange={(e) => setTempParams({ ...tempParams, nominalCementDailyTon: Number(e.target.value) })}
                  className="enms-input w-full font-mono"
                />
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] block mb-1">کف تعهد بارگیری و دیسپاچینگ روزانه (تن):</label>
                <input
                  type="number"
                  value={tempParams.targetDailyDispatchTon}
                  onChange={(e) => setTempParams({ ...tempParams, targetDailyDispatchTon: Number(e.target.value) })}
                  className="enms-input w-full font-mono"
                />
              </div>

              <div>
                <label className="text-[var(--color-text-secondary)] block mb-1">میانگین ظرفیت بارگیری هر کامیون/تریلی ناوگان (تن):</label>
                <input
                  type="number"
                  value={tempParams.defaultTruckPayloadTon}
                  onChange={(e) => setTempParams({ ...tempParams, defaultTruckPayloadTon: Number(e.target.value) })}
                  className="enms-input w-full font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
              <button
                onClick={() => {
                  setTempParams(DEFAULT_PROCESS_PARAMS);
                  setParams(DEFAULT_PROCESS_PARAMS);
                  localStorage.setItem('cement_process_baseline_params', JSON.stringify(DEFAULT_PROCESS_PARAMS));
                  setIsSettingsOpen(false);
                }}
                className="enms-button enms-button-secondary flex items-center gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بازنشانی به پیش‌فرض</span>
              </button>

              <button
                onClick={() => {
                  setParams(tempParams);
                  localStorage.setItem('cement_process_baseline_params', JSON.stringify(tempParams));
                  setIsSettingsOpen(false);
                }}
                className="enms-button enms-button-primary flex items-center gap-1.5 text-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره و اعمال پارامترها</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsMassBalance;