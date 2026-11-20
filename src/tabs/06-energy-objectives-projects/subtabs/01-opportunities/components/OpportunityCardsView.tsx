/**
 * Opportunity Cards View Component
 * نمای کارت‌های هوشمند فرصت‌های بهبود با نمایش امتیازات تفکیکی ۵گانه AHP
 */

import React from 'react';
import { ArrowUpRight, CheckCircle2, Edit2, Sliders, Trash2 } from 'lucide-react';
import { EnergyOpportunityItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface OpportunityCardsViewProps {
  opportunities: EnergyOpportunityItem[];
  onOpenEdit: (op: EnergyOpportunityItem) => void;
  onOpenAhp: (op: EnergyOpportunityItem) => void;
  onDelete: (id: string, title: string) => void;
  onPromote: (op: EnergyOpportunityItem) => void;
  getRankBadgeClass: (rank?: string) => string;
}

export const OpportunityCardsView: React.FC<OpportunityCardsViewProps> = ({
  opportunities,
  onOpenEdit,
  onOpenAhp,
  onDelete,
  onPromote,
  getRankBadgeClass,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
      {opportunities.map((op, idx) => {
        const ahp = op.ahp;
        return (
          <div
            key={op.id}
            className="enms-card p-5 flex flex-col justify-between border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[var(--color-primary-bg)] text-[var(--color-primary)] text-xs font-mono font-bold flex items-center justify-center">
                    #{toPersianDigits(idx + 1)}
                  </span>
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">
                    {op.id}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`enms-badge text-[10px] font-bold ${getRankBadgeClass(ahp?.priorityRank)}`}>
                    {ahp?.priorityRank}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-primary)]">
                    {toPersianDigits(ahp?.finalScore || 0)} / ۱۰۰
                  </span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
                {op.title}
              </h3>

              <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] mt-1.5 flex-wrap">
                <span>واحد: <strong className="text-[var(--color-text-secondary)]">{op.department}</strong></span>
                <span>•</span>
                <span>تجهیز: <strong className="text-[var(--color-text-secondary)]">{op.targetSEU}</strong></span>
              </div>

              <p className="text-xs text-[var(--color-text-secondary)] mt-2.5 leading-relaxed text-justify bg-[var(--color-bg-card-subtle)] p-2.5 rounded-lg border border-[var(--color-border-subtle)]">
                {op.description}
              </p>

              {/* خلاصه معیارهای ۵گانه AHP */}
              <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] grid grid-cols-5 gap-1 text-center text-[10px]">
                <div className="p-1 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-muted)] block">صرفه‌جویی</span>
                  <strong className="text-amber-500 font-bold">{toPersianDigits(ahp?.energySavingScore || 0)}/۵</strong>
                </div>
                <div className="p-1 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-muted)] block">اقتصادی</span>
                  <strong className="text-emerald-500 font-bold">{toPersianDigits(ahp?.economicScore || 0)}/۵</strong>
                </div>
                <div className="p-1 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-muted)] block">سهولت</span>
                  <strong className="text-sky-500 font-bold">{toPersianDigits(ahp?.feasibilityRiskScore || 0)}/۵</strong>
                </div>
                <div className="p-1 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-muted)] block">HSE</span>
                  <strong className="text-purple-500 font-bold">{toPersianDigits(ahp?.hseImpactScore || 0)}/۵</strong>
                </div>
                <div className="p-1 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-muted)] block">تأمین</span>
                  <strong className="text-indigo-500 font-bold">{toPersianDigits(ahp?.supplyChainScore || 0)}/۵</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onOpenEdit(op)}
                  className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                  title="ویرایش"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(op.id, op.title)}
                  className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-rose-500"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAhp(op)}
                  className="enms-button enms-button-secondary !py-1 !px-2 text-xs flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3 text-[var(--color-primary)]" />
                  <span>امتیازدهی AHP</span>
                </button>

                {op.promotedToProjectId ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>پروژه {op.promotedToProjectId}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onPromote(op)}
                    className="enms-button enms-button-primary !py-1 !px-2.5 text-xs flex items-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>ارتقا به پروژه</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OpportunityCardsView;
