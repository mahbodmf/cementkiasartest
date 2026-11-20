/**
 * Opportunity Matrix View Component
 * ماتریس ۲ بعدی اولویت‌بندی استراتژیک (Quick Wins vs. Strategic CAPEX vs. Maintenance Tweaks vs. Re-evaluate)
 */

import React from 'react';
import { EnergyOpportunityItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface OpportunityMatrixViewProps {
  opportunities: EnergyOpportunityItem[];
  onOpenEdit?: (op: EnergyOpportunityItem) => void;
  onOpenAhp?: (op: EnergyOpportunityItem) => void;
}

export const OpportunityMatrixView: React.FC<OpportunityMatrixViewProps> = ({
  opportunities,
  onOpenEdit,
  onOpenAhp,
}) => {
  return (
    <div className="enms-card p-6" dir="rtl">
      <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
        ماتریس اولویت‌بندی دوبعدی دستاوردها (Quick Wins vs Strategic)
      </h3>
      <div className="grid grid-cols-2 gap-3 min-h-[350px]">
        {/* ۱. دستاوردهای سریع و طلایی */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ⚡ دستاوردهای سریع و طلایی (Quick Wins)
          </span>
          <div className="space-y-1.5 my-2">
            {opportunities
              .filter((op) => (op.ahp?.finalScore || 0) >= 75)
              .map((op) => (
                <div
                  key={op.id}
                  onClick={() => onOpenAhp?.(op)}
                  className="p-2 rounded bg-[var(--color-bg-surface)] border border-emerald-500/30 text-[11px] flex items-center justify-between shadow-xs cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[170px]">
                    {op.title}
                  </span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {toPersianDigits(op.ahp?.finalScore || 0)}
                  </span>
                </div>
              ))}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">اقدام فوری</span>
        </div>

        {/* ۲. پروژه‌های استراتژیک سرمایه‌ای */}
        <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col justify-between">
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
            🏛️ پروژه‌های استراتژیک سرمایه‌ای (CAPEX بالا)
          </span>
          <div className="space-y-1.5 my-2">
            {opportunities
              .filter((op) => (op.ahp?.finalScore || 0) >= 60 && (op.ahp?.finalScore || 0) < 75)
              .map((op) => (
                <div
                  key={op.id}
                  onClick={() => onOpenAhp?.(op)}
                  className="p-2 rounded bg-[var(--color-bg-surface)] border border-sky-500/30 text-[11px] flex items-center justify-between shadow-xs cursor-pointer hover:border-sky-500 transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[170px]">
                    {op.title}
                  </span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                    {toPersianDigits(op.ahp?.finalScore || 0)}
                  </span>
                </div>
              ))}
          </div>
          <span className="text-[10px] text-sky-600 font-semibold">تأمین مالی</span>
        </div>

        {/* ۳. بهینه‌سازی‌های نگهداری */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            🔧 بهبودهای روتین نگهداری
          </span>
          <div className="space-y-1.5 my-2">
            {opportunities
              .filter((op) => op.type.includes('بدون') && (op.ahp?.finalScore || 0) < 60)
              .map((op) => (
                <div
                  key={op.id}
                  onClick={() => onOpenAhp?.(op)}
                  className="p-2 rounded bg-[var(--color-bg-surface)] border border-amber-500/30 text-[11px] flex items-center justify-between shadow-xs cursor-pointer hover:border-amber-500 transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[170px]">
                    {op.title}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {toPersianDigits(op.ahp?.finalScore || 0)}
                  </span>
                </div>
              ))}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">عملیات نت</span>
        </div>

        {/* ۴. اولویت ج و مشروط */}
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            ⏳ اولویت ج و مشروط
          </span>
          <div className="space-y-1.5 my-2">
            {opportunities
              .filter((op) => (op.ahp?.finalScore || 0) < 55)
              .map((op) => (
                <div
                  key={op.id}
                  onClick={() => onOpenAhp?.(op)}
                  className="p-2 rounded bg-[var(--color-bg-surface)] border border-rose-500/30 text-[11px] flex items-center justify-between shadow-xs cursor-pointer hover:border-rose-500 transition-colors"
                >
                  <span className="font-bold text-[var(--color-text-primary)] truncate max-w-[170px]">
                    {op.title}
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">
                    {toPersianDigits(op.ahp?.finalScore || 0)}
                  </span>
                </div>
              ))}
          </div>
          <span className="text-[10px] text-rose-600 font-semibold">تعلیق موقت</span>
        </div>
      </div>
    </div>
  );
};

export default OpportunityMatrixView;
