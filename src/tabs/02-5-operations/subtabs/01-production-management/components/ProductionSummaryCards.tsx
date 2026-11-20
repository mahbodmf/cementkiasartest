import React from 'react';
import { ProductionSummary, DepartmentFilterMode } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { TrendingDown, TrendingUp, Gauge, Cpu, Target, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ProductionSummaryCardsProps {
  summary: ProductionSummary;
  activeDept: DepartmentFilterMode;
  onSelectDept: (dept: DepartmentFilterMode) => void;
}

export const ProductionSummaryCards: React.FC<ProductionSummaryCardsProps> = ({
  summary,
  activeDept,
  onSelectDept,
}) => {
  const isThermalCompliant = summary.avgSecThermalKcalKg <= 900;
  const isElectricalCompliant = summary.avgSecElectricalKwhTon <= 105;
  const isKilnEffCompliant = (summary.avgKilnEfficiencyPct || 0) >= 90;
  const isMillEffCompliant = (summary.avgMillEfficiencyPct || 0) >= 85;

  const mapKpiToDept = (id: string): DepartmentFilterMode => {
    if (id === 'crusher') return 'crusher';
    if (id === 'rawMill') return 'rawMill';
    if (id === 'kilnElec' || id === 'kilnThermal') return 'kiln';
    if (id === 'cementMill') return 'cementMill';
    return 'all';
  };

  return (
    <div className="space-y-4 mt-4" dir="rtl">
      {/* ردیف اول: شاخص‌های کلان تولید و راندمان خطوط */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
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

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] block">مجموع تولید سیمان</span>
          <div className="text-base font-bold font-mono text-cyan-500 mt-1">
            {toPersianDigits(formatPersianNumber(summary.totalCementTon))}
            <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">تن</span>
          </div>
          <div className="text-[10px] text-cyan-500 font-mono mt-0.5">
            ضریب کلینکر/سیمان: {toPersianDigits((summary.clinkerToCementFactor * 100).toFixed(1))}٪
          </div>
        </div>

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

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] block">روزهای فعال کاری</span>
          <div className="text-base font-bold font-mono text-emerald-500 mt-1">
            {toPersianDigits(summary.operatingDays)}
            <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">روز</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">پایش مستمر خط</div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-text-muted)] block">راندمان کوره</span>
            <Gauge className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-500 mt-1">
            {toPersianDigits(summary.avgKilnEfficiencyPct ? summary.avgKilnEfficiencyPct.toFixed(1) : '۰')}٪
          </div>
          <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isKilnEffCompliant ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isKilnEffCompliant ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isKilnEffCompliant ? 'مطلوب (≥ ۹۰٪)' : 'پایین‌تر از تارگت'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--color-text-muted)] block">راندمان آسیاب</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <div className="text-base font-bold font-mono text-cyan-500 mt-1">
            {toPersianDigits(summary.avgMillEfficiencyPct ? summary.avgMillEfficiencyPct.toFixed(1) : '۰')}٪
          </div>
          <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMillEffCompliant ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isMillEffCompliant ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{isMillEffCompliant ? 'مطلوب (≥ ۸۵٪)' : 'پایین‌تر از تارگت'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] block">SEC حرارتی کل</span>
          <div className="text-base font-bold font-mono text-amber-500 mt-1">
            {toPersianDigits(formatPersianNumber(summary.avgSecThermalKcalKg))}
            <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">kcal/kg</span>
          </div>
          <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isThermalCompliant ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isThermalCompliant ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span>{isThermalCompliant ? 'انطباق با هدف ۹۰۰' : 'فراتر از هدف ۹۰۰'}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] shadow-xs">
          <span className="text-[11px] text-[var(--color-text-muted)] block">SEC برق کل</span>
          <div className="text-base font-bold font-mono text-purple-500 mt-1">
            {toPersianDigits(formatPersianNumber(summary.avgSecElectricalKwhTon))}
            <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-sans">kWh/t</span>
          </div>
          <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isElectricalCompliant ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isElectricalCompliant ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
            <span>{isElectricalCompliant ? 'منطبق بر استاندارد' : 'فراتر از استاندارد'}</span>
          </div>
        </div>
      </div>

      {/* ردیف دوم: پایش شاخص‌های عملکرد انرژی (SEC) تفکیکی در برابر اهداف مرحله اول */}
      <div className="pt-3 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-primary)]">
            <Target className="w-4 h-4 text-[var(--color-primary)]" />
            <span>شاخص‌های عملکرد انرژی (SEC) به تفکیک واحدهای عملیاتی در مقایسه با اهداف مرحله اول</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            برای مشاهده جزئیات ورودی و خروجی هر واحد روی کارت مربوطه کلیک کنید
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.departmentalKpis.map((kpi) => {
            const deptTarget = mapKpiToDept(kpi.id);
            const isSelected = activeDept === deptTarget;
            const hasData = kpi.actualValue > 0;

            return (
              <div
                key={kpi.id}
                onClick={() => onSelectDept(isSelected ? 'all' : deptTarget)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary)] shadow-sm'
                    : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-primary-border)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-[var(--color-text-primary)] truncate">
                    {kpi.title}
                  </span>
                  {hasData ? (
                    kpi.isCompliant ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )
                  ) : null}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                      {hasData ? toPersianDigits(kpi.actualValue.toFixed(2)) : '---'}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-muted)] mr-1 font-mono">
                      {kpi.unit}
                    </span>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-[var(--color-text-muted)] block">هدف مرحله ۱:</span>
                    <span className="text-xs font-bold font-mono text-[var(--color-primary)]">
                      {toPersianDigits(kpi.targetValue.toFixed(2))}
                    </span>
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[var(--color-border)] flex items-center justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">
                    تولید: {toPersianDigits(formatPersianNumber(Math.round(kpi.totalProductionTon)))} تن
                  </span>
                  {hasData ? (
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                        kpi.isCompliant
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : 'bg-rose-500/15 text-rose-500'
                      }`}
                    >
                      {kpi.variancePct > 0 ? `+${toPersianDigits(kpi.variancePct.toFixed(1))}٪ انحراف` : `${toPersianDigits(Math.abs(kpi.variancePct).toFixed(1))}٪ بهبود`}
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">بدون کنتور تفکیکی</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};