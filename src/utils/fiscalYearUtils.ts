import { toPersianDigits, PERSIAN_MONTH_NAMES } from './persianUtils';

/**
 * تایپ‌ها و اینترفیس‌های مدیریت سال مالی و دوره‌های زمانی سیمان کیاسر
 * دوره مالی رسمی: ۱ دی‌ماه تا ۳۰ آذرماه سال بعد
 * انطباق با بند ۶.۳ استاندارد ISO 50001:2018
 */

export type FiscalQuarter = 1 | 2 | 3 | 4;
export type FiscalHalfYear = 1 | 2;

export interface FiscalYearInfo {
  year: number; // e.g. 1405
  title: string; // e.g. "سال مالی ۱۴۰۴-۱۴۰۵"
  persianTitle: string;
  startDate: string; // e.g. "1404/10/01"
  endDate: string; // e.g. "1405/09/30"
  isLeap: boolean;
}

export interface FiscalQuarterInfo {
  quarter: FiscalQuarter;
  code: string; // "Q1", "Q2", "Q3", "Q4"
  title: string;
  persianTitle: string;
  seasonName: string;
  seasonConstraint: string;
  startCalendarMonth: number; // 1-based (دی: 10, فروردین: 1, ...)
  endCalendarMonth: number;
  months: string[];
}

export interface FiscalMonthInfo {
  fiscalMonthIndex: number; // 1 (دی) تا 12 (آذر)
  calendarMonthIndex: number; // 1 (فروردین) تا 12 (اسفند)
  monthName: string;
  calendarYear: number;
  daysCount: number;
  quarter: FiscalQuarter;
  halfYear: FiscalHalfYear;
  code: string;
}

export interface FiscalPeriodFilter {
  year: number;
  quarter?: FiscalQuarter;
  calendarMonth?: number;
}

export const DEFAULT_FISCAL_YEAR = 1405;
export const SUPPORTED_FISCAL_YEARS: number[] = [1402, 1403, 1404, 1405, 1406, 1407];

export const FISCAL_QUARTERS = [
  { id: 'Q1', quarter: 1, title: 'فصل ۱ (زمستان - ناترازی گاز)', season: 'زمستان', code: 'Q1' },
  { id: 'Q2', quarter: 2, title: 'فصل ۲ (بهار - شرایط پایدار)', season: 'بهار', code: 'Q2' },
  { id: 'Q3', quarter: 3, title: 'فصل ۳ (تابستان - پیک‌سایی برق)', season: 'تابستان', code: 'Q3' },
  { id: 'Q4', quarter: 4, title: 'فصل ۴ (پاییز - انباشت کلینکر)', season: 'پاییز', code: 'Q4' },
] as const;

/**
 * ترتیب ۱۲ ماه سال مالی کیاسر با شروع از دی‌ماه
 */
export const FISCAL_MONTH_NAMES = [
  'دی',
  'بهمن',
  'اسفند',
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
] as const;

/**
 * الگوریتم تقویم خورشیدی حسابی (دوره ۳۳ ساله خیامی)
 */
export function isLeapPersianYear(calendarYear: number): boolean {
  const mod = (((calendarYear - 474) % 2820) + 2820) % 2820;
  return ((mod + 38) * 682) % 2816 < 682;
}

/**
 * تعداد روزهای ماه تقویمی خورشیدی
 */
export function getDaysInCalendarMonth(calendarYear: number, calendarMonth: number): number {
  if (calendarMonth < 1 || calendarMonth > 12) {
    throw new Error(`شماره ماه نامعتبر است: ${calendarMonth}`);
  }
  if (calendarMonth <= 6) return 31;
  if (calendarMonth <= 11) return 30;
  return isLeapPersianYear(calendarYear) ? 30 : 29;
}

/**
 * دریافت مشخصات سال مالی کیاسر (۱ دی سال قبل لغایت ۳۰ آذر سال جاری)
 */
export function getFiscalYearInfo(fiscalYear: number = DEFAULT_FISCAL_YEAR): FiscalYearInfo {
  const startYear = fiscalYear - 1;
  const endYear = fiscalYear;
  const startYearP = toPersianDigits(startYear);
  const endYearP = toPersianDigits(endYear);

  return {
    year: fiscalYear,
    title: `سال مالی ${startYear}-${endYear}`,
    persianTitle: `سال مالی ${startYearP}-${endYearP} (۱ دی تا ۳۰ آذر)`,
    startDate: `${startYear}/10/01`,
    endDate: `${endYear}/09/30`,
    isLeap: isLeapPersianYear(startYear), // سال کبیسه برای اسفند ماه واقع در Q1
  };
}

/**
 * تشخیص سه‌ماهه مالی (Quarter) بر اساس ماه تقویمی (۱ تا ۱۲)
 */
export function getQuarterForCalendarMonth(calendarMonth: number): FiscalQuarter {
  if (calendarMonth === 10 || calendarMonth === 11 || calendarMonth === 12) return 1; // دی، بهمن، اسفند
  if (calendarMonth === 1 || calendarMonth === 2 || calendarMonth === 3) return 2; // فروردین، اردیبهشت، خرداد
  if (calendarMonth === 4 || calendarMonth === 5 || calendarMonth === 6) return 3; // تیر، مرداد، شهریور
  return 4; // مهر، آبان، آذر
}

/**
 * دریافت اطلاعات تفصیلی فصول ۴گانه مالی کیاسر
 */
export function getFiscalQuarterInfo(quarter: FiscalQuarter, fiscalYear: number = DEFAULT_FISCAL_YEAR): FiscalQuarterInfo {
  const quarterDetails: Record<
    FiscalQuarter,
    {
      season: string;
      constraint: string;
      startMonth: number;
      endMonth: number;
      months: string[];
    }
  > = {
    1: {
      season: 'زمستان',
      constraint: 'ناترازی گاز و مصرف سوخت جایگزین (مازوت)',
      startMonth: 10,
      endMonth: 12,
      months: ['دی', 'بهمن', 'اسفند'],
    },
    2: {
      season: 'بهار',
      constraint: 'تولید پایدار و بهره‌برداری حداکثری کوره',
      startMonth: 1,
      endMonth: 3,
      months: ['فروردین', 'اردیبهشت', 'خرداد'],
    },
    3: {
      season: 'تابستان',
      constraint: 'پیک‌سایی برق توانیر و مدیریت دیماند',
      startMonth: 4,
      endMonth: 6,
      months: ['تیر', 'مرداد', 'شهریور'],
    },
    4: {
      season: 'پاییز',
      constraint: 'تولید حداکثری و انباشت کلینکر در سیلوها',
      startMonth: 7,
      endMonth: 9,
      months: ['مهر', 'آبان', 'آذر'],
    },
  };

  const current = quarterDetails[quarter];
  const qP = toPersianDigits(quarter);
  const yP = toPersianDigits(fiscalYear);

  return {
    quarter,
    code: `Q${quarter}`,
    title: `سه‌ماهه ${quarter} مالی (${current.season}) ${fiscalYear}`,
    persianTitle: `سه‌ماهه ${qP} مالی (${current.season})`,
    seasonName: current.season,
    seasonConstraint: current.constraint,
    startCalendarMonth: current.startMonth,
    endCalendarMonth: current.endMonth,
    months: current.months,
  };
}

/**
 * فهرست تمام ۴ سه‌ماهه سال مالی کیاسر
 */
export function getAllFiscalQuarters(fiscalYear: number = DEFAULT_FISCAL_YEAR): FiscalQuarterInfo[] {
  return ([1, 2, 3, 4] as FiscalQuarter[]).map((q) => getFiscalQuarterInfo(q, fiscalYear));
}

/**
 * دریافت ۱۲ ماه سال مالی کیاسر با رعایت ترتیب از دی تا آذر
 */
export function getFiscalMonths(fiscalYear: number = DEFAULT_FISCAL_YEAR): FiscalMonthInfo[] {
  const mapping = [
    { fIdx: 1, cIdx: 10, isPrevYear: true },  // دی
    { fIdx: 2, cIdx: 11, isPrevYear: true },  // بهمن
    { fIdx: 3, cIdx: 12, isPrevYear: true },  // اسفند
    { fIdx: 4, cIdx: 1, isPrevYear: false },  // فروردین
    { fIdx: 5, cIdx: 2, isPrevYear: false },  // اردیبهشت
    { fIdx: 6, cIdx: 3, isPrevYear: false },  // خرداد
    { fIdx: 7, cIdx: 4, isPrevYear: false },  // تیر
    { fIdx: 8, cIdx: 5, isPrevYear: false },  // مرداد
    { fIdx: 9, cIdx: 6, isPrevYear: false },  // شهریور
    { fIdx: 10, cIdx: 7, isPrevYear: false }, // مهر
    { fIdx: 11, cIdx: 8, isPrevYear: false }, // آبان
    { fIdx: 12, cIdx: 9, isPrevYear: false }, // آذر
  ];

  return mapping.map((m) => {
    const calendarYear = m.isPrevYear ? fiscalYear - 1 : fiscalYear;
    const monthName = PERSIAN_MONTH_NAMES[m.cIdx - 1];
    return {
      fiscalMonthIndex: m.fIdx,
      calendarMonthIndex: m.cIdx,
      monthName,
      calendarYear,
      daysCount: getDaysInCalendarMonth(calendarYear, m.cIdx),
      quarter: getQuarterForCalendarMonth(m.cIdx),
      halfYear: m.fIdx <= 6 ? 1 : 2,
      code: `M${m.fIdx < 10 ? '0' : ''}${m.fIdx}`,
    };
  });
}

/**
 * ساخت رشته استاندارد تاریخ شمسی YYYY/MM/DD با ارقام انگلیسی
 */
export function formatPersianDateString(year: number, month: number, day: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}/${m}/${d}`;
}

/**
 * تجزیه تاریخ شمسی "YYYY/MM/DD"
 */
export function parsePersianDateString(dateStr?: string | null): {
  year: number;
  month: number;
  day: number;
} | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const normalized = dateStr.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const parts = normalized.split(/[/\\-]/).map((p) => parseInt(p.trim(), 10));

  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return {
      year: parts[0],
      month: parts[1],
      day: parts[2],
    };
  }
  return null;
}

/**
 * بررسی انطباق دقیق یک رکورد تاریخی با سال مالی کیاسر
 * دی تا اسفند سال Y-1 یا فروردین تا آذر سال Y
 */
export function isDateInFiscalYear(dateStr: string, fiscalYear: number): boolean {
  const parsed = parsePersianDateString(dateStr);
  if (!parsed) return false;

  const { year, month } = parsed;
  if (month >= 10 && month <= 12) {
    return year === fiscalYear - 1;
  }
  return year === fiscalYear;
}

/**
 * بازه تاریخ شروع و پایان سال مالی کیاسر
 */
export function getFiscalYearDateRange(fiscalYear: number = DEFAULT_FISCAL_YEAR): {
  startDate: string;
  endDate: string;
} {
  const info = getFiscalYearInfo(fiscalYear);
  return {
    startDate: info.startDate,
    endDate: info.endDate,
  };
}

/**
 * تعیین سال مالی جاری بر مبنای تاریخ سیستمی امروز
 */
export function getCurrentFiscalYear(): number {
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
    });
    const parts = formatter.formatToParts(new Date());
    const yStr = parts.find((p) => p.type === 'year')?.value;
    const mStr = parts.find((p) => p.type === 'month')?.value;

    if (yStr && mStr) {
      const y = parseInt(yStr.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10);
      const m = parseInt(mStr.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 10);

      // اگر در دی، بهمن یا اسفند باشیم، سال مالی متعلق به سال بعد است
      return m >= 10 ? y + 1 : y;
    }
  } catch {}
  return DEFAULT_FISCAL_YEAR;
}