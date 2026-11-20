import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  GitFork,
  TableProperties,
  FileSpreadsheet,
  FileDown,
  Upload,
  Printer,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CalendarRange,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../../../../utils/persianUtils';

export type TimeHorizonType =
  | 'fiscal_year'
  | 'current_month'
  | 'design_capacity'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'h1'
  | 'h2'
  | 'custom_range';

export interface CustomDateRange {
  startDate: string; // YYYY/MM/DD
  endDate: string;   // YYYY/MM/DD
  daysCount: number;
}

export interface HorizonControlBarProps {
  timeHorizon: TimeHorizonType;
  onTimeHorizonChange: (horizon: TimeHorizonType, customRange?: CustomDateRange) => void;
  viewMode: 'flow' | 'table';
  onViewModeChange: (mode: 'flow' | 'table') => void;
  fiscalPeriodTitle: string;
  flowData?: any;
  onImportData?: (importedData: any) => void;
  activeCustomRange?: CustomDateRange;
}

const MONTH_NAMES_PERSIAN = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export const HorizonControlBar: React.FC<HorizonControlBarProps> = ({
  timeHorizon,
  onTimeHorizonChange,
  viewMode,
  onViewModeChange,
  fiscalPeriodTitle,
  flowData,
  onImportData,
  activeCustomRange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // استیت تقویم پاپ‌آپ
  const [currentYear, setCurrentYear] = useState(1405);
  const [currentMonth, setCurrentMonth] = useState(6); // مهر (اندیس 6)

  // تاریخ‌های انتخابی برای بازه
  const [rangeStart, setRangeStart] = useState<{ year: number; month: number; day: number } | null>(
    activeCustomRange
      ? { year: 1405, month: 1, day: 1 }
      : { year: 1405, month: 1, day: 1 }
  );
  const [rangeEnd, setRangeEnd] = useState<{ year: number; month: number; day: number } | null>(
    activeCustomRange
      ? { year: 1405, month: 6, day: 31 }
      : { year: 1405, month: 6, day: 31 }
  );

  const presetLabels: Record<TimeHorizonType, string> = {
    fiscal_year: 'سال مالی ۱۴۰۴-۱۴۰۵ (YTD)',
    current_month: 'ماه جاری (شهریور)',
    design_capacity: 'ظرفیت اسمی طراحی (۲۰۰۰ tpd)',
    q1: 'فصل زمستان (Q1)',
    q2: 'فصل بهار (Q2)',
    q3: 'فصل تابستان (Q3)',
    q4: 'فصل پاییز (Q4)',
    h1: 'شش‌ماهه اول (نیم‌سال اول)',
    h2: 'شش‌‌ماهه دوم (نیم‌سال دوم)',
    custom_range: activeCustomRange
      ? `${activeCustomRange.startDate} تا ${activeCustomRange.endDate} (${toPersianDigits(activeCustomRange.daysCount)} روز)`
      : 'بازه تقویمی دلخواه...',
  };

  // تعداد روزهای ماه جاری شمسی
  const daysInCurrentMonth = useMemo(() => {
    if (currentMonth < 6) return 31;
    if (currentMonth < 11) return 30;
    return 29; // سال اسفند عادی
  }, [currentMonth]);

  // روز شروع ماه در هفته (شبیه‌سازی آفست تقویم برای هم‌ترازی شنبه تا جمعه)
  const startDayOffset = useMemo(() => {
    return (currentMonth * 2 + 1) % 7;
  }, [currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const isSameDate = (
    a: { year: number; month: number; day: number } | null,
    y: number,
    m: number,
    d: number
  ) => {
    if (!a) return false;
    return a.year === y && a.month === m && a.day === d;
  };

  const isBetweenRange = (y: number, m: number, d: number) => {
    if (!rangeStart || !rangeEnd) return false;
    const currentVal = y * 10000 + (m + 1) * 100 + d;
    const startVal = rangeStart.year * 10000 + (rangeStart.month + 1) * 100 + rangeStart.day;
    const endVal = rangeEnd.year * 10000 + (rangeEnd.month + 1) * 100 + rangeEnd.day;

    return currentVal > startVal && currentVal < endVal;
  };

  const handleDayClick = (dayNumber: number) => {
    const selected = { year: currentYear, month: currentMonth, day: dayNumber };

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(selected);
      setRangeEnd(null);
    } else {
      const startVal = rangeStart.year * 10000 + (rangeStart.month + 1) * 100 + rangeStart.day;
      const endVal = selected.year * 10000 + (selected.month + 1) * 100 + selected.day;

      if (endVal < startVal) {
        setRangeEnd(rangeStart);
        setRangeStart(selected);
      } else {
        setRangeEnd(selected);
      }
    }
  };

  // محاسبه تعداد روزهای بین دو تاریخ انتخابی
  const calculatedDaysCount = useMemo(() => {
    if (!rangeStart || !rangeEnd) return 0;
    const startVal = rangeStart.year * 365 + rangeStart.month * 30 + rangeStart.day;
    const endVal = rangeEnd.year * 365 + rangeEnd.month * 30 + rangeEnd.day;
    return Math.max(Math.abs(endVal - startVal) + 1, 1);
  }, [rangeStart, rangeEnd]);

  const handleApplyCalendarRange = () => {
    if (!rangeStart || !rangeEnd) return;

    const formattedStart = `${rangeStart.year}/${String(rangeStart.month + 1).padStart(2, '0')}/${String(rangeStart.day).padStart(2, '0')}`;
    const formattedEnd = `${rangeEnd.year}/${String(rangeEnd.month + 1).padStart(2, '0')}/${String(rangeEnd.day).padStart(2, '0')}`;

    onTimeHorizonChange('custom_range', {
      startDate: formattedStart,
      endDate: formattedEnd,
      daysCount: calculatedDaysCount,
    });

    setIsCalendarOpen(false);
  };

  const handleExportCSV = () => {
    if (!flowData?.departmentFlows) return;
    const headers = ['کد دپارتمان', 'نام دپارتمان', 'سهم انرژی (%)', 'انرژی معادل (GJ)', 'برق (MWh)', 'گاز (Nm3)'];
    const rows = flowData.departmentFlows.map((d: any) => [
      d.code,
      d.name,
      d.energySharePct,
      d.energyShareGj,
      d.electricityMwh,
      d.naturalGasNm3 || 0,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ترازنامه_انرژی_سیمان_کیاسر_${timeHorizon}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    if (!flowData) return;
    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `energy-flow-kiasar-${timeHorizon}.json`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (onImportData) onImportData(json);
      } catch {
        alert('فرمت فایل نامعتبر است.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="enms-card p-4 space-y-4" dir="rtl">
      {/* سطر اول: هدر و دکمه‌های گزارش‌گیری */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="enms-badge badge-success font-semibold">بند ۶.۳ استاندارد ISO 50001:2018</span>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">Energy Review & Carrier Breakdown</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
            جریان حامل‌ها و موازنه مصرف انرژی به تفکیک ساختار سازمانی سیمان کیاسر
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-text-muted)] font-mono">
            <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>دوره مالی کیاسر: </span>
            <strong className="text-[var(--color-text-secondary)]">{fiscalPeriodTitle}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />

          <button onClick={() => fileInputRef.current?.click()} className="enms-button enms-button-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>بارگذاری داده</span>
          </button>
          <button onClick={handleExportCSV} className="enms-button enms-button-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>خروجی اکسل</span>
          </button>
          <button onClick={handleExportJSON} className="enms-button enms-button-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" />
            <span>خروجی JSON</span>
          </button>
          <button onClick={() => window.print()} className="enms-button enms-button-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1">
            <Printer className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            <span>چاپ</span>
          </button>
        </div>
      </div>

      {/* سطر دوم: انتخابگرهای بازه زمانی با پاپ‌آپ تقویم دوگانه */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
        <div className="flex items-center gap-2 flex-wrap relative">
          <span className="text-xs font-bold text-[var(--color-text-muted)] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>افق زمانی ترازنامه:</span>
          </span>

          <div className="enms-tab-pills">
            <button
              onClick={() => onTimeHorizonChange('fiscal_year')}
              className={`enms-tab-pill text-xs !py-1 !px-2.5 ${timeHorizon === 'fiscal_year' ? 'active' : ''}`}
            >
              سال مالی (YTD)
            </button>
            <button
              onClick={() => onTimeHorizonChange('current_month')}
              className={`enms-tab-pill text-xs !py-1 !px-2.5 ${timeHorizon === 'current_month' ? 'active' : ''}`}
            >
              ماه جاری
            </button>
            <button
              onClick={() => onTimeHorizonChange('design_capacity')}
              className={`enms-tab-pill text-xs !py-1 !px-2.5 ${timeHorizon === 'design_capacity' ? 'active' : ''}`}
            >
              ظرفیت اسمی
            </button>
          </div>

          {/* دراپ‌داون پریست‌های فصلی */}
          <div className="relative">
            <button
              onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] flex items-center gap-1 transition-colors"
            >
              <span>{['q1', 'q2', 'q3', 'q4', 'h1', 'h2'].includes(timeHorizon) ? presetLabels[timeHorizon] : 'فصلی / دوره‌ای'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isPresetMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xl z-30 p-1.5 flex flex-col gap-1 text-xs animate-fadeIn">
                <span className="text-[10px] text-[var(--color-text-muted)] px-2 py-0.5 font-bold">دوره‌های فصلی:</span>
                {(['q1', 'q2', 'q3', 'q4'] as TimeHorizonType[]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      onTimeHorizonChange(q);
                      setIsPresetMenuOpen(false);
                    }}
                    className={`text-right px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors ${timeHorizon === q ? 'text-[var(--color-primary)] font-bold bg-[var(--color-primary-bg)]' : 'text-[var(--color-text-primary)]'}`}
                  >
                    {presetLabels[q]}
                  </button>
                ))}
                <div className="border-t border-[var(--color-border-subtle)] my-1" />
                <span className="text-[10px] text-[var(--color-text-muted)] px-2 py-0.5 font-bold">دوره‌های شش‌ماهه:</span>
                {(['h1', 'h2'] as TimeHorizonType[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => {
                      onTimeHorizonChange(h);
                      setIsPresetMenuOpen(false);
                    }}
                    className={`text-right px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors ${timeHorizon === h ? 'text-[var(--color-primary)] font-bold bg-[var(--color-primary-bg)]' : 'text-[var(--color-text-primary)]'}`}
                  >
                    {presetLabels[h]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* کلید باز کردن پاپ‌آپ تقویم تعاملی بازه‌ای */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                timeHorizon === 'custom_range'
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-bold shadow-xs'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>{timeHorizon === 'custom_range' ? presetLabels.custom_range : 'تقویم بازه دلخواه...'}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* پاپ‌آپ تقویم شمسی دوگانه بازه‌ای */}
            {isCalendarOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl z-50 p-4 animate-fadeIn select-none">
                {/* هدر ناوبری ماه و سال تقویم */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                    title="ماه بعد"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                    <span>{MONTH_NAMES_PERSIAN[currentMonth]}</span>
                    <span className="font-mono">{toPersianDigits(currentYear)}</span>
                  </div>

                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                    title="ماه قبل"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* روزهای هفته */}
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--color-text-muted)] my-2">
                  {WEEK_DAYS.map((w, idx) => (
                    <span key={idx} className={idx === 6 ? 'text-rose-500' : ''}>
                      {w}
                    </span>
                  ))}
                </div>

                {/* گرید روزهای ماه */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {/* روزهای خالی اول ماه */}
                  {Array.from({ length: startDayOffset }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-8" />
                  ))}

                  {/* روزهای ماه */}
                  {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const isFriday = (startDayOffset + idx) % 7 === 6;

                    const isStart = isSameDate(rangeStart, currentYear, currentMonth, dayNum);
                    const isEnd = isSameDate(rangeEnd, currentYear, currentMonth, dayNum);
                    const inRange = isBetweenRange(currentYear, currentMonth, dayNum);

                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleDayClick(dayNum)}
                        className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all relative ${
                          isStart || isEnd
                            ? 'bg-[var(--color-primary)] text-white font-bold shadow-xs scale-105 z-10'
                            : inRange
                            ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-semibold'
                            : isFriday
                            ? 'text-rose-500 hover:bg-rose-500/10 font-bold'
                            : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {toPersianDigits(dayNum)}
                      </button>
                    );
                  })}
                </div>

                {/* اطلاعات بازه انتخابی و کلیدهای اقدام */}
                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex flex-col gap-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--color-text-muted)]">طول بازه انتخابی:</span>
                    <strong className="font-mono text-[var(--color-primary)] font-bold">
                      {rangeStart && rangeEnd ? `${toPersianDigits(calculatedDaysCount)} روز کاری` : 'انتخاب تاریخ پایان...'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs"
                    >
                      بستن
                    </button>
                    <button
                      onClick={handleApplyCalendarRange}
                      disabled={!rangeStart || !rangeEnd}
                      className="enms-button enms-button-primary !py-1 !px-3 text-xs flex items-center gap-1 disabled:opacity-40"
                    >
                      <Check className="w-3 h-3" />
                      <span>اعمال بازه</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* سوئیچ شیوه نمایش */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--color-text-muted)]">شیوه نمایش:</span>
          <div className="enms-tab-pills">
            <button
              onClick={() => onViewModeChange('flow')}
              className={`enms-tab-pill text-xs !py-1 !px-2.5 flex items-center gap-1 ${viewMode === 'flow' ? 'active' : ''}`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>جریان درختی انرژی</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`enms-tab-pill text-xs !py-1 !px-2.5 flex items-center gap-1 ${viewMode === 'table' ? 'active' : ''}`}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>ماتریس جدولی حامل‌ها</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HorizonControlBar;