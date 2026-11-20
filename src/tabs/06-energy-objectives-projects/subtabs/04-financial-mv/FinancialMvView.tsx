import React, { useState } from 'react';
import {
  Calculator,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { FinancialAndMVItem, EnergyProjectItem } from '../../../../types';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { FinancialMvModal } from './FinancialMvModal';

interface FinancialMvViewProps {
  financialData: FinancialAndMVItem[];
  summary: {
    totalCapexBudgetMillionRials: number;
    totalAnnualFinancialSavingMillionRials: number;
    achievedSavingPct: number;
  };
  projects: EnergyProjectItem[];
  onAddFinancialMv?: (item: FinancialAndMVItem) => void;
  onUpdateFinancialMv?: (item: FinancialAndMVItem) => void;
  onDeleteFinancialMv?: (projectId: string) => void;
}

export const FinancialMvView: React.FC<FinancialMvViewProps> = ({
  financialData,
  summary,
  projects,
  onAddFinancialMv,
  onUpdateFinancialMv,
  onDeleteFinancialMv,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialAndMVItem | null>(null);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FinancialAndMVItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (projectId: string, title: string) => {
    if (window.confirm(`آیا از حذف رکورد صحه‌گذاری پروژه "${title}" با کد ${projectId} اطمینان دارید؟`)) {
      if (onDeleteFinancialMv) {
        onDeleteFinancialMv(projectId);
      }
    }
  };

  const handleSave = (item: FinancialAndMVItem) => {
    if (editingItem && onUpdateFinancialMv) {
      onUpdateFinancialMv(item);
    } else if (onAddFinancialMv) {
      onAddFinancialMv(item);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" dir="rtl">
      {/* کارت‌های خلاصه مالی */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="enms-card p-4">
          <span className="text-xs text-[var(--color-text-muted)]">مجموع بودجه مصوب (CAPEX)</span>
          <div className="text-xl font-bold font-mono text-[var(--color-text-primary)] mt-1">
            {formatPersianNumber(summary.totalCapexBudgetMillionRials)} <span className="text-xs font-sans text-[var(--color-text-muted)]">میلیون ریال</span>
          </div>
        </div>

        <div className="enms-card p-4">
          <span className="text-xs text-[var(--color-text-muted)]">صرفه‌جویی مالی سالانه مصوب</span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatPersianNumber(summary.totalAnnualFinancialSavingMillionRials)} <span className="text-xs font-sans text-[var(--color-text-muted)]">میلیون ریال</span>
          </div>
        </div>

        <div className="enms-card p-4">
          <span className="text-xs text-[var(--color-text-muted)]">نرخ تحقق صرفه‌جویی</span>
          <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {toPersianDigits(summary.achievedSavingPct)}٪
          </div>
        </div>
      </div>

      {/* جدول پروتکل اندازه‌گیری و صحه‌گذاری (IPMVP) */}
      <div className="enms-card p-0 overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              نتایج اندازه‌گیری و صحه‌گذاری صرفه‌جویی مطابق استاندارد IPMVP (بند ۹.۱)
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="enms-button enms-button-primary text-xs flex items-center gap-1.5 shrink-0 justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت رکورد صحه‌گذاری M&V</span>
          </button>
        </div>

        <div className="enms-table-container border-0 rounded-none overflow-x-auto">
          <table className="enms-table text-xs">
            <thead>
              <tr>
                <th className="w-20 text-center">کد پروژه</th>
                <th className="min-w-[180px]">عنوان پروژه</th>
                <th>روش صحه‌گذاری (IPMVP Option)</th>
                <th className="w-28 text-center">صرفه‌جویی مالی</th>
                <th className="w-24 text-center">ارزش فعلی (NPV)</th>
                <th className="w-20 text-center">IRR</th>
                <th className="w-24 text-center">دوره بازگشت</th>
                <th className="w-28 text-center">وضعیت M&V</th>
                <th className="w-16 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map((item) => (
                <tr key={item.projectId} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="text-center font-mono font-bold text-[var(--color-primary)]">
                    {item.projectId}
                  </td>
                  <td className="font-bold text-[var(--color-text-primary)]">
                    <div>{item.projectTitle}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] font-normal mt-0.5">
                      صحه‌گذار: {item.verifier}
                    </div>
                  </td>
                  <td className="text-[var(--color-text-secondary)]">
                    <div>{item.mvOption}</div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                      مبنا: {item.baselinePeriod} | گزارش: {item.reportingPeriod}
                    </span>
                  </td>
                  <td className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPersianNumber(item.verifiedFinancialSavingMillionRialsYear)} م.ر
                  </td>
                  <td className="text-center font-mono text-[var(--color-text-primary)]">
                    {formatPersianNumber(item.npvMillionRials)} م.ر
                  </td>
                  <td className="text-center font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    {toPersianDigits(item.irrPct)}٪
                  </td>
                  <td className="text-center font-mono text-[var(--color-text-primary)]">
                    {toPersianDigits(item.paybackActualYears)} سال
                  </td>
                  <td className="text-center">
                    <span
                      className={`enms-badge text-[10px] ${
                        item.mvStatus === 'منطبق بر IPMVP'
                          ? 'badge-success'
                          : item.mvStatus === 'در حال جمع‌آوری داده'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {item.mvStatus}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        title="ویرایش رکورد M&V"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.projectId, item.projectTitle)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="حذف رکورد M&V"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال ایجاد و ویرایش */}
      <FinancialMvModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingItem}
        availableProjects={projects}
      />
    </div>
  );
};

export default FinancialMvView;
