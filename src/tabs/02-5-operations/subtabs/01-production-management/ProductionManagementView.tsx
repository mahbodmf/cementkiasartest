import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Factory, Calendar, Download, RefreshCw, LayoutList, TrendingUp, Columns2 } from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import {
  DailyProductionRecord,
  PeriodProductionData,
  TimeFilterMode,
  DepartmentFilterMode,
  DepartmentalTargetKpi,
  ProductionViewDisplayMode,
} from './types';
import { ProductionSummaryCards } from './components/ProductionSummaryCards';
import { ProductionSecTrendChart } from './components/ProductionSecTrendChart';
import { ProductionDailyTable } from './components/ProductionDailyTable';
import { ProductionEditModal } from './components/ProductionEditModal';

interface ProductionManagementViewProps {
  externalPeriodKey?: string;
}

// اهداف مرحله اول مصوب کارخانه سیمان کیاسر
const STAGE1_TARGETS = {
  crusher: 1.14,      // kWh/t مواد خردشده
  rawMill: 24.0,      // kWh/t مواد تولیدی ثبت‌شده
  kilnElec: 34.0,     // kWh/t کلینکر
  cementMill: 38.0,   // kWh/t سیمان
  kilnThermal: 900.0, // kcal/kg کلینکر
};

export const ProductionManagementView: React.FC<ProductionManagementViewProps> = ({ externalPeriodKey }) => {
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [energyData, setEnergyData] = useState<Record<string, any>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('monthly');
  const [activeDept, setActiveDept] = useState<DepartmentFilterMode>('all');
  const [displayMode, setDisplayMode] = useState<ProductionViewDisplayMode>('both');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('spring');
  const [selectedYearOnly, setSelectedYearOnly] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingRow, setEditingRow] = useState<DailyProductionRecord | null>(null);

  const SEASONS_CONFIG: Record<string, { label: string; months: string[] }> = {
    spring: { label: 'بهار', months: ['01', '02', '03'] },
    summer: { label: 'تابستان', months: ['04', '05', '06'] },
    autumn: { label: 'پاییز', months: ['07', '08', '09'] },
    winter: { label: 'زمستان', months: ['10', '11', '12'] },
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // ۱. بارگذاری گزارش تولید روزانه
        let loadedProd: Record<string, any> = {};
        const savedProd = localStorage.getItem('cement_production_logs');
        if (savedProd) {
          loadedProd = JSON.parse(savedProd);
        } else {
          const resOps = await fetch('/data/02-5-operations/daily-production-report.json').catch(() => null);
          if (resOps && resOps.ok) loadedProd = await resOps.json();
        }

        // ۲. بارگذاری لاگ مصرف انرژی تفکیکی پست‌های ۱ تا ۵
        let loadedEnergy: Record<string, any> = {};
        const savedEnergy = localStorage.getItem('cement_energy_logs');
        if (savedEnergy) {
          loadedEnergy = JSON.parse(savedEnergy);
        } else {
          const resEn = await fetch('/data/03-energy-review/energy-consumption-log.json').catch(() => null);
          if (resEn && resEn.ok) loadedEnergy = await resEn.json();
        }

        if (loadedEnergy && Object.keys(loadedEnergy).length > 0) {
          setEnergyData(loadedEnergy);
        }

        if (loadedProd && Object.keys(loadedProd).length > 0) {
          setAllData(loadedProd);
          localStorage.setItem('cement_production_logs', JSON.stringify(loadedProd));

          const sortedKeys = Object.keys(loadedProd).sort();
          const latestKey = sortedKeys[sortedKeys.length - 1];
          setSelectedPeriod(latestKey);
          const [initialYear] = latestKey.split('_');
          setSelectedSeasonYear(initialYear);
          setSelectedYearOnly(initialYear);
        }
      } catch (err) {
        console.error('Error fetching dynamic production & energy data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    Object.keys(allData).forEach((key) => {
      const parts = key.split('_');
      if (parts[0]) years.add(parts[0]);
    });
    return Array.from(years).sort();
  }, [allData]);

  useEffect(() => {
    if (externalPeriodKey && allData[externalPeriodKey]) {
      setSelectedPeriod(externalPeriodKey);
      setTimeFilterMode('monthly');
      const [yearPart] = externalPeriodKey.split('_');
      setSelectedSeasonYear(yearPart);
      setSelectedYearOnly(yearPart);
    }
  }, [externalPeriodKey, allData]);

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
          totalCrusherTon: 0,
          totalRawMealTon: 0,
          avgClinkerPerDay: 0,
          avgCementPerDay: 0,
          avgSecThermalKcalKg: 0,
          avgSecElectricalKwhTon: 0,
          operatingDays: 0,
          feedToClinkerFactor: 0,
          clinkerToCementFactor: 0,
          avgKilnEfficiencyPct: 0,
          avgMillEfficiencyPct: 0,
          departmentalKpis: [],
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
      targetKeys = seasonMonths.map((m) => `${selectedSeasonYear}_${m}`).filter((k) => !!allData[k]);
    } else if (timeFilterMode === 'yearly') {
      targetKeys = availableKeys.filter((k) => k.startsWith(`${selectedYearOnly}_`));
    }

    if (targetKeys.length === 0) {
      targetKeys = [selectedPeriod || availableKeys[availableKeys.length - 1]];
    }

    const aggregatedRecords: DailyProductionRecord[] = [];
    let sumClinker = 0;
    let sumCement = 0;
    let sumFeed = 0;
    let sumCrusher = 0;
    let sumRawMeal = 0;

    let sumCrusherKwh = 0;
    let sumRawMillKwh = 0;
    let sumKilnKwh = 0;
    let sumCementMillKwh = 0;

    const secThermValues: number[] = [];
    const secElecValues: number[] = [];

    targetKeys.forEach((key) => {
      const monthObj = allData[key];
      const energyMonthObj = energyData[key];
      if (!monthObj) return;

      const rawDays: any[] = monthObj.days || monthObj.dailyRecords || [];
      const energyDays: any[] = energyMonthObj?.days || [];

      const energyByDay = new Map<number, any>();
      energyDays.forEach((ed) => {
        if (ed.dayNumber) energyByDay.set(ed.dayNumber, ed);
      });

      rawDays.forEach((raw: any, idx: number) => {
        const dayNum = raw.dayNumber || idx + 1;
        const prod = raw.productionTon || {};
        const mats = raw.rawMaterialsConsumptionTon || {};
        const spec = raw.specificEnergy || {};
        const eDay = energyByDay.get(dayNum);
        const elec = eDay?.electricityKwh || {};

        const kilnFeed = Number(raw.kilnFeedTon ?? prod.kilnFeed ?? 0);
        const clinker = Number(raw.clinkerTon ?? prod.clinker ?? 0);
        const cement = Number(raw.totalCementTon ?? prod.cement ?? 0);
        const cement2 = Number(raw.cementType2Ton ?? (cement > 0 ? Math.round(cement * 0.7) : 0));
        const cementPuzz = Number(raw.cementPuzzolanicTon ?? (cement > 0 ? Math.round(cement * 0.3) : 0));
        const crusher = Number(prod.crusher ?? 0);
        const rawMeal = Number(prod.rawMeal ?? 0);
        const dispatch = Number(prod.cementDispatch ?? 0);

        const crusherClay = Number(mats.crusherClay ?? 0);
        const rawMillLimestone = Number(mats.rawMillLimestone ?? 0);
        const rawMillClay = Number(mats.rawMillClay ?? 0);
        const gypsum = Number(mats.gypsum ?? 0);

        const crusherKwh = Math.max(0, Number(elec.substation1_Crusher ?? 0) + Number(elec.crusherMotor ?? 0));
        const rawMillKwh = Math.max(
          0,
          Number(elec.substation2_RawMill ?? 0) + Number(elec.rawMillMainMotor ?? 0) + Number(elec.rawMillFanMotor ?? 0)
        );
        const kilnKwh = Math.max(
          0,
          Number(elec.substation3_Kiln ?? 0) +
            Number(elec.kilnMainDrive ?? 0) +
            Number(elec.kilnIdFan ?? 0) +
            Number(elec.baghouseMotor ?? 0) +
            Number(elec.substation4_EP ?? 0) +
            Number(elec.epFanMotor ?? 0)
        );
        const cementMillKwh = Math.max(
          0,
          Number(elec.substation5_CementMill ?? 0) +
            Number(elec.cementMill1Motor ?? 0) +
            Number(elec.cementMill2Motor ?? 0) +
            Number(elec.cementMillFan ?? 0)
        );

        const crusherSec = crusher > 0 && crusherKwh > 0 ? crusherKwh / crusher : 0;
        const rawMillSec = rawMeal > 0 && rawMillKwh > 0 ? rawMillKwh / rawMeal : 0;
        const kilnElecSec = clinker > 0 && kilnKwh > 0 ? kilnKwh / clinker : 0;
        const cementMillSec = cement > 0 && cementMillKwh > 0 ? cementMillKwh / cement : 0;

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
          dayNumber: dayNum,
          jalaliDate: raw.jalaliDate || '',
          crusherTon: Number(crusher.toFixed(1)),
          rawMealTon: Number(rawMeal.toFixed(1)),
          kilnFeedTon: Number(kilnFeed.toFixed(1)),
          clinkerTon: Number(clinker.toFixed(1)),
          cementType2Ton: Number(cement2.toFixed(1)),
          cementPuzzolanicTon: Number(cementPuzz.toFixed(1)),
          totalCementTon: Number(cement.toFixed(1)),
          dispatchTon: Number(dispatch.toFixed(1)),
          crusherClayTon: Number(crusherClay.toFixed(1)),
          rawMillLimestoneTon: Number(rawMillLimestone.toFixed(1)),
          rawMillClayTon: Number(rawMillClay.toFixed(1)),
          gypsumTon: Number(gypsum.toFixed(1)),
          crusherKwh,
          rawMillKwh,
          kilnKwh,
          cementMillKwh,
          crusherSecKwhTon: Number(crusherSec.toFixed(2)),
          rawMillSecKwhTon: Number(rawMillSec.toFixed(2)),
          kilnElecSecKwhTon: Number(kilnElecSec.toFixed(2)),
          cementMillSecKwhTon: Number(cementMillSec.toFixed(2)),
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
        sumCrusher += crusher;
        sumRawMeal += rawMeal;

        sumCrusherKwh += crusherKwh;
        sumRawMillKwh += rawMillKwh;
        sumKilnKwh += kilnKwh;
        sumCementMillKwh += cementMillKwh;

        if (secTherm > 0) secThermValues.push(secTherm);
        if (secElec > 0) secElecValues.push(secElec);
      });
    });

    const operatingDays = aggregatedRecords.filter((r) => r.clinkerTon > 0 || r.totalCementTon > 0).length || aggregatedRecords.length || 1;
    const avgClinker = sumClinker / operatingDays;
    const avgCement = sumCement / operatingDays;
    const avgSecTherm = secThermValues.length > 0 ? secThermValues.reduce((a, b) => a + b, 0) / secThermValues.length : 0;
    const avgSecElec = secElecValues.length > 0 ? secElecValues.reduce((a, b) => a + b, 0) / secElecValues.length : 0;

    const calcDeptKpi = (
      id: DepartmentalTargetKpi['id'],
      title: string,
      unit: string,
      actual: number,
      target: number,
      prodTon: number,
      energyUsed: number
    ): DepartmentalTargetKpi => {
      const variancePct = actual > 0 ? ((actual - target) / target) * 100 : 0;
      return {
        id,
        title,
        unit,
        actualValue: Number(actual.toFixed(2)),
        targetValue: target,
        variancePct: Number(variancePct.toFixed(1)),
        isCompliant: actual > 0 && actual <= target,
        totalProductionTon: prodTon,
        totalEnergyUsed: energyUsed,
      };
    };

    const actualCrusherSec = sumCrusher > 0 && sumCrusherKwh > 0 ? sumCrusherKwh / sumCrusher : 0;
    const actualRawMillSec = sumRawMeal > 0 && sumRawMillKwh > 0 ? sumRawMillKwh / sumRawMeal : 0;
    const actualKilnElecSec = sumClinker > 0 && sumKilnKwh > 0 ? sumKilnKwh / sumClinker : 0;
    const actualCementMillSec = sumCement > 0 && sumCementMillKwh > 0 ? sumCementMillKwh / sumCement : 0;

    const departmentalKpis: DepartmentalTargetKpi[] = [
      calcDeptKpi('crusher', 'سنگ‌شکن - کل واحد', 'kWh/t', actualCrusherSec, STAGE1_TARGETS.crusher, sumCrusher, sumCrusherKwh),
      calcDeptKpi('rawMill', 'آسیاب مواد خام - کل واحد', 'kWh/t', actualRawMillSec, STAGE1_TARGETS.rawMill, sumRawMeal, sumRawMillKwh),
      calcDeptKpi('kilnElec', 'پخت - برق کل واحد', 'kWh/t', actualKilnElecSec, STAGE1_TARGETS.kilnElec, sumClinker, sumKilnKwh),
      calcDeptKpi('cementMill', 'آسیاب سیمان - کل واحد', 'kWh/t', actualCementMillSec, STAGE1_TARGETS.cementMill, sumCement, sumCementMillKwh),
      calcDeptKpi('kilnThermal', 'پخت - انرژی حرارتی', 'kcal/kg', avgSecTherm, STAGE1_TARGETS.kilnThermal, sumClinker, 0),
    ];

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
        totalCrusherTon: Number(sumCrusher.toFixed(1)),
        totalRawMealTon: Number(sumRawMeal.toFixed(1)),
        avgClinkerPerDay: Number(avgClinker.toFixed(1)),
        avgCementPerDay: Number(avgCement.toFixed(1)),
        avgSecThermalKcalKg: Number(avgSecTherm.toFixed(1)),
        avgSecElectricalKwhTon: Number(avgSecElec.toFixed(1)),
        operatingDays,
        feedToClinkerFactor: Number((sumClinker > 0 ? sumFeed / sumClinker : 0).toFixed(2)),
        clinkerToCementFactor: Number((sumCement > 0 ? sumClinker / sumCement : 0).toFixed(3)),
        avgKilnEfficiencyPct: Number(avgKilnEff.toFixed(1)),
        avgMillEfficiencyPct: Number(avgMillEff.toFixed(1)),
        departmentalKpis,
      },
      dailyRecords: aggregatedRecords,
    };
  }, [allData, energyData, selectedPeriod, timeFilterMode, selectedSeasonYear, selectedSeason, selectedYearOnly]);

  const handleExportExcel = () => {
    if (currentPeriodData.dailyRecords.length === 0) return;

    const rows = currentPeriodData.dailyRecords.map((r) => ({
      'روز': r.dayNumber,
      'تاریخ شمسی': r.jalaliDate,
      'سنگ‌شکن (تن)': r.crusherTon,
      'پودر مواد خام (تن)': r.rawMealTon,
      'خوراک کوره (تن)': r.kilnFeedTon,
      'تولید کلینکر (تن)': r.clinkerTon,
      'مجموع سیمان (تن)': r.totalCementTon,
      'SEC سنگ‌شکن (kWh/t)': r.crusherSecKwhTon,
      'SEC آسیاب مواد (kWh/t)': r.rawMillSecKwhTon,
      'SEC برق پخت (kWh/t)': r.kilnElecSecKwhTon,
      'SEC آسیاب سیمان (kWh/t)': r.cementMillSecKwhTon,
      'SEC حرارتی (kcal/kg)': r.secThermalKcalKg,
      'SEC برق کل (kWh/t)': r.secElectricalKwhTon,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    const sheetName = `تولید_و_انرژی_${currentPeriodData.period}`.replace(/[\/\*\[\]\:\?]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `گزارش_تفکیکی_تولید_و_انرژی_${sheetName}.xlsx`);
  };

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
        <span>در حال بارگذاری پایگاه داده جامع تولید و موازنه انرژی...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fadeIn text-xs" dir="rtl">
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
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
                تولید روزانه، موازنه ورودی/خروجی ۴ دپارتمان عملیاتی و پایش شاخص‌های SEC در برابر اهداف مرحله اول
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* انتخاب حالت نمایش بخش پایین (جدول / نمودار / هر دو) */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <button
                onClick={() => setDisplayMode('both')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  displayMode === 'both'
                    ? 'bg-[var(--color-primary)] text-slate-950'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                title="نمایش هم‌زمان نمودار و جدول"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>نمای ترکیبی</span>
              </button>
              <button
                onClick={() => setDisplayMode('chart')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  displayMode === 'chart'
                    ? 'bg-[var(--color-primary)] text-slate-950'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                title="فقط نمودار روند SEC"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>نمودار SEC</span>
              </button>
              <button
                onClick={() => setDisplayMode('table')}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  displayMode === 'table'
                    ? 'bg-[var(--color-primary)] text-slate-950'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                title="فقط جدول موازنه"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>جدول</span>
              </button>
            </div>

            {/* فیلتر زمانی */}
            <div className="enms-tab-pills text-xs">
              <button
                onClick={() => setTimeFilterMode('monthly')}
                className={`enms-tab-pill ${timeFilterMode === 'monthly' ? 'active' : ''}`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setTimeFilterMode('seasonal')}
                className={`enms-tab-pill ${timeFilterMode === 'seasonal' ? 'active' : ''}`}
              >
                فصلی
              </button>
              <button
                onClick={() => setTimeFilterMode('yearly')}
                className={`enms-tab-pill ${timeFilterMode === 'yearly' ? 'active' : ''}`}
              >
                سالانه
              </button>
            </div>

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
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>خروجی اکسل تفکیکی</span>
            </button>
          </div>
        </div>

        {/* ردیف کارت‌های کلان + کارت‌های SEC تفکیکی دپارتمان‌ها */}
        <ProductionSummaryCards
          summary={currentPeriodData.summary}
          activeDept={activeDept}
          onSelectDept={setActiveDept}
        />
      </div>

      {/* نمودار تحلیلی روند SEC روزانه در مقایسه با هدف مرحله اول */}
      {(displayMode === 'both' || displayMode === 'chart') && (
        <ProductionSecTrendChart
          records={currentPeriodData.dailyRecords}
          periodTitle={currentPeriodData.period}
          activeDept={activeDept}
          onDeptChange={setActiveDept}
        />
      )}

      {/* جدول کارنامه جامع و موازنه ورودی/خروجی تفکیکی هر دپارتمان */}
      {(displayMode === 'both' || displayMode === 'table') && (
        <ProductionDailyTable
          records={currentPeriodData.dailyRecords}
          periodTitle={currentPeriodData.period}
          activeDept={activeDept}
          onDeptChange={setActiveDept}
          onEditRow={(row) => setEditingRow(row)}
        />
      )}

      <ProductionEditModal
        record={editingRow}
        onClose={() => setEditingRow(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default ProductionManagementView;