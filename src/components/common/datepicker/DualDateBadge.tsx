import React from 'react';
import { Calendar } from 'lucide-react';
import {
  parseJalaliString,
  jalaliToGregorian,
  gregorianToJalali,
  formatJalaliToString,
  toPersianDigits,
  pad2,
} from '../../../services/calendar';

export interface DualDateBadgeProps {
  /**
   * تاریخ به فرمت شمسی (مثلاً ۱۴۰۴/۰۸/۱۵ یا 1404/08/15) یا میلادی (مثلاً 2025-11-06)
   */
  date: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const DualDateBadge: React.FC<DualDateBadgeProps> = ({
  date,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  if (!date) return null;

  let jalaliStr = '';
  let gregorianStr = '';

  // تشخیص اینکه تاریخ ورودی شمسی است یا میلادی
  const parsedJalali = parseJalaliString(date);

  if (parsedJalali && parsedJalali.year >= 1300 && parsedJalali.year <= 1500) {
    // تاریخ ورودی شمسی است
    jalaliStr = formatJalaliToString(parsedJalali, true);
    const g = jalaliToGregorian(parsedJalali.year, parsedJalali.month, parsedJalali.day);
    gregorianStr = `${g.year}/${pad2(g.month)}/${pad2(g.day)}`;
  } else {
    // احتمالاً تاریخ میلادی است (مثلاً 2025-11-06)
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const gYear = d.getFullYear();
      const gMonth = d.getMonth() + 1;
      const gDay = d.getDate();
      gregorianStr = `${gYear}/${pad2(gMonth)}/${pad2(gDay)}`;
      const j = gregorianToJalali(gYear, gMonth, gDay);
      jalaliStr = formatJalaliToString(j, true);
    } else {
      jalaliStr = toPersianDigits(date);
    }
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5',
  };

  return (
    <div
      dir="rtl"
      className={`inline-flex items-center rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-mono shadow-2xs ${sizeClasses[size]} ${className}`}
      title={`تاریخ هماهنگ شمسی و میلادی`}
    >
      {showIcon && <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
      <span className="font-bold text-[var(--color-text-primary)]">{jalaliStr}</span>
      {gregorianStr && (
        <>
          <span className="text-[var(--color-text-muted)] text-[10px] select-none">|</span>
          <span className="text-[var(--color-text-muted)] text-[11px] font-normal">{gregorianStr}</span>
        </>
      )}
    </div>
  );
};

export default DualDateBadge;
