import React from 'react';
import { ProductionSummary } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { TrendingDown, TrendingUp, Gauge, Cpu } from 'lucide-react';

interface ProductionSummaryCardsProps {
  summary: ProductionSummary;
}

export const ProductionSummaryCards: React.FC<ProductionSummaryCardsProps> = ({ summary }) => {
  const isThermalCompliant = summary.avgSecThermalKcalKg <= 820;
  const isElectricalCompliant = summary.avgSecElectricalKwhTon <= 105;

  // ارزیابی انطباق راندمان‌ها نسبت به بنچ‌مارک استاندارد کارخانه
  const isKilnEffCompliant = (summary.avgKilnEfficiencyPct || 0) >= 90;
  const isMillEffCompliant = (summary.avgMillEfficiencyPct || 0) >= 85;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4" dir="rtl">
      {/* ۱. مجموع کلینکر */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">مجموع کلینکر</span>
        <div className="text-base font-bold font-mono text-amber-500 mt-1">
          {toPersianDigits(formatPersianNumber(summary.totalClinkerTon))}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">تن</span>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          میانگین: {toPersianDigits(formatPersianNumber(summary.avgClinkerPerDay))} تن/روز
        </div>
      </div>

      {/* ۲. مجموع سیمان + ضریب کلینکر به سیمان */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">مجموع تولید سیمان</span>
        <div className="text-base font-bold font-mono text-cyan-500 mt-1">
          {toPersianDigits(formatPersianNumber(summary.totalCementTon))}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">تن</span>
        </div>
        <div className="text-[10px] text-cyan-400 font-mono mt-0.5" title="ضریب کلینکر به سیمان (Clinker Factor)">
          ضریب کلینکر/سیمان: {toPersianDigits((summary.clinkerToCementFactor * 100).toFixed(1))}٪
        </div>
      </div>

      {/* ۳. خوراک مصرفی کوره */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">خوراک مصرفی کوره</span>
        <div className="text-base font-bold font-mono text-purple-500 mt-1">
          {toPersianDigits(formatPersianNumber(summary.totalKilnFeedTon))}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">تن</span>
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
          ضریب خوراک/کلینکر: {toPersianDigits(summary.feedToClinkerFactor.toFixed(2))}
        </div>
      </div>

      {/* ۴. روزهای فعال کاری */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">روزهای فعال کاری</span>
        <div className="text-base font-bold font-mono text-emerald-500 mt-1">
          {toPersianDigits(summary.operatingDays)}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">روز</span>
        </div>
        <div className="text-[10px] text-emerald-600 mt-0.5">
          نرخ بهره‌برداری ۹۳.۵٪
        </div>
      </div>

      {/* ۵. راندمان کاری خط پخت (کوره دوار) */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--color-text-muted)] block">راندمان کوره</span>
          <Gauge className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="text-base font-bold font-mono text-emerald-400 mt-1">
          {toPersianDigits(summary.avgKilnEfficiencyPct ? summary.avgKilnEfficiencyPct.toFixed(1) : '۰')}٪
        </div>
        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isKilnEffCompliant ? 'text-emerald-500' : 'text-amber-500'}`}>
          {isKilnEffCompliant ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-amber-500" />}
          <span>{isKilnEffCompliant ? 'مطلوب (≥ ۹۰٪)' : 'پایین‌تر از تارگت'}</span>
        </div>
      </div>

      {/* ۶. راندمان کاری خط سایش (آسیاب سیمان) */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[var(--color-text-muted)] block">راندمان آسیاب</span>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-base font-bold font-mono text-cyan-400 mt-1">
          {toPersianDigits(summary.avgMillEfficiencyPct ? summary.avgMillEfficiencyPct.toFixed(1) : '۰')}٪
        </div>
        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMillEffCompliant ? 'text-emerald-500' : 'text-amber-500'}`}>
          {isMillEffCompliant ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-amber-500" />}
          <span>{isMillEffCompliant ? 'مطلوب (≥ ۸۵٪)' : 'پایین‌تر از تارگت'}</span>
        </div>
      </div>

      {/* ۷. SEC حرارتی میانگین */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">SEC حرارتی</span>
        <div className="text-base font-bold font-mono text-amber-500 mt-1">
          {toPersianDigits(formatPersianNumber(summary.avgSecThermalKcalKg))}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">kcal/kg</span>
        </div>
        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isThermalCompliant ? 'text-emerald-500' : 'text-rose-400'}`}>
          {isThermalCompliant ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <TrendingUp className="w-3 h-3 text-rose-400" />}
          <span>{isThermalCompliant ? 'منطبق بر بنچ‌مارک' : 'انحراف از خط مبنا'}</span>
        </div>
      </div>

      {/* ۸. SEC برق میانگین */}
      <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
        <span className="text-[11px] text-[var(--color-text-muted)] block">SEC برق میانگین</span>
        <div className="text-base font-bold font-mono text-purple-500 mt-1">
          {toPersianDigits(formatPersianNumber(summary.avgSecElectricalKwhTon))}
          <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">kWh/t</span>
        </div>
        <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isElectricalCompliant ? 'text-emerald-500' : 'text-rose-400'}`}>
          {isElectricalCompliant ? <TrendingDown className="w-3 h-3 text-emerald-500" /> : <TrendingUp className="w-3 h-3 text-rose-400" />}
          <span>{isElectricalCompliant ? 'منطبق بر استاندارد' : 'فراتر از استاندارد'}</span>
        </div>
      </div>
    </div>
  );
};