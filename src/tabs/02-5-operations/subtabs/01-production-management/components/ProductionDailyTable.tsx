import React, { useState } from 'react';
import { DailyProductionRecord, DepartmentFilterMode } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { BarChart3, Search, Edit2 } from 'lucide-react';

interface ProductionDailyTableProps {
  records: DailyProductionRecord[];
  periodTitle: string;
  activeDept?: DepartmentFilterMode;
  onDeptChange?: (dept: DepartmentFilterMode) => void;
  onEditRow: (record: DailyProductionRecord) => void;
}

const DEPT_FILTERS: { id: DepartmentFilterMode; label: string }[] = [
  { id: 'all', label: 'همه واحدها' },
  { id: 'crusher', label: 'سنگ‌شکن' },
  { id: 'rawMill', label: 'آسیاب مواد خام' },
  { id: 'kiln', label: 'کوره و پخت' },
  { id: 'cementMill', label: 'آسیاب سیمان' },
];

export const ProductionDailyTable: React.FC<ProductionDailyTableProps> = ({
  records,
  periodTitle,
  activeDept = 'all',
  onDeptChange,
  onEditRow,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRecords = records.filter((rec) => {
    if (!searchQuery.trim()) return true;
    return (
      rec.dayNumber.toString().includes(searchQuery) ||
      rec.jalaliDate.includes(searchQuery) ||
      (rec.notes && rec.notes.includes(searchQuery))
    );
  });

  return (
    <div className="enms-card p-4 space-y-3" dir="rtl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 flex-wrap">
          <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
            کارنامه تفکیکی تولید روزانه - {periodTitle}
          </h3>
          <span className="enms-badge badge-success text-[10px]">
            {toPersianDigits(records.length)} روز ثبت‌شده
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onDeptChange && (
            <div className="enms-tab-pills text-[11px]">
              {DEPT_FILTERS.map((dept) => (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => onDeptChange(dept.id)}
                  className={`enms-tab-pill ${activeDept === dept.id ? 'active' : ''}`}
                >
                  {dept.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره روز یا توضیحات..."
              className="enms-input text-xs pl-8 w-56"
            />
            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-right text-xs">
          <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
            <tr>
              <th className="p-2.5 text-center w-12">روز</th>
              <th className="p-2.5 text-center">تاریخ شمسی</th>

              {activeDept === 'all' && (
                <>
                  <th className="p-2.5 text-center">خوراک کوره (ton)</th>
                  <th className="p-2.5 text-center">کلینکر (ton)</th>
                  <th className="p-2.5 text-center">سیمان تیپ ۲ (ton)</th>
                  <th className="p-2.5 text-center">سیمان پوزولانی (ton)</th>
                  <th className="p-2.5 text-center font-bold">مجموع سیمان (ton)</th>
                  <th className="p-2.5 text-center">SEC حرارتی</th>
                  <th className="p-2.5 text-center">SEC الکتریکی</th>
                </>
              )}

              {activeDept === 'crusher' && (
                <>
                  <th className="p-2.5 text-center">رس ورودی (ton)</th>
                  <th className="p-2.5 text-center font-bold">تولید سنگ‌شکن (ton)</th>
                  <th className="p-2.5 text-center">برق پست ۱ (kWh)</th>
                  <th className="p-2.5 text-center">SEC سنگ‌شکن (kWh/t)</th>
                </>
              )}

              {activeDept === 'rawMill' && (
                <>
                  <th className="p-2.5 text-center">سنگ‌آهک (ton)</th>
                  <th className="p-2.5 text-center">رس (ton)</th>
                  <th className="p-2.5 text-center font-bold">پودر مواد خام (ton)</th>
                  <th className="p-2.5 text-center">برق پست ۲ (kWh)</th>
                  <th className="p-2.5 text-center">SEC آسیاب مواد (kWh/t)</th>
                </>
              )}

              {activeDept === 'kiln' && (
                <>
                  <th className="p-2.5 text-center">خوراک کوره (ton)</th>
                  <th className="p-2.5 text-center font-bold">تولید کلینکر (ton)</th>
                  <th className="p-2.5 text-center">برق پخت (kWh)</th>
                  <th className="p-2.5 text-center">SEC برق پخت (kWh/t)</th>
                  <th className="p-2.5 text-center">SEC حرارتی (kcal/kg)</th>
                </>
              )}

              {activeDept === 'cementMill' && (
                <>
                  <th className="p-2.5 text-center">سنگ گچ (ton)</th>
                  <th className="p-2.5 text-center font-bold">مجموع سیمان (ton)</th>
                  <th className="p-2.5 text-center">تحویل سیمان (ton)</th>
                  <th className="p-2.5 text-center">برق پست ۵ (kWh)</th>
                  <th className="p-2.5 text-center">SEC آسیاب سیمان (kWh/t)</th>
                </>
              )}

              <th className="p-2.5">رویدادهای فرآیندی</th>
              <th className="p-2.5 text-center w-10">ویرایش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] font-mono">
            {filteredRecords.map((row, idx) => (
              <tr key={`${row.jalaliDate || row.dayNumber}-${idx}`} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors">
                <td className="p-2.5 text-center font-bold text-[var(--color-primary)]">
                  {toPersianDigits(row.dayNumber)}
                </td>
                <td className="p-2.5 text-center text-[var(--color-text-secondary)] whitespace-nowrap">
                  {toPersianDigits(row.jalaliDate)}
                </td>

                {activeDept === 'all' && (
                  <>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.kilnFeedTon))}</td>
                    <td className="p-2.5 text-center font-bold text-amber-500">
                      {toPersianDigits(formatPersianNumber(row.clinkerTon))}
                    </td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.cementType2Ton))}</td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.cementPuzzolanicTon))}</td>
                    <td className="p-2.5 text-center font-bold text-cyan-600 dark:text-cyan-400">
                      {toPersianDigits(formatPersianNumber(row.totalCementTon))}
                    </td>
                    <td className="p-2.5 text-center text-amber-500 font-bold">
                      {toPersianDigits(row.secThermalKcalKg > 0 ? row.secThermalKcalKg : '-')}
                    </td>
                    <td className="p-2.5 text-center text-purple-500 font-bold">
                      {toPersianDigits(row.secElectricalKwhTon > 0 ? row.secElectricalKwhTon : '-')}
                    </td>
                  </>
                )}

                {activeDept === 'crusher' && (
                  <>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.crusherClayTon))}</td>
                    <td className="p-2.5 text-center font-bold text-cyan-500">
                      {toPersianDigits(formatPersianNumber(row.crusherTon))}
                    </td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.crusherKwh))}</td>
                    <td className={`p-2.5 text-center font-bold ${row.crusherSecKwhTon > 1.14 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {row.crusherSecKwhTon > 0 ? toPersianDigits(row.crusherSecKwhTon.toFixed(2)) : '-'}
                    </td>
                  </>
                )}

                {activeDept === 'rawMill' && (
                  <>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.rawMillLimestoneTon))}</td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.rawMillClayTon))}</td>
                    <td className="p-2.5 text-center font-bold text-blue-500">
                      {toPersianDigits(formatPersianNumber(row.rawMealTon))}
                    </td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.rawMillKwh))}</td>
                    <td className={`p-2.5 text-center font-bold ${row.rawMillSecKwhTon > 24 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {row.rawMillSecKwhTon > 0 ? toPersianDigits(row.rawMillSecKwhTon.toFixed(2)) : '-'}
                    </td>
                  </>
                )}

                {activeDept === 'kiln' && (
                  <>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.kilnFeedTon))}</td>
                    <td className="p-2.5 text-center font-bold text-amber-500">
                      {toPersianDigits(formatPersianNumber(row.clinkerTon))}
                    </td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.kilnKwh))}</td>
                    <td className={`p-2.5 text-center font-bold ${row.kilnElecSecKwhTon > 34 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {row.kilnElecSecKwhTon > 0 ? toPersianDigits(row.kilnElecSecKwhTon.toFixed(2)) : '-'}
                    </td>
                    <td className={`p-2.5 text-center font-bold ${row.secThermalKcalKg > 900 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {row.secThermalKcalKg > 0 ? toPersianDigits(row.secThermalKcalKg.toFixed(1)) : '-'}
                    </td>
                  </>
                )}

                {activeDept === 'cementMill' && (
                  <>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.gypsumTon))}</td>
                    <td className="p-2.5 text-center font-bold text-purple-500">
                      {toPersianDigits(formatPersianNumber(row.totalCementTon))}
                    </td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.dispatchTon))}</td>
                    <td className="p-2.5 text-center">{toPersianDigits(formatPersianNumber(row.cementMillKwh))}</td>
                    <td className={`p-2.5 text-center font-bold ${row.cementMillSecKwhTon > 38 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {row.cementMillSecKwhTon > 0 ? toPersianDigits(row.cementMillSecKwhTon.toFixed(2)) : '-'}
                    </td>
                  </>
                )}

                <td className="p-2.5 text-[11px] font-sans text-[var(--color-text-muted)] max-w-sm truncate" title={row.notes}>
                  {row.notes || '-'}
                </td>
                <td className="p-2.5 text-center font-sans">
                  <button
                    onClick={() => onEditRow(row)}
                    className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition"
                    title="ویرایش مقادیر روز"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionDailyTable;