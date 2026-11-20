import React from 'react';
import { Calendar, Download, X } from 'lucide-react';
import { toPersianDigits } from '../../../../../../../utils/persianUtils';
import { DateRangeSelectorProps } from '../types';

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  quickFilter,
  onQuickFilterChange,
  startPeriod,
  endPeriod,
  onStartPeriodChange,
  onEndPeriodChange,
  availableMonthKeys,
  onExportExcel,
  onClose,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      {/* فیلترهای سریع دوره */}
      <div className="flex bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5 text-xs">
        <button
          onClick={() => onQuickFilterChange('current')}
          className={`px-3 py-1 rounded-md transition ${
            quickFilter === 'current' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          ماه جاری
        </button>
        <button
          onClick={() => onQuickFilterChange('last3m')}
          className={`px-3 py-1 rounded-md transition ${
            quickFilter === 'last3m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          ۳ ماه اخیر
        </button>
        <button
          onClick={() => onQuickFilterChange('last6m')}
          className={`px-3 py-1 rounded-md transition ${
            quickFilter === 'last6m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          ۶ ماه اخیر
        </button>
        <button
          onClick={() => onQuickFilterChange('all')}
          className={`px-3 py-1 rounded-md transition ${
            quickFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          کل سوابق (۲۵ ماه)
        </button>
      </div>

      {/* انتخابگر دقیق تقویمی سال و ماه */}
      <div className="flex items-center gap-1.5 bg-[var(--color-bg-card-subtle)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] text-xs">
        <Calendar className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[var(--color-text-muted)] text-[10px]">از:</span>
        <select
          value={startPeriod}
          onChange={(e) => onStartPeriodChange(e.target.value)}
          className="bg-transparent text-[var(--color-text-primary)] font-mono text-[11px] focus:outline-none cursor-pointer"
        >
          {availableMonthKeys.map((k: string) => (
            <option key={k} value={k} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
              {toPersianDigits(k)}
            </option>
          ))}
        </select>

        <span className="text-[var(--color-text-muted)] text-[10px] mr-1">تا:</span>
        <select
          value={endPeriod}
          onChange={(e) => onEndPeriodChange(e.target.value)}
          className="bg-transparent text-[var(--color-text-primary)] font-mono text-[11px] focus:outline-none cursor-pointer"
        >
          {availableMonthKeys.map((k: string) => (
            <option key={k} value={k} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
              {toPersianDigits(k)}
            </option>
          ))}
        </select>
      </div>

      {/* دکمه خروجی اکسل */}
      <button
        onClick={onExportExcel}
        className="p-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-emerald-400 border border-[var(--color-border)] transition"
        title="دانلود اکسل داده‌های این بازه"
      >
        <Download className="w-4 h-4" />
      </button>

      {/* دکمه بستن پاپ‌آپ */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default DateRangeSelector;
