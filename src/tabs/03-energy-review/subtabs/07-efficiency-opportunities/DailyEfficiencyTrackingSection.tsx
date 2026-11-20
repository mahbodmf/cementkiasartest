import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

export interface DailyEfficiencyItem {
  dayNumber: number;
  jalaliDate: string;
  kilnFeedTon: number;
  clinkerTon: number;
  totalCementTon: number;
  kilnEfficiencyPct: number;
  cementMillEfficiencyPct: number;
  notes?: string;
}

interface DailyEfficiencyTrackingSectionProps {
  dailyRecords: DailyEfficiencyItem[];
  periodTitle: string;
  kilnBenchmarkPct?: number;
  millBenchmarkPct?: number;
}

export const DailyEfficiencyTrackingSection: React.FC<DailyEfficiencyTrackingSectionProps> = ({
  dailyRecords,
  periodTitle,
  kilnBenchmarkPct = 68.2,
  millBenchmarkPct = 72.8,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTarget, setFilterTarget] = useState<'all' | 'underperforming'>('all');

  const filteredRecords = useMemo(() => {
    return dailyRecords.filter((rec) => {
      const matchSearch =
        rec.dayNumber.toString().includes(searchQuery) ||
        rec.jalaliDate.includes(searchQuery) ||
        (rec.notes && rec.notes.includes(searchQuery));

      if (!matchSearch) return false;

      if (filterTarget === 'underperforming') {
        return (
          (rec.clinkerTon > 0 && rec.kilnEfficiencyPct < kilnBenchmarkPct) ||
          (rec.totalCementTon > 0 && rec.cementMillEfficiencyPct < millBenchmarkPct)
        );
      }

      return true;
    });
  }, [dailyRecords, searchQuery, filterTarget, kilnBenchmarkPct, millBenchmarkPct]);

  const handleExportExcel = () => {
    const rows = dailyRecords.map((r) => ({
      'روز': r.dayNumber,
      'تاریخ': r.jalaliDate,
      'تولید کلینکر (ton)': r.clinkerTon,
      'راندمان کوره (٪)': r.kilnEfficiencyPct,
      'انحراف کوره از بنچ‌‌مارک (٪)': (r.kilnEfficiencyPct - kilnBenchmarkPct).toFixed(1),
      'تولید سیمان (ton)': r.totalCementTon,
      'راندمان آسیاب سیمان (٪)': r.cementMillEfficiencyPct,
      'انحراف آسیاب از بنچ‌مارک (٪)': (r.cementMillEfficiencyPct - millBenchmarkPct).toFixed(1),
      'شرح رویدادها و توقفات': r.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'راندمان_روزانه');
    XLSX.writeFile(wb, `کارنامه_راندمان_تجهیزات_بارز_${periodTitle.replace(/[\s\/]/g, '_')}.xlsx`);
  };

  return (
    <div className="enms-card p-5 space-y-4 mt-6 border border-[var(--color-border)] bg-[var(--color-bg-card)]" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              کارنامه تفکیکی راندمان روزانه کوره و آسیاب سیمان ({periodTitle})
            </h3>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              پایش انطباق عملکرد کاری با بنچ‌مارک استاندارد (کوره: {toPersianDigits(kilnBenchmarkPct)}٪ | آسیاب: {toPersianDigits(millBenchmarkPct)}٪)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-[var(--color-bg-card-subtle)] p-0.5 rounded-lg border border-[var(--color-border)] text-[11px]">
            <button
              onClick={() => setFilterTarget('all')}
              className={`px-2.5 py-1 rounded transition ${filterTarget === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
            >
              تمام روزها ({toPersianDigits(dailyRecords.length)})
            </button>
            <button
              onClick={() => setFilterTarget('underperforming')}
              className={`px-2.5 py-1 rounded transition ${filterTarget === 'underperforming' ? 'bg-rose-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
            >
              روزهای دارای انحراف راندمان
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی روز یا شرح..."
              className="enms-input text-xs pl-8 w-44"
            />
            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2 top-2.5" />
          </div>

          <button
            onClick={handleExportExcel}
            className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
            title="دانلود اکسل راندمان‌ها"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>اکسل راندمان</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-right text-xs">
          <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
            <tr>
              <th className="p-2.5 text-center w-12">روز</th>
              <th className="p-2.5 text-center">تاریخ</th>
              <th className="p-2.5 text-center">تولید کلینکر (ton)</th>
              <th className="p-2.5 text-center text-amber-500 font-bold">راندمان کاری کوره</th>
              <th className="p-2.5 text-center">وضعیت نسبت به بنچ‌مارک ({toPersianDigits(kilnBenchmarkPct)}٪)[cite: 44]</th>
              <th className="p-2.5 text-center">تولید سیمان (ton)</th>
              <th className="p-2.5 text-center text-cyan-400 font-bold">راندمان کاری آسیاب</th>
              <th className="p-2.5 text-center">وضعیت نسبت به بنچ‌مارک ({toPersianDigits(millBenchmarkPct)}٪)[cite: 44]</th>
              <th className="p-2.5">شرح فرآیندی و توقفات موثر بر راندمان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] font-mono">
            {filteredRecords.map((r) => {
              const kilnDiff = r.clinkerTon > 0 ? Number((r.kilnEfficiencyPct - kilnBenchmarkPct).toFixed(1)) : 0;
              const millDiff = r.totalCementTon > 0 ? Number((r.cementMillEfficiencyPct - millBenchmarkPct).toFixed(1)) : 0;

              return (
                <tr key={`${r.dayNumber}-${r.jalaliDate}`} className="hover:bg-[var(--color-bg-card-subtle)]/60 transition-colors">
                  <td className="p-2.5 text-center font-bold text-[var(--color-primary)]">
                    {toPersianDigits(r.dayNumber)}
                  </td>
                  <td className="p-2.5 text-center text-[var(--color-text-secondary)] whitespace-nowrap">
                    {toPersianDigits(r.jalaliDate)}
                  </td>
                  <td className="p-2.5 text-center text-amber-400">
                    {toPersianDigits(formatPersianNumber(r.clinkerTon))}
                  </td>

                  <td className="p-2.5 text-center font-bold text-sm text-[var(--color-text-primary)]">
                    {r.clinkerTon > 0 ? `${toPersianDigits(r.kilnEfficiencyPct)}٪` : '-'}
                  </td>
                  <td className="p-2.5 text-center font-sans text-[11px]">
                    {r.clinkerTon === 0 ? (
                      <span className="text-[var(--color-text-muted)]">توقف کامل</span>
                    ) : kilnDiff >= 0 ? (
                      <span className="text-emerald-400 font-medium inline-flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {toPersianDigits(Math.abs(kilnDiff))}٪+ بالاتر
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium inline-flex items-center gap-1 font-mono">
                        <TrendingDown className="w-3 h-3 text-rose-500" />
                        {toPersianDigits(Math.abs(kilnDiff))}٪- افت
                      </span>
                    )}
                  </td>

                  <td className="p-2.5 text-center text-cyan-400">
                    {toPersianDigits(formatPersianNumber(r.totalCementTon))}
                  </td>
                  <td className="p-2.5 text-center font-bold text-sm text-[var(--color-text-primary)]">
                    {r.totalCementTon > 0 ? `${toPersianDigits(r.cementMillEfficiencyPct)}٪` : '-'}
                  </td>
                  <td className="p-2.5 text-center font-sans text-[11px]">
                    {r.totalCementTon === 0 ? (
                      <span className="text-[var(--color-text-muted)]">توقف کامل</span>
                    ) : millDiff >= 0 ? (
                      <span className="text-emerald-400 font-medium inline-flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                        {toPersianDigits(Math.abs(millDiff))}٪+ بالاتر
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium inline-flex items-center gap-1 font-mono">
                        <TrendingDown className="w-3 h-3 text-rose-500" />
                        {toPersianDigits(Math.abs(millDiff))}٪- افت
                      </span>
                    )}
                  </td>

                  <td className="p-2.5 text-[11px] font-sans text-[var(--color-text-muted)] max-w-xs truncate" title={r.notes}>
                    {r.notes || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyEfficiencyTrackingSection;