import { JalaliDate, GregorianDate, DateRange, HolidayItem, CalendarPreset, CalendarFormatOptions } from './types';
import { gregorianToJalali, jalaliToGregorian, getDaysInJalaliMonth } from './jalaliEngine';
import { safeFetchPublicJson } from '../configService';

const HOLIDAYS_STORAGE_KEY = 'enms_calendar_holidays_v1';

function readCachedHolidays(): HolidayItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HOLIDAYS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as HolidayItem[];
    }
  } catch {
    // ignore invalid localStorage cache
  }
  return [];
}

let holidays: HolidayItem[] = readCachedHolidays();
let holidaysLoaded = false;

export async function loadHolidaysData(): Promise<HolidayItem[]> {
  if (holidaysLoaded && holidays.length > 0) return holidays;
  const loaded = await safeFetchPublicJson<HolidayItem[]>(
    '/data/calendar/holidaysData.json',
    holidays,
    { storageKey: HOLIDAYS_STORAGE_KEY }
  );
  if (Array.isArray(loaded)) {
    holidays = loaded;
    holidaysLoaded = true;
  }
  return holidays;
}

// پیش‌بارگذاری غیرمسدودکننده در مرورگر جهت دسترسی همگام getHolidayInfo
if (typeof window !== 'undefined') {
  void loadHolidaysData();
}

export const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const PERSIAN_WEEK_DAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_WEEK_DAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

/**
 * تبدیل ارقام انگلیسی به ارقام فارسی
 */
export function toPersianDigits(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

/**
 * پد کردن اعداد دو رقمی (مثلاً 5 به '05')
 */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * دریافت تاریخ امروز به فرمت شمسی
 */
export function getTodayJalali(): JalaliDate {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/**
 * فرمت تاریخ جلالی به رشته YYYY/MM/DD
 */
export function formatJalaliToString(j: JalaliDate, usePersianDigits: boolean = false): string {
  const formatted = `${j.year}/${pad2(j.month)}/${pad2(j.day)}`;
  return usePersianDigits ? toPersianDigits(formatted) : formatted;
}

/**
 * پارس کردن رشته YYYY/MM/DD شمسی به آبجکت JalaliDate
 */
export function parseJalaliString(str: string): JalaliDate | null {
  if (!str) return null;
  // تبدیل اعداد فارسی به انگلیسی قبل از پارس
  const normalized = str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parts = normalized.split(/[-/]/).map((p) => parseInt(p, 10));
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }
  return null;
}

/**
 * بررسی اینکه آیا تاریخ مشخصی تعطیل رسمی است یا خیر
 */
export function getHolidayInfo(year: number, month: number, day: number): HolidayItem | null {
  const monthDay = `${pad2(month)}/${pad2(day)}`;
  const fullDate = `${year}/${pad2(month)}/${pad2(day)}`;

  // اول بررسی تاریخ‌های سالانه و سپس تاریخ‌های ثابت سال جاری
  const matched = holidays.find((h) => h.date === fullDate || h.date === monthDay);
  return matched || null;
}

/**
 * محاسبه روز هفته در تقویم شمسی (۰ = شنبه، ۶ = جمعه)
 */
export function getDayOfWeekJalali(year: number, month: number, day: number): number {
  const g = jalaliToGregorian(year, month, day);
  const date = new Date(g.year, g.month - 1, g.day);
  // در جاوااسکریپت: 0 = یکشنبه، 6 = شنبه
  // در تقویم ایرانی: 0 = شنبه، 6 = جمعه
  const jsDay = date.getDay();
  return (jsDay + 1) % 7;
}

/**
 * تولید بازه زمانی پیش‌فرض بر اساس Preset
 */
export function getPresetDateRange(preset: CalendarPreset): DateRange {
  const today = getTodayJalali();
  const todayStr = formatJalaliToString(today);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };
    case 'thisMonth': {
      const days = getDaysInJalaliMonth(today.year, today.month);
      return {
        startDate: `${today.year}/${pad2(today.month)}/01`,
        endDate: `${today.year}/${pad2(today.month)}/${pad2(days)}`,
      };
    }
    case 'thisYear': {
      const daysInEsfand = getDaysInJalaliMonth(today.year, 12);
      return {
        startDate: `${today.year}/01/01`,
        endDate: `${today.year}/12/${pad2(daysInEsfand)}`,
      };
    }
    case 'thisQuarter': {
      const q = Math.ceil(today.month / 3);
      const startMonth = (q - 1) * 3 + 1;
      const endMonth = q * 3;
      const endDays = getDaysInJalaliMonth(today.year, endMonth);
      return {
        startDate: `${today.year}/${pad2(startMonth)}/01`,
        endDate: `${today.year}/${pad2(endMonth)}/${pad2(endDays)}`,
      };
    }
    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}
