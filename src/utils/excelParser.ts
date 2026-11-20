import * as XLSX from 'xlsx';
import { toPersianDigits } from './persianUtils';
import { detectJalaliMonthFromFileName } from '../services/calendar/jalaliEngine';

// =============================================================================
// تایپ‌ها و اینترفیس‌های عمومی پارسر اکسل
// =============================================================================

export interface SheetParseOptions {
  /** شماره ردیف هدر (پیش‌فرض: 0 یعنی اولین ردیف) */
  headerRowIndex?: number;
  /** مقدار پیش‌فرض برای سلول‌های خالی */
  defaultValue?: any;
  /** نادیده گرفتن ردیف‌های خالی (پیش‌فرض: true) */
  skipBlankRows?: boolean;
  /** نام یا ایندکس شیت مورد نظر */
  sheet?: string | number;
  /** آیا کلیدهای هدر نرمال‌سازی شوند (حذف فواصل اضافی و یکسان‌سازی کاراکترهای فارسی) */
  normalizeHeaders?: boolean;
}

export interface ExportExcelOptions {
  sheetName?: string;
  /** جهت راست به چپ برای کاربرگ‌های فارسی */
  rtl?: boolean;
  /** تنظیم خودکار عرض ستون‌ها بر اساس محتوا */
  autoColumnWidth?: boolean;
}

// تایپ داده‌های خروجی پارس لاگ مصرف انرژی
export interface ParsedEnergyConsumptionRow {
  dayNumber: number;
  jalaliDate: string;
  activeElecKwh: number;
  reactiveElecKvarh: number;
  peakDemandKw: number;
  naturalGasM3: number;
  fuelOilLiters: number;
  substations: {
    crusherKwh: number;
    rawMillKwh: number;
    kilnKwh: number;
    cementMillKwh: number;
    utilitiesKwh: number;
  };
  secElectricalKwhTon: number;
  secThermalKcalKg: number;
  status: 'normal' | 'warning' | 'anomaly';
  notes?: string;
}

export interface ParsedEnergyConsumptionResult {
  period: string;
  year: number;
  month: number;
  monthName: string;
  records: ParsedEnergyConsumptionRow[];
  summary: {
    totalElectricityMwh: number;
    totalGasM3: number;
    totalMazutTon: number;
    avgSecElectricKwhTon: number;
    avgSecThermalKcalKg: number;
  };
}

// تایپ داده‌های خروجی پارس گزارش روزانه تولید
export interface ParsedProductionRow {
  dayNumber: number;
  jalaliDate: string;
  clinkerTon: number;
  cementType2Ton: number;
  cementPuzzolanicTon: number;
  cementCompositeTon: number;
  totalCementTon: number;
  kilnFeedTon: number;
  fuelGasM3: number;
  secThermalKcalKg: number;
  secElectricalKwhTon: number;
  kilnEfficiencyPct: number;
  cementMillEfficiencyPct: number;
  notes?: string;
}

export interface ParsedProductionResult {
  period: string;
  year: number;
  month: number;
  monthName: string;
  records: ParsedProductionRow[];
  summary: {
    totalClinkerTon: number;
    totalCementTon: number;
    totalKilnFeedTon: number;
    avgClinkerPerDay: number;
    avgCementPerDay: number;
  };
}

// تایپ داده‌های خروجی پارس لاگ توقفات دپارتمان‌ها
export interface ParsedStoppageRow {
  dayNumber: number;
  jalaliDate: string;
  crusher: { runHours: number; stopHours: number; cause?: string };
  rawMill: { runHours: number; stopHours: number; cause?: string };
  kiln: { runHours: number; stopHours: number; cause?: string };
  cementMill: { runHours: number; stopHours: number; cause?: string };
  totalDowntimeHours: number;
}

// باندل جامع ماهانه استخراج‌شده از اکسل کارخانه
export interface MonthDataBundle {
  monthKey: string;
  year: number;
  month: number;
  monthName: string;
  dispatchData: any;
  productionData: any;
  stopsData: any;
  energyData: any;
}

// =============================================================================
// توابع کمکی پاکسازی و نرمال‌سازی داده‌ها (Data Cleaning Utilities)
// =============================================================================

/**
 * تبدیل ارقام فارسی و عربی به ارقام انگلیسی
 */
export function persianToEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const val = String(str);
  return val
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * پاک‌سازی و یکسان‌سازی متن هدر ستون‌های اکسل
 * - حذف کاراکترهای نامرئی و BOM
 * - یکدست‌سازی «ی» و «ک» فارسی و عربی
 * - حذف فواصل چندگانه
 */
export function normalizeHeaderKey(key: string): string {
  if (!key) return '';
  return key
    .toString()
    .replace(/^\uFEFF/, '') // حذف BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // حذف Zero-width space
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * تبدیل ایمن هر ورودی اکسل به عدد اعشاری با حذف جداکننده‌ها و کاراکترهای غیرعددی
 */
export function parseExcelNumber(val: any, fallback: number = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  const normalized = persianToEnglishDigits(val)
    .replace(/,/g, '')
    .replace(/،/g, '')
    .replace(/%/g, '')
    .replace(/[^\d.-]/g, '')
    .trim();

  const num = parseFloat(normalized);
  return isNaN(num) ? fallback : num;
}

/**
 * تبدیل ایمن تاریخ اکسل (سریال نامبر عددی یا رشته تاریخ شمسی/میلادی)
 */
export function parseExcelDate(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    return persianToEnglishDigits(val.trim());
  }
  // اگر عدد سریال اکسل باشد
  if (typeof val === 'number') {
    try {
      const dateObj = XLSX.SSF.parse_date_code(val);
      if (dateObj) {
        const y = dateObj.y;
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}/${m}/${d}`;
      }
    } catch {
      // fallback
    }
  }
  return String(val);
}

// =============================================================================
// توابع اصلی خواندن فایل و کاربرگ (Core Reading Functions)
// =============================================================================

/**
 * خواندن فایل اکسل ارسالی کاربر از طریق File یا Blob به ساختار WorkBook
 */
export async function readWorkbookFromFile(file: File | Blob): Promise<XLSX.WorkBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, {
          type: 'array',
          cellDates: true,
          cellNF: false,
          cellText: false,
        });
        resolve(workbook);
      } catch (err) {
        reject(new Error(`خطا در رمزگشایی فایل اکسل: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error('خطا در بارگذاری باینری فایل اکسل.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * خواندن ورک‌بوک از ArrayBuffer یا Uint8Array
 */
export function readWorkbookFromBuffer(buffer: ArrayBuffer | Uint8Array): XLSX.WorkBook {
  return XLSX.read(buffer, { type: 'array' });
}

/**
 * دریافت لیست اسامی تمام شیت‌های موجود در فایل اکسل
 */
export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames || [];
}

/**
 * تبدیل یک شیت مشخص به آرایه‌ای از آبجکت‌های JSON استاندارد
 */
export function parseSheetToJson<T = Record<string, any>>(
  workbook: XLSX.WorkBook,
  options: SheetParseOptions = {}
): T[] {
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) {
    return [];
  }

  let targetSheetName: string;
  if (typeof options.sheet === 'number') {
    targetSheetName = sheetNames[options.sheet] || sheetNames[0];
  } else if (typeof options.sheet === 'string' && sheetNames.includes(options.sheet)) {
    targetSheetName = options.sheet;
  } else {
    targetSheetName = sheetNames[0];
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) return [];

  // تبدیل شیت به ماتریس سطری
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: options.defaultValue ?? null,
    blankrows: !options.skipBlankRows,
  });

  if (!rawRows || rawRows.length === 0) return [];

  const headerRowIdx = options.headerRowIndex ?? 0;
  if (headerRowIdx >= rawRows.length) return [];

  const rawHeaders = rawRows[headerRowIdx] as string[];
  const headers = rawHeaders.map((h) =>
    options.normalizeHeaders ? normalizeHeaderKey(String(h ?? '')) : String(h ?? '').trim()
  );

  const result: T[] = [];

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || (!Array.isArray(row) && typeof row !== 'object')) continue;

    // بررسی آیا کل ردیف خالی است
    const hasValues = row.some((cell) => cell !== null && cell !== undefined && cell !== '');
    if (!hasValues && options.skipBlankRows !== false) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((header, colIdx) => {
      if (header) {
        rowObj[header] = row[colIdx] !== undefined ? row[colIdx] : options.defaultValue ?? null;
      }
    });

    result.push(rowObj as T);
  }

  return result;
}

/**
 * پارس مستقیم فایل اکسل به داده‌های JSON به‌صورت تک‌مرحله‌ای
 */
export async function parseExcelFileToJson<T = Record<string, any>>(
  file: File,
  options: SheetParseOptions = {}
): Promise<{ sheetNames: string[]; data: T[] }> {
  const workbook = await readWorkbookFromFile(file);
  const sheetNames = getSheetNames(workbook);
  const data = parseSheetToJson<T>(workbook, options);
  return { sheetNames, data };
}

/**
 * تبدیل شیت به ماتریس دوبعدی ساده (مناسب برای پیش‌نمایش جدول)
 */
export function parseSheetToRawMatrix(
  workbook: XLSX.WorkBook,
  sheetNameOrIndex?: string | number
): any[][] {
  const sheetNames = workbook.SheetNames;
  if (!sheetNames || sheetNames.length === 0) return [];

  let name = sheetNames[0];
  if (typeof sheetNameOrIndex === 'number' && sheetNames[sheetNameOrIndex]) {
    name = sheetNames[sheetNameOrIndex];
  } else if (typeof sheetNameOrIndex === 'string' && sheetNames.includes(sheetNameOrIndex)) {
    name = sheetNameOrIndex;
  }

  const sheet = workbook.Sheets[name];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

// =============================================================================
// پارسرهای تخصصی ماژول‌های سیستم مدیریت انرژی (Domain-Specific Parsers)
// =============================================================================

/**
 * پیدا کردن مقدار یک ستون از میان نام‌های محتمل (فارسی و انگلیسی)
 */
function findColumnValue(row: Record<string, any>, candidateKeys: string[]): any {
  // ۱. جستجوی دقیق
  for (const key of candidateKeys) {
    if (row[key] !== undefined) return row[key];
  }

  // ۲. جستجو بر اساس کلیدهای نرمال‌شده
  const rowNormalizedKeys = Object.keys(row).map((k) => ({
    original: k,
    normalized: normalizeHeaderKey(k),
  }));

  for (const candidate of candidateKeys) {
    const normCandidate = normalizeHeaderKey(candidate);
    const match = rowNormalizedKeys.find(
      (k) => k.normalized === normCandidate || k.normalized.includes(normCandidate)
    );
    if (match) return row[match.original];
  }

  return undefined;
}

/**
 * پارسر تخصصی لاگ‌شیت روزانه مصارف انرژی (برق، گاز، مازوت، پست‌ها و SEC)
 */
export async function parseEnergyConsumptionExcel(
  source: File | XLSX.WorkBook,
  fileName?: string
): Promise<ParsedEnergyConsumptionResult> {
  const workbook = source instanceof File ? await readWorkbookFromFile(source) : source;
  const name = fileName || (source instanceof File ? source.name : 'energy_log.xlsx');

  // استخراج دوره شمسی از روی نام فایل
  const detected = detectJalaliMonthFromFileName(name);
  const periodCode = `${detected.year}_${String(detected.monthIndex).padStart(2, '0')}`;

  const rows = parseSheetToJson<Record<string, any>>(workbook, {
    headerRowIndex: 0,
    skipBlankRows: true,
  });

  const records: ParsedEnergyConsumptionRow[] = [];

  rows.forEach((row, index) => {
    const day = parseExcelNumber(
      findColumnValue(row, ['روز', 'day', 'daynumber', 'ردیف', 'id']),
      index + 1
    );

    const jalaliDate = parseExcelDate(
      findColumnValue(row, ['تاریخ', 'date', 'jalalidate', 'تاریخ شمسی'])
    ) || `${detected.year}/${String(detected.monthIndex).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

    const activeElec = parseExcelNumber(
      findColumnValue(row, ['برق کل کارخانه (kwh)', 'برق کل', 'activeeleckwh', 'electricitykwh', 'برق'])
    );

    const naturalGas = parseExcelNumber(
      findColumnValue(row, ['گاز طبیعی (nm³)', 'گاز طبیعی', 'naturalgasm3', 'گاز', 'سوخت گاز'])
    );

    const fuelOil = parseExcelNumber(
      findColumnValue(row, ['مازوت (لیتر)', 'مازوت', 'fueloilliters', 'سوخت مایع'])
    );

    const crusherKwh = parseExcelNumber(
      findColumnValue(row, ['پست سنگ‌شکن (kwh)', 'پست سنگ‌شکن', 'crusherkwh', 'سنگ‌شکن'])
    );

    const rawMillKwh = parseExcelNumber(
      findColumnValue(row, ['پست آسیاب مواد (kwh)', 'پست آسیاب مواد', 'rawmillkwh', 'آسیاب مواد'])
    );

    const kilnKwh = parseExcelNumber(
      findColumnValue(row, ['پست کوره (kwh)', 'پست کوره', 'kilnkwh', 'کوره'])
    );

    const cementMillKwh = parseExcelNumber(
      findColumnValue(row, ['پست آسیاب سیمان (kwh)', 'پست آسیاب سیمان', 'cementmillkwh', 'آسیاب سیمان'])
    );

    const utilitiesKwh = parseExcelNumber(
      findColumnValue(row, ['پست یوتیلیتی (kwh)', 'پست یوتیلیتی', 'utilitieskwh', 'یوتیلیتی', 'الکتروفیلتر'])
    );

    const secElec = parseExcelNumber(
      findColumnValue(row, ['sec برق (kwh/ton)', 'sec برق', 'secelectricalkwhton', 'sec_elec'])
    );

    const secThermal = parseExcelNumber(
      findColumnValue(row, ['sec حرارت (kcal/kg)', 'sec حرارت', 'secthermalkcalkg', 'sec_thermal'])
    );

    const notes = String(findColumnValue(row, ['توضیحات', 'notes', 'شرح', 'وضعیت و توضیحات']) || '').trim();

    let status: 'normal' | 'warning' | 'anomaly' = 'normal';
    if (secThermal > 1200 || secElec > 160) {
      status = 'anomaly';
    } else if (secThermal > 950 || secElec > 120) {
      status = 'warning';
    }

    records.push({
      dayNumber: day,
      jalaliDate,
      activeElecKwh: activeElec,
      reactiveElecKvarh: Math.round(activeElec * 0.25),
      peakDemandKw: activeElec > 0 ? Math.round(activeElec / 20) : 0,
      naturalGasM3: naturalGas,
      fuelOilLiters: fuelOil,
      substations: {
        crusherKwh,
        rawMillKwh,
        kilnKwh,
        cementMillKwh,
        utilitiesKwh,
      },
      secElectricalKwhTon: Number(secElec.toFixed(1)),
      secThermalKcalKg: Number(secThermal.toFixed(1)),
      status,
      notes: notes || undefined,
    });
  });

  const totalElec = records.reduce((s, r) => s + r.activeElecKwh, 0);
  const totalGas = records.reduce((s, r) => s + r.naturalGasM3, 0);
  const totalMazut = records.reduce((s, r) => s + r.fuelOilLiters, 0);

  const nonZeroSecElec = records.filter((r) => r.secElectricalKwhTon > 0);
  const nonZeroSecTherm = records.filter((r) => r.secThermalKcalKg > 0);

  const avgSecElectric =
    nonZeroSecElec.length > 0
      ? Number((nonZeroSecElec.reduce((s, r) => s + r.secElectricalKwhTon, 0) / nonZeroSecElec.length).toFixed(1))
      : 0;

  const avgSecThermal =
    nonZeroSecTherm.length > 0
      ? Number((nonZeroSecTherm.reduce((s, r) => s + r.secThermalKcalKg, 0) / nonZeroSecTherm.length).toFixed(1))
      : 0;

  return {
    period: periodCode,
    year: detected.year,
    month: detected.monthIndex,
    monthName: detected.monthName,
    records,
    summary: {
      totalElectricityMwh: Number((totalElec / 1000).toFixed(1)),
      totalGasM3: totalGas,
      totalMazutTon: Number((totalMazut / 1000).toFixed(1)),
      avgSecElectricKwhTon: avgSecElectric,
      avgSecThermalKcalKg: avgSecThermal,
    },
  };
}

/**
 * پارسر تخصصی گزارش جامع تولید و کارکرد دپارتمان‌ها
 */
export async function parseProductionReportExcel(
  source: File | XLSX.WorkBook,
  fileName?: string
): Promise<ParsedProductionResult> {
  const workbook = source instanceof File ? await readWorkbookFromFile(source) : source;
  const name = fileName || (source instanceof File ? source.name : 'production_report.xlsx');

  const detected = detectJalaliMonthFromFileName(name);
  const periodCode = `${detected.year}_${String(detected.monthIndex).padStart(2, '0')}`;

  const rows = parseSheetToJson<Record<string, any>>(workbook, {
    headerRowIndex: 0,
    skipBlankRows: true,
  });

  const records: ParsedProductionRow[] = [];

  rows.forEach((row, index) => {
    const day = parseExcelNumber(
      findColumnValue(row, ['روز', 'day', 'daynumber', 'ردیف']),
      index + 1
    );

    const jalaliDate = parseExcelDate(
      findColumnValue(row, ['تاریخ', 'date', 'jalalidate'])
    ) || `${detected.year}/${String(detected.monthIndex).padStart(2, '0')}/${String(day).padStart(2, '0')}`;

    const clinkerTon = parseExcelNumber(
      findColumnValue(row, ['کلینکر تولیدی (تن)', 'کلینکر', 'clinkerton', 'کلینکر تولیدی'])
    );

    const cementType2 = parseExcelNumber(
      findColumnValue(row, ['سیمان تیپ ۲ (تن)', 'تیپ ۲', 'cementtype2ton', 'سیمان تیپ 2'])
    );

    const cementPuzzolanic = parseExcelNumber(
      findColumnValue(row, ['سیمان پوزولانی (تن)', 'پوزولانی', 'cementpuzzolanicton'])
    );

    const cementComposite = parseExcelNumber(
      findColumnValue(row, ['سیمان مرکب (تن)', 'مرکب', 'cementcompositeton'])
    );

    let totalCement = parseExcelNumber(
      findColumnValue(row, ['مجموع سیمان (تن)', 'کل سیمان', 'totalcementton', 'تولید سیمان'])
    );
    if (totalCement === 0 && (cementType2 > 0 || cementPuzzolanic > 0 || cementComposite > 0)) {
      totalCement = cementType2 + cementPuzzolanic + cementComposite;
    }

    const kilnFeedTon = parseExcelNumber(
      findColumnValue(row, ['خوراک کوره (تن)', 'خوراک کوره', 'kilnfeedton', 'مواد خام کوره'])
    );

    const fuelGasM3 = parseExcelNumber(
      findColumnValue(row, ['گاز مصرفی (m³)', 'گاز کوره', 'fuelgasm3', 'گاز'])
    );

    const secThermalKcalKg = parseExcelNumber(
      findColumnValue(row, ['sec حرارتی (kcal/kg)', 'sec حرارتی', 'secthermalkcalkg'])
    );

    const secElectricalKwhTon = parseExcelNumber(
      findColumnValue(row, ['sec برق (kwh/t)', 'sec برق', 'secelectricalkwhton'])
    );

    const kilnEfficiency = parseExcelNumber(
      findColumnValue(row, ['راندمان کوره (٪)', 'راندمان کوره', 'kilnefficiencypct']),
      clinkerTon > 0 ? 92 : 0
    );

    const cementMillEfficiency = parseExcelNumber(
      findColumnValue(row, ['راندمان آسیاب (٪)', 'راندمان آسیاب', 'cementmillefficiencypct']),
      totalCement > 0 ? 88 : 0
    );

    const notes = String(findColumnValue(row, ['توضیحات فرآیندی', 'توضیحات', 'notes']) || '').trim();

    records.push({
      dayNumber: day,
      jalaliDate,
      clinkerTon,
      cementType2Ton: cementType2,
      cementPuzzolanicTon: cementPuzzolanic,
      cementCompositeTon: cementComposite,
      totalCementTon: totalCement,
      kilnFeedTon: kilnFeedTon || Math.round(clinkerTon * 1.58),
      fuelGasM3,
      secThermalKcalKg,
      secElectricalKwhTon,
      kilnEfficiencyPct: kilnEfficiency,
      cementMillEfficiencyPct: cementMillEfficiency,
      notes: notes || undefined,
    });
  });

  const totalClinker = records.reduce((s, r) => s + r.clinkerTon, 0);
  const totalCement = records.reduce((s, r) => s + r.totalCementTon, 0);
  const totalFeed = records.reduce((s, r) => s + r.kilnFeedTon, 0);

  return {
    period: periodCode,
    year: detected.year,
    month: detected.monthIndex,
    monthName: detected.monthName,
    records,
    summary: {
      totalClinkerTon: totalClinker,
      totalCementTon: totalCement,
      totalKilnFeedTon: totalFeed,
      avgClinkerPerDay: records.length > 0 ? Number((totalClinker / records.length).toFixed(1)) : 0,
      avgCementPerDay: records.length > 0 ? Number((totalCement / records.length).toFixed(1)) : 0,
    },
  };
}

/**
 * پارسر تخصصی لاگ توقفات تجهیزات کلیدی کارخانه (کوره، آسیاب‌ها و سنگ‌شکن)
 */
export async function parseStoppagesExcel(
  source: File | XLSX.WorkBook
): Promise<ParsedStoppageRow[]> {
  const workbook = source instanceof File ? await readWorkbookFromFile(source) : source;
  const rows = parseSheetToJson<Record<string, any>>(workbook, { headerRowIndex: 0 });

  return rows.map((row, index) => {
    const day = parseExcelNumber(findColumnValue(row, ['روز', 'day', 'daynumber']), index + 1);
    const jalaliDate = parseExcelDate(findColumnValue(row, ['تاریخ', 'date', 'jalalidate']));

    const kilnRun = parseExcelNumber(findColumnValue(row, ['کارکرد کوره (h)', 'کارکرد کوره', 'kilnrunhours']));
    const kilnStop = parseExcelNumber(findColumnValue(row, ['توقف کوره (h)', 'توقف کوره', 'kilnstophours']));
    const kilnCause = findColumnValue(row, ['علت توقف کوره', 'علت کوره', 'kilncause']);

    const rawMillRun = parseExcelNumber(findColumnValue(row, ['کارکرد آسیاب مواد (h)', 'کارکرد آسیاب مواد', 'rawmillrunhours']));
    const rawMillStop = parseExcelNumber(findColumnValue(row, ['توقف آسیاب مواد (h)', 'توقف آسیاب مواد', 'rawmillstophours']));
    const rawMillCause = findColumnValue(row, ['علت توقف آسیاب مواد', 'علت آسیاب مواد', 'rawmillcause']);

    const cementMillRun = parseExcelNumber(findColumnValue(row, ['کارکرد آسیاب سیمان (h)', 'کارکرد آسیاب سیمان', 'cementmillrunhours']));
    const cementMillStop = parseExcelNumber(findColumnValue(row, ['توقف آسیاب سیمان (h)', 'توقف آسیاب سیمان', 'cementmillstophours']));
    const cementMillCause = findColumnValue(row, ['علت توقف آسیاب سیمان', 'علت آسیاب سیمان', 'cementmillcause']);

    const crusherRun = parseExcelNumber(findColumnValue(row, ['کارکرد سنگ‌شکن (h)', 'کارکرد سنگ‌شکن', 'crusherrunhours']));
    const crusherStop = parseExcelNumber(findColumnValue(row, ['توقف سنگ‌شکن (h)', 'توقف سنگ‌شکن', 'crusherstophours']));
    const crusherCause = findColumnValue(row, ['علت توقف سنگ‌شکن', 'علت سنگ‌شکن', 'crushercause']);

    const totalDowntime = kilnStop + rawMillStop + cementMillStop + crusherStop;

    return {
      dayNumber: day,
      jalaliDate,
      crusher: { runHours: crusherRun, stopHours: crusherStop, cause: crusherCause || undefined },
      rawMill: { runHours: rawMillRun, stopHours: rawMillStop, cause: rawMillCause || undefined },
      kiln: { runHours: kilnRun, stopHours: kilnStop, cause: kilnCause || undefined },
      cementMill: { runHours: cementMillRun, stopHours: cementMillStop, cause: cementMillCause || undefined },
      totalDowntimeHours: totalDowntime,
    };
  });
}

// =============================================================================
// توابع ساخت و خروجی فایل اکسل (Export & Template Generators)
// =============================================================================

/**
 * خروجی گرفتن تمیز از داده‌های JSON به فایل Excel با تنظیمات فونت و راست‌به‌چپ
 */
export function exportJsonToExcel<T = Record<string, any>>(
  data: T[],
  fileName: string,
  options: ExportExcelOptions = {}
): void {
  const { sheetName = 'گزارش', rtl = true, autoColumnWidth = true } = options;

  const worksheet = XLSX.utils.json_to_sheet(data);

  // تنظیم جهت راست به چپ برای نمایش صحیح متن و اعداد فارسی در اکسل
  if (rtl) {
    if (!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({ rightToLeft: true });
  }

  // محاسبه خودکار عرض ستون‌ها بر اساس طول داده‌ها
  if (autoColumnWidth && data.length > 0) {
    const keys = Object.keys(data[0] as object);
    const colWidths = keys.map((key) => {
      let maxLen = key.length;
      for (const row of data.slice(0, 100)) {
        const val = String((row as any)[key] ?? '');
        if (val.length > maxLen) maxLen = val.length;
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    worksheet['!cols'] = colWidths;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const cleanFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
}

/**
 * ایجاد و دانلود فایل قالب خام اکسل برای لاگ مصرف انرژی
 */
export function downloadEnergyLogTemplate(period: string = '1405_01'): void {
  const sampleData = [
    {
      'روز': 1,
      'تاریخ': '1405/01/01',
      'برق کل کارخانه (kWh)': 142000,
      'گاز طبیعی (Nm³)': 118000,
      'مازوت (لیتر)': 0,
      'پست سنگ‌شکن (kWh)': 6200,
      'پست آسیاب مواد (kWh)': 41500,
      'پست کوره (kWh)': 53200,
      'پست آسیاب سیمان (kWh)': 32800,
      'پست یوتیلیتی (kWh)': 8300,
      'SEC برق (kWh/ton)': 108.5,
      'SEC حرارت (kcal/kg)': 765.0,
      'توضیحات': 'تولید نرمال با ظرفیت نامی',
    },
    {
      'روز': 2,
      'تاریخ': '1405/01/02',
      'برق کل کارخانه (kWh)': 139500,
      'گاز طبیعی (Nm³)': 116200,
      'مازوت (لیتر)': 0,
      'پست سنگ‌شکن (kWh)': 5900,
      'پست آسیاب مواد (kWh)': 40800,
      'پست کوره (kWh)': 52900,
      'پست آسیاب سیمان (kWh)': 31600,
      'پست یوتیلیتی (kWh)': 8300,
      'SEC برق (kWh/ton)': 107.2,
      'SEC حرارت (kcal/kg)': 758.4,
      'توضیحات': 'عملکرد بهینه کوره',
    },
  ];

  exportJsonToExcel(sampleData, `قالب_ورود_لاگ_مصارف_انرژی_${period}.xlsx`, {
    sheetName: 'مصارف_روزانه_انرژی',
    rtl: true,
  });
}

/**
 * ایجاد و دانلود فایل قالب خام اکسل برای گزارش روزانه تولید
 */
export function downloadProductionReportTemplate(period: string = '1405_01'): void {
  const sampleData = [
    {
      'روز': 1,
      'تاریخ': '1405/01/01',
      'کلینکر تولیدی (تن)': 3120,
      'خوراک کوره (تن)': 4950,
      'سیمان تیپ ۲ (تن)': 1800,
      'سیمان پوزولانی (تن)': 1250,
      'مجموع سیمان (تن)': 3050,
      'گاز مصرفی (m³)': 118000,
      'SEC حرارتی (kcal/kg)': 765.0,
      'SEC برق (kWh/t)': 108.5,
      'راندمان کوره (٪)': 93.5,
      'راندمان آسیاب (٪)': 89.2,
      'توضیحات فرآیندی': 'تولید پیوسته خط ۱',
    },
  ];

  exportJsonToExcel(sampleData, `قالب_ورود_گزارش_تولید_${period}.xlsx`, {
    sheetName: 'گزارش_جامع_تولید',
    rtl: true,
  });
}

/**
 * پردازش جامع فایل اکسل کارخانه سیمان کیاسر و استخراج تمام داده‌های ماهانه
 */
export async function parseCementExcel(
  file: File,
  defaultYear: number = 1405,
  defaultMonth: number = 6,
  defaultMonthName: string = 'شهریور'
): Promise<MonthDataBundle> {
  const workbook = await readWorkbookFromFile(file);
  const detected = detectJalaliMonthFromFileName(file.name, defaultYear);
  const year = detected.year || defaultYear;
  const month = detected.monthIndex || defaultMonth;
  const monthName = detected.monthName || defaultMonthName;
  const monthKey = `${year}_${String(month).padStart(2, '0')}`;

  // ۱. استخراج لاگ مصرف انرژی
  const energyResult = await parseEnergyConsumptionExcel(workbook, file.name);
  const energyData = {
    year,
    month,
    monthName,
    summary: energyResult.summary,
    days: energyResult.records,
    dailyRecords: energyResult.records,
  };

  // ۲. استخراج گزارش تولید
  const prodResult = await parseProductionReportExcel(workbook, file.name);
  const productionData = {
    year,
    month,
    monthName,
    summary: prodResult.summary,
    dailyRecords: prodResult.records,
  };

  // ۳. استخراج گزارش توقفات
  const stopsRecords = await parseStoppagesExcel(workbook);
  const stopsData = {
    year,
    month,
    monthName,
    days: stopsRecords,
  };

  // ۴. استخراج گزارش تحویل و بارگیرخانه
  const sheetNames = getSheetNames(workbook);
  const dispatchSheet =
    sheetNames.find((s) => s.includes('بارگیر') || s.includes('تحویل') || s.toLowerCase().includes('dispatch')) ||
    sheetNames[0];

  const dispatchRows = parseSheetToJson<Record<string, any>>(workbook, { sheet: dispatchSheet });
  const dispatchDays = dispatchRows.map((row, idx) => {
    const dayNumber = parseExcelNumber(findColumnValue(row, ['روز', 'day', 'daynumber']), idx + 1);
    const jalaliDate =
      parseExcelDate(findColumnValue(row, ['تاریخ', 'date', 'jalalidate'])) ||
      `${year}/${String(month).padStart(2, '0')}/${String(dayNumber).padStart(2, '0')}`;
    const bulk = parseExcelNumber(findColumnValue(row, ['تحویل فله (تن)', 'فله', 'bulktype2ton', 'bulk']));
    const bag = parseExcelNumber(findColumnValue(row, ['تحویل پاکتی (تن)', 'پاکتی', 'bagtype2ton', 'bag']));
    const total = parseExcelNumber(findColumnValue(row, ['مجموع تحویل (تن)', 'کل تحویل', 'totaldispatchton']), bulk + bag);
    const trucks = parseExcelNumber(findColumnValue(row, ['تعداد کامیون/بونکر', 'کامیون', 'truckscount']));

    return {
      id: `rec_${monthKey}_${String(dayNumber).padStart(2, '0')}`,
      dayNumber,
      jalaliDate,
      dispatch: {
        bulkType2Ton: bulk,
        bagType2Ton: bag,
        totalDispatchTon: total,
      },
      bulkDispatchTon: bulk,
      bagDispatchTon: bag,
      totalDispatchTon: total,
      trucksCount: trucks,
      notes: String(findColumnValue(row, ['توضیحات', 'notes']) || ''),
    };
  });

  const dispatchData = {
    year,
    month,
    monthName,
    totalDays: dispatchDays.length,
    totalDispatchTon: dispatchDays.reduce((s, d) => s + (d.totalDispatchTon || 0), 0),
    days: dispatchDays,
    dailyRecords: dispatchDays,
  };

  return {
    monthKey,
    year,
    month,
    monthName,
    dispatchData,
    productionData,
    stopsData,
    energyData,
  };
}

export default {
  readWorkbookFromFile,
  readWorkbookFromBuffer,
  getSheetNames,
  parseSheetToJson,
  parseExcelFileToJson,
  parseSheetToRawMatrix,
  parseEnergyConsumptionExcel,
  parseProductionReportExcel,
  parseStoppagesExcel,
  parseCementExcel,
  exportJsonToExcel,
  downloadEnergyLogTemplate,
  downloadProductionReportTemplate,
  parseExcelNumber,
  parseExcelDate,
  normalizeHeaderKey,
  persianToEnglishDigits,
};
