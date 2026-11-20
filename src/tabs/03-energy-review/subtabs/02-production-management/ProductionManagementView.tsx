import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Factory, Calendar, Download, RefreshCw } from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { DailyProductionRecord, PeriodProductionData, TimeFilterMode } from './types';
import { ProductionSummaryCards } from './components/ProductionSummaryCards';
import { ProductionDailyTable } from './components/ProductionDailyTable';
import { ProductionEditModal } from './components/ProductionEditModal';

interface ProductionManagementViewProps {
  /** اتصال به فیلتر زمانی بالای صفحه در صورت تزریق از کانتکست یا هدر */
  externalPeriodKey?: string;
}

export const ProductionManagementView: React.FC<ProductionManagementViewProps> = ({ externalPeriodKey }) => {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('monthly');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('spring');
  const [selectedYearOnly, setSelectedYearOnly] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRow, setEditingRow] = useState<DailyProductionRecord | null>(null);

  // تعریف ماه‌های هر فصل
  const SEASONS_CONFIG: Record<string, { label: string; months: string[] }> = {
    spring: { label: 'بهار', months: ['01', '02', '03'] },
    summer: { label: 'تابستان', months: ['04', '05', '06'] },
    autumn: { label: 'پاییز', months: ['07', '08', '09'] },
    winter: { label: 'زمستان', months: ['10', '11', '12'] },
  };

  // ۱. واکشی کاملاً داینامیک داده‌ها از LocalStorage یا فایل JSON سیستم
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let loadedJson: Record<string, any> = {};
        const savedProd = localStorage.getItem('cement_production_logs');

        if (savedProd) {
          loadedJson = JSON.parse(savedProd);
        } else {
          // مسیر استاندارد فایل JSON تولید روزانه
          const res = await fetch('/data/02-5-operations/daily-production-report.json').catch(() => null);
          if (res && res.ok) {
            loadedJson = await res.json();
          }
        }

        if (loadedJson && Object.keys(loadedJson).length > 0) {
          setAllData(loadedJson);
          localStorage.setItem('cement_production_logs', JSON.stringify(loadedJson));

          const sortedKeys = Object.keys(loadedJson).sort();
          const latestKey = sortedKeys[sortedKeys.length - 1];

          // تنظیم دوره‌ها بر اساس آخرین دیتای موجود در JSON به صورت کاملاً داینامیک
          setSelectedPeriod(latestKey);
          const [initialYear] = latestKey.split('_');
          setSelectedSeasonYear(initialYear);
          setSelectedYearOnly(initialYear);
        }
      } catch (err) {
        console.error('Error fetching dynamic production data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ۲. استخراج کاملاً داینامیک تمام سال‌های موجود در دیتابیس (بدون هاردکد)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    Object.keys(allData).forEach((key) => {
      const parts = key.split('_');
      if (parts[0]) years.add(parts[0]);
    });
    return Array.from(years).sort();
  }, [allData]);

  // ۳. هماهنگی با کلید انتخابی خارجی (اگر از هدر مقدار ارسال شود)
  useEffect(() => {
    if (externalPeriodKey && allData[externalPeriodKey]) {
      setSelectedPeriod(externalPeriodKey);
      setTimeFilterMode('monthly');
      const [yearPart] = externalPeriodKey.split('_');
      setSelectedSeasonYear(yearPart);
      setSelectedYearOnly(yearPart);
    }
  }, [externalPeriodKey, allData]);

  // ۴. موتور تجمیع و پردازش داده‌ها متناسب با فیلتر ماهانه، فصلی و سالانه
  const currentPeriodData = useMemo<PeriodProductionData>(() => {
    const availableKeys = Object.keys(allData).sort();
    if (availableKeys.length === 0) {
      return {
        period: '',
        year: 0,
        month: 0,
        monthName: '',
        plantName: 'کارخانه سیمان کیاسر',
        summary: {
          totalClinkerTon: 0,
          totalCementTon: 0,
          totalKilnFeedTon: 0,
          avgClinkerPerDay: 0,
          avgCementPerDay: 0,
          avgSecThermalKcalKg: 0,
          avgSecElectricalKwhTon: 0,
          operatingDays: 0,
          feedToClinkerFactor: 0,
          clinkerToCementFactor: 0,
          avgKilnEfficiencyPct: 0,
          avgMillEfficiencyPct: 0,
        },
        dailyRecords: [],
      };
    }

    let targetKeys: string[] = [];

    if (timeFilterMode === 'monthly') {
      const activeKey = selectedPeriod && allData[selectedPeriod] ? selectedPeriod : availableKeys[availableKeys.length - 1];
      targetKeys = [activeKey];
    } else if (timeFilterMode === 'seasonal') {
      const seasonMonths = SEASONS_CONFIG[selectedSeason]?.months || [];
      targetKeys = seasonMonths
        .map((m) => `${selectedSeasonYear}_${m}`)
        .filter((k) => !!allData[k]);
    } else if (timeFilterMode === 'yearly') {
      targetKeys = availableKeys.filter((k) => k.startsWith(`${selectedYearOnly}_`));
    }

    // اگر برای فصل یا سال انتخابی دیتایی نبود، آخرین ماه موجود مبنا قرار گیرد
    if (targetKeys.length === 0) {
      targetKeys = [selectedPeriod || availableKeys[availableKeys.length - 1]];
    }

    const aggregatedRecords: DailyProductionRecord[] = [];
    let sumClinker = 0;
    let sumCement = 0;
    let sumFeed = 0;
    const secThermValues: number[] = [];
    const secElecValues: number[] = [];

    targetKeys.forEach((key) => {
      const monthObj = allData[key];
      if (!monthObj) return;

      const rawDays: any[] = monthObj.days || monthObj.dailyRecords || [];

      rawDays.forEach((raw: any, idx: number) => {
        const prod = raw.productionTon || {};
        const spec = raw.specificEnergy || {};

        const kilnFeed = Number(raw.kilnFeedTon ?? prod.kilnFeed ?? 0);
        const clinker = Number(raw.clinkerTon ?? prod.clinker ?? 0);
        const cement = Number(raw.totalCementTon ?? prod.cement ?? 0);
        const cement2 = Number(raw.cementType2Ton ?? (cement > 0 ? Math.round(cement * 0.7) : 0));
        const cementPuzz = Number(raw.cementPuzzolanicTon ?? (cement > 0 ? Math.round(cement * 0.3) : 0));
        const crusher = Number(prod.crusher ?? 0);
        const rawMeal = Number(prod.rawMeal ?? 0);
        const dispatch = Number(prod.cementDispatch ?? 0);

        const secTherm = Number(raw.secThermalKcalKg ?? spec.secThermalKcalKg ?? 0);
        const secElec = Number(raw.secElectricalKwhTon ?? spec.secElectricKwhTon ?? 0);

        const gas = raw.fuelGasM3 ?? (secTherm > 0 && clinker > 0 ? Math.round((clinker * 1000 * secTherm) / (8200 * 1000)) : 0);
        const kilnEff = raw.kilnEfficiencyPct ?? (clinker > 0 ? Math.min(99, Math.round((clinker / 2000) * 100)) : 0);
        const millEff = raw.cementMillEfficiencyPct ?? (cement > 0 ? Math.min(98, Math.round((cement / 2200) * 100)) : 0);

        let note = raw.notes;
        if (!note && (crusher > 0 || rawMeal > 0)) {
          note = `سنگ‌شکن: ${toPersianDigits(crusher.toFixed(1))} تن | تحویل: ${toPersianDigits(dispatch.toFixed(1))} تن`;
        }

        aggregatedRecords.push({
          dayNumber: raw.dayNumber || idx + 1,
          jalaliDate: raw.jalaliDate || '',
          kilnFeedTon: Number(kilnFeed.toFixed(1)),
          clinkerTon: Number(clinker.toFixed(1)),
          cementType2Ton: Number(cement2.toFixed(1)),
          cementPuzzolanicTon: Number(cementPuzz.toFixed(1)),
          totalCementTon: Number(cement.toFixed(1)),
          crusherTon: Number(crusher.toFixed(1)),
          rawMealTon: Number(rawMeal.toFixed(1)),
          dispatchTon: Number(dispatch.toFixed(1)),
          fuelGasM3: gas,
          secThermalKcalKg: Number(secTherm.toFixed(1)),
          secElectricalKwhTon: Number(secElec.toFixed(1)),
          kilnEfficiencyPct: kilnEff,
          cementMillEfficiencyPct: millEff,
          notes: note,
        });

        sumClinker += clinker;
        sumCement += cement;
        sumFeed += kilnFeed;
        if (secTherm > 0) secThermValues.push(secTherm);
        if (secElec > 0) secElecValues.push(secElec);
      });
    });

    const operatingDays = aggregatedRecords.filter((r) => r.clinkerTon > 0 || r.totalCementTon > 0).length || aggregatedRecords.length || 1;
    const avgClinker = sumClinker / (operatingDays || 1);
    const avgCement = sumCement / (operatingDays || 1);

    const avgSecTherm = secThermValues.length > 0 ? secThermValues.reduce((a, b) => a + b, 0) / secThermValues.length : 0;
    const avgSecElec = secElecValues.length > 0 ? secElecValues.reduce((a, b) => a + b, 0) / secElecValues.length : 0;

    const feedClinkerRatio = sumClinker > 0 ? sumFeed / sumClinker : 0;
    const clinkerCementRatio = sumCement > 0 ? sumClinker / sumCement : 0;

    const firstKey = targetKeys[0] || availableKeys[0];
    const firstPeriodMeta = allData[firstKey] || {};

    let periodTitle = `${firstPeriodMeta.monthName || ''} ${toPersianDigits(firstPeriodMeta.year || '')}`;
    if (timeFilterMode === 'seasonal') {
      periodTitle = `فصل ${SEASONS_CONFIG[selectedSeason]?.label} ${toPersianDigits(selectedSeasonYear)}`;
    } else if (timeFilterMode === 'yearly') {
      periodTitle = `سال مالی ${toPersianDigits(selectedYearOnly)}`;
    }

    const validKilnEff = aggregatedRecords.filter((r) => r.kilnEfficiencyPct > 0);
    const avgKilnEff = validKilnEff.length > 0 ? validKilnEff.reduce((s, r) => s + r.kilnEfficiencyPct, 0) / validKilnEff.length : 0;

    const validMillEff = aggregatedRecords.filter((r) => r.cementMillEfficiencyPct > 0);
    const avgMillEff = validMillEff.length > 0 ? validMillEff.reduce((s, r) => s + r.cementMillEfficiencyPct, 0) / validMillEff.length : 0;

    return {
      period: periodTitle,
      year: firstPeriodMeta.year || parseInt(firstKey.split('_')[0], 10),
      month: firstPeriodMeta.month || parseInt(firstKey.split('_')[1], 10),
      monthName: firstPeriodMeta.monthName || '',
      plantName: firstPeriodMeta.plantName || 'کارخانه سیمان کیاسر',
      summary: {
        totalClinkerTon: Number(sumClinker.toFixed(1)),
        totalCementTon: Number(sumCement.toFixed(1)),
        totalKilnFeedTon: Number(sumFeed.toFixed(1)),
        avgClinkerPerDay: Number(avgClinker.toFixed(1)),
        avgCementPerDay: Number(avgCement.toFixed(1)),
        avgSecThermalKcalKg: Number(avgSecTherm.toFixed(1)),
        avgSecElectricalKwhTon: Number(avgSecElec.toFixed(1)),
        operatingDays,
        feedToClinkerFactor: Number(feedClinkerRatio.toFixed(2)),
        clinkerToCementFactor: Number(clinkerCementRatio.toFixed(3)),
        avgKilnEfficiencyPct: Number(avgKilnEff.toFixed(1)),
        avgMillEfficiencyPct: Number(avgMillEff.toFixed(1)),
      },
      dailyRecords: aggregatedRecords,
    };
  }, [allData, selectedPeriod, timeFilterMode, selectedSeasonYear, selectedSeason, selectedYearOnly]);

  // ۵. دانلود خروجی اکسل از تمام رکوردهای فیلترشده
  const handleExportExcel = () => {
    if (currentPeriodData.dailyRecords.length === 0) return;

    const rows = currentPeriodData.dailyRecords.map((r) => ({
      'روز': r.dayNumber,
      'تاریخ شمسی': r.jalaliDate,
      'خوراک کوره (تن)': r.kilnFeedTon,
      'تولید کلینکر (تن)': r.clinkerTon,
      'سیمان تیپ ۲ (تن)': r.cementType2Ton,
      'سیمان پوزولانی (تن)': r.cementPuzzolanicTon,
      'مجموع سیمان (تن)': r.totalCementTon,
      'SEC حرارتی (kcal/kg)': r.secThermalKcalKg,
      'SEC برق (kWh/t)': r.secElectricalKwhTon,
      'توضیحات فرآیندی': r.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    const sheetName = `تولید_${currentPeriodData.period}`.replace(/[\/\*\[\]\:\?]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `گزارش_جامع_تولید_${sheetName}.xlsx`);
  };

  // ۶. ذخیره ویرایش دستی ردیف در state و LocalStorage
  const handleSaveEdit = (updatedRecord: DailyProductionRecord) => {
    const monthKey = selectedPeriod;
    const currentMonthObj = allData[monthKey];
    if (!currentMonthObj) return;

    const rawDays = currentMonthObj.days || currentMonthObj.dailyRecords || [];
    const updatedDays = rawDays.map((r: any) =>
      r.dayNumber === updatedRecord.dayNumber
        ? {
            ...r,
            kilnFeedTon: updatedRecord.kilnFeedTon,
            clinkerTon: updatedRecord.clinkerTon,
            cementType2Ton: updatedRecord.cementType2Ton,
            cementPuzzolanicTon: updatedRecord.cementPuzzolanicTon,
            totalCementTon: updatedRecord.totalCementTon,
            secThermalKcalKg: updatedRecord.secThermalKcalKg,
            secElectricalKwhTon: updatedRecord.secElectricalKwhTon,
            notes: updatedRecord.notes,
          }
        : r
    );

    const updatedMonthObj = { ...currentMonthObj, days: updatedDays };
    const updatedAllData = { ...allData, [monthKey]: updatedMonthObj };

    setAllData(updatedAllData);
    localStorage.setItem('cement_production_logs', JSON.stringify(updatedAllData));
    setEditingRow(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
        <span>در حال بارگذاری پایگاه داده جامع تولید...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-xs" dir="rtl">
      {/* هدر ماژول و انتخاب‌گر دوره‌ها */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  پایش و مدیریت جامع تولید (Production Management)
                </h2>
                <span className="enms-badge badge-warning text-[10px]">ساب‌تب ۶.۳-ب</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] font-mono">
                  {currentPeriodData.plantName}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                تولید روزانه کلینکر و انواع سیمان، راندمان خطوط پخت و آسیاب و نسبت‌های مصرف
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* انتخاب حالت زمانی */}
            <div className="flex bg-[var(--color-bg-card-subtle)] p-0.5 rounded-lg border border-[var(--color-border)] text-xs">
              <button
                onClick={() => setTimeFilterMode('monthly')}
                className={`px-3 py-1 rounded transition ${timeFilterMode === 'monthly' ? 'bg-[var(--color-primary)] text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setTimeFilterMode('seasonal')}
                className={`px-3 py-1 rounded transition ${timeFilterMode === 'seasonal' ? 'bg-[var(--color-primary)] text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                فصلی
              </button>
              <button
                onClick={() => setTimeFilterMode('yearly')}
                className={`px-3 py-1 rounded transition ${timeFilterMode === 'yearly' ? 'bg-[var(--color-primary)] text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                سالانه
              </button>
            </div>

            {/* کنترل‌های داینامیک انتخاب دوره */}
            {timeFilterMode === 'monthly' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-[var(--color-primary)] focus:outline-none cursor-pointer"
                >
                  {Object.keys(allData).sort().map((key) => {
                    const p = allData[key];
                    return (
                      <option key={key} value={key} className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
                        {p?.monthName || 'دوره'} {p?.year ? toPersianDigits(p.year) : ''} ({key})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {timeFilterMode === 'seasonal' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedSeasonYear}
                  onChange={(e) => setSelectedSeasonYear(e.target.value)}
                  className="bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      سال {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-[var(--color-text-primary)]"
                >
                  {Object.entries(SEASONS_CONFIG).map(([k, s]) => (
                    <option key={k} value={k}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeFilterMode === 'yearly' && (
              <select
                value={selectedYearOnly}
                onChange={(e) => setSelectedYearOnly(e.target.value)}
                className="bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded px-3 py-1 text-xs text-[var(--color-text-primary)]"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    عملکرد کامل سال {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleExportExcel}
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>خروجی اکسل تولید</span>
            </button>
          </div>
        </div>

        {/* کارت‌های شاخص‌های کلیدی تولید، ضریب کلینکر و راندمان خطوط پخت و سایش */}
        <ProductionSummaryCards summary={currentPeriodData.summary} />
      </div>

      {/* جدول کارنامه تفکیکی روزانه دوره انتخابی (بدون ستون‌های راندمان جهت بهبود خوانایی) */}
      <ProductionDailyTable
        records={currentPeriodData.dailyRecords}
        periodTitle={currentPeriodData.period}
        onEditRow={(row) => setEditingRow(row)}
      />

      {/* مودال ویرایش ردیف روزانه */}
      <ProductionEditModal
        record={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ProductionManagementView;