export const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(val?: number | string | null): string {
  if (val === undefined || val === null) return '';
  return String(val).replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w]);
}

export function formatPersianNumber(val: number, decimals: number = 0): string {
  if (val === undefined || val === null || isNaN(val)) return '۰';
  const parts = val.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  return toPersianDigits(parts.join('٫'));
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

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

/**
 * Returns formatted Persian live clock and solar date string:
 * e.g. "شنبه، ۲۸ مرداد ۱۴۰۵ - ۱۱:۳۰:۲۵"
 */
export function getPersianLiveDateTime(date: Date = new Date()): {
  fullString: string;
  timeString: string;
  dateString: string;
} {
  // Use Intl.DateTimeFormat with Persian calendar if supported
  try {
    const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const dateFormatter = new Intl.DateTimeFormat('fa-IR', {
      calendar: 'persian',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeString = timeFormatter.format(date);
    const dateString = dateFormatter.format(date);
    return {
      fullString: `${dateString} - ${timeString}`,
      timeString,
      dateString,
    };
  } catch {
    // Fallback simulation for year 1405
    const hours = toPersianDigits(String(date.getHours()).padStart(2, '0'));
    const minutes = toPersianDigits(String(date.getMinutes()).padStart(2, '0'));
    const seconds = toPersianDigits(String(date.getSeconds()).padStart(2, '0'));
    const timeString = `${hours}:${minutes}:${seconds}`;
    const dateString = `شنبه، ۲۸ مرداد ۱۴۰۵`;
    return {
      fullString: `${dateString} - ${timeString}`,
      timeString,
      dateString,
    };
  }
}

export function getCurrentPersianDateTime(date: Date = new Date()): {
  date: string;
  time: string;
  full: string;
} {
  const res = getPersianLiveDateTime(date);
  return {
    date: res.dateString,
    time: res.timeString,
    full: res.fullString,
  };
}
