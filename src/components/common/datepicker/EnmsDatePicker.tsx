import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  JalaliDate,
  DateRange,
  HolidayItem,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEK_DAYS_SHORT,
  getTodayJalali,
  getDaysInJalaliMonth,
  getDayOfWeekJalali,
  getHolidayInfo,
  formatJalaliToString,
  parseJalaliString,
  toPersianDigits,
  pad2,
  jalaliToGregorian,
} from '../../../services/calendar';

export interface EnmsDatePickerProps {
  mode?: 'single' | 'range';
  value?: string; // YYYY/MM/DD
  rangeValue?: DateRange;
  onChange?: (date: string) => void;
  onRangeChange?: (range: DateRange) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const EnmsDatePicker: React.FC<EnmsDatePickerProps> = ({
  mode = 'single',
  value,
  rangeValue,
  onChange,
  onRangeChange,
  label,
  placeholder = 'انتخاب تاریخ...',
  className = '',
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => getTodayJalali(), []);

  // سال و ماه جاری در نمای تقویم
  const initialDate = useMemo(() => {
    if (mode === 'single' && value) {
      const p = parseJalaliString(value);
      if (p) return p;
    }
    if (mode === 'range' && rangeValue?.startDate) {
      const p = parseJalaliString(rangeValue.startDate);
      if (p) return p;
    }
    return today;
  }, [value, rangeValue, mode, today]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);

  // حالت انتخاب بازه
  const [rangeStart, setRangeStart] = useState<string | null>(rangeValue?.startDate || null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(rangeValue?.endDate || null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // بستن با کلیک در خارج از کامپوننت
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // روزهای ماه جاری
  const daysInCurrentMonth = useMemo(() => {
    return getDaysInJalaliMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  // روز شروع ماه در هفته (۰ = شنبه، ۶ = جمعه)
  const firstDayOfWeek = useMemo(() => {
    return getDayOfWeekJalali(viewYear, viewMonth, 1);
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}/${pad2(viewMonth)}/${pad2(day)}`;

    if (mode === 'single') {
      if (onChange) onChange(formatted);
      setIsOpen(false);
    } else {
      // انتخاب بازه
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(formatted);
        setRangeEnd(null);
      } else {
        // انتخاب پایان بازه
        if (formatted < rangeStart) {
          setRangeStart(formatted);
          setRangeEnd(rangeStart);
          if (onRangeChange) onRangeChange({ startDate: formatted, endDate: rangeStart });
        } else {
          setRangeEnd(formatted);
          if (onRangeChange) onRangeChange({ startDate: rangeStart, endDate: formatted });
        }
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'single' && onChange) {
      onChange('');
    } else if (mode === 'range' && onRangeChange) {
      setRangeStart(null);
      setRangeEnd(null);
      onRangeChange({ startDate: '', endDate: '' });
    }
  };

  // تولید متن نمایش در اینپوت
  const displayValue = useMemo(() => {
    if (mode === 'single') {
      return value ? toPersianDigits(value) : '';
    } else {
      const s = rangeValue?.startDate || rangeStart;
      const e = rangeValue?.endDate || rangeEnd;
      if (s && e) {
        return `${toPersianDigits(s)} تا ${toPersianDigits(e)}`;
      }
      if (s) {
        return `از ${toPersianDigits(s)}...`;
      }
      return '';
    }
  }, [mode, value, rangeValue, rangeStart, rangeEnd]);

  // معادل میلادی تاریخ انتخاب شده
  const gregorianEquivalent = useMemo(() => {
    const targetStr = mode === 'single' ? value : rangeValue?.startDate || rangeStart;
    if (!targetStr) return null;
    const p = parseJalaliString(targetStr);
    if (!p) return null;
    const g = jalaliToGregorian(p.year, p.month, p.day);
    return `${g.year}/${pad2(g.month)}/${pad2(g.day)}`;
  }, [mode, value, rangeValue, rangeStart]);

  return (
    <div className={`relative flex flex-col gap-1 ${className}`} ref={containerRef} dir="rtl">
      {label && (
        <label className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-between">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}

      {/* اینپوت شیک برای باز کردن تقویم */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`enms-input flex items-center justify-between cursor-pointer transition-all select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-500/50'
        } ${isOpen ? 'border-purple-500 ring-2 ring-purple-500/10' : ''}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          {displayValue ? (
            <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">
              {displayValue}
            </span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">{placeholder}</span>
          )}
        </div>

        {displayValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-rose-500 transition-colors"
            title="پاک کردن تاریخ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* پاپ‌آپ تعاملی تقویم */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl w-72 sm:w-80 flex flex-col gap-3.5 animate-fadeIn">
          {/* هدر ماه و سال */}
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-app)] text-[var(--color-text-secondary)] transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 font-bold text-xs text-[var(--color-text-primary)]">
              <span>{PERSIAN_MONTH_NAMES[viewMonth - 1]}</span>
              <span className="font-mono text-purple-600 dark:text-purple-400">
                {toPersianDigits(viewYear)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-app)] text-[var(--color-text-secondary)] transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* سربرگ روزهای هفته */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[var(--color-text-muted)]">
            {PERSIAN_WEEK_DAYS_SHORT.map((dayName, idx) => (
              <div
                key={idx}
                className={`py-1 ${idx === 6 ? 'text-rose-500 dark:text-rose-400 font-extrabold' : ''}`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* شبکه روزهای ماه */}
          <div className="grid grid-cols-7 gap-1">
            {/* خانه‌های خالی پیش از اولین روز ماه */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* روزهای ماه */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}/${pad2(viewMonth)}/${pad2(day)}`;
              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isFriday = dayOfWeek === 6;
              const holidayInfo: HolidayItem | null = getHolidayInfo(viewYear, viewMonth, day);
              const isHoliday = Boolean(holidayInfo || isFriday);

              const isToday =
                today.year === viewYear && today.month === viewMonth && today.day === day;

              const isSingleSelected = mode === 'single' && value === dateStr;

              // وضعیت‌های بازه
              const isRangeStart = mode === 'range' && (rangeValue?.startDate === dateStr || rangeStart === dateStr);
              const isRangeEnd = mode === 'range' && (rangeValue?.endDate === dateStr || rangeEnd === dateStr);
              const effectiveEnd = rangeEnd || (hoverDate && rangeStart && hoverDate > rangeStart ? hoverDate : null);
              const isInRange =
                mode === 'range' &&
                rangeStart &&
                effectiveEnd &&
                dateStr > rangeStart &&
                dateStr < effectiveEnd;

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  onMouseEnter={() => mode === 'range' && rangeStart && !rangeEnd && setHoverDate(dateStr)}
                  title={holidayInfo?.title || (isFriday ? 'جمعه (تعطیل رسمی)' : undefined)}
                  className={`h-8 w-full rounded-lg text-xs font-mono font-medium flex flex-col items-center justify-center relative transition-all ${
                    isSingleSelected || isRangeStart || isRangeEnd
                      ? 'bg-purple-600 text-white font-bold shadow-xs scale-105 z-10'
                      : isInRange
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 rounded-none'
                      : isHoliday
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-subtle)]'
                  } ${isToday && !isSingleSelected ? 'border border-purple-500/50' : ''}`}
                >
                  <span>{toPersianDigits(day)}</span>

                  {/* نشانگر قرمز مناسبت تعطیل با نقطه قرمز */}
                  {holidayInfo && !isSingleSelected && !isRangeStart && !isRangeEnd && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute bottom-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* پاورقی تاریخ انتخابی و معادل میلادی */}
          <div className="pt-2.5 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
            <button
              type="button"
              onClick={() => {
                const todayStr = formatJalaliToString(today);
                if (mode === 'single' && onChange) onChange(todayStr);
                setViewYear(today.year);
                setViewMonth(today.month);
                if (mode === 'single') setIsOpen(false);
              }}
              className="text-purple-600 dark:text-purple-400 hover:underline font-bold font-sans"
            >
              برو به امروز
            </button>

            {gregorianEquivalent && (
              <span className="text-[10px] text-[var(--color-text-muted)]">
                میلادی: {gregorianEquivalent}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnmsDatePicker;
