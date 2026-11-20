import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Clock,
  Calendar,
  Search,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface DepartmentStopDetail {
  runHours: number;
  stopHours: number;
  runHoursStr: string;
  stopHoursStr: string;
  cause: string;
}

interface DailyStopRecord {
  dayNumber: number;
  jalaliDate: string;
  crusher: DepartmentStopDetail;
  rawMill: DepartmentStopDetail;
  kiln: DepartmentStopDetail;
  cementMill: DepartmentStopDetail;
  overallStatus: 'normal' | 'scheduled_stop' | 'emergency_stop';
}

interface PeriodStopsSummary {
  totalKilnRunHours: number;
  totalKilnStopHours: number;
  totalRawMillRunHours: number;
  totalCementMillRunHours: number;
  overallAvailabilityPct: number;
  topStopCauses: Array<{ cause: string; hours: number; dept: string }>;
}

interface NormalizedPeriodStopsData {
  period: string;
  year: number;
  month: number;
  monthName: string;
  plantName: string;
  summary: PeriodStopsSummary;
  dailyRecords: DailyStopRecord[];
}

function parseHoursToDecimal(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseFloat(p) || 0);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    return Number((h + m / 60 + s / 3600).toFixed(2));
  }
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

function formatHoursStr(val: string | number | undefined): string {
  if (val === undefined || val === null || val === '') return '00:00';
  if (typeof val === 'string' && val.includes(':')) {
    const parts = val.split(':');
    return `${parts[0].padStart(2, '0')}:${(parts[1] || '00').padStart(2, '0')}`;
  }
  const dec = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
  const h = Math.floor(dec);
  const m = Math.round((dec - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export const StoppagesAnalysisView: React.FC = () => {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1403_05');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data/02-5-operations/department-stops-log.json');
        if (res.ok) {
          const json = await res.json();
          setAllData(json);
          const keys = Object.keys(json);
          if (keys.length > 0 && !keys.includes(selectedPeriod)) {
            setSelectedPeriod(keys[0]);
          }
        }
      } catch (err) {
        console.error('Error loading stoppages log:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentPeriodData: NormalizedPeriodStopsData = useMemo(() => {
    const rawPeriod = allData[selectedPeriod] || {};
    const rawDays: any[] = rawPeriod.days || rawPeriod.dailyRecords || [];

    const records: DailyStopRecord[] = rawDays.map((raw: any, idx: number) => {
      const depts = raw.departments || {};
      const crusherRaw = depts.crusher || raw.crusher || {};
      const rawMillRaw = depts.rawMill || raw.rawMill || {};
      const kilnRaw = depts.kiln || raw.kiln || {};
      const cementMillRaw = depts.cementMill || raw.cementMill || {};

      const kilnStop = parseHoursToDecimal(kilnRaw.stopHours);
      const rawMillStop = parseHoursToDecimal(rawMillRaw.stopHours);
      const cementMillStop = parseHoursToDecimal(cementMillRaw.stopHours);
      const crusherStop = parseHoursToDecimal(crusherRaw.stopHours);

      let overallStatus: 'normal' | 'scheduled_stop' | 'emergency_stop' = raw.overallStatus || 'normal';
      if (!raw.overallStatus) {
        if (kilnStop > 8 || rawMillStop > 8 || cementMillStop > 8) {
          overallStatus = 'scheduled_stop';
        } else if (kilnStop > 0 || rawMillStop > 0 || cementMillStop > 0) {
          overallStatus = 'emergency_stop';
        }
      }

      return {
        dayNumber: raw.dayNumber || idx + 1,
        jalaliDate: raw.jalaliDate || '',
        crusher: {
          runHours: parseHoursToDecimal(crusherRaw.runHours),
          stopHours: crusherStop,
          runHoursStr: formatHoursStr(crusherRaw.runHours),
          stopHoursStr: formatHoursStr(crusherRaw.stopHours),
          cause: crusherRaw.stopCauses || crusherRaw.cause || '',
        },
        rawMill: {
          runHours: parseHoursToDecimal(rawMillRaw.runHours),
          stopHours: rawMillStop,
          runHoursStr: formatHoursStr(rawMillRaw.runHours),
          stopHoursStr: formatHoursStr(rawMillRaw.stopHours),
          cause: rawMillRaw.stopCauses || rawMillRaw.cause || '',
        },
        kiln: {
          runHours: parseHoursToDecimal(kilnRaw.runHours),
          stopHours: kilnStop,
          runHoursStr: formatHoursStr(kilnRaw.runHours),
          stopHoursStr: formatHoursStr(kilnRaw.stopHours),
          cause: kilnRaw.stopCauses || kilnRaw.cause || '',
        },
        cementMill: {
          runHours: parseHoursToDecimal(cementMillRaw.runHours),
          stopHours: cementMillStop,
          runHoursStr: formatHoursStr(cementMillRaw.runHours),
          stopHoursStr: formatHoursStr(cementMillRaw.stopHours),
          cause: cementMillRaw.stopCauses || cementMillRaw.cause || '',
        },
        overallStatus,
      };
    });

    // محاسبه خلاصه کارکرد و توقفات
    const totalKilnRun = Number(records.reduce((s, r) => s + r.kiln.runHours, 0).toFixed(1));
    const totalKilnStop = Number(records.reduce((s, r) => s + r.kiln.stopHours, 0).toFixed(1));
    const totalRawMillRun = Number(records.reduce((s, r) => s + r.rawMill.runHours, 0).toFixed(1));
    const totalCementMillRun = Number(records.reduce((s, r) => s + r.cementMill.runHours, 0).toFixed(1));
    const totalPossible = (records.length || 1) * 24;
    const availPct = totalPossible > 0 ? Number(((totalKilnRun / totalPossible) * 100).toFixed(1)) : 0;

    // استخراج علل اصلی توقفات
    const causeMap: Record<string, { cause: string; hours: number; dept: string }> = {};
    records.forEach((r) => {
      if (r.kiln.stopHours > 0 && r.kiln.cause && r.kiln.cause !== '-') {
        causeMap[r.kiln.cause] = {
          cause: r.kiln.cause,
          hours: Number(((causeMap[r.kiln.cause]?.hours || 0) + r.kiln.stopHours).toFixed(1)),
          dept: 'کوره',
        };
      }
      if (r.rawMill.stopHours > 0 && r.rawMill.cause && r.rawMill.cause !== '-') {
        causeMap[r.rawMill.cause] = {
          cause: r.rawMill.cause,
          hours: Number(((causeMap[r.rawMill.cause]?.hours || 0) + r.rawMill.stopHours).toFixed(1)),
          dept: 'آسیاب مواد',
        };
      }
      if (r.cementMill.stopHours > 0 && r.cementMill.cause && r.cementMill.cause !== '-') {
        causeMap[r.cementMill.cause] = {
          cause: r.cementMill.cause,
          hours: Number(((causeMap[r.cementMill.cause]?.hours || 0) + r.cementMill.stopHours).toFixed(1)),
          dept: 'آسیاب سیمان',
        };
      }
      if (r.crusher.stopHours > 0 && r.crusher.cause && r.crusher.cause !== '-') {
        causeMap[r.crusher.cause] = {
          cause: r.crusher.cause,
          hours: Number(((causeMap[r.crusher.cause]?.hours || 0) + r.crusher.stopHours).toFixed(1)),
          dept: 'سنگ‌شکن',
        };
      }
    });

    const calculatedTopCauses = Object.values(causeMap)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 4);

    const summary: PeriodStopsSummary = {
      totalKilnRunHours: rawPeriod.summary?.totalKilnRunHours ?? totalKilnRun,
      totalKilnStopHours: rawPeriod.summary?.totalKilnStopHours ?? totalKilnStop,
      totalRawMillRunHours: rawPeriod.summary?.totalRawMillRunHours ?? totalRawMillRun,
      totalCementMillRunHours: rawPeriod.summary?.totalCementMillRunHours ?? totalCementMillRun,
      overallAvailabilityPct: rawPeriod.summary?.overallAvailabilityPct ?? availPct,
      topStopCauses: rawPeriod.summary?.topStopCauses || calculatedTopCauses,
    };

    return {
      period: selectedPeriod,
      year: rawPeriod.year || 1403,
      month: rawPeriod.month || 5,
      monthName: rawPeriod.monthName || 'مرداد',
      plantName: rawPeriod.plantName || 'کارخانه سیمان کیاسر',
      summary,
      dailyRecords: records,
    };
  }, [allData, selectedPeriod]);

  const filteredRecords = useMemo(() => {
    return (currentPeriodData?.dailyRecords || []).filter((rec) => {
      const matchSearch =
        !searchQuery.trim() ||
        rec.dayNumber?.toString().includes(searchQuery) ||
        rec.jalaliDate?.includes(searchQuery) ||
        rec.kiln?.cause?.includes(searchQuery) ||
        rec.rawMill?.cause?.includes(searchQuery) ||
        rec.cementMill?.cause?.includes(searchQuery) ||
        rec.crusher?.cause?.includes(searchQuery);

      const matchDept =
        selectedDeptFilter === 'all' ||
        (selectedDeptFilter === 'kiln' && (rec.kiln?.stopHours || 0) > 0) ||
        (selectedDeptFilter === 'rawMill' && (rec.rawMill?.stopHours || 0) > 0) ||
        (selectedDeptFilter === 'cementMill' && (rec.cementMill?.stopHours || 0) > 0) ||
        (selectedDeptFilter === 'crusher' && (rec.crusher?.stopHours || 0) > 0);

      return matchSearch && matchDept;
    });
  }, [currentPeriodData?.dailyRecords, searchQuery, selectedDeptFilter]);

  const handleExportExcel = () => {
    const rows = (currentPeriodData.dailyRecords || []).map((r) => ({
      'روز': r.dayNumber,
      'تاریخ': r.jalaliDate,
      'کارکرد کوره (h)': r.kiln.runHoursStr,
      'توقف کوره (h)': r.kiln.stopHoursStr,
      'علت توقف کوره': r.kiln.cause || '-',
      'کارکرد آسیاب مواد (h)': r.rawMill.runHoursStr,
      'توقف آسیاب مواد (h)': r.rawMill.stopHoursStr,
      'علت توقف آسیاب مواد': r.rawMill.cause || '-',
      'کارکرد آسیاب سیمان (h)': r.cementMill.runHoursStr,
      'توقف آسیاب سیمان (h)': r.cementMill.stopHoursStr,
      'علت توقف آسیاب سیمان': r.cementMill.cause || '-',
      'کارکرد سنگ‌شکن (h)': r.crusher.runHoursStr,
      'توقف سنگ‌شکن (h)': r.crusher.stopHoursStr,
      'علت توقف سنگ‌شکن': r.crusher.cause || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `توقفات_${currentPeriodData.period}`);
    XLSX.writeFile(wb, `لاگ_توقفات_${currentPeriodData.period}.xlsx`);
  };

  const periodKeys = Object.keys(allData);

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-xs" dir="rtl">
      {/* هدر ساب‌تب */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  پایش توقفات و کارکرد خطوط (Stoppages Analysis)
                </h2>
                <span className="enms-badge badge-danger text-[10px]">ساب‌تب ۶.۳-د</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] font-mono">
                  {currentPeriodData.plantName}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                ساعات کارکرد و توقف دپارتمان‌های سنگ‌شکن، آسیای مواد، کوره و آسیای سیمان و ریشه‌یابی علل توقف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[11px] text-[var(--color-text-muted)]">دوره مالی:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-[var(--color-primary)] focus:outline-none cursor-pointer"
              >
                {periodKeys.map((key) => {
                  const p = allData[key];
                  return (
                    <option key={key} value={key} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                      {p.monthName || key} {p.year ? toPersianDigits(p.year) : ''} ({key})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleExportExcel}
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>خروجی اکسل توقفات</span>
            </button>
          </div>
        </div>

        {/* کارت‌های شاخص‌های کلیدی دسترس‌پذیری */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">کارکرد کوره پخت</span>
            <div className="text-base font-bold font-mono text-amber-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.totalKilnRunHours)}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">ساعت</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              توقفات کوره: {toPersianDigits(currentPeriodData.summary.totalKilnStopHours)} ساعت
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">کارکرد آسیاب مواد</span>
            <div className="text-base font-bold font-mono text-cyan-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.totalRawMillRunHours)}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">ساعت</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              خط تولید خوراک کوره
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">کارکرد آسیاب سیمان</span>
            <div className="text-base font-bold font-mono text-purple-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.totalCementMillRunHours)}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">ساعت</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              آسیاب‌های سیمان ۱ و ۲
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">نرخ در دسترس بودن کوره</span>
            <div className="text-base font-bold font-mono text-emerald-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.overallAvailabilityPct)}٪
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              بر مبنای کل ساعات ماهانه
            </div>
          </div>
        </div>
      </div>

      {/* علل اصلی توقفات (Top Stoppage Causes) */}
      {currentPeriodData.summary.topStopCauses && currentPeriodData.summary.topStopCauses.length > 0 && (
        <div className="enms-card p-4">
          <h4 className="font-bold text-xs text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>ریشه‌یابی و اولویت علل توقفات در دوره مالی جاری (Pareto Stoppages)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentPeriodData.summary.topStopCauses.map((cause, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="enms-badge badge-warning text-[9px]">{cause.dept}</span>
                  <span className="font-mono font-bold text-rose-500">{toPersianDigits(cause.hours)} ساعت</span>
                </div>
                <div className="text-xs font-semibold text-[var(--color-text-primary)] mt-1">{cause.cause}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول لاگ روزانه توقفات */}
      <div className="enms-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              لاگ‌شیت تفکیکی کارکرد و توقفات خطوط روزانه - {currentPeriodData.monthName} {toPersianDigits(currentPeriodData.year)}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="enms-select text-xs"
            >
              <option value="all">همه دپارتمان‌ها</option>
              <option value="kiln">دارای توقف کوره</option>
              <option value="rawMill">دارای توقف آسیاب مواد</option>
              <option value="cementMill">دارای توقف آسیاب سیمان</option>
              <option value="crusher">دارای توقف سنگ‌شکن</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در علل توقف یا روز..."
              className="enms-input text-xs w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
              <tr>
                <th className="p-2.5 text-center w-12">روز</th>
                <th className="p-2.5 text-center">تاریخ</th>
                <th className="p-2.5 text-center">سنگ‌شکن کارکرد</th>
                <th className="p-2.5 text-center">سنگ‌شکن توقف</th>
                <th className="p-2.5 text-center">آسیاب مواد کارکرد</th>
                <th className="p-2.5 text-center">آسیاب مواد توقف</th>
                <th className="p-2.5 text-center">کوره کارکرد</th>
                <th className="p-2.5 text-center">کوره توقف</th>
                <th className="p-2.5 text-center">آسیاب سیمان کارکرد</th>
                <th className="p-2.5 text-center">آسیاب سیمان توقف</th>
                <th className="p-2.5 min-w-[280px]">شرح و ریشه‌یابی علل توقفات</th>
                <th className="p-2.5 text-center">وضعیت خط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-[var(--color-text-muted)]">
                    هیچ رکوردی منطبق با جستجو در این دوره یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={`${row.jalaliDate || row.dayNumber}-${idx}`} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors">
                    <td className="p-2.5 text-center font-bold font-mono text-[var(--color-primary)]">
                      {toPersianDigits(row.dayNumber)}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                      {toPersianDigits(row.jalaliDate)}
                    </td>
                    <td className="p-2.5 text-center font-mono text-emerald-500 font-medium">
                      {toPersianDigits(row.crusher.runHoursStr)}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className={row.crusher.stopHours > 0 ? 'text-rose-500 font-bold' : 'text-[var(--color-text-muted)]'}>
                        {toPersianDigits(row.crusher.stopHoursStr)}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-cyan-500">
                      {toPersianDigits(row.rawMill.runHoursStr)}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className={row.rawMill.stopHours > 0 ? 'text-rose-500 font-bold' : 'text-[var(--color-text-muted)]'}>
                        {toPersianDigits(row.rawMill.stopHoursStr)}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-amber-500">
                      {toPersianDigits(row.kiln.runHoursStr)}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className={row.kiln.stopHours > 0 ? 'text-rose-500 font-bold' : 'text-[var(--color-text-muted)]'}>
                        {toPersianDigits(row.kiln.stopHoursStr)}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-purple-500">
                      {toPersianDigits(row.cementMill.runHoursStr)}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      <span className={row.cementMill.stopHours > 0 ? 'text-rose-500 font-bold' : 'text-[var(--color-text-muted)]'}>
                        {toPersianDigits(row.cementMill.stopHoursStr)}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                      {row.kiln.cause && row.kiln.cause !== '-' && (
                        <div className="text-amber-600 dark:text-amber-400">
                          <span className="font-bold">کوره:</span> {row.kiln.cause}
                        </div>
                      )}
                      {row.rawMill.cause && row.rawMill.cause !== '-' && (
                        <div className="text-cyan-600 dark:text-cyan-400">
                          <span className="font-bold">آسیاب مواد:</span> {row.rawMill.cause}
                        </div>
                      )}
                      {row.cementMill.cause && row.cementMill.cause !== '-' && (
                        <div className="text-purple-600 dark:text-purple-400">
                          <span className="font-bold">آسیاب سیمان:</span> {row.cementMill.cause}
                        </div>
                      )}
                      {row.crusher.cause && row.crusher.cause !== '-' && (
                        <div className="text-[var(--color-text-secondary)]">
                          <span className="font-bold">سنگ‌شکن:</span> {row.crusher.cause}
                        </div>
                      )}
                      {!row.kiln.cause && !row.rawMill.cause && !row.cementMill.cause && !row.crusher.cause && (
                        <span className="text-[var(--color-text-muted)]">تولید عادی و بدون توقف گزارش‌شده</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {row.overallStatus === 'emergency_stop' ? (
                        <span className="enms-badge badge-danger text-[10px]">توقف اضطراری</span>
                      ) : row.overallStatus === 'scheduled_stop' ? (
                        <span className="enms-badge badge-warning text-[10px]">نت برنامه‌ای</span>
                      ) : (
                        <span className="enms-badge badge-success text-[10px]">عادی</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoppagesAnalysisView;
