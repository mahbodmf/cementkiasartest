import React from 'react';
import { Download, Calendar, Sparkles, Activity } from 'lucide-react';
import { OperationsAnalyticsDashboardProps } from './types';
import { useOperationsData } from './hooks/useOperationsData';
import {
  OperationsSummaryCards,
  OperationsAiPanel,
  OperationsMassBalance,
  OperationsParetoAnalysis,
  OperationsSpcCharts,
  OperationsDailyTable,
} from './components';
import { toPersianDigits } from '../../../../utils/persianUtils';

export const OperationsAnalyticsDashboard: React.FC<OperationsAnalyticsDashboardProps> = ({ externalPeriodKey }) => {
  const {
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    isLoading,
    integratedDailyRecords,
    analyticsSummary,
    paretoStopCauses,
    handleExportExcel,
    handleGenerateAiDiagnostic,
    isAiLoading,
    aiAnalysis,
  } = useOperationsData(externalPeriodKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-[var(--color-text-muted)] gap-2">
        <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <span>در حال تجمیع و پردازش داده‌های چندگانه عملیات...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-fadeIn" dir="rtl">
      {/* سربرگ داشبورد، دوره زمانی و دکمه‌های کنترل */}
      <div className="enms-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--color-primary)]" />
            <span>داشبورد جامع هوش و تحلیل داده‌های عملیات (EnMS Data Fusion & OEE)</span>
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            ممیزی تقاطعی خطوط تولید، پایش توقفات، تراز جرم و مقایسه پیوسته با معیارهای پذیرش استاندارد
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[var(--color-bg-card-subtle)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs">
            <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-[var(--color-text-primary)] focus:outline-none cursor-pointer font-mono"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                  دوره: {toPersianDigits(p.replace('_', ' / '))}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateAiDiagnostic}
            disabled={isAiLoading}
            className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-warning)]" />
            <span>{isAiLoading ? 'در حال ممیزی...' : 'گزارش تشخیصی AI'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="enms-button enms-button-primary text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>اکسل تجمیعی</span>
          </button>
        </div>
      </div>

      {/* ۱. کارت‌های ۴گانه خلاصه وضعیت */}
      <OperationsSummaryCards 
        summary={analyticsSummary} 
        dailyRecords={integratedDailyRecords} 
        externalPeriodKey={selectedPeriod}
      />

      {/* ۲. پنل هوش مصنوعی تشخیصی */}
      <OperationsAiPanel 
        aiResponse={aiAnalysis} 
        isLoading={isAiLoading} 
      />

      {/* ۳. موازنه جریان جرم به صورت کاملاً تمام‌عرض (Full-Width) */}
      <div className="w-full">
        <OperationsMassBalance 
          summary={analyticsSummary} 
          records={integratedDailyRecords} 
          externalPeriodKey={selectedPeriod}
        />
      </div>

      {/* ۴. پارتوی علل توقفات در ردیف بعد و به صورت تمام‌عرض */}
      <div className="w-full">
        <OperationsParetoAnalysis paretoCauses={paretoStopCauses} />
      </div>

      {/* ۵. نمودارهای کنترل فرآیند SPC */}
      <OperationsSpcCharts records={integratedDailyRecords} />

      {/* ۶. جدول ماتریس روزانه */}
      <OperationsDailyTable records={integratedDailyRecords} />
    </div>
  );
};

export default OperationsAnalyticsDashboard;