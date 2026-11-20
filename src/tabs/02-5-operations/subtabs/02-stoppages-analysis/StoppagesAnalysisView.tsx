import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Clock, Search, Download, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface StoppagesAnalysisViewProps {
  externalPeriodKey?: string;
}

export const StoppagesAnalysisView: React.FC<StoppagesAnalysisViewProps> = ({ externalPeriodKey }) => {
  const [allStopsData, setAllStopsData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<'all' | 'kiln' | 'cementMill' | 'rawMill' | 'crusher'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStopsLog = async () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem('cement_stops_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAllStopsData(parsed);
          const keys = Object.keys(parsed).sort();
          if (keys.length > 0) setSelectedPeriod(externalPeriodKey && parsed[externalPeriodKey] ? externalPeriodKey : keys[keys.length - 1]);
        } else {
          // مسیر استاندارد دایرکتوری داده‌های عملیات کارخانه
          const res = await fetch('/data/02-5-operations/department-stops-log.json').catch(() => null);

          if (res && res.ok) {
            const json = await res.json();
            setAllStopsData(json);
            localStorage.setItem('cement_stops_logs', JSON.stringify(json));
            const keys = Object.keys(json).sort();
            if (keys.length > 0) setSelectedPeriod(externalPeriodKey && json[externalPeriodKey] ? externalPeriodKey : keys[keys.length - 1]);
          }
        }
      } catch (err) {
        console.error('Error fetching stops log:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStopsLog();
  }, [externalPeriodKey]);

  useEffect(() => {
    if (externalPeriodKey && allStopsData[externalPeriodKey]) {
      setSelectedPeriod(externalPeriodKey);
    }
  }, [externalPeriodKey, allStopsData]);

  const currentMonthData = allStopsData[selectedPeriod] || {};
  const daysList: any[] = currentMonthData.days || [];

  const filteredDays = useMemo(() => {
    return daysList.filter((d: any) => {
      const matchSearch =
        d.dayNumber.toString().includes(searchQuery) ||
        (d.jalaliDate && d.jalaliDate.includes(searchQuery)) ||
        Object.values(d.departments || {}).some((dept: any) => dept.stopCauses && dept.stopCauses.includes(searchQuery));
      return matchSearch;
    });
  }, [daysList, searchQuery]);

  const handleExportExcel = () => {
    if (daysList.length === 0) return;
    const rows = daysList.map((d: any) => ({
      'روز': d.dayNumber,
      'تاریخ': d.jalaliDate,
      'کارکرد کوره': d.departments?.kiln?.runHours || '-',
      'توقف کوره': d.departments?.kiln?.stopHours || '-',
      'علل توقف کوره': d.departments?.kiln?.stopCauses || '-',
      'کارکرد آسیاب سیمان': d.departments?.cementMill?.runHours || '-',
      'توقف آسیاب سیمان': d.departments?.cementMill?.stopHours || '-',
      'علل توقف آسیاب سیمان': d.departments?.cementMill?.stopCauses || '-',
      'کارکرد آسیاب مواد': d.departments?.rawMill?.runHours || '-',
      'توقف آسیاب مواد': d.departments?.rawMill?.stopHours || '-',
      'علل توقف آسیاب مواد': d.departments?.rawMill?.stopCauses || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'توقفات');
    XLSX.writeFile(wb, `گزارش_توقفات_کارخانه_${selectedPeriod}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        <span>در حال بارگذاری پایگاه داده توقفات خطوط...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 text-xs animate-fadeIn" dir="rtl">
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/30 flex items-center justify-center text-[var(--color-warning)]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  پایش توقفات و کارکرد خطوط دپارتمان‌ها (Line Downtime Tracking)
                </h2>
                <span className="enms-badge badge-warning text-[10px]">بخش عملیات کارخانه</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                ساعات کارکرد، ساعات توقف و گزارش علل ریشه‌ای توقفات کوره، آسیاب سیمان، آسیاب مواد و سنگ‌شکن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="enms-select text-xs font-mono text-[var(--color-primary)] font-bold cursor-pointer"
            >
              {Object.keys(allStopsData).sort().map((k) => (
                <option key={k} value={k} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                  {allStopsData[k]?.monthName || 'ماه'} {allStopsData[k]?.year ? toPersianDigits(allStopsData[k].year) : ''} ({k})
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی روز یا علت توقف..."
                className="enms-input text-xs pl-8 w-56"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2.5 top-2.5" />
            </div>

            <button onClick={handleExportExcel} className="enms-button enms-button-secondary text-xs flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>اکسل توقفات</span>
            </button>
          </div>
        </div>

        {/* فیلتر تفکیک دپارتمان */}
        <div className="flex items-center gap-2 mt-3 pt-1 flex-wrap">
          <span className="text-[11px] text-[var(--color-text-muted)]">تجهیز مورد بررسی:</span>
          <div className="enms-tab-pills text-xs">
            {(['all', 'kiln', 'cementMill', 'rawMill', 'crusher'] as const).map((d) => {
              const labels = {
                all: 'تمام خطوط',
                kiln: 'کوره پخت',
                cementMill: 'آسیاب سیمان',
                rawMill: 'آسیاب مواد',
                crusher: 'سنگ‌شکن',
              };
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDept(d)}
                  className={`enms-tab-pill ${selectedDept === d ? 'active' : ''}`}
                >
                  {labels[d]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* جدول داده‌های روزانه */}
      <div className="enms-table-container">
        <table className="enms-table">
          <thead>
            <tr>
              <th className="text-center w-12">روز</th>
              <th className="text-center whitespace-nowrap">تاریخ</th>
              {(selectedDept === 'all' || selectedDept === 'kiln') && (
                <>
                  <th className="text-center text-[var(--color-warning)]">کارکرد کوره</th>
                  <th className="text-center text-[var(--color-danger)]">توقف کوره</th>
                  <th>علل توقف کوره</th>
                </>
              )}
              {(selectedDept === 'all' || selectedDept === 'cementMill') && (
                <>
                  <th className="text-center text-[var(--color-info)]">کارکرد آسیاب سیمان</th>
                  <th className="text-center text-[var(--color-danger)]">توقف آسیاب</th>
                  <th>علل توقف آسیاب سیمان</th>
                </>
              )}
              {(selectedDept === 'all' || selectedDept === 'rawMill') && (
                <>
                  <th className="text-center text-[var(--color-purple)]">کارکرد آسیاب مواد</th>
                  <th className="text-center text-[var(--color-danger)]">توقف مواد</th>
                  <th>علل توقف آسیاب مواد</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {filteredDays.map((d: any, idx: number) => (
              <tr key={d.id || `${d.jalaliDate || d.dayNumber}-${idx}`}>
                <td className="text-center font-bold text-[var(--color-primary)]">{toPersianDigits(d.dayNumber)}</td>
                <td className="text-center text-[var(--color-text-muted)] whitespace-nowrap">{toPersianDigits(d.jalaliDate)}</td>

                {(selectedDept === 'all' || selectedDept === 'kiln') && (
                  <>
                    <td className="text-center text-[var(--color-text-secondary)]">{toPersianDigits(d.departments?.kiln?.runHours || '-')}</td>
                    <td className="text-center text-[var(--color-danger)] font-bold">{toPersianDigits(d.departments?.kiln?.stopHours || '-')}</td>
                    <td className="font-sans text-[var(--color-text-primary)] max-w-xs truncate" title={d.departments?.kiln?.stopCauses}>
                      {d.departments?.kiln?.stopCauses || '-'}
                    </td>
                  </>
                )}

                {(selectedDept === 'all' || selectedDept === 'cementMill') && (
                  <>
                    <td className="text-center text-[var(--color-text-secondary)]">{toPersianDigits(d.departments?.cementMill?.runHours || '-')}</td>
                    <td className="text-center text-[var(--color-danger)] font-bold">{toPersianDigits(d.departments?.cementMill?.stopHours || '-')}</td>
                    <td className="font-sans text-[var(--color-text-primary)] max-w-xs truncate" title={d.departments?.cementMill?.stopCauses}>
                      {d.departments?.cementMill?.stopCauses || '-'}
                    </td>
                  </>
                )}

                {(selectedDept === 'all' || selectedDept === 'rawMill') && (
                  <>
                    <td className="text-center text-[var(--color-text-secondary)]">{toPersianDigits(d.departments?.rawMill?.runHours || '-')}</td>
                    <td className="text-center text-[var(--color-danger)] font-bold">{toPersianDigits(d.departments?.rawMill?.stopHours || '-')}</td>
                    <td className="font-sans text-[var(--color-text-primary)] max-w-xs truncate" title={d.departments?.rawMill?.stopCauses}>
                      {d.departments?.rawMill?.stopCauses || '-'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoppagesAnalysisView;