/**
 * AHP Weights Modal Component
 * مدال تنظیم و کالیبراسیون اوزان معیارهای ۵‌گانه در متدولوژی تحلیل سلسله‌مراتبی AHP
 */

import React, { useState, useEffect } from 'react';
import { Sliders, RotateCcw, X } from 'lucide-react';
import { AHPWeightCriteria } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';
import { DEFAULT_AHP_WEIGHTS } from '../../../../../utils/ahpCalculator';

interface AhpWeightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weights: AHPWeightCriteria;
  onSaveWeights: (weights: AHPWeightCriteria) => void;
}

export const AhpWeightsModal: React.FC<AhpWeightsModalProps> = ({
  isOpen,
  onClose,
  weights,
  onSaveWeights,
}) => {
  const [localWeights, setLocalWeights] = useState<AHPWeightCriteria>(weights);

  useEffect(() => {
    setLocalWeights(weights);
  }, [weights, isOpen]);

  if (!isOpen) return null;

  const total =
    Number(localWeights.energySavingWeight || 0) +
    Number(localWeights.economicWeight || 0) +
    Number(localWeights.feasibilityRiskWeight || 0) +
    Number(localWeights.hseImpactWeight || 0) +
    Number(localWeights.supplyChainWeight || 0);

  const isNormalized = Math.abs(total - 1.0) < 0.01;

  const handleNormalize = () => {
    if (total <= 0) return;
    setLocalWeights({
      energySavingWeight: Number((localWeights.energySavingWeight / total).toFixed(2)),
      economicWeight: Number((localWeights.economicWeight / total).toFixed(2)),
      feasibilityRiskWeight: Number((localWeights.feasibilityRiskWeight / total).toFixed(2)),
      hseImpactWeight: Number((localWeights.hseImpactWeight / total).toFixed(2)),
      supplyChainWeight: Number((localWeights.supplyChainWeight / total).toFixed(2)),
    });
  };

  const handleResetToDefault = () => {
    setLocalWeights(DEFAULT_AHP_WEIGHTS);
  };

  const handleSave = () => {
    onSaveWeights(localWeights);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn" dir="rtl">
      <div className="enms-card max-w-lg w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                تنظیم اوزان نسبی معیارهای غربالگری AHP
              </h3>
              <p className="text-xs text-[var(--color-text-muted)]">تعیین وزن هر معیار بر مبنای سیاست‌های انرژی سازمان</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {[
            {
              key: 'energySavingWeight',
              label: 'پتانسیل صرفه‌جویی انرژی (کاهش مصارف ویژه):',
              color: 'accent-amber-500',
              val: localWeights.energySavingWeight,
            },
            {
              key: 'economicWeight',
              label: 'توجیه اقتصادی و دوره بازگشت سرمایه:',
              color: 'accent-emerald-500',
              val: localWeights.economicWeight,
            },
            {
              key: 'feasibilityRiskWeight',
              label: 'سهولت فنی، اجرا و عدم ریسک توقف خط تولید:',
              color: 'accent-sky-500',
              val: localWeights.feasibilityRiskWeight,
            },
            {
              key: 'hseImpactWeight',
              label: 'اثرات زیست‌محیطی، کاهش انتشار CO2 و غبار:',
              color: 'accent-purple-500',
              val: localWeights.hseImpactWeight,
            },
            {
              key: 'supplyChainWeight',
              label: 'تأمین داخلی قطعات و عدم وابستگی تحریمی:',
              color: 'accent-indigo-500',
              val: localWeights.supplyChainWeight,
            },
          ].map((item) => (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-text-secondary)] font-medium">{item.label}</span>
                <span className="font-mono font-bold text-xs text-[var(--color-primary)]">
                  {toPersianDigits(Math.round(item.val * 100))}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.60"
                step="0.05"
                value={item.val}
                onChange={(e) =>
                  setLocalWeights({
                    ...localWeights,
                    [item.key]: Number(e.target.value),
                  })
                }
                className={`w-full cursor-pointer ${item.color}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span>مجموع اوزان:</span>
            <strong className={`font-mono font-bold ${isNormalized ? 'text-emerald-500' : 'text-amber-500'}`}>
              {toPersianDigits(Math.round(total * 100))}%
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            {!isNormalized && (
              <button
                type="button"
                onClick={handleNormalize}
                className="enms-button enms-button-secondary !py-0.5 !px-2 text-[10px]"
              >
                نرمال‌سازی ۱۰۰٪
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="enms-button enms-button-secondary !py-0.5 !px-2 text-[10px] flex items-center gap-1"
              title="بازنشانی به اوزان پیش‌فرض استاندارد"
            >
              <RotateCcw className="w-3 h-3" />
              <span>پیش‌فرض</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
          <button onClick={onClose} className="enms-button enms-button-secondary text-xs px-3 py-1.5">
            انصراف
          </button>
          <button onClick={handleSave} className="enms-button enms-button-primary text-xs px-4 py-1.5">
            اعمال و محاسبه مجدد
          </button>
        </div>
      </div>
    </div>
  );
};

export default AhpWeightsModal;
