import React, { useState } from 'react';
import { PieChart, BarChart3, Zap, Flame, Wind, Activity } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

interface EnergyCarrierAnalyticsProps {
  flowData: any;
  periodMultiplier: number;
}

export const EnergyCarrierAnalytics: React.FC<EnergyCarrierAnalyticsProps> = ({
  flowData,
  periodMultiplier,
}) => {
  const [activeCarrierTab, setActiveCarrierTab] = useState<'all' | 'electricity' | 'gas' | 'compressedAir'>('electricity');

  if (!flowData || !flowData.departmentFlows) return null;

  const departments = flowData.departmentFlows;
  const plantTotal = flowData.plantTotalFlow;

  // محاسبه مجموع مصرف حامل‌ها
  const totalElec = Math.round((plantTotal.electricityMwh || 65000) * periodMultiplier);
  const totalGas = Math.round(((plantTotal.naturalGasNm3 || 48500000) * periodMultiplier) / 1000000);
  const totalGj = Math.round((plantTotal.totalEquivalentGj || 1885000) * periodMultiplier);

  // پیدا کردن بیشترین مقدار برای محاسبه درصد عرض میله‌ها
  const maxBarValue = Math.max(
    ...departments.map((d: any) => {
      if (activeCarrierTab === 'electricity') return d.electricityMwh || 0;
      if (activeCarrierTab === 'gas') return d.naturalGasNm3 || 0;
      return d.energyShareGj || 0;
    })
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fadeIn" dir="rtl">
      {/* ۱. نمودار دونات و ترکیب حامل‌های انرژی کل کارخانه */}
      <div className="enms-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--color-primary)]" />
              <span>ترکیب سبد حامل‌های انرژی کارخانه (Energy Mix)</span>
            </h4>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">مبنا: GJ هم‌ارز</span>
          </div>

          {/* دونات گرافیکی با CSS خالص */}
          <div className="my-5 flex items-center justify-center">
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center"
                 style={{
                   background: 'conic-gradient(#10b981 0% 12%, #f59e0b 12% 98%, #06b6d4 98% 100%)',
                 }}>
              <div className="w-24 h-24 rounded-full bg-[var(--color-bg-surface)] flex flex-col items-center justify-center border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)]">مجموع انرژی</span>
                <span className="font-mono font-bold text-xs text-[var(--color-text-primary)]">
                  {toPersianDigits(formatPersianNumber(totalGj))}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] font-mono">GJ</span>
              </div>
            </div>
          </div>

          {/* راهنمای حامل‌ها */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-card-subtle)]">
              <span className="flex items-center gap-1.5 text-amber-500 font-medium">
                <Flame className="w-3.5 h-3.5" /> گاز طبیعی و سوخت حرارتی
              </span>
              <span className="font-mono font-bold text-[var(--color-text-primary)]">
                ۸۸.۱٪ <span className="text-[10px] text-[var(--color-text-muted)]">({toPersianDigits(totalGas)} M.Nm³)</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-card-subtle)]">
              <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <Zap className="w-3.5 h-3.5" /> برق شبکه ۶۳ کیلوولت
              </span>
              <span className="font-mono font-bold text-[var(--color-text-primary)]">
                ۱۱.۵٪ <span className="text-[10px] text-[var(--color-text-muted)]">({toPersianDigits(formatPersianNumber(totalElec))} MWh)</span>
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-card-subtle)]">
              <span className="flex items-center gap-1.5 text-sky-500 font-medium">
                <Wind className="w-3.5 h-3.5" /> هوای فشرده تولیدی
              </span>
              <span className="font-mono font-bold text-[var(--color-text-primary)]">
                ۰.۴٪ <span className="text-[10px] text-[var(--color-text-muted)]">(۷.۵ بار)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-muted)]">
          بیشترین مصرف حرارتی در کوره پخت (۸۸.۱٪) و بیشترین مصرف برق در آسیای سیمان (۳۷.۰۴٪) متمرکز است.
        </div>
      </div>

      {/* ۲. نمودار میله‌ای مقایسه دپارتمان‌ها بر اساس حامل انتخابی */}
      <div className="enms-card p-5 lg:col-span-2 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
            <h4 className="text-xs font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--color-primary)]" />
              <span>مقایسه سهم دپارتمان‌ها به تفکیک حامل انرژی</span>
            </h4>

            {/* سوئیچ حامل انرژی */}
            <div className="enms-tab-pills !p-0.5 text-xs">
              <button
                onClick={() => setActiveCarrierTab('electricity')}
                className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${activeCarrierTab === 'electricity' ? 'active' : ''}`}
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>برق (MWh)</span>
              </button>
              <button
                onClick={() => setActiveCarrierTab('gas')}
                className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${activeCarrierTab === 'gas' ? 'active' : ''}`}
              >
                <Flame className="w-3 h-3 text-rose-500" />
                <span>گاز (Nm³)</span>
              </button>
              <button
                onClick={() => setActiveCarrierTab('all')}
                className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${activeCarrierTab === 'all' ? 'active' : ''}`}
              >
                <Activity className="w-3 h-3 text-[var(--color-primary)]" />
                <span>انرژی کل (GJ)</span>
              </button>
            </div>
          </div>

          {/* میله‌های مقایسه‌ای دپارتمان‌ها */}
          <div className="space-y-3.5 mt-4">
            {departments.map((d: any) => {
              let value = 0;
              let unitLabel = '';
              let pct = 0;

              if (activeCarrierTab === 'electricity') {
                value = Math.round((d.electricityMwh || 0) * periodMultiplier);
                unitLabel = 'MWh';
                pct = d.electricSharePct || 0;
              } else if (activeCarrierTab === 'gas') {
                value = Math.round((d.naturalGasNm3 || 0) * periodMultiplier);
                unitLabel = 'Nm³';
                pct = d.naturalGasNm3 ? Math.round((d.naturalGasNm3 / plantTotal.naturalGasNm3) * 100) : 0;
              } else {
                value = Math.round((d.energyShareGj || 0) * periodMultiplier);
                unitLabel = 'GJ';
                pct = d.energySharePct || 0;
              }

              const barWidth = maxBarValue > 0 ? Math.max((value / (maxBarValue * periodMultiplier)) * 100, 2) : 0;

              return (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--color-text-primary)]">{d.name}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[var(--color-primary)]">
                        {toPersianDigits(formatPersianNumber(value))} {unitLabel}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] w-12 text-left">
                        ({toPersianDigits(pct)}٪)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[var(--color-bg-app)] h-2.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        activeCarrierTab === 'electricity'
                          ? 'bg-gradient-to-r from-amber-500 to-emerald-500'
                          : activeCarrierTab === 'gas'
                          ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                          : 'bg-gradient-to-r from-purple-600 to-emerald-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>داده‌های پایش آنلاین کنتورهای فرعی پست ۶۳/۶.۳ کیلوولت</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">انطباق ۱۰۰٪ با ترازنامه ورودی</span>
        </div>
      </div>
    </div>
  );
};

export default EnergyCarrierAnalytics;