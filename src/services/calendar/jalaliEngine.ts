import { JalaliDate, GregorianDate } from './types';

/**
 * اسامی رسمی ۱۲ ماه تقویم هجری شمسی
 */
export const JALALI_MONTH_NAMES = [
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
] as const;

export type JalaliMonthName = (typeof JALALI_MONTH_NAMES)[number];

/**
 * تشخیص سال کبیسه شمسی (الگوریتم ۳۳ ساله خیامی)
 */
export function isJalaliLeapYear(jYear: number): boolean {
  const mod = (jYear + 38) % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(mod);
}

/**
 * تعداد دقیق روزهای ماه در تقویم جلالی (پشتیبانی از ۶ ماه اول ۳۱ روز، ۵ ماه دوم ۳۰ روز و اسفند ۲۹ یا ۳۰ روز)
 * @param year سال شمسی (مثلاً ۱۴۰۴ یا ۱۴۰۵)
 * @param month شماره ماه (۱ تا ۱۲)
 */
export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`شماره ماه نامعتبر است: ${month}. باید بین ۱ تا ۱۲ باشد.`);
  }
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return isJalaliLeapYear(year) ? 30 : 29;
}

/**
 * دریافت نام فارسی ماه بر اساس اندیس ۱ تا ۱۲
 */
export function getJalaliMonthName(month: number): string {
  if (month < 1 || month > 12) return '';
  return JALALI_MONTH_NAMES[month - 1];
}

/**
 * استخراج هوشمند ماه و سال از روی نام فایل اکسل لاگ‌شیت کارخانه
 * مثال‌ها: "فروردین 04_2.xlsx", "دی 01.xlsx", "خرداد 06.xlsx"
 */
export function detectJalaliMonthFromFileName(
  fileName: string,
  defaultYear: number = 1405
): { monthIndex: number; monthName: string; year: number } {
  const cleanName = fileName.replace(/[_-]/g, ' ').trim();

  // ۱. شناسایی نام ماه
  let detectedMonthIndex = 1;
  let detectedMonthName: string = JALALI_MONTH_NAMES[0];

  for (let i = 0; i < JALALI_MONTH_NAMES.length; i++) {
    if (cleanName.includes(JALALI_MONTH_NAMES[i])) {
      detectedMonthIndex = i + 1;
      detectedMonthName = JALALI_MONTH_NAMES[i];
      break;
    }
  }

  // ۲. شناسایی سال در صورت درج در نام فایل (مثلاً ۱۴۰۴ یا 04 یا 1405)
  let detectedYear = defaultYear;
  const yearMatchFull = cleanName.match(/(13\d{2}|14\d{2})/);
  if (yearMatchFull) {
    detectedYear = parseInt(yearMatchFull[1], 10);
  } else {
    const yearMatchShort = cleanName.match(/\b(0[1-9]|[1-9][0-9])\b/);
    if (yearMatchShort) {
      const shortVal = parseInt(yearMatchShort[1], 10);
      if (shortVal >= 1 && shortVal <= 20) {
        detectedYear = 1400 + shortVal;
      }
    }
  }

  return {
    monthIndex: detectedMonthIndex,
    monthName: detectedMonthName,
    year: detectedYear,
  };
}

/**
 * تبدیل تاریخ میلادی به تاریخ شمسی
 */
export function gregorianToJalali(gYear: number, gMonth: number, gDay: number): JalaliDate {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const gy = gYear - 1600;
  const gm = gMonth - 1;
  const gd = gDay - 1;

  let gDayNo =
    365 * gy +
    Math.floor((gy + 3) / 4) -
    Math.floor((gy + 99) / 100) +
    Math.floor((gy + 399) / 400);

  for (let i = 0; i < gm; ++i) {
    gDayNo += gDaysInMonth[i];
  }
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) {
    gDayNo++;
  }
  gDayNo += gd;

  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11 && jDayNo >= jDaysInMonth[i]; ++i) {
    jDayNo -= jDaysInMonth[i];
    jm = i + 1;
  }
  const jd = jDayNo + 1;

  return { year: jy, month: jm + 1, day: jd };
}

/**
 * تبدیل تاریخ شمسی به میلادی
 */
export function jalaliToGregorian(jYear: number, jMonth: number, jDay: number): GregorianDate {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const jy = jYear - 979;
  const jm = jMonth - 1;
  const jd = jDay - 1;

  let jDayNo = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; ++i) {
    jDayNo += jDaysInMonth[i];
  }
  jDayNo += jd;

  let gDayNo = jDayNo + 79;

  let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
  gDayNo %= 146097;

  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo--;
    gy += 100 * Math.floor(gDayNo / 36524);
    gDayNo %= 36524;

    if (gDayNo >= 365) {
      gDayNo++;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(gDayNo / 1461);
  gDayNo %= 1461;

  if (gDayNo >= 366) {
    leap = false;
    gDayNo--;
    gy += Math.floor(gDayNo / 365);
    gDayNo %= 365;
  }

  let gm = 0;
  for (let i = 0; gDayNo >= gDaysInMonth[i] + (i === 1 && leap ? 1 : 0); i++) {
    gDayNo -= gDaysInMonth[i] + (i === 1 && leap ? 1 : 0);
    gm = i + 1;
  }
  const gd = gDayNo + 1;

  return { year: gy, month: gm + 1, day: gd };
}

/**
 * قالب‌بندی تاریخ شمسی به فرمت رشته‌ای YYYY/MM/DD با صفرهای پیشین
 */
export function formatJalaliDate(year: number, month: number, day: number): string {
  const m = month < 10 ? `0${month}` : `${month}`;
  const d = day < 10 ? `0${day}` : `${day}`;
  return `${year}/${m}/${d}`;
}