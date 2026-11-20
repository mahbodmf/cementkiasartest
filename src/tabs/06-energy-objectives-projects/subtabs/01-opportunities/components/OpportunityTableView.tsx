/**
 * Opportunity Table View Component
 * نمای ماتریس جدولی فرصت‌های بهبود با ستون‌های کامل مالی، SEU و رتبه‌بندی AHP
 */

import React from 'react';
import { ArrowUpRight, Edit2, Sliders, Trash2 } from 'lucide-react';
import { EnergyOpportunityItem } from '../../../../../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

interface OpportunityTableViewProps {
  opportunities: EnergyOpportunityItem[];
  onOpenEdit: (op: EnergyOpportunityItem) => void;
  onOpenAhp: (op: EnergyOpportunityItem) => void;
  onDelete: (id: string, title: string) => void;
  onPromote: (op: EnergyOpportunityItem) => void;
  getRankBadgeClass: (rank?: string) => string;
}

export const OpportunityTableView: React.FC<OpportunityTableViewProps> = ({
  opportunities,
  onOpenEdit,
  onOpenAhp,
  onDelete,
  onPromote,
  getRankBadgeClass,
}) => {
  return (
    <div className="enms-card p-0 overflow-hidden" dir="rtl">
      <div className="enms-table-container border-0 rounded-none overflow-x-auto">
        <table className="enms-table text-xs">
          <thead>
            <tr>
              <th className="w-12 text-center">رتبه</th>
              <th className="w-20 text-center">کد</th>
              <th className="min-w-[200px]">عنوان فرصت بهینه‌سازی</th>
              <th className="w-24 text-center">دپارتمان</th>
              <th className="w-28 text-center">تجهیز (SEU)</th>
              <th className="w-24 text-center">صرفه‌جویی (م.ر)</th>
              <th className="w-24 text-center">سرمایه (م.ر)</th>
              <th className="w-20 text-center">بازگشت</th>
              <th className="w-28 text-center">امتیاز AHP</th>
              <th className="w-28 text-center">وضعیت رتبه</th>
              <th className="w-32 text-center">عملیات مدیریت</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((op, idx) => (
              <tr key={op.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                <td className="text-center font-mono font-bold text-[var(--color-text-muted)]">
                  #{toPersianDigits(idx + 1)}
                </td>
                <td className="text-center font-mono font-bold text-[var(--color-primary)]">
                  {op.id}
                </td>
                <td>
                  <div className="font-bold text-[var(--color-text-primary)]">{op.title}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-xs">{op.description}</div>
                </td>
                <td className="text-center text-[var(--color-text-secondary)]">{op.department}</td>
                <td className="text-center text-[var(--color-text-secondary)]">{op.targetSEU}</td>
                <td className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPersianNumber(op.estimatedFinancialSavingMillionRials)}
                </td>
                <td className="text-center font-mono">{formatPersianNumber(op.estimatedCapexMillionRials)}</td>
                <td className="text-center font-mono text-cyan-600 dark:text-cyan-400">
                  {toPersianDigits(op.simplePaybackYears)} سال
                </td>
                <td className="text-center">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-primary)]">
                    {toPersianDigits(op.ahp?.finalScore || 0)} / ۱۰۰
                  </span>
                </td>
                <td className="text-center">
                  <span className={`enms-badge text-[10px] font-bold ${getRankBadgeClass(op.ahp?.priorityRank)}`}>
                    {op.ahp?.priorityRank}
                  </span>
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onOpenAhp(op)}
                      className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-amber-500"
                      title="امتیازدهی AHP"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEdit(op)}
                      className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                      title="ویرایش فرصت"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(op.id, op.title)}
                      className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-rose-500"
                      title="حذف فرصت"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {op.promotedToProjectId ? (
                      <span className="text-[10px] font-mono text-emerald-500 font-bold px-1" title="تبدیل شده به پروژه">
                        ✓ {op.promotedToProjectId}
                      </span>
                    ) : (
                      <button
                        onClick={() => onPromote(op)}
                        className="p-1 rounded bg-[var(--color-primary-bg)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                        title="ارتقا به پروژه اجرایی"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpportunityTableView;
