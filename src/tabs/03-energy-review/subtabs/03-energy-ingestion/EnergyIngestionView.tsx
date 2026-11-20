import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Zap,
  Flame,
  Download,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Layers,
  Edit2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

interface DailyEnergyRecord {
  dayNumber: number;
  jalaliDate: string;
  activeElecKwh: number;
  reactiveElecKvarh: number;
  peakDemandKw: number;
  naturalGasM3: number;
  fuelOilLiters: number;
  substations: {
    crusherKwh: number;
    rawMillKwh: number;
    kilnKwh: number;
    cementMillKwh: number;
    utilitiesKwh: number;
  };
  secElectricalKwhTon: number;
  secThermalKcalKg: number;
  status: 'normal' | 'warning' | 'anomaly';
  notes?: string;
}

interface PeriodEnergySummary {
  totalElectricityMwh: number;
  totalGasM3: number;
  totalMazutTon: number;
  totalGasCostMrdRials: number;
  totalElecCostMrdRials: number;
  avgSecThermalKcalKg: number;
  avgSecElectricKwhTon: number;
  substationsShare: {
    crusherMwh: number;
    rawMillMwh: number;
    kilnMwh: number;
    cementMillMwh: number;
    utilitiesMwh: number;
  };
}

interface NormalizedPeriodEnergyData {
  period: string;
  year: number;
  month: number;
  monthName: string;
  plantName: string;
  summary: PeriodEnergySummary;
  dailyRecords: DailyEnergyRecord[];
}

export const EnergyIngestionView: React.FC = () => {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1403_05');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRow, setEditingRow] = useState<DailyEnergyRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/data/03-energy-review/energy-consumption-log.json');
        if (res.ok) {
          const json = await res.json();
          setAllData(json);
          const keys = Object.keys(json);
          if (keys.length > 0 && !keys.includes(selectedPeriod)) {
            setSelectedPeriod(keys[0]);
          }
        }
      } catch (err) {
        console.error('Error loading energy consumption log:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentPeriodData: NormalizedPeriodEnergyData = useMemo(() => {
    const rawPeriod = allData[selectedPeriod] || {};
    const rawDays: any[] = rawPeriod.days || rawPeriod.dailyRecords || [];

    const records: DailyEnergyRecord[] = rawDays.map((raw: any, idx: number) => {
      const elec = raw.electricityKwh || {};
      const fuels = raw.fuels || {};
      const kpi = raw.kpi || {};
      const subs = raw.substations || {};

      const activeElec = raw.activeElecKwh ?? elec.totalPlant ?? 0;
      const gas = raw.naturalGasM3 ?? fuels.naturalGasNm3 ?? 0;
      const fuelOil = raw.fuelOilLiters ?? fuels.fuelOilLiter ?? 0;
      const secElec = raw.secElectricalKwhTon ?? kpi.secElectricKwhTon ?? 0;
      const secTherm = raw.secThermalKcalKg ?? kpi.secThermalKcalKg ?? 0;

      const crusherKwh = subs.crusherKwh ?? elec.substation1_Crusher ?? 0;
      const rawMillKwh = subs.rawMillKwh ?? elec.substation2_RawMill ?? 0;
      const kilnKwh = subs.kilnKwh ?? elec.substation3_Kiln ?? 0;
      const cementMillKwh = subs.cementMillKwh ?? elec.substation5_CementMill ?? 0;
      const utilitiesKwh = subs.utilitiesKwh ?? elec.substation4_EP ?? 0;

      let status: 'normal' | 'warning' | 'anomaly' = raw.status || 'normal';
      if (!raw.status) {
        if (secTherm > 1200 || secElec > 160) {
          status = 'anomaly';
        } else if (secTherm > 950 || secElec > 120) {
          status = 'warning';
        }
      }

      return {
        dayNumber: raw.dayNumber || idx + 1,
        jalaliDate: raw.jalaliDate || '',
        activeElecKwh: activeElec,
        reactiveElecKvarh: raw.reactiveElecKvarh ?? Math.round(activeElec * 0.25),
        peakDemandKw: raw.peakDemandKw ?? (activeElec > 0 ? Math.round(activeElec / 20) : 0),
        naturalGasM3: gas,
        fuelOilLiters: fuelOil,
        substations: {
          crusherKwh,
          rawMillKwh,
          kilnKwh,
          cementMillKwh,
          utilitiesKwh,
        },
        secElectricalKwhTon: Number(secElec.toFixed(1)),
        secThermalKcalKg: Number(secTherm.toFixed(1)),
        status,
        notes: raw.notes || (status === 'anomaly' ? 'مصرف ویژه حرارتی بالا به دلیل توقف خط' : undefined),
      };
    });

    const totalElecKwh = rawPeriod.totalElectricityKwh ?? records.reduce((s, r) => s + r.activeElecKwh, 0);
    const totalElecMwh = Number((totalElecKwh / 1000).toFixed(1));
    const totalGasM3 = rawPeriod.totalGasNm3 ?? records.reduce((s, r) => s + r.naturalGasM3, 0);
    const totalMazutTon = Number(((rawPeriod.totalFuelOilLiter ?? records.reduce((s, r) => s + r.fuelOilLiters, 0)) / 1000).toFixed(1));

    // محاسبه سهم پست‌ها
    const crusherMwh = Number((records.reduce((s, r) => s + r.substations.crusherKwh, 0) / 1000).toFixed(1));
    const rawMillMwh = Number((records.reduce((s, r) => s + r.substations.rawMillKwh, 0) / 1000).toFixed(1));
    const kilnMwh = Number((records.reduce((s, r) => s + r.substations.kilnKwh, 0) / 1000).toFixed(1));
    const cementMillMwh = Number((records.reduce((s, r) => s + r.substations.cementMillKwh, 0) / 1000).toFixed(1));
    const utilitiesMwh = Number((records.reduce((s, r) => s + r.substations.utilitiesKwh, 0) / 1000).toFixed(1));

    const avgTherm = rawPeriod.avgSecThermalKcalKg ?? (records.length > 0 ? Math.round(records.reduce((s, r) => s + r.secThermalKcalKg, 0) / records.length) : 0);
    const avgElec = rawPeriod.avgSecElectricKwhTon ?? (records.length > 0 ? Number((records.reduce((s, r) => s + r.secElectricalKwhTon, 0) / records.length).toFixed(1)) : 0);

    const summary: PeriodEnergySummary = {
      totalElectricityMwh: rawPeriod.summary?.totalElectricityMwh ?? totalElecMwh,
      totalGasM3: rawPeriod.summary?.totalGasM3 ?? totalGasM3,
      totalMazutTon: rawPeriod.summary?.totalMazutTon ?? totalMazutTon,
      totalGasCostMrdRials: rawPeriod.summary?.totalGasCostMrdRials ?? Number((totalGasM3 * 0.003).toFixed(2)),
      totalElecCostMrdRials: rawPeriod.summary?.totalElecCostMrdRials ?? Number((totalElecMwh * 9).toFixed(2)),
      avgSecThermalKcalKg: avgTherm,
      avgSecElectricKwhTon: avgElec,
      substationsShare: rawPeriod.summary?.substationsShare || {
        crusherMwh,
        rawMillMwh,
        kilnMwh,
        cementMillMwh,
        utilitiesMwh,
      },
    };

    return {
      period: selectedPeriod,
      year: rawPeriod.year || 1403,
      month: rawPeriod.month || 5,
      monthName: rawPeriod.monthName || 'مرداد',
      plantName: rawPeriod.plantName || 'کارخانه سیمان کیاسر',
      summary,
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
      'برق کل کارخانه (kWh)': r.activeElecKwh,
      'گاز طبیعی (Nm³)': r.naturalGasM3,
      'مازوت (لیتر)': r.fuelOilLiters,
      'پست سنگ‌شکن (kWh)': r.substations.crusherKwh,
      'پست آسیاب مواد (kWh)': r.substations.rawMillKwh,
      'پست کوره (kWh)': r.substations.kilnKwh,
      'پست آسیاب سیمان (kWh)': r.substations.cementMillKwh,
      'پست یوتیلیتی (kWh)': r.substations.utilitiesKwh,
      'SEC برق (kWh/ton)': r.secElectricalKwhTon,
      'SEC حرارت (kcal/kg)': r.secThermalKcalKg,
      'وضعیت': r.status,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `مصارف_${currentPeriodData.period}`);
    XLSX.writeFile(wb, `لاگ_مصارف_انرژی_${currentPeriodData.period}.xlsx`);
  };

  const periodKeys = Object.keys(allData);

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-xs" dir="rtl">
      {/* هدر ساب‌تب */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  ورودی و پایش مصارف حامل‌های انرژی (Energy Ingestion)
                </h2>
                <span className="enms-badge badge-success text-[10px]">ساب‌تب ۶.۳-ج</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] font-mono">
                  {currentPeriodData.plantName}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                پایش مصارف برق پست‌ها، گاز طبیعی، مازوت و محاسبه شاخص‌های SEC الکتریکی و حرارتی
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
              <span>خروجی اکسل مصارف</span>
            </button>
          </div>
        </div>

        {/* کارت‌های شاخص‌های کلیدی مصرف انرژی */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">کل مصرف برق دوره</span>
            <div className="text-base font-bold font-mono text-[var(--color-primary)] mt-1">
              {toPersianDigits(formatPersianNumber(currentPeriodData.summary.totalElectricityMwh))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">MWh</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              میانگین SEC برق: {toPersianDigits(currentPeriodData.summary.avgSecElectricKwhTon)} kWh/ton
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">کل مصرف گاز طبیعی</span>
            <div className="text-base font-bold font-mono text-cyan-500 mt-1">
              {toPersianDigits(formatPersianNumber(Math.round(currentPeriodData.summary.totalGasM3 / 1000)))}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">هزار Nm³</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              میانگین SEC حرارت: {toPersianDigits(currentPeriodData.summary.avgSecThermalKcalKg)} kcal/kg
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">مصرف سوخت مایع (مازوت)</span>
            <div className="text-base font-bold font-mono text-amber-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.totalMazutTon)}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">تن</span>
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">
              سوخت پشتیبان کوره
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[11px] text-[var(--color-text-muted)] block">برق دپارتمان‌های بارز</span>
            <div className="text-base font-bold font-mono text-purple-500 mt-1">
              {toPersianDigits(currentPeriodData.summary.substationsShare.rawMillMwh + currentPeriodData.summary.substationsShare.kilnMwh + currentPeriodData.summary.substationsShare.cementMillMwh)}
              <span className="text-[10px] text-[var(--color-text-muted)] mr-1">MWh</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              کوره + آسیاب مواد + آسیاب سیمان
            </div>
          </div>
        </div>
      </div>

      {/* جدول لاگ روزانه مصارف انرژی */}
      <div className="enms-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              لاگ‌شیت تفکیکی مصارف روزانه برق و سوخت - {currentPeriodData.monthName} {toPersianDigits(currentPeriodData.year)}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس روز یا تاریخ..."
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
                <th className="p-2.5 text-center">برق کل (kWh)</th>
                <th className="p-2.5 text-center">گاز طبیعی (Nm³)</th>
                <th className="p-2.5 text-center">پست سنگ‌شکن</th>
                <th className="p-2.5 text-center">پست آسیاب مواد</th>
                <th className="p-2.5 text-center">پست کوره</th>
                <th className="p-2.5 text-center">پست آسیاب سیمان</th>
                <th className="p-2.5 text-center">SEC برق (kWh/t)</th>
                <th className="p-2.5 text-center">SEC حرارت (kcal/kg)</th>
                <th className="p-2.5">توضیحات و وضعیت</th>
                <th className="p-2.5 text-center">ارزیابی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-[var(--color-text-muted)]">
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
                    <td className="p-2.5 text-center font-mono font-bold text-[var(--color-text-primary)]">
                      {toPersianDigits(formatPersianNumber(row.activeElecKwh))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                      {toPersianDigits(formatPersianNumber(row.naturalGasM3))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-[var(--color-text-muted)]">
                      {toPersianDigits(formatPersianNumber(row.substations.crusherKwh))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-cyan-500 font-medium">
                      {toPersianDigits(formatPersianNumber(row.substations.rawMillKwh))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-amber-500 font-medium">
                      {toPersianDigits(formatPersianNumber(row.substations.kilnKwh))}
                    </td>
                    <td className="p-2.5 text-center font-mono text-purple-500 font-medium">
                      {toPersianDigits(formatPersianNumber(row.substations.cementMillKwh))}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-500">
                      {row.secElectricalKwhTon > 0 ? toPersianDigits(row.secElectricalKwhTon) : '-'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-amber-500">
                      {row.secThermalKcalKg > 0 ? toPersianDigits(row.secThermalKcalKg) : '-'}
                    </td>
                    <td className="p-2.5 text-[11px] text-[var(--color-text-muted)] max-w-xs truncate">
                      {row.notes || (row.activeElecKwh === 0 && row.naturalGasM3 === 0 ? 'توقف کامل خط تولید' : 'مصرف نرمال خط')}
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {row.status === 'anomaly' ? (
                        <span className="enms-badge badge-danger text-[10px]">انحراف بالا</span>
                      ) : row.status === 'warning' ? (
                        <span className="enms-badge badge-warning text-[10px]">هشدار مصرف</span>
                      ) : (
                        <span className="enms-badge badge-success text-[10px]">نرمال</span>
                      )}
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

export default EnergyIngestionView;
