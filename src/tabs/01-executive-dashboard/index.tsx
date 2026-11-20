import React from 'react';
import { ExecutiveOperationsWidgets } from './components';
import {
  Activity,
  Zap,
  Flame,
} from 'lucide-react';

export const ExecutiveDashboardView: React.FC = () => {
  return (
    <div className="w-full flex flex-col space-y-6 animate-fadeIn text-xs" dir="rtl">
      {/* ۱. هدر معرفی داشبورد کلان */}
      <div className="enms-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/30 flex items-center justify-center text-[var(--color-warning)]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  داشبورد کلان شاخص‌های عملکرد انرژی و عملیات کارخانه
                </h2>
                <span className="enms-badge badge-warning text-[10px]">نمای هیئت‌مدیره</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                پایش یکپارچه EnPIها، راندمان خط پخت، تاب‌آوری دپوی کلینکر و انحرافات مصرف ویژه حرارتی و الکتریکی
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ۲. بخش ویجت‌های ۴ گانه پایش تقاطعی و تاب‌آوری عملیات (OEE، انحراف حرارتی، دپو و تحویل) */}
      <ExecutiveOperationsWidgets />

      {/* ۳. بخش پنل‌های موازنه انرژی و اهداف کلان */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="enms-card">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-primary)]" />
              وضعیت مصرف ویژه الکتریکی کل کارخانه (SEC Electrical)
            </h3>
            <span className="enms-badge badge-success text-[10px]">هدف: ۱۰۵ kWh/t</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-[var(--color-text-muted)] block text-[11px]">میانگین محقق‌شده دوره</span>
              <div className="text-2xl font-bold font-mono text-[var(--color-primary)] mt-1">
                ۱۰۲.۴ <span className="text-xs font-sans text-[var(--color-text-muted)]">kWh/ton cement</span>
              </div>
            </div>
            <span className="text-[var(--color-primary)] font-bold bg-[var(--color-primary-bg)] px-2.5 py-1 rounded border border-[var(--color-primary-border)] text-xs">
              ۲.۵٪ بهبود نسبت به سال پایه
            </span>
          </div>
        </div>

        <div className="enms-card">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-3">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Flame className="w-4 h-4 text-[var(--color-warning)]" />
              وضعیت مصرف ویژه حرارتی خط پخت (SEC Thermal)
            </h3>
            <span className="enms-badge badge-warning text-[10px]">معیار استاندارد: ۸۲۰ kcal/kg</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-[var(--color-text-muted)] block text-[11px]">میانگین محقق‌شده کوره دوار</span>
              <div className="text-2xl font-bold font-mono text-[var(--color-warning)] mt-1">
                ۷۹۸.۲ <span className="text-xs font-sans text-[var(--color-text-muted)]">kcal/kg clinker</span>
              </div>
            </div>
            <span className="text-[var(--color-primary)] font-bold bg-[var(--color-primary-bg)] px-2.5 py-1 rounded border border-[var(--color-primary-border)] text-xs">
              منطبق با استاندارد ملی ISIRI 7873
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboardView;