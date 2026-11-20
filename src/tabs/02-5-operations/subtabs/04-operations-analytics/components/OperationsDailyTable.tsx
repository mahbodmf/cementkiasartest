import React, { useState, useMemo } from 'react';
import { BarChart3, Filter, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { DailyIntegratedRecord, DepartmentFilter, ACCEPTANCE_CRITERIA } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

export interface OperationsDailyTableProps {
  records: DailyIntegratedRecord[];
}

export const OperationsDailyTable: React.FC<OperationsDailyTableProps> = ({ records }) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<DepartmentFilter>('all');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'non-compliant'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // فیلتر جستجو بر اساس تاریخ یا علت توقف
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesDate = r.jalaliDate.includes(q) || String(r.dayNumber).includes(q);
        const matchesCause =
          (r.kilnStopCauses && r.kilnStopCauses.toLowerCase().includes(q)) ||
          (r.millStopCauses && r.millStopCauses.toLowerCase().includes(q)) ||
          (r.rawMillStopCauses && r.rawMillStopCauses.toLowerCase().includes(q)) ||
          (r.crusherStopCauses && r.crusherStopCauses.toLowerCase().includes(q));
        if (!matchesDate && !matchesCause) return false;
      }

      // فیلتر انطباق حرارتی
      if (complianceFilter === 'compliant') {
        if (r.secThermal > ACCEPTANCE_CRITERIA.secThermalMax) return false;
      } else if (complianceFilter === 'non-compliant') {
        if (r.secThermal <= ACCEPTANCE_CRITERIA.secThermalMax) return false;
      }

      // فیلتر تجهیز
      if (selectedDeptFilter === 'kiln' && r.kilnRunHours === 0 && r.kilnStopHours === 0) {
        return true;
      }
      return true;
    });
  }, [records, searchQuery, complianceFilter, selectedDeptFilter]);

  const deptLabels: Record<DepartmentFilter, string> = {
    all: 'تمام خطوط',
    kiln: 'کوره پخت',
    cementMill: 'آسیاب سیمان',
    rawMill: 'آسیاب مواد',
    crusher: 'سنگ‌شکن',
  };

  return (
    <div className="enms-card" dir="rtl">
      {/* هدر و کنترل‌های فیلتر */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">
              ماتریس جامع روزانه عملیات: تولید، توقفات، OEE و انطباق استاندارد
            </h3>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              واکشی همگام و ممیزی تقاطعی از گزارش روزانه تولید، لاگ‌شیت توقفات دپارتمان‌ها و بارگیرخانه
            </p>
          </div>
        </div>

        {/* فیلترهای جستجو، تجهیز و انطباق */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* جعبه جستجو */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی روز یا علت..."
              className="enms-input px-2.5 py-1.5 pr-7 text-xs w-36 sm:w-44"
            />
            <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
          </div>

          {/* فیلتر انطباق */}
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value as any)}
            className="enms-select text-xs"
          >
            <option value="all">تمام وضعیت‌ها</option>
            <option value="compliant">فقط منطبق (SEC مجاز)</option>
            <option value="non-compliant">دارای انحراف و تخطی</option>
          </select>

          {/* فیلتر تجهیز */}
          <div className="flex items-center gap-1 bg-[var(--color-bg-card-subtle)] p-1 rounded-lg border border-[var(--color-border)]">
            <Filter className="w-3 h-3 text-[var(--color-text-muted)] mr-1" />
            {(['all', 'kiln', 'cementMill', 'rawMill', 'crusher'] as DepartmentFilter[]).map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-2 py-0.5 rounded text-[11px] transition whitespace-nowrap ${
                  selectedDeptFilter === dept
                    ? 'bg-[var(--color-primary)] text-white font-bold shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {deptLabels[dept]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* جدول داده‌ها */}
      <div className="enms-table-container mt-4">
        <table className="enms-table text-xs">
          <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium select-none">
            <tr>
              <th className="p-2.5 text-center w-12">روز</th>
              <th className="p-2.5 text-center whitespace-nowrap">تاریخ</th>
              <th className="p-2.5 text-center text-amber-400">تولید کلینکر</th>
              <th className="p-2.5 text-center text-cyan-400">تولید سیمان</th>
              <th className="p-2.5 text-center text-purple-400">تحویل بارگیرخانه</th>

              {selectedDeptFilter === 'all' && (
                <>
                  <th className="p-2.5 text-center text-emerald-400">کارکرد کوره (h)</th>
                  <th className="p-2.5 text-center text-rose-400">توقف کوره (h)</th>
                  <th className="p-2.5 text-center text-emerald-400 font-bold">OEE کوره</th>
                </>
              )}
              {selectedDeptFilter === 'kiln' && (
                <>
                  <th className="p-2.5 text-center text-emerald-400">کارکرد کوره (h)</th>
                  <th className="p-2.5 text-center text-rose-400">توقف کوره (h)</th>
                  <th className="p-2.5 text-center text-emerald-400 font-bold">OEE کوره</th>
                </>
              )}
              {selectedDeptFilter === 'cementMill' && (
                <>
                  <th className="p-2.5 text-center text-cyan-400">کارکرد آسیاب (h)</th>
                  <th className="p-2.5 text-center text-rose-400">توقف آسیاب (h)</th>
                </>
              )}
              {selectedDeptFilter === 'rawMill' && (
                <>
                  <th className="p-2.5 text-center text-amber-400">کارکرد آس مواد (h)</th>
                  <th className="p-2.5 text-center text-rose-400">توقف آس مواد (h)</th>
                </>
              )}
              {selectedDeptFilter === 'crusher' && (
                <>
                  <th className="p-2.5 text-center text-purple-400">کارکرد سنگ‌شکن (h)</th>
                  <th className="p-2.5 text-center text-rose-400">توقف سنگ‌شکن (h)</th>
                </>
              )}

              <th className="p-2.5 text-center text-amber-400">SEC حرارتی</th>
              <th className="p-2.5 text-center text-cyan-400">SEC برق</th>
              <th className="p-2.5 text-center">وضعیت انطباق حرارتی</th>
              <th className="p-2.5 min-w-[200px]">شرح و علل ریشه‌ای توقفات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] font-mono text-[11px]">
            {filteredRecords.map((r, idx) => {
              const isThermalOk = r.secThermal <= ACCEPTANCE_CRITERIA.secThermalMax;

              // انتخاب متن علت توقف بر اساس تجهیز فیلترشده
              let deptStopCause = r.kilnStopCauses;
              if (selectedDeptFilter === 'cementMill') deptStopCause = r.millStopCauses;
              else if (selectedDeptFilter === 'rawMill') deptStopCause = r.rawMillStopCauses;
              else if (selectedDeptFilter === 'crusher') deptStopCause = r.crusherStopCauses;
              else {
                deptStopCause = r.kilnStopCauses || r.millStopCauses || r.rawMillStopCauses || r.crusherStopCauses;
              }

              return (
                <tr key={`${r.jalaliDate || r.dayNumber}-${idx}`} className="hover:bg-[var(--color-bg-card-subtle)] transition-colors">
                  <td className="p-2.5 text-center font-bold text-emerald-400">{toPersianDigits(r.dayNumber)}</td>
                  <td className="p-2.5 text-center text-[var(--color-text-muted)] whitespace-nowrap">{toPersianDigits(r.jalaliDate)}</td>
                  <td className="p-2.5 text-center text-amber-300 font-semibold">
                    {r.clinkerTon > 0 ? toPersianDigits(formatPersianNumber(r.clinkerTon)) : '-'}
                  </td>
                  <td className="p-2.5 text-center text-cyan-300 font-semibold">
                    {r.cementTon > 0 ? toPersianDigits(formatPersianNumber(r.cementTon)) : '-'}
                  </td>
                  <td className="p-2.5 text-center text-purple-300 font-semibold">
                    {r.dispatchTon > 0 ? toPersianDigits(formatPersianNumber(r.dispatchTon)) : '-'}
                  </td>

                  {/* کارکرد و توقف تجهیزات بر اساس فیلتر */}
                  {(selectedDeptFilter === 'all' || selectedDeptFilter === 'kiln') && (
                    <>
                      <td className="p-2.5 text-center text-emerald-400 font-bold">{toPersianDigits(r.kilnRunHours.toFixed(1))}</td>
                      <td className="p-2.5 text-center text-rose-400 font-bold">{toPersianDigits(r.kilnStopHours.toFixed(1))}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-300">
                        {r.kilnOEE > 0 ? `${toPersianDigits(r.kilnOEE.toFixed(1))}٪` : '-'}
                      </td>
                    </>
                  )}
                  {selectedDeptFilter === 'cementMill' && (
                    <>
                      <td className="p-2.5 text-center text-cyan-400 font-bold">{toPersianDigits(r.millRunHours.toFixed(1))}</td>
                      <td className="p-2.5 text-center text-rose-400 font-bold">{toPersianDigits(r.millStopHours.toFixed(1))}</td>
                    </>
                  )}
                  {selectedDeptFilter === 'rawMill' && (
                    <>
                      <td className="p-2.5 text-center text-amber-400 font-bold">{toPersianDigits(r.rawMillRunHours.toFixed(1))}</td>
                      <td className="p-2.5 text-center text-rose-400 font-bold">{toPersianDigits(r.rawMillStopHours.toFixed(1))}</td>
                    </>
                  )}
                  {selectedDeptFilter === 'crusher' && (
                    <>
                      <td className="p-2.5 text-center text-purple-400 font-bold">{toPersianDigits(r.crusherRunHours.toFixed(1))}</td>
                      <td className="p-2.5 text-center text-rose-400 font-bold">{toPersianDigits(r.crusherStopHours.toFixed(1))}</td>
                    </>
                  )}

                  <td className="p-2.5 text-center text-amber-400">
                    {r.secThermal > 0 ? toPersianDigits(Math.round(r.secThermal)) : '-'}
                  </td>
                  <td className="p-2.5 text-center text-cyan-400">
                    {r.secElectrical > 0 ? toPersianDigits(r.secElectrical.toFixed(1)) : '-'}
                  </td>

                  {/* وضعیت انطباق */}
                  <td className="p-2.5 text-center font-sans">
                    {r.secThermal > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isThermalOk
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/80'
                        }`}
                      >
                        {isThermalOk ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>منطبق</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>+{toPersianDigits(Math.round(r.thermalDeviation))} kcal</span>
                          </>
                        )}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">-</span>
                    )}
                  </td>

                  {/* شرح علل توقفات */}
                  <td
                    className="p-2.5 font-sans text-[var(--color-text-secondary)] max-w-xs truncate"
                    title={deptStopCause || 'تولید عادی و بدون توقف بحرانی'}
                  >
                    {deptStopCause || 'تولید عادی و بدون توقف بحرانی'}
                  </td>
                </tr>
              );
            })}

            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={12} className="p-8 text-center text-[var(--color-text-muted)] font-sans">
                  موردی با شرایط فیلتر انتخاب‌شده یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OperationsDailyTable;
