import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  AlertTriangle,
  Flame,
  Zap,
  Wrench,
  Activity,
  Clock,
  Download,
  Info,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Filter,
  Calendar as CalendarIcon,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

export interface OperationsParetoAnalysisProps {
  paretoCauses?: any[];
  records?: any[];
  externalPeriodKey?: string;
}

type TabMode = 'pareto' | 'timeline' | 'reliability';
type DeptFilter = 'all' | 'kiln' | 'cementMill' | 'rawMill' | 'crusher';

export const OperationsParetoAnalysis: React.FC<OperationsParetoAnalysisProps> = ({
  paretoCauses: propParetoCauses = [],
  records: propRecords = [],
  externalPeriodKey,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('pareto');
  const [selectedDept, setSelectedDept] = useState<DeptFilter>('all');
  
  // ۱. کنترل زوم پویا (عرض هر ستون بر حسب پیکسل)
  const [barStepWidth, setBarStepWidth] = useState<number>(95);

  // ۲. فیلتر تعداد علل نمایشی در نمودار
  const [topLimit, setTopLimit] = useState<number>(10);

  // ۳. کنترل تولتیپ شناور با موس
  const [hoveredPoint, setHoveredPoint] = useState<{
    data: any;
    x: number;
    y: number;
  } | null>(null);

  // ۴. خواندن داده‌های ۲۵ ماهه
  const [allStopsData, setAllStopsData] = useState<Record<string, any>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem('cement_stops_logs');
      if (s) setAllStopsData(JSON.parse(s));
    } catch {}
  }, []);

  const availableMonthKeys = useMemo(() => {
    return Object.keys(allStopsData || {}).sort();
  }, [allStopsData]);

  // مدیریت بازه زمانی
  const [startPeriod, setStartPeriod] = useState<string>('');
  const [endPeriod, setEndPeriod] = useState<string>('');
  const [quickRange, setQuickRange] = useState<'current' | '3m' | '6m' | 'all' | 'custom'>('6m');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pickerStart, setPickerStart] = useState('');
  const [pickerEnd, setPickerEnd] = useState('');

  useEffect(() => {
    if (availableMonthKeys.length > 0) {
      const active = externalPeriodKey && availableMonthKeys.includes(externalPeriodKey)
        ? externalPeriodKey
        : availableMonthKeys[availableMonthKeys.length - 1];
      
      const idx6m = Math.max(0, availableMonthKeys.length - 6);
      setStartPeriod(availableMonthKeys[idx6m]);
      setEndPeriod(active);
      setPickerStart(availableMonthKeys[idx6m]);
      setPickerEnd(active);
    }
  }, [availableMonthKeys, externalPeriodKey]);

  const handleQuickFilter = (type: 'current' | '3m' | '6m' | 'all') => {
    setQuickRange(type);
    if (availableMonthKeys.length === 0) return;
    const latest = availableMonthKeys[availableMonthKeys.length - 1];
    setEndPeriod(latest);

    if (type === 'current') {
      const cur = externalPeriodKey || latest;
      setStartPeriod(cur);
      setEndPeriod(cur);
    } else if (type === '3m') {
      setStartPeriod(availableMonthKeys[Math.max(0, availableMonthKeys.length - 3)]);
    } else if (type === '6m') {
      setStartPeriod(availableMonthKeys[Math.max(0, availableMonthKeys.length - 6)]);
    } else if (type === 'all') {
      setStartPeriod(availableMonthKeys[0]);
    }
  };

  const handleApplyCalendar = () => {
    let s = pickerStart;
    let e = pickerEnd;
    if (availableMonthKeys.indexOf(s) > availableMonthKeys.indexOf(e)) {
      const temp = s;
      s = e;
      e = temp;
    }
    setStartPeriod(s);
    setEndPeriod(e);
    setQuickRange('custom');
    setIsCalendarOpen(false);
  };

  const handleZoomIn = () => setBarStepWidth((prev) => Math.min(180, prev + 20));
  const handleZoomOut = () => setBarStepWidth((prev) => Math.max(50, prev - 20));
  const handleResetZoom = () => setBarStepWidth(95);

  const categorizeCause = (causeText: string): 'mechanical' | 'electrical' | 'process' | 'forced' => {
    const text = causeText.toLowerCase();
    if (
      text.includes('مکانیک') ||
      text.includes('بیرینگ') ||
      text.includes('الواتور') ||
      text.includes('بک هوس') ||
      text.includes('گیربکس') ||
      text.includes('غلطک') ||
      text.includes('تسمه') ||
      text.includes('رولیک') ||
      text.includes('لاینر') ||
      text.includes('روغن')
    ) {
      return 'mechanical';
    }
    if (
      text.includes('برق') ||
      text.includes('آمپر') ||
      text.includes('موتور') ||
      text.includes('ترانس') ||
      text.includes('تابلو') ||
      text.includes('سنسور') ||
      text.includes('کابل') ||
      text.includes('plc') ||
      text.includes('سوختن')
    ) {
      return 'electrical';
    }
    if (
      text.includes('سالن') ||
      text.includes('سیلو') ||
      text.includes('اختلاط') ||
      text.includes('دپو') ||
      text.includes('گرفتگی') ||
      text.includes('قیف') ||
      text.includes('پر بودن') ||
      text.includes('فشار') ||
      text.includes('دما')
    ) {
      return 'process';
    }
    return 'forced';
  };

  const parseTimeToHours = (timeStr?: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) + (parts[1] || 0) / 60;
  };

  // تجمیع علل توقفات
  const { enrichedCauses, monthlyTrendData, totalDowntimeHours, totalRecordsCount } = useMemo(() => {
    const causeMap: Record<string, { cause: string; hours: number; count: number; dept: string; category: string }> = {};
    const monthlyMap: Record<string, { period: string; mechanical: number; electrical: number; process: number; forced: number; total: number }> = {};

    let validMonths: string[] = [];
    if (availableMonthKeys.length > 0 && startPeriod && endPeriod) {
      const sIdx = availableMonthKeys.indexOf(startPeriod);
      const eIdx = availableMonthKeys.indexOf(endPeriod);
      validMonths = availableMonthKeys.slice(Math.min(sIdx, eIdx), Math.max(sIdx, eIdx) + 1);
    }

    let recordsCount = 0;

    const processDayRecord = (d: any, mKey: string) => {
      recordsCount++;
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { period: mKey, mechanical: 0, electrical: 0, process: 0, forced: 0, total: 0 };
      }

      const inspect = (causeStr: string, deptName: string, deptKey: string, stopHours: number) => {
        if (!causeStr || causeStr === '-' || stopHours <= 0) return;
        if (selectedDept !== 'all' && selectedDept !== deptKey) return;

        const items = causeStr.split(/[-–,،]/).map((c) => c.trim()).filter(Boolean);
        const allocatedH = stopHours / (items.length || 1);

        items.forEach((item) => {
          const cat = categorizeCause(item);
          if (!causeMap[item]) {
            causeMap[item] = { cause: item, hours: 0, count: 0, dept: deptName, category: cat };
          }
          causeMap[item].hours += allocatedH;
          causeMap[item].count += 1;

          monthlyMap[mKey][cat] += allocatedH;
          monthlyMap[mKey].total += allocatedH;
        });
      };

      const depts = d.departments || {};
      inspect(depts.kiln?.stopCauses, 'کوره پخت', 'kiln', parseTimeToHours(depts.kiln?.stopHours));
      inspect(depts.cementMill?.stopCauses, 'آسیاب سیمان', 'cementMill', parseTimeToHours(depts.cementMill?.stopHours));
      inspect(depts.rawMill?.stopCauses, 'آسیاب مواد', 'rawMill', parseTimeToHours(depts.rawMill?.stopHours));
      inspect(depts.crusher?.stopCauses, 'سنگ‌شکن', 'crusher', parseTimeToHours(depts.crusher?.stopHours));
    };

    if (validMonths.length > 0) {
      validMonths.forEach((mKey) => {
        const mDays = allStopsData[mKey]?.days || [];
        mDays.forEach((d: any) => processDayRecord(d, mKey));
      });
    } else if (propRecords && propRecords.length > 0) {
      propRecords.forEach((r: any) => {
        recordsCount++;
        const checkProp = (causeStr: string, deptName: string, deptKey: string, stopH: number) => {
          if (!causeStr || causeStr === '-' || stopH <= 0) return;
          if (selectedDept !== 'all' && selectedDept !== deptKey) return;
          const items = causeStr.split(/[-–,،]/).map((c) => c.trim()).filter(Boolean);
          const allocatedH = stopH / (items.length || 1);
          items.forEach((item) => {
            const cat = categorizeCause(item);
            if (!causeMap[item]) {
              causeMap[item] = { cause: item, hours: 0, count: 0, dept: deptName, category: cat };
            }
            causeMap[item].hours += allocatedH;
            causeMap[item].count += 1;
          });
        };
        checkProp(r.kilnStopCauses, 'کوره پخت', 'kiln', r.kilnStopHours || 0);
        checkProp(r.millStopCauses, 'آسیاب سیمان', 'cementMill', r.millStopHours || 0);
        checkProp(r.rawMillStopCauses, 'آسیاب مواد', 'rawMill', r.rawMillStopHours || 0);
        checkProp(r.crusherStopCauses, 'سنگ‌شکن', 'crusher', r.crusherStopHours || 0);
      });
    }

    const items = Object.values(causeMap).sort((a, b) => b.hours - a.hours);
    const totalH = items.reduce((s, x) => s + x.hours, 0) || 1;

    let accum = 0;
    const enriched = items.map((item) => {
      accum += item.hours;
      return {
        ...item,
        pct: (item.hours / totalH) * 100,
        cumPct: (accum / totalH) * 100,
      };
    });

    const monthlyList = Object.values(monthlyMap).sort((a, b) => a.period.localeCompare(b.period));

    return {
      enrichedCauses: enriched,
      monthlyTrendData: monthlyList,
      totalDowntimeHours: totalH,
      totalRecordsCount: recordsCount,
    };
  }, [allStopsData, availableMonthKeys, startPeriod, endPeriod, selectedDept, propRecords]);

  // سهم ۴ رسته
  const categoryStats = useMemo(() => {
    const cats: Record<string, number> = { mechanical: 0, electrical: 0, process: 0, forced: 0 };
    enrichedCauses.forEach((x) => {
      if (cats[x.category] !== undefined) cats[x.category] += x.hours;
      else cats.forced += x.hours;
    });

    return [
      {
        category: 'mechanical',
        label: 'مکانیکی (Mechanical)',
        hours: cats.mechanical,
        pct: Math.round((cats.mechanical / totalDowntimeHours) * 100),
        color: '#f59e0b',
        icon: Wrench,
      },
      {
        category: 'electrical',
        label: 'برق و ابزاردقیق (C&I)',
        hours: cats.electrical,
        pct: Math.round((cats.electrical / totalDowntimeHours) * 100),
        color: '#06b6d4',
        icon: Zap,
      },
      {
        category: 'process',
        label: 'فرآیندی و عملیات (Process)',
        hours: cats.process,
        pct: Math.round((cats.process / totalDowntimeHours) * 100),
        color: '#a855f7',
        icon: Activity,
      },
      {
        category: 'forced',
        label: 'اضطراری و توقفات بیرونی',
        hours: cats.forced,
        pct: Math.round((cats.forced / totalDowntimeHours) * 100),
        color: '#f43f5e',
        icon: AlertTriangle,
      },
    ];
  }, [enrichedCauses, totalDowntimeHours]);

  // شاخص‌های قابلیت اطمینان
  const reliabilityMetrics = useMemo(() => {
    const failureCount = enrichedCauses.reduce((s, x) => s + x.count, 0) || 1;
    const totalOperatingDays = Math.max(1, totalRecordsCount || 30);
    const totalCalendarHours = totalOperatingDays * 24;
    const netUptimeHours = Math.max(0, totalCalendarHours - totalDowntimeHours);

    const mttr = failureCount > 0 ? totalDowntimeHours / failureCount : 0;
    const mtbf = failureCount > 0 ? netUptimeHours / failureCount : 0;
    const availabilityRate = totalCalendarHours > 0 ? (netUptimeHours / totalCalendarHours) * 100 : 90;

    const kilnStopsHours = enrichedCauses.filter((c) => c.dept.includes('کوره')).reduce((s, x) => s + x.hours, 0);
    const estimatedGasLossM3 = Math.round(kilnStopsHours * 240);

    return {
      mttr: mttr.toFixed(1),
      mtbf: mtbf.toFixed(1),
      availabilityRate: availabilityRate.toFixed(1),
      failureCount,
      estimatedGasLossM3,
    };
  }, [enrichedCauses, totalDowntimeHours, totalRecordsCount]);

  const handleExportParetoExcel = () => {
    if (enrichedCauses.length === 0) return;
    const rows = enrichedCauses.map((c, i) => ({
      'رتبه': i + 1,
      'عنوان و شرح توقف': c.cause,
      'دپارتمان مسئول': c.dept,
      'دسته ماهیت توقف':
        c.category === 'mechanical'
          ? 'مکانیکی'
          : c.category === 'electrical'
          ? 'برق و ابزاردقیق'
          : c.category === 'process'
          ? 'فرآیندی'
          : 'اضطراری/بیرونی',
      'مدت زمان توقف (ساعت)': Number(c.hours.toFixed(1)),
      'سهم زمانی (درصد)': Number(c.pct.toFixed(1)),
      'درصد تجمعی پارتو': Number(c.cumPct.toFixed(1)),
      'تعداد دفعات وقوع': c.count,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تحلیل_پارتو');
    XLSX.writeFile(wb, `تحلیل_پارتو_توقفات_${startPeriod}_تا_${endPeriod}.xlsx`);
  };

  // علل نمایشی بر اساس فیلتر Top N
  const topVitalCauses = useMemo(() => {
    return topLimit === 999 ? enrichedCauses : enrichedCauses.slice(0, topLimit);
  }, [enrichedCauses, topLimit]);

  const maxCauseHours = topVitalCauses[0]?.hours || 10;
  const svgTotalWidth = Math.max(1050, topVitalCauses.length * barStepWidth + 140);

  return (
    <div
      className="enms-card p-5 shadow-2xl flex flex-col justify-between select-none w-full animate-fadeIn"
      dir="rtl"
    >
      {/* ۱. سربرگ با بازه زمانی، تب‌ها، فیلتر دپارتمان و اکسل */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[var(--color-border-subtle)] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-danger-bg)] border border-[var(--color-danger)]/30 flex items-center justify-center text-[var(--color-danger)]">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
              <span>تحلیل پیشرفته پارتوی توقفات خطوط (Downtime RCA & Reliability)</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/40 font-mono">
                قانون ۸۰/۲۰ استاندارد
              </span>
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              بازه فعال: <strong className="text-[var(--color-primary)] font-mono">{toPersianDigits(startPeriod)}</strong> تا{' '}
              <strong className="text-[var(--color-primary)] font-mono">{toPersianDigits(endPeriod)}</strong> ({toPersianDigits(totalRecordsCount)} روز ارزیابی‌شده)
            </p>
          </div>
        </div>

        {/* نوار انتخاب بازه زمانی، تب‌ها و کنترلرها */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* دکمه‌های سریع بازه */}
          <div className="enms-tab-pills text-xs">
            <button
              onClick={() => handleQuickFilter('current')}
              className={`enms-tab-pill ${quickRange === 'current' ? 'active' : ''}`}
            >
              ماه جاری
            </button>
            <button
              onClick={() => handleQuickFilter('3m')}
              className={`enms-tab-pill ${quickRange === '3m' ? 'active' : ''}`}
            >
              ۳ ماه اخیر
            </button>
            <button
              onClick={() => handleQuickFilter('6m')}
              className={`enms-tab-pill ${quickRange === '6m' ? 'active' : ''}`}
            >
              ۶ ماه اخیر
            </button>
            <button
              onClick={() => handleQuickFilter('all')}
              className={`enms-tab-pill ${quickRange === 'all' ? 'active' : ''}`}
            >
              کل تاریخچه
            </button>
          </div>

          {/* دکمه تقویم انتخاب بازه دلخواه */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className={`enms-button text-xs flex items-center gap-1.5 ${
              quickRange === 'custom'
                ? 'enms-button-primary'
                : 'enms-button-secondary text-[var(--color-warning)]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span className="font-mono text-[11px]">{toPersianDigits(startPeriod)} تا {toPersianDigits(endPeriod)}</span>
          </button>

          {/* فیلتر دپارتمان */}
          <div className="flex items-center gap-1.5 bg-[var(--color-bg-card-subtle)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-xs">
            <Filter className="w-3 h-3 text-[var(--color-warning)]" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as DeptFilter)}
              className="bg-transparent text-[var(--color-text-primary)] focus:outline-none cursor-pointer font-sans text-xs"
            >
              <option value="all" className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">کل کارخانه (یکپارچه)</option>
              <option value="kiln" className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">کوره و پیروپروسس</option>
              <option value="cementMill" className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">آسیاب‌های سیمان</option>
              <option value="rawMill" className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">آسیاب مواد خام</option>
              <option value="crusher" className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">سنگ‌شکن و دپوها</option>
            </select>
          </div>

          <button
            onClick={handleExportParetoExcel}
            className="enms-button enms-button-secondary p-1.5 text-[var(--color-primary)]"
            title="دانلود اکسل"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ۲. سوییچ تب‌های تحلیلی + دکمه‌های زوم و فیلتر تعداد علل برتر */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 my-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="enms-tab-pills text-xs font-medium">
            <button
              onClick={() => setActiveTab('pareto')}
              className={`enms-tab-pill ${activeTab === 'pareto' ? 'active' : ''}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>پارتوی ۸۰/۲۰</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`enms-tab-pill ${activeTab === 'timeline' ? 'active' : ''}`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>سهم و روند ۴ رسته</span>
            </button>
            <button
              onClick={() => setActiveTab('reliability')}
              className={`enms-tab-pill ${activeTab === 'reliability' ? 'active' : ''}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>شاخص‌های قابلیت اطمینان</span>
            </button>
          </div>

          {/* کنترلرهای زوم پویا */}
          <div className="flex items-center bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5">
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded cursor-pointer" title="بزرگ‌نمایی ستون‌ها">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded cursor-pointer" title="کوچک‌نمایی ستون‌ها">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetZoom} className="p-1.5 hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] rounded cursor-pointer" title="ریست زوم">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* فیلتر تعداد علل برتر */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-card-subtle)] px-2 py-1 rounded-lg border border-[var(--color-border)] text-[11px]">
            <span className="text-[var(--color-text-muted)]">نمایش:</span>
            {[10, 15, 20].map((num) => (
              <button
                key={num}
                onClick={() => setTopLimit(num)}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${
                  topLimit === num ? 'bg-[var(--color-primary)] text-[var(--color-bg-app)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {toPersianDigits(num)}
              </button>
            ))}
            <button
              onClick={() => setTopLimit(999)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                topLimit === 999 ? 'bg-[var(--color-primary)] text-[var(--color-bg-app)] font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              همه
            </button>
          </div>
        </div>

        {/* ۴ کارت سریع شاخص‌ها */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 max-w-2xl">
          <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[10px] text-[var(--color-text-muted)]">کل توقفات:</span>
            <span className="font-mono font-bold text-[var(--color-danger)]">{toPersianDigits(totalDowntimeHours.toFixed(1))}h</span>
          </div>
          <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[10px] text-[var(--color-text-muted)]">MTBF پایداری:</span>
            <span className="font-mono font-bold text-[var(--color-info)]">{toPersianDigits(reliabilityMetrics.mtbf)}h</span>
          </div>
          <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[10px] text-[var(--color-text-muted)]">MTTR تعمیر:</span>
            <span className="font-mono font-bold text-[var(--color-warning)]">{toPersianDigits(reliabilityMetrics.mttr)}h</span>
          </div>
          <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex justify-between items-center text-xs">
            <span className="text-[10px] text-[var(--color-text-muted)]">هدررفت گاز:</span>
            <span className="font-mono font-bold text-[var(--color-primary)]">{toPersianDigits(formatPersianNumber(reliabilityMetrics.estimatedGasLossM3))}m³</span>
          </div>
        </div>
      </div>

      {/* ۳. بوم پارتوی ۸۰/۲۰ با زوم، اسکرول و برچسب‌های خوانا */}
      {activeTab === 'pareto' && (
        <div className="bg-[var(--color-bg-card-subtle)] p-4 rounded-xl border border-[var(--color-border)] mb-3 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border-subtle)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              نمودار تلفیقی پارتو با قابلیت زوم و تولتیپ شناور (روی هر ستون یا درصد بروید تا جزئیات کامل باز شود)
            </span>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-3 h-2 bg-amber-500 rounded-sm inline-block" /> ساعات توقف
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> درصد تجمعی (Cum %)
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed" /> مرز ۸۰٪ پارتو
              </span>
            </div>
          </div>

          <div className="w-full h-84 overflow-x-auto overflow-y-hidden">
            <svg
              className="h-full"
              style={{ width: `${svgTotalWidth}px`, minHeight: '300px' }}
              viewBox={`0 0 ${svgTotalWidth} 300`}
            >
              {/* خط کف نمودار */}
              <line x1="60" y1="220" x2={svgTotalWidth - 40} y2="220" stroke="#374151" strokeWidth="1.5" />

              {/* خط‌چین افقی مرز ۸۰٪ پارتو با برچسب مشخص و بدون تداخل */}
              {(() => {
                const y80 = 220 - (80 / 100) * 160;
                return (
                  <g>
                    <line
                      x1="60"
                      y1={y80}
                      x2={svgTotalWidth - 40}
                      y2={y80}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <rect x="70" y={y80 - 20} width="165" height="18" fill="#2d1218" rx="4" stroke="#881337" />
                    <text x="75" y={y80 - 7} fill="#fca5a5" fontSize="10" fontWeight="bold">
                      مرز ۸۰٪ پارتو (علل بحرانی خط)
                    </text>
                  </g>
                );
              })()}

              {/* ترسیم ستون‌ها و منحنی تجمعی */}
              {(() => {
                const step = barStepWidth;
                const usableH = 160;
                const baseY = 220;

                const cumPoints = topVitalCauses
                  .map((c, i) => {
                    const x = 110 + i * step;
                    const y = baseY - (c.cumPct / 100) * usableH;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <>
                    {topVitalCauses.map((c, idx) => {
                      const x = 110 + idx * step;
                      const barH = (c.hours / maxCauseHours) * usableH;
                      const isVital = c.cumPct <= 80 || idx === 0;
                      const barWidth = Math.max(24, Math.min(60, step * 0.55));

                      return (
                        <g
                          key={c.cause}
                          onMouseEnter={(e) => setHoveredPoint({ data: c, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="cursor-pointer group"
                        >
                          {/* خط عمودی راهنما هنگام هاور */}
                          <line x1={x} y1="30" x2={x} y2={baseY} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition" />

                          {/* ستون توقف */}
                          <rect
                            x={x - barWidth / 2}
                            y={baseY - barH}
                            width={barWidth}
                            height={Math.max(4, barH)}
                            fill={isVital ? '#f59e0b' : '#6b7280'}
                            opacity={0.85}
                            rx="4"
                            className="group-hover:opacity-100 group-hover:fill-amber-400 transition"
                          />

                          {/* عدد ساعت توقف بالای ستون */}
                          <text
                            x={x}
                            y={baseY - barH - 6}
                            textAnchor="middle"
                            fill="#f3f4f6"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {toPersianDigits(c.hours.toFixed(0))}h
                          </text>

                          {/* عنوان علت در محور افقی با فونت خوانا */}
                          <text
                            x={x}
                            y="238"
                            textAnchor="end"
                            fill={isVital ? '#fbbf24' : '#9ca3af'}
                            fontSize="9"
                            fontFamily="sans-serif"
                            transform={`rotate(-40, ${x}, 238)`}
                            className="group-hover:fill-white font-medium"
                          >
                            {c.cause.length > 22 ? `${c.cause.slice(0, 22)}...` : c.cause}
                          </text>
                        </g>
                      );
                    })}

                    {/* خط پولی‌لاین درصد تجمعی */}
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={cumPoints}
                    />

                    {/* نقاط روی منحنی تجمعی */}
                    {topVitalCauses.map((c, idx) => {
                      const x = 110 + idx * step;
                      const y = baseY - (c.cumPct / 100) * usableH;

                      return (
                        <g
                          key={`pt-${c.cause}`}
                          onMouseEnter={(e) => setHoveredPoint({ data: c, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="cursor-pointer group"
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r="4.5"
                            fill="#06b6d4"
                            stroke="#0b0f17"
                            strokeWidth="2"
                            className="group-hover:r-7 transition"
                          />
                          <text
                            x={x}
                            y={y - 8}
                            textAnchor="middle"
                            fill="#67e8f9"
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {toPersianDigits(Math.round(c.cumPct))}٪
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
      )}

      {/* تب ۲: سهم و روند ۴ رسته */}
      {activeTab === 'timeline' && (
        <div className="bg-[var(--color-bg-card-subtle)] p-4 rounded-xl border border-[var(--color-border)] mb-3 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              توزیع سهم زمانی و روند ماه به ماه ۴ رسته ماهیت توقفات در بازه انتخابی
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              مجموع کل توقفات: {toPersianDigits(totalDowntimeHours.toFixed(1))} ساعت
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {categoryStats.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div key={cat.category} className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold" style={{ color: cat.color }}>
                      <IconComp className="w-4 h-4" />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[var(--color-text-primary)]">
                      {toPersianDigits(cat.hours.toFixed(1))} ساعت ({toPersianDigits(cat.pct)}٪)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, cat.pct)}%`, backgroundColor: cat.color }}
                    />
                  </div>

                  <div className="text-[10px] text-[var(--color-text-muted)] mt-2 flex justify-between">
                    <span>اولویت اقدام: {cat.pct > 30 ? 'بسیار بالا' : cat.pct > 15 ? 'متوسط' : 'عادی'}</span>
                    <span className="font-mono">سهم از کل: {toPersianDigits(cat.pct)}٪</span>
                  </div>
                </div>
              );
            })}
          </div>

          {monthlyTrendData.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col">
              <span className="text-xs font-bold text-[var(--color-text-primary)] mb-2">روند مقایسه‌ای ماهانه توقفات به تفکیک ۴ رسته:</span>
              <div className="w-full h-44 overflow-x-auto overflow-y-hidden">
                <svg
                  className="h-full"
                  style={{ width: `${Math.max(600, monthlyTrendData.length * 60)}px` }}
                  viewBox={`0 0 ${Math.max(600, monthlyTrendData.length * 60)} 150`}
                >
                  <line x1="30" y1="125" x2={Math.max(580, monthlyTrendData.length * 60)} y2="125" stroke="var(--color-border)" strokeWidth="1" />

                  {(() => {
                    const maxM = Math.max(50, ...monthlyTrendData.map((m) => m.total));
                    const usableH = 95;
                    const step = 60;

                    return monthlyTrendData.map((m, idx) => {
                      const x = 50 + idx * step;
                      const mechH = (m.mechanical / maxM) * usableH;
                      const elecH = (m.electrical / maxM) * usableH;
                      const procH = (m.process / maxM) * usableH;
                      const forcH = (m.forced / maxM) * usableH;

                      let currentY = 125;

                      return (
                        <g key={m.period} className="cursor-pointer group">
                          {mechH > 0 && <rect x={x - 14} y={currentY - mechH} width="28" height={mechH} fill="#f59e0b" rx="1" />}
                          {elecH > 0 && <rect x={x - 14} y={(currentY -= mechH) - elecH} width="28" height={elecH} fill="#06b6d4" rx="1" />}
                          {procH > 0 && <rect x={x - 14} y={(currentY -= elecH) - procH} width="28" height={procH} fill="#a855f7" rx="1" />}
                          {forcH > 0 && <rect x={x - 14} y={(currentY -= procH) - forcH} width="28" height={forcH} fill="#f43f5e" rx="1" />}
                          <text x={x} y="140" textAnchor="middle" fill="var(--color-text-muted)" fontSize="9" fontFamily="monospace">
                            {toPersianDigits(m.period)}
                          </text>
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* تب ۳: جدول RCA */}
      {activeTab === 'reliability' && (
        <div className="bg-[var(--color-bg-card-subtle)] p-4 rounded-xl border border-[var(--color-border)] mb-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--color-primary)]" />
              ممیزی علل ریشه‌ای توقفات و شاخص‌های قابلیت اطمینان (RCA Matrix)
            </span>
            <span className="text-[11px] text-[var(--color-primary)] font-mono">
              نرخ پایداری خط: {toPersianDigits(reliabilityMetrics.availabilityRate)}٪
            </span>
          </div>

          <div className="enms-table-container max-h-64 overflow-y-auto">
            <table className="enms-table">
              <thead className="sticky top-0 font-medium">
                <tr>
                  <th>رتبه</th>
                  <th>عنوان و علت توقف</th>
                  <th>دپارتمان</th>
                  <th>ماهیت</th>
                  <th className="font-mono">مدت (h)</th>
                  <th className="font-mono">سهم (٪)</th>
                  <th className="font-mono">تجمعی (٪)</th>
                  <th>وضعیت پارتو</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px]">
                {enrichedCauses.map((c, idx) => {
                  const isVital = c.cumPct <= 80 || idx === 0;
                  return (
                    <tr key={c.cause}>
                      <td className="text-[var(--color-text-muted)]">{toPersianDigits(idx + 1)}</td>
                      <td className="font-sans font-bold text-[var(--color-text-primary)]">{c.cause}</td>
                      <td className="font-sans text-[var(--color-text-muted)]">{c.dept}</td>
                      <td className="font-sans">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            c.category === 'mechanical'
                              ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border border-[var(--color-warning)]/40'
                              : c.category === 'electrical'
                              ? 'bg-[var(--color-info-bg)] text-[var(--color-info)] border border-[var(--color-info)]/40'
                              : c.category === 'process'
                              ? 'bg-[var(--color-purple-bg)] text-[var(--color-purple)] border border-[var(--color-purple)]/40'
                              : 'bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)]/40'
                          }`}
                        >
                          {c.category === 'mechanical'
                            ? 'مکانیکی'
                            : c.category === 'electrical'
                            ? 'برقی'
                            : c.category === 'process'
                            ? 'فرآیندی'
                            : 'اضطراری'}
                        </span>
                      </td>
                      <td className="text-[var(--color-warning)] font-bold">{toPersianDigits(c.hours.toFixed(1))}</td>
                      <td className="text-[var(--color-text-secondary)]">{toPersianDigits(c.pct.toFixed(1))}٪</td>
                      <td className="text-[var(--color-info)]">{toPersianDigits(Math.round(c.cumPct))}٪</td>
                      <td className="font-sans">
                        {isVital ? (
                          <span className="text-[var(--color-danger)] font-bold text-[10px]">بحرانی (۸۰٪ اول)</span>
                        ) : (
                          <span className="text-[var(--color-text-muted)] text-[10px]">فرعی</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ۴. نوار نتیجه‌گیری ممیزی در پایین */}
      <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
          <span>
            بر اساس تحلیل پارتوی بازه انتخابی، مهار{' '}
            <strong className="text-[var(--color-danger)] font-bold">
              {toPersianDigits(enrichedCauses.filter((c) => c.cumPct <= 80).length || 2)} علت اول
            </strong>
            ، معادل <strong className="text-[var(--color-primary)] font-bold">۸۰٪ از کل توقفات</strong> را برطرف خواهد کرد.
          </span>
        </span>
        <span className="font-bold font-mono text-[var(--color-info)] text-xs">
          دپارتمان: {selectedDept === 'all' ? 'کل خطوط کارخانه' : selectedDept}
        </span>
      </div>

      {/* ۵. نشانگر شناور Tooltip تعاملی با حرکت موس */}
      {hoveredPoint && (
        <div
          className="fixed z-50 pointer-events-none p-3.5 rounded-xl bg-[var(--color-bg-surface-elevated)] border border-[var(--color-border-strong)] shadow-2xl text-xs text-[var(--color-text-primary)] transform -translate-x-1/2 -translate-y-full mb-3 min-w-[260px]"
          style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y - 12}px` }}
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[var(--color-border-subtle)] gap-2">
            <span className="font-bold text-[var(--color-warning)] text-xs">
              {hoveredPoint.data.cause}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                hoveredPoint.data.cumPct <= 80 ? 'bg-[var(--color-danger-bg)] text-[var(--color-danger)]' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'
              }`}
            >
              {hoveredPoint.data.cumPct <= 80 ? 'علت بحرانی (۸۰٪)' : 'علت فرعی'}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">دپارتمان مسئول:</span>
              <span className="text-[var(--color-text-primary)] font-sans font-bold">{hoveredPoint.data.dept}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">ماهیت خرابی:</span>
              <span className="text-[var(--color-info)] font-sans">
                {hoveredPoint.data.category === 'mechanical'
                  ? 'مکانیکی'
                  : hoveredPoint.data.category === 'electrical'
                  ? 'برق و ابزاردقیق'
                  : hoveredPoint.data.category === 'process'
                  ? 'فرآیندی'
                  : 'اضطراری'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">مدت زمان توقف:</span>
              <span className="text-[var(--color-danger)] font-bold">{toPersianDigits(hoveredPoint.data.hours.toFixed(1))} ساعت</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">سهم از کل توقفات:</span>
              <span className="text-[var(--color-warning)] font-bold">{toPersianDigits(hoveredPoint.data.pct.toFixed(1))}٪</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">درصد تجمعی پارتو:</span>
              <span className="text-[var(--color-info)] font-bold">{toPersianDigits(Math.round(hoveredPoint.data.cumPct))}٪</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[var(--color-border-subtle)]">
              <span className="text-[var(--color-text-muted)] font-sans">تعداد دفعات رخداد:</span>
              <span className="text-[var(--color-text-secondary)]">{toPersianDigits(hoveredPoint.data.count)} مرتبه</span>
            </div>
          </div>
        </div>
      )}

      {/* ۶. پاپ‌آپ تقویم انتخاب بازه دلخواه */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[var(--color-warning)]" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">انتخاب بازه زمانی ارزیابی پارتو</h4>
              </div>
              <button onClick={() => setIsCalendarOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--color-text-primary)] block mb-1 font-bold">از دوره مبدأ:</label>
                <div className="max-h-52 overflow-y-auto space-y-1 bg-[var(--color-bg-card-subtle)] p-2 rounded-xl border border-[var(--color-border)]">
                  {availableMonthKeys.map((m) => (
                    <button
                      key={`start-${m}`}
                      onClick={() => setPickerStart(m)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs font-mono transition flex justify-between cursor-pointer ${
                        pickerStart === m ? 'bg-[var(--color-primary)] text-[var(--color-bg-app)] font-bold' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      <span>دوره {toPersianDigits(m)}</span>
                      {pickerStart === m && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-primary)] block mb-1 font-bold">تا دوره مقصد:</label>
                <div className="max-h-52 overflow-y-auto space-y-1 bg-[var(--color-bg-card-subtle)] p-2 rounded-xl border border-[var(--color-border)]">
                  {availableMonthKeys.map((m) => (
                    <button
                      key={`end-${m}`}
                      onClick={() => setPickerEnd(m)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-xs font-mono transition flex justify-between cursor-pointer ${
                        pickerEnd === m ? 'bg-[var(--color-primary)] text-[var(--color-bg-app)] font-bold' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                    >
                      <span>دوره {toPersianDigits(m)}</span>
                      {pickerEnd === m && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-subtle)]">
              <span className="text-xs text-[var(--color-warning)] font-mono">
                بازه: {toPersianDigits(pickerStart)} تا {toPersianDigits(pickerEnd)}
              </span>
              <button
                onClick={handleApplyCalendar}
                className="enms-button enms-button-primary text-xs"
              >
                <Check className="w-4 h-4" />
                <span>اعمال بازه بر پارتو</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsParetoAnalysis;