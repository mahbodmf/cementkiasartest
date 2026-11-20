import React, { useState } from 'react';
import { DailyProductionRecord } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { BarChart3, Search, Edit2 } from 'lucide-react';

interface ProductionDailyTableProps {
  records: DailyProductionRecord[];
  periodTitle: string;
  onEditRow: (record: DailyProductionRecord) => void;
}

export const ProductionDailyTable: React.FC<ProductionDailyTableProps> = ({
  records,
  periodTitle,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
          <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
            کارنامه تفکیکی تولید روزانه - {periodTitle}
          </h3>
          <span className="enms-badge badge-success text-[10px]">
            {toPersianDigits(records.length)} روز ثبت‌شده
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره روز یا توضیحات..."
              className="enms-input text-xs pl-8 w-60"
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
              <th className="p-2.5 text-center">خوراک کوره (ton)</th>
              <th className="p-2.5 text-center">کلینکر (ton)</th>
              <th className="p-2.5 text-center">سیمان تیپ ۲ (ton)</th>
              <th className="p-2.5 text-center">سیمان پوزولانی (ton)</th>
              <th className="p-2.5 text-center font-bold">مجموع سیمان (ton)</th>
              <th className="p-2.5 text-center">SEC حرارتی</th>
              <th className="p-2.5 text-center">SEC الکتریکی</th>
              <th className="p-2.5">رویدادهای فرآیندی</th>
              <th className="p-2.5 text-center w-10">ویرایش</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] font-mono">
            {filteredRecords.map((row) => (
              <tr key={`${row.dayNumber}-${row.jalaliDate}`} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors">
                <td className="p-2.5 text-center font-bold text-[var(--color-primary)]">
                  {toPersianDigits(row.dayNumber)}
                </td>
                <td className="p-2.5 text-center text-[var(--color-text-secondary)] whitespace-nowrap">
                  {toPersianDigits(row.jalaliDate)}
                </td>
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