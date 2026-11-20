/**
 * Opportunity AHP Evaluation Modal
 * مدال ارزیابی و امتیازدهی اختصاصی به یک فرصت بر پایه ۵ معیار کلیدی AHP
 */

import React, { useState, useEffect } from 'react';
import { Award, X } from 'lucide-react';
import { EnergyOpportunityItem, AHPWeightCriteria } from '../../../../../types';
import { calculateAHPScore } from '../../../../../utils/ahpCalculator';

interface OpportunityAhpModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: EnergyOpportunityItem | null;
  weights: AHPWeightCriteria;
  onSaveEvaluation: (updated: EnergyOpportunityItem) => void;
}

export const OpportunityAhpModal: React.FC<OpportunityAhpModalProps> = ({
  isOpen,
  onClose,
  opportunity,
  weights,
  onSaveEvaluation,
}) => {
  const [criteriaScores, setCriteriaScores] = useState({
    energySavingScore: 4,
    economicScore: 4,
    feasibilityRiskScore: 3,
    hseImpactScore: 3,
    supplyChainScore: 4,
  });

  useEffect(() => {
    if (opportunity?.ahp) {
      setCriteriaScores({
        energySavingScore: opportunity.ahp.energySavingScore,
        economicScore: opportunity.ahp.economicScore,
        feasibilityRiskScore: opportunity.ahp.feasibilityRiskScore,
        hseImpactScore: opportunity.ahp.hseImpactScore,
        supplyChainScore: opportunity.ahp.supplyChainScore,
      });
    }
  }, [opportunity]);

  if (!isOpen || !opportunity) return null;

  const handleSave = () => {
    const newAHP = calculateAHPScore(criteriaScores, weights);
    const updated: EnergyOpportunityItem = {
      ...opportunity,
      ahp: newAHP,
    };
    onSaveEvaluation(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn" dir="rtl">
      <div className="enms-card max-w-lg w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                ارزیابی چندمعیاره AHP: {opportunity.id}
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] truncate max-w-xs">{opportunity.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {[
            { key: 'energySavingScore', title: '۱. پتانسیل کاهش مصرف ویژه انرژی کوره و آسیاب‌ها' },
            { key: 'economicScore', title: '۲. توجیه مالی، دوره بازگشت سرمایه و تناسب CAPEX' },
            { key: 'feasibilityRiskScore', title: '۳. سهولت فنی اجرا و عدم ایجاد توقف اضطراری' },
            { key: 'hseImpactScore', title: '۴. کاهش غبار خروجی دودکش و بهبود شاخص‌های HSE' },
            { key: 'supplyChainScore', title: '۵. در دسترس بودن قطعات یدکی و امکان ساخت داخل' },
          ].map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--color-bg-app)]">
              <span className="text-[var(--color-text-secondary)] font-medium">{c.title}</span>
              <select
                value={(criteriaScores as any)[c.key]}
                onChange={(e) =>
                  setCriteriaScores({
                    ...criteriaScores,
                    [c.key]: Number(e.target.value),
                  })
                }
                className="enms-select !py-1 !px-2 font-mono font-bold text-xs"
              >
                <option value={5}>۵ - بسیار مطلوب (عالی)</option>
                <option value={4}>۴ - مطلوب (خوب)</option>
                <option value={3}>۳ - متوسط (قابل قبول)</option>
                <option value={2}>۲ - نامطلوب (سخت/پرهزینه)</option>
                <option value={1}>۱ - بحرانی / بسیار ضعیف</option>
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          <button
            onClick={onClose}
            className="enms-button enms-button-secondary text-xs px-3 py-1.5"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="enms-button enms-button-primary text-xs px-4 py-1.5"
          >
            محاسبه رتبه و ذخیره
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpportunityAhpModal;
