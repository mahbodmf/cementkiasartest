import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Truck, Search, Download, RefreshCw } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

interface DispatchInventoryViewProps {
  externalPeriodKey?: string;
}

export const DispatchInventoryView: React.FC<DispatchInventoryViewProps> = ({ externalPeriodKey }) => {
  const [allDispatchData, setAllDispatchData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDispatchLog = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem('cement_dispatch_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAllDispatchData(parsed);
          const keys = Object.keys(parsed).sort();
          if (keys.length > 0) setSelectedPeriod(externalPeriodKey && parsed[externalPeriodKey] ? externalPeriodKey : keys[keys.length - 1]);
        } else {
          // مسیر استاندارد دایرکتوری داده‌های عملیات
          const res = await fetch('/data/02-5-operations/cement-dispatch-log.json').catch(() => null);

          if (res && res.ok) {
            const json = await res.json();
            setAllDispatchData(json);
            localStorage.setItem('cement_dispatch_logs', JSON.stringify(json));
            const keys = Object.keys(json).sort();
            if (keys.length > 0) setSelectedPeriod(externalPeriodKey && json[externalPeriodKey] ? externalPeriodKey : keys[keys.length - 1]);
          }
        }
      } catch (err) {
        console.error('Error fetching dispatch log:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDispatchLog();
  }, [externalPeriodKey]);

  useEffect(() => {
    if (externalPeriodKey && allDispatchData[externalPeriodKey]) {
      setSelectedPeriod(externalPeriodKey);
    }
  }, [externalPeriodKey, allDispatchData]);

  const currentMonthData = allDispatchData[selectedPeriod] || {};
  const daysList: any[] = currentMonthData.days || [];

  const filteredDays = useMemo(() => {
    return daysList.filter((d: any) => {
      return (
        d.dayNumber.toString().includes(searchQuery) ||
        (d.jalaliDate && d.jalaliDate.includes(searchQuery))
      );
    });
  }, [daysList, searchQuery]);

  const totalDispatchTon = currentMonthData.totalDispatchTon || daysList.reduce((s: number, d: any) => s + (d.dispatch?.totalDispatchTon || 0), 0);
  const latestDay = daysList[daysList.length - 1] || {};
  const latestSilos = latestDay.siloLevelsPercent || {};
  const latestStocks = latestDay.stocks || {};

  const handleExportExcel = () => {
    if (daysList.length === 0) return;
    const rows = daysList.map((d: any) => ({
      'روز': d.dayNumber,
      'تاریخ': d.jalaliDate,
      'فله تیپ ۲ (تن)': d.dispatch?.bulkType2Ton || 0,
      'پاکت تیپ ۲ (تن)': d.dispatch?.bagType2Ton || 0,
      'مجموع دیسپاچ (تن)': d.dispatch?.totalDispatchTon || 0,
      'سیلو مواد خام (٪)': d.siloLevelsPercent?.rawMealSilo || 0,
      'سیلو اصلی کلینکر (٪)': d.siloLevelsPercent?.clinkerMainSilo || 0,
      'سیلو ۱ سیمان (٪)': d.siloLevelsPercent?.cementSilo1 || 0,
      'سیلو ۲ سیمان (٪)': d.siloLevelsPercent?.cementSilo2 || 0,
      'دپوی کلینکر (تن)': d.stocks?.clinkerDepoTon || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'بارگیرخانه');
    XLSX.writeFile(wb, `گزارش_بارگیرخانه_${selectedPeriod}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        <span>در حال بارگذاری لاگ تحویل و سطح سیلوها...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs animate-fadeIn" dir="rtl">
      {/* هدر کنترل دوره */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-info)]/30 flex items-center justify-center text-[var(--color-info)]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  تحویل، دیسپاچ، بارگیرخانه و سطح سیلوها (Cement Dispatch & Silos)
                </h2>
                <span className="enms-badge badge-info text-[10px]">بخش عملیات کارخانه</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                بارگیری فله و پاکتی انواع سیمان، موجودی سیلوهای کلینکر و سیمان، و دپوی مواد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="enms-select text-xs font-mono text-[var(--color-info)] font-bold cursor-pointer"
            >
              {Object.keys(allDispatchData).sort().map((k) => (
                <option key={k} value={k} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                  {allDispatchData[k]?.monthName || 'ماه'} {allDispatchData[k]?.year ? toPersianDigits(allDispatchData[k].year) : ''} ({k})
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی روز یا تاریخ..."
                className="enms-input text-xs pl-8 w-52"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
            </div>

            <button onClick={handleExportExcel} className="enms-button enms-button-secondary text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[var(--color-info)]" />
              <span>اکسل بارگیرخانه</span>
            </button>
          </div>
        </div>

        {/* کارت‌های شاخص کلیدی دیسپاچ و سیلوها */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          <div className="enms-kpi-card">
            <div className="enms-kpi-top">
              <span className="enms-kpi-title">مجموع تحویل سیمان دوره</span>
            </div>
            <div className="enms-kpi-value-wrap">
              <span className="enms-kpi-value text-[var(--color-info)]">
                {toPersianDigits(formatPersianNumber(totalDispatchTon))}
              </span>
              <span className="enms-kpi-unit">تن</span>
            </div>
            <div className="enms-kpi-footer">
              <span className="text-[10px] text-[var(--color-text-muted)]">
                میانگین: {toPersianDigits(formatPersianNumber(Math.round(totalDispatchTon / (daysList.length || 1))))} تن/روز
              </span>
            </div>
          </div>

          <div className="enms-kpi-card">
            <div className="enms-kpi-top">
              <span className="enms-kpi-title">موجودی دپوی کلینکر</span>
            </div>
            <div className="enms-kpi-value-wrap">
              <span className="enms-kpi-value text-[var(--color-warning)]">
                {toPersianDigits(formatPersianNumber(latestStocks.clinkerDepoTon || 0))}
              </span>
              <span className="enms-kpi-unit">تن</span>
            </div>
            <div className="enms-kpi-footer">
              <span className="text-[10px] text-[var(--color-warning)]">آخرین برآورد انبار روباز و سیلو</span>
            </div>
          </div>

          <div className="enms-kpi-card">
            <div className="enms-kpi-top">
              <span className="enms-kpi-title">درصد پرشدگی سیلوی اصلی کلینکر</span>
            </div>
            <div className="enms-kpi-value-wrap">
              <span className="enms-kpi-value text-[var(--color-primary)]">
                {toPersianDigits(latestSilos.clinkerMainSilo || 0)}٪
              </span>
            </div>
            <div className="enms-kpi-footer">
              <span className="text-[10px] text-[var(--color-text-muted)]">
                سیلوی ریجکت: {toPersianDigits(latestSilos.clinkerRejectSilo || 0)}٪
              </span>
            </div>
          </div>

          <div className="enms-kpi-card">
            <div className="enms-kpi-top">
              <span className="enms-kpi-title">موجودی سیلوهای سیمان ۱ و ۲</span>
            </div>
            <div className="enms-kpi-value-wrap">
              <span className="enms-kpi-value text-[var(--color-purple)]">
                {toPersianDigits(latestSilos.cementSilo1 || 0)}٪ / {toPersianDigits(latestSilos.cementSilo2 || 0)}٪
              </span>
            </div>
            <div className="enms-kpi-footer">
              <span className="text-[10px] text-[var(--color-text-muted)]">
                سیلو مواد خام: {toPersianDigits(latestSilos.rawMealSilo || 0)}٪
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* جدول روزانه تحویل و بارگیرخانه */}
      <div className="enms-table-container">
        <table className="enms-table">
          <thead>
            <tr>
              <th className="text-center w-12">روز</th>
              <th className="text-center whitespace-nowrap">تاریخ</th>
              <th className="text-center">فله تیپ ۲ (تن)</th>
              <th className="text-center">پاکت تیپ ۲ (تن)</th>
              <th className="text-center text-[var(--color-info)] font-bold">مجموع تحویل (تن)</th>
              <th className="text-center">سیلو کلینکر</th>
              <th className="text-center">سیلو سیمان ۱</th>
              <th className="text-center">سیلو سیمان ۲</th>
              <th className="text-center">موجودی دپوی کلینکر (تن)</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {filteredDays.map((d: any, idx: number) => (
              <tr key={d.id || `${d.jalaliDate || d.dayNumber}-${idx}`}>
                <td className="text-center font-bold text-[var(--color-info)]">{toPersianDigits(d.dayNumber)}</td>
                <td className="text-center text-[var(--color-text-muted)] whitespace-nowrap">{toPersianDigits(d.jalaliDate)}</td>
                <td className="text-center text-[var(--color-text-secondary)]">{toPersianDigits(formatPersianNumber(d.dispatch?.bulkType2Ton || 0))}</td>
                <td className="text-center text-[var(--color-text-secondary)]">{toPersianDigits(formatPersianNumber(d.dispatch?.bagType2Ton || 0))}</td>
                <td className="text-center font-bold text-[var(--color-info)]">
                  {toPersianDigits(formatPersianNumber(d.dispatch?.totalDispatchTon || 0))}
                </td>
                <td className="text-center text-[var(--color-warning)]">{toPersianDigits(d.siloLevelsPercent?.clinkerMainSilo || 0)}٪</td>
                <td className="text-center text-[var(--color-purple)]">{toPersianDigits(d.siloLevelsPercent?.cementSilo1 || 0)}٪</td>
                <td className="text-center text-[var(--color-purple)]">{toPersianDigits(d.siloLevelsPercent?.cementSilo2 || 0)}٪</td>
                <td className="text-center text-[var(--color-text-secondary)]">
                  {toPersianDigits(formatPersianNumber(d.stocks?.clinkerDepoTon || 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DispatchInventoryView;