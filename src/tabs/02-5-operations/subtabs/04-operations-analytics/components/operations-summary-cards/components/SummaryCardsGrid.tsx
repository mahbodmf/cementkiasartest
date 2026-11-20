import React from 'react';
import {
  Gauge,
  Flame,
  Truck,
  Layers,
  Maximize2,
  Settings,
} from 'lucide-react';
import { CalculatedSummary, OperationsTargets, ModalType } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../../../utils/persianUtils';

export interface SummaryCardsGridProps {
  summary: CalculatedSummary;
  targets: OperationsTargets;
  onCardClick: (type: ModalType) => void;
  onOpenSettings: () => void;
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({
  summary,
  targets,
  onCardClick,
  onOpenSettings,
}) => {
  return (
    <div className="w-full flex flex-col gap-2 mt-2" dir="rtl">
      {/* نوار راهنما و دکمه تنظیم شاخص‌ها */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] text-[var(--color-text-secondary)] font-medium">
          برای مشاهده نمودار و تحلیل روند روزانه، روی هر یک از کارت‌های زیر کلیک کنید:
        </span>
        <button
          onClick={onOpenSettings}
          className="enms-button enms-button-secondary text-[11px] flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>تنظیم شاخص‌ها و اهداف پذیرش</span>
        </button>
      </div>

      {/* شبکه ۴ کارت شاخص */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* ۱. کارت OEE کوره */}
        <div
          onClick={() => onCardClick('oee')}
          className="enms-kpi-card p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-emerald-500/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-[11px] group-hover:text-emerald-400 transition font-medium">
              اثربخشی کلی خط پخت (OEE)
            </span>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="enms-kpi-value text-xl font-bold font-mono text-emerald-400 mt-1">
            {toPersianDigits(summary.avgKilnOEE.toFixed(1))}٪
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5 space-y-0.5 border-t border-[var(--color-border)] pt-1">
            <div className="flex justify-between">
              <span>شاخص هدف پذیرش:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {toPersianDigits(targets.targetKilnOee)}٪
              </span>
            </div>
            <div className="flex justify-between">
              <span>وضعیت انطباق:</span>
              <span
                className={
                  summary.avgKilnOEE >= targets.targetKilnOee
                    ? 'text-emerald-400 font-bold'
                    : 'text-rose-400 font-bold'
                }
              >
                {summary.avgKilnOEE >= targets.targetKilnOee
                  ? 'منطبق بر هدف'
                  : 'انحراف از هدف'}
              </span>
            </div>
          </div>
        </div>

        {/* ۲. کارت انحراف حرارتی ناشی از توقفات */}
        <div
          onClick={() => onCardClick('thermal')}
          className="enms-kpi-card p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-rose-500/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-[11px] group-hover:text-rose-400 transition font-medium">
              انحراف حرارتی ناشی از توقفات
            </span>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-rose-400 transition" />
              <Flame className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="enms-kpi-value text-xl font-bold font-mono text-rose-400 mt-1">
            {summary.downtimeEnergyImpactKcal > 0
              ? `+${toPersianDigits(summary.downtimeEnergyImpactKcal)} kcal/kg`
              : 'بدون انحراف حرارتی'}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-1.5 flex justify-between border-t border-[var(--color-border)] pt-1">
            <span>سقف استاندارد SEC:</span>
            <span className="font-mono font-bold text-[var(--color-text-secondary)]">
              {toPersianDigits(targets.secThermalMax)} kcal/kg
            </span>
          </div>
        </div>

        {/* ۳. کارت پایداری دپوی کلینکر */}
        <div
          onClick={() => onCardClick('runway')}
          className="enms-kpi-card p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-cyan-500/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-[11px] group-hover:text-cyan-400 transition font-medium">
              پایداری دپوی کلینکر (Runway)
            </span>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-400 transition" />
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="enms-kpi-value text-xl font-bold font-mono text-cyan-400 mt-1">
            {toPersianDigits(summary.inventoryRunwayDays)}{' '}
            <span className="enms-kpi-unit text-xs font-sans text-[var(--color-text-muted)]">روز</span>
          </div>
          <div className="text-[10px] text-cyan-500/80 mt-1.5 flex justify-between border-t border-[var(--color-border)] pt-1">
            <span>کف دپوی اطمینان:</span>
            <span className="font-mono text-[var(--color-text-secondary)]">
              {toPersianDigits(formatPersianNumber(targets.minClinkerSafetyStock))} تن
            </span>
          </div>
        </div>

        {/* ۴. کارت موازنه دیسپاچینگ و تحویل */}
        <div
          onClick={() => onCardClick('dispatch')}
          className="enms-kpi-card p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] hover:border-purple-500/60 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-[11px] group-hover:text-purple-400 transition font-medium">
              مجموع دیسپاچ سیمان دوره
            </span>
            <div className="flex items-center gap-1.5">
              <Maximize2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-purple-400 transition" />
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="enms-kpi-value text-xl font-bold font-mono text-purple-400 mt-1">
            {toPersianDigits(formatPersianNumber(summary.totalDispatch))}{' '}
            <span className="enms-kpi-unit text-xs font-sans text-[var(--color-text-muted)]">تن</span>
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5 flex justify-between border-t border-[var(--color-border)] pt-1">
            <span>کف تعهد روزانه:</span>
            <span className="font-mono text-purple-400 font-bold">
              {toPersianDigits(formatPersianNumber(targets.targetDailyDispatch))} تن
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCardsGrid;