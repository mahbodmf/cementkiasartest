import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Truck,
  Database,
  Calendar,
  Search,
  Download,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

interface DailyDispatchRecord {
  dayNumber: number;
  jalaliDate: string;
  bulkDispatchTon: number;
  bagDispatchTon: number;
  totalDispatchTon: number;
  trucksCount: number;
  notes?: string;
  siloLevelsPercent?: Record<string, number>;
  stocks?: any;
}

interface SiloStatus {
  siloId: string;
  type: string;
  capacityTon: number;
  currentInventoryTon: number;
  utilizationPct: number;
}

interface PeriodDispatchSummary {
  totalBulkCementTon: number;
  totalBagCementTon: number;
  totalDispatchTon: number;
  avgDailyDispatchTon: number;
  trucksCount: number;
  currentSilosInventoryTon: number;
  silosCapacityTon: number;
  capacityUtilizationPct: number;
}

interface NormalizedPeriodDispatchData {
  period: string;
  year: number;
  month: number;
  monthName: string;
  plantName: string;
  summary: PeriodDispatchSummary;
  silosStatus: SiloStatus[];
  dailyRecords: DailyDispatchRecord[];
}

export const DispatchInventoryView: React.FC = () => {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1403_05');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data/02-5-operations/cement-dispatch-log.json');
        if (res.ok) {
          const json = await res.json();
          setAllData(json);
          const keys = Object.keys(json);
          if (keys.length > 0 && !keys.includes(selectedPeriod)) {
            setSelectedPeriod(keys[0]);
          }
        }
      } catch (err) {
        console.error('Error loading dispatch log:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentPeriodData: NormalizedPeriodDispatchData = useMemo(() => {
    const rawPeriod = allData[selectedPeriod] || {};
    const rawDays: any[] = rawPeriod.days || rawPeriod.dailyRecords || [];

    const records: DailyDispatchRecord[] = rawDays.map((raw: any, idx: number) => {
      const disp = raw.dispatch || {};
      const bulkTon = raw.bulkDispatchTon ?? ((disp.bulkType2Ton || 0) + (disp.bulkType1_325Ton || 0));
      const bagTon = raw.bagDispatchTon ?? ((disp.bagType2Ton || 0) + (disp.bagType1_325Ton || 0));
      const totalTon = raw.totalDispatchTon ?? (disp.totalDispatchTon ?? (bulkTon + bagTon));
      const trucks = raw.trucksCount ?? (totalTon > 0 ? Math.ceil(totalTon / 25) : 0);

      let note = raw.notes;
      if (!note && raw.stocks?.clinkerDepoTon) {
        note = `موجودی کلینکر دپو: ${toPersianDigits(formatPersianNumber(raw.stocks.clinkerDepoTon))} تن`;
      }

      return {
        dayNumber: raw.dayNumber || idx + 1,
        jalaliDate: raw.jalaliDate || '',
        bulkDispatchTon: Number(bulkTon.toFixed(1)),
        bagDispatchTon: Number(bagTon.toFixed(1)),
        totalDispatchTon: Number(totalTon.toFixed(1)),
        trucksCount: trucks,
        notes: note,
        siloLevelsPercent: raw.siloLevelsPercent,
        stocks: raw.stocks,
      };
    });

    const totalBulk = Number(records.reduce((s, r) => s + r.bulkDispatchTon, 0).toFixed(1));
    const totalBag = Number(records.reduce((s, r) => s + r.bagDispatchTon, 0).toFixed(1));
    const totalDisp = rawPeriod.totalDispatchTon ?? Number((totalBulk + totalBag).toFixed(1));
    const avgDaily = records.length > 0 ? Number((totalDisp / records.length).toFixed(1)) : 0;
    const totalTrucks = records.reduce((s, r) => s + r.trucksCount, 0);

    // محاسبه وضعیت سیلوها
    const lastDay = records[records.length - 1];
    const levels = lastDay?.siloLevelsPercent || { cementSilo1: 52, cementSilo2: 20, rawMealSilo: 66, clinkerMainSilo: 74 };
    const defaultSilos: SiloStatus[] = [
      {
        siloId: 'SILO-01',
        type: 'سیلوی شماره ۱ سیمان تیپ ۲ (فله)',
        capacityTon: 10000,
        currentInventoryTon: Math.round(10000 * ((levels.cementSilo1 || 50) / 100)),
        utilizationPct: levels.cementSilo1 || 50,
      },
      {
        siloId: 'SILO-02',
        type: 'سیلوی شماره ۲ سیمان پاکتی / پوزولانی',
        capacityTon: 8000,
        currentInventoryTon: Math.round(8000 * ((levels.cementSilo2 || 40) / 100)),
        utilizationPct: levels.cementSilo2 || 40,
      },
      {
        siloId: 'SILO-CLK',
        type: 'سیلوی اصلی کلینکر پخت',
        capacityTon: 40000,
        currentInventoryTon: Math.round(40000 * ((levels.clinkerMainSilo || 60) / 100)),
        utilizationPct: levels.clinkerMainSilo || 60,
      },
    ];

    const silos: SiloStatus[] = rawPeriod.silosStatus || defaultSilos;
    const totalSilosCap = silos.reduce((s, sil) => s + sil.capacityTon, 0);
    const totalSilosInv = silos.reduce((s, sil) => s + sil.currentInventoryTon, 0);
    const utilPct = totalSilosCap > 0 ? Number(((totalSilosInv / totalSilosCap) * 100).toFixed(1)) : 65;

    const summary: PeriodDispatchSummary = {
      totalBulkCementTon: rawPeriod.summary?.totalBulkCementTon ?? totalBulk,
      totalBagCementTon: rawPeriod.summary?.totalBagCementTon ?? totalBag,
      totalDispatchTon: rawPeriod.summary?.totalDispatchTon ?? totalDisp,
      avgDailyDispatchTon: rawPeriod.summary?.avgDailyDispatchTon ?? avgDaily,
      trucksCount: rawPeriod.summary?.trucksCount ?? totalTrucks,
      currentSilosInventoryTon: rawPeriod.summary?.currentSilosInventoryTon ?? totalSilosInv,
      silosCapacityTon: rawPeriod.summary?.silosCapacityTon ?? totalSilosCap,
      capacityUtilizationPct: rawPeriod.summary?.capacityUtilizationPct ?? utilPct,
    };

    return {
      period: selectedPeriod,
      year: rawPeriod.year || 1403,
      month: rawPeriod.month || 5,
      monthName: rawPeriod.monthName || 'مرداد',
      plantName: rawPeriod.plantName || 'کارخانه سیمان کیاسر',
      summary,
      silosStatus: silos,
      dailyRecords: records,
    };
  }, [allData, selectedPeriod]);

  const filteredRecords = useMemo(() => {
    return (currentPeriodData.dailyRecords || []).filter((rec) => {
      if (!searchQuery.trim()) return true;
      return (
        rec.dayNumber.toString().includes(searchQuery) ||
        rec.jalaliDate.includes(searchQuery) ||
        (rec.notes && rec.notes.includes(searchQuery))
      );
    });
  }, [currentPeriodData.dailyRecords, searchQuery]);

  const handleExportExcel = () => {
    const rows = (currentPeriodData.dailyRecords || []).map((r) => ({
      'روز': r.dayNumber,
      'تاریخ': r.jalaliDate,
      'تحویل فله (تن)': r.bulkDispatchTon,
      'تحویل پاکتی (تن)': r.bagDispatchTon,
      'مجموع تحویل (تن)': r.totalDispatchTon,
      'تعداد کامیون/بونکر': r.trucksCount,
      'توضیحات': r.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `بارگیرخانه_${currentPeriodData.period}`);
    XLSX.writeFile(wb, `لاگ_بارگیرخانه_${currentPeriodData.period}.xlsx`);
  };

  const periodKeys = Object.keys(allData);

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-xs" dir="rtl">
      {/* هدر ساب‌تب */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  تحویل و بارگیرخانه سیمان (Dispatch & Silos Inventory)
                </h2>
                <span className="enms-badge badge-primary text-[10px]">ساب‌تب ۶.۳-هـ</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] font-mono">
                  {currentPeriodData.plantName}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                آمار روزانه تحویل فله و پاکتی انواع سیمان، موجودی و ظرفیت سیلوهای ذخیره و پایش تردد ناوگان حمل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[11px] text-[var(--color-text-muted)]">دوره مالی:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-[var(--color-primary)] focus:outline-none cursor-pointer"
              >
                {periodKeys.map((key) => {
                  const p = allData[key];
                  return (
                    <option key={key} value={key} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                      {p.monthName || key} {p.year ? toPersianDigits(p.year) : ''} ({key})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleExportExcel}
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>خروجی اکسل بارگیرخانه</span>
            </button>
          </div>
        </div>

        {/* کارت‌های خلاصه وضعیت تحویل */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">مجموع تحویل سیمان</span>
            <div className="text-base font-bold font-mono text-[var(--color-primary)] mt-1">
              {toPersianDigits(formatPersianNumber(currentPeriodData.summary.totalDispatchTon))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">تن</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              میانگین روزانه: {toPersianDigits(formatPersianNumber(currentPeriodData.summary.avgDailyDispatchTon))} تن
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">تحویل سیمان فله</span>
            <div className="text-base font-bold font-mono text-cyan-500 mt-1">
              {toPersianDigits(formatPersianNumber(currentPeriodData.summary.totalBulkCementTon))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">تن</span>
            </div>
            <div className="text-[10px] text-cyan-600 mt-0.5">
              انواع سیمان فله پروژه‌ای
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">تحویل سیمان پاکتی (کیسه)</span>
            <div className="text-base font-bold font-mono text-amber-500 mt-1">
              {toPersianDigits(formatPersianNumber(currentPeriodData.summary.totalBagCementTon))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">تن</span>
            </div>
            <div className="text-[10px] text-amber-600 mt-0.5">
              توزیع خرده‌فروشی و عاملیت‌ها
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">تردد کامیون و بونکر</span>
            <div className="text-base font-bold font-mono text-emerald-500 mt-1">
              {toPersianDigits(formatPersianNumber(currentPeriodData.summary.trucksCount))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">دستگاه</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              ناوگان بارگیرخانه
            </div>
          </div>
        </div>
      </div>

      {/* وضعیت سیلوهای ذخیره سیمان */}
      {currentPeriodData.silosStatus && currentPeriodData.silosStatus.length > 0 && (
        <div className="enms-card p-4">
          <h4 className="font-bold text-xs text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--color-primary)]" />
            <span>وضعیت لحظه‌ای موجودی و ظرفیت سیلوهای ذخیره سیمان کیاسر</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentPeriodData.silosStatus.map((silo, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[var(--color-text-primary)]">{silo.siloId}</span>
                  <span className="font-mono text-xs font-bold text-[var(--color-primary)]">{toPersianDigits(silo.utilizationPct)}٪ پر</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{silo.type}</div>
                <div className="w-full bg-[var(--color-border)] h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                    style={{ width: `${silo.utilizationPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5 font-mono">
                  <span>موجودی: {toPersianDigits(formatPersianNumber(silo.currentInventoryTon))} تن</span>
                  <span>ظرفیت: {toPersianDigits(formatPersianNumber(silo.capacityTon))} تن</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول لاگ روزانه تحویل بارگیرخانه */}
      <div className="enms-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              لاگ‌شیت تفکیکی تحویل روزانه بارگیرخانه - {currentPeriodData.monthName} {toPersianDigits(currentPeriodData.year)}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی شماره روز یا تاریخ..."
              className="enms-input text-xs w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
              <tr>
                <th className="p-2.5 text-center w-12">روز</th>
                <th className="p-2.5 text-center">تاریخ</th>
                <th className="p-2.5 text-center">تحویل سیمان فله (ton)</th>
                <th className="p-2.5 text-center">تحویل سیمان پاکتی (ton)</th>
                <th className="p-2.5 text-center font-bold">مجموع تحویل (ton)</th>
                <th className="p-2.5 text-center">تعداد تردد کامیون/بونکر</th>
                <th className="p-2.5">وضعیت و توضیحات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--color-text-muted)]">
                    هیچ رکوردی منطبق با جستجو در این دوره یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr key={`${row.jalaliDate || row.dayNumber}-${idx}`} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors">
                    <td className="p-2.5 text-center font-bold font-mono text-[var(--color-primary)]">
                      {toPersianDigits(row.dayNumber)}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[var(--color-text-secondary)] whitespace-nowrap">
                      {toPersianDigits(row.jalaliDate)}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-cyan-500">
                      {toPersianDigits(formatPersianNumber(row.bulkDispatchTon))}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-amber-500">
                      {toPersianDigits(formatPersianNumber(row.bagDispatchTon))}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-[var(--color-primary)]">
                      {toPersianDigits(formatPersianNumber(row.totalDispatchTon))}
                    </td>
                    <td className="p-2.5 text-center font-mono">
                      {toPersianDigits(row.trucksCount)}
                    </td>
                    <td className="p-2.5 text-[11px] text-[var(--color-text-muted)]">
                      {row.notes || (row.totalDispatchTon === 0 ? 'عدم تحویل (تعطیل/توقف)' : 'تحویل عادی بارگیرخانه')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DispatchInventoryView;
