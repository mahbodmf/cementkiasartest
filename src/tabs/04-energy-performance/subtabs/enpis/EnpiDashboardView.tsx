import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  Gauge,
  Zap,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  SlidersHorizontal,
  RotateCcw,
  Calendar,
  Calculator,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { safeFetchPublicJson } from '../../../../services/configService';
import {
  DEFAULT_ENPI_CONFIG,
  EnpiConfig,
  EnpiComplianceStatus,
  EnpiFilterMode,
  SEASONS_MAP,
  aggregatePeriodsEnpi,
  computeRegressionForInputs,
  formatPeriodLabel,
} from './enpiCalculations';

function getStatusPresentation(status: EnpiComplianceStatus) {
  switch (status) {
    case 'compliant':
      return {
        label: 'منطبق با هدف',
        shortLabel: 'منطبق',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        barColor: '#10b981',
        Icon: CheckCircle2,
      };
    case 'warning':
      return {
        label: 'نزدیک به مرز هشدار',
        shortLabel: 'هشدار',
        textClass: 'text-amber-600 dark:text-amber-400',
        barColor: '#f59e0b',
        Icon: AlertTriangle,
      };
    case 'non-compliant':
      return {
        label: 'انحراف افزایشی',
        shortLabel: 'عدم انطباق',
        textClass: 'text-rose-600 dark:text-rose-400',
        barColor: '#ef4444',
        Icon: XCircle,
      };
    default:
      return {
        label: 'فاقد داده کافی',
        shortLabel: 'نامشخص',
        textClass: 'text-[var(--color-text-muted)]',
        barColor: '#94a3b8',
        Icon: AlertTriangle,
      };
  }
}

function formatSignedDecimal(val: number | null, digits = 2): string {
  if (val === null || !Number.isFinite(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return toPersianDigits(`${sign}${val.toFixed(digits)}`);
}

function formatSignedInt(val: number | null): string {
  if (val === null || !Number.isFinite(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return `${sign}${formatPersianNumber(Math.round(val))}`;
}

export const EnpiDashboardView: React.FC = () => {
  const { isDark } = useTheme();

  const [config, setConfig] = useState<EnpiConfig>(DEFAULT_ENPI_CONFIG);
  const [prodLogs, setProdLogs] = useState<Record<string, any>>({});
  const [energyLogs, setEnergyLogs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // فیلترهای دوره زمانی
  const [filterMode, setFilterMode] = useState<EnpiFilterMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('spring');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // تب نمودار روند رگرسیونی
  const [trendCarrier, setTrendCarrier] = useState<'electric' | 'thermal'>('electric');

  // مقادیر شبیه‌ساز رگرسیون (What-If Simulator)
  const [simClinker, setSimClinker] = useState<number>(38000);
  const [simCement, setSimCement] = useState<number>(38000);
  const [simActualElec, setSimActualElec] = useState<number>(4200000);
  const [simActualThermal, setSimActualThermal] = useState<number>(4100000);
  const [simInitialized, setSimInitialized] = useState<boolean>(false);

  // بارگذاری پیکربندی EnPI و لاگ‌های استاندارد تولید و انرژی
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const cfg = await safeFetchPublicJson<EnpiConfig>(
          '/data/04-energy-performance/enpi-config.json',
          DEFAULT_ENPI_CONFIG,
          { storageKey: 'enms_enpi_config_v1' }
        );
        if (!mounted) return;
        setConfig(cfg);

        // بررسی حافظه کش محلی و سپس واکشی از مسیر استاندارد
        let loadedProd: Record<string, any> = {};
        const cachedProd = localStorage.getItem('cement_production_logs');
        if (cachedProd) {
          try {
            loadedProd = JSON.parse(cachedProd);
          } catch {
            loadedProd = {};
          }
        }
        if (!loadedProd || Object.keys(loadedProd).length === 0) {
          loadedProd = await safeFetchPublicJson<Record<string, any>>(
            cfg.dataSources.productionReportPath,
            {},
            { storageKey: 'cement_production_logs' }
          );
        }

        let loadedEnergy: Record<string, any> = {};
        const cachedEnergy = localStorage.getItem('cement_energy_logs');
        if (cachedEnergy) {
          try {
            loadedEnergy = JSON.parse(cachedEnergy);
          } catch {
            loadedEnergy = {};
          }
        }
        if (!loadedEnergy || Object.keys(loadedEnergy).length === 0) {
          loadedEnergy = await safeFetchPublicJson<Record<string, any>>(
            cfg.dataSources.energyConsumptionPath,
            {},
            { storageKey: 'cement_energy_logs' }
          );
        }

        if (!mounted) return;

        setProdLogs(loadedProd);
        setEnergyLogs(loadedEnergy);

        const commonKeys = Object.keys(loadedProd)
          .filter((k) => Boolean(loadedEnergy[k]))
          .sort();

        if (commonKeys.length > 0) {
          // انتخاب آخرین ماه دارای تولید کامل کلینکر و سیمان جهت نمایش دقیق اولیه
          const normalMonths = commonKeys.filter((k) => {
            const t = loadedProd[k]?.totals;
            return (t?.clinkerTon || 0) > 10000 && (t?.cementTon || 0) > 10000;
          });
          const defaultKey =
            normalMonths.length > 0
              ? normalMonths[normalMonths.length - 1]
              : commonKeys[commonKeys.length - 1];

          const [yr, mo] = defaultKey.split('_');
          setSelectedMonth(defaultKey);
          setSelectedYear(yr);
          setSelectedSeasonYear(yr);
          const matchedSeason =
            Object.entries(SEASONS_MAP).find(([, s]) => s.months.includes(mo))?.[0] ||
            'spring';
          setSelectedSeason(matchedSeason);
        }
      } catch (err) {
        if (mounted) {
          setLoadError('خطا در بارگذاری داده‌های تولید و مصرف انرژی جهت محاسبه EnPI');
          console.error(err);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  // کلیدهای ماهانه مشترک مرتب‌شده
  const availableMonths = useMemo(() => {
    return Object.keys(prodLogs)
      .filter((k) => Boolean(energyLogs[k]))
      .sort();
  }, [prodLogs, energyLogs]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(availableMonths.map((k) => k.split('_')[0]))).sort();
  }, [availableMonths]);

  // استخراج کلیدهای دوره انتخابی بر اساس فیلتر فعال
  const activePeriodInfo = useMemo(() => {
    if (availableMonths.length === 0) {
      return { keys: [] as string[], label: 'فاقد دوره' };
    }

    if (filterMode === 'monthly') {
      const key = availableMonths.includes(selectedMonth)
        ? selectedMonth
        : availableMonths[availableMonths.length - 1];
      return {
        keys: [key],
        label: formatPeriodLabel(key, prodLogs[key], energyLogs[key]),
      };
    }

    if (filterMode === 'seasonal') {
      const seasonMeta = SEASONS_MAP[selectedSeason] || SEASONS_MAP.spring;
      const keys = availableMonths.filter((k) => {
        const [y, m] = k.split('_');
        return y === selectedSeasonYear && seasonMeta.months.includes(m);
      });
      return {
        keys,
        label: `${seasonMeta.label} ${selectedSeasonYear}`,
      };
    }

    if (filterMode === 'yearly') {
      const keys = availableMonths.filter((k) => k.startsWith(`${selectedYear}_`));
      return {
        keys,
        label: `سال ${selectedYear}`,
      };
    }

    return {
      keys: availableMonths,
      label: `کل دوره پایش (${toPersianDigits(availableMonths.length)} ماه)`,
    };
  }, [
    availableMonths,
    filterMode,
    selectedMonth,
    selectedSeasonYear,
    selectedSeason,
    selectedYear,
    prodLogs,
    energyLogs,
  ]);

  // محاسبه EnPIهای دوره انتخابی
  const activeSummary = useMemo(() => {
    if (activePeriodInfo.keys.length === 0) return null;
    return aggregatePeriodsEnpi(
      activePeriodInfo.keys,
      prodLogs,
      energyLogs,
      config,
      activePeriodInfo.label
    );
  }, [activePeriodInfo, prodLogs, energyLogs, config]);

  // همگام‌سازی اولیه شبیه‌ساز با مقادیر واقعی دوره انتخابی
  useEffect(() => {
    if (activeSummary && !simInitialized) {
      setSimClinker(Math.round(activeSummary.clinkerTon));
      setSimCement(Math.round(activeSummary.cementTon));
      setSimActualElec(Math.round(activeSummary.electricalRegression.actualTotal));
      setSimActualThermal(Math.round(activeSummary.thermalRegression.actualTotal));
      setSimInitialized(true);
    }
  }, [activeSummary, simInitialized]);

  const handleSyncSimulator = () => {
    if (!activeSummary) return;
    setSimClinker(Math.round(activeSummary.clinkerTon));
    setSimCement(Math.round(activeSummary.cementTon));
    setSimActualElec(Math.round(activeSummary.electricalRegression.actualTotal));
    setSimActualThermal(Math.round(activeSummary.thermalRegression.actualTotal));
  };

  // سری زمانی ماهانه جهت نمودار روند و جدول مقایسه‌ای
  const monthlySeries = useMemo(() => {
    return availableMonths.map((key) =>
      aggregatePeriodsEnpi([key], prodLogs, energyLogs, config)
    );
  }, [availableMonths, prodLogs, energyLogs, config]);

  // داده‌های نمودار مقایسه SEC دپارتمان‌های برقی با هدف مرحله اول
  const electricDeptChartData = useMemo(() => {
    if (!activeSummary) return [];
    return activeSummary.departments
      .filter((d) => d.carrierType === 'electric')
      .map((d) => ({
        id: d.id,
        name: d.name,
        actual: d.actualSec !== null ? Number(d.actualSec.toFixed(2)) : 0,
        target: d.targetSec,
      }));
  }, [activeSummary]);

  const kilnThermalDept = useMemo(() => {
    return activeSummary?.departments.find((d) => d.carrierType === 'thermal') || null;
  }, [activeSummary]);

  // خروجی زنده شبیه‌ساز رگرسیون
  const simulatorResult = useMemo(() => {
    return computeRegressionForInputs(
      simClinker,
      simCement,
      simActualElec,
      simActualThermal,
      config
    );
  }, [simClinker, simCement, simActualElec, simActualThermal, config]);

  // داده‌های نمودار روند ماهانه Actual vs Baseline Y
  const regressionTrendChartData = useMemo(() => {
    return monthlySeries.map((m) => ({
      periodKey: m.periodKey,
      label: m.label,
      actualElecMwh: Number((m.electricalRegression.actualTotal / 1000).toFixed(1)),
      expectedElecMwh: Number((m.electricalRegression.expectedTotal / 1000).toFixed(1)),
      actualThermalKnm3: Number((m.thermalRegression.actualTotal / 1000).toFixed(1)),
      expectedThermalKnm3: Number((m.thermalRegression.expectedTotal / 1000).toFixed(1)),
    }));
  }, [monthlySeries]);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisTextColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderColor: isDark ? '#334155' : '#cbd5e1',
    borderRadius: '10px',
    fontSize: '12px',
    color: isDark ? '#f8fafc' : '#0f172a',
  };

  if (isLoading) {
    return (
      <div className="enms-card p-10 flex flex-col items-center justify-center gap-3 min-h-[320px]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          در حال محاسبه شاخص‌های عملکرد انرژی (EnPIs) و مدل‌های رگرسیونی...
        </p>
      </div>
    );
  }

  if (loadError || !activeSummary) {
    return (
      <div className="enms-card p-10 flex flex-col items-center justify-center gap-3 min-h-[280px] text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p className="text-sm font-bold text-[var(--color-text-primary)]">
          {loadError || 'داده‌ای برای دوره انتخابی در گزارش‌های تولید و انرژی یافت نشد.'}
        </p>
        {filterMode !== 'all' && availableMonths.length > 0 && (
          <button
            onClick={() => setFilterMode('all')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition"
          >
            نمایش کل دوره پایش
          </button>
        )}
      </div>
    );
  }

  const elecRegStatus = getStatusPresentation(activeSummary.electricalRegression.status);
  const thermalRegStatus = getStatusPresentation(activeSummary.thermalRegression.status);
  const ElecStatusIcon = elecRegStatus.Icon;
  const ThermalStatusIcon = thermalRegStatus.Icon;

  const compliantDeptCount = activeSummary.departments.filter(
    (d) => d.status === 'compliant'
  ).length;

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* نوار فیلتر زمانی و خلاصه متغیرهای تولیدی دوره */}
      <section className="enms-card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <span>بند ۶.۴ و ۶.۵ استاندارد ISO 50001:2018</span>
                <span aria-hidden="true">·</span>
                <span>پایش SEC واحدها و خط مبنای رگرسیونی سازمان</span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-text-primary)] mt-0.5">
                داشبورد شاخص‌های عملکرد انرژی (EnPIs) — {activeSummary.label}
              </h3>
            </div>
          </div>

          {/* کنترل‌های انتخاب بازه زمانی */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center p-1 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)]">
              {(
                [
                  { id: 'monthly', label: 'ماهانه' },
                  { id: 'seasonal', label: 'فصلی' },
                  { id: 'yearly', label: 'سالانه' },
                  { id: 'all', label: 'کل دوره' },
                ] as { id: EnpiFilterMode; label: string }[]
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setFilterMode(mode.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                    filterMode === mode.id
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {filterMode === 'monthly' && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {availableMonths.map((k) => (
                    <option key={k} value={k}>
                      {toPersianDigits(formatPeriodLabel(k, prodLogs[k], energyLogs[k]))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterMode === 'seasonal' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedSeasonYear}
                  onChange={(e) => setSelectedSeasonYear(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      سال {toPersianDigits(y)}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                >
                  {Object.entries(SEASONS_MAP).map(([id, s]) => (
                    <option key={id} value={id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterMode === 'yearly' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    سال {toPersianDigits(y)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* نوار متغیرهای کلیدی دوره انتخابی */}
        <div className="pt-3 border-t border-[var(--color-border)] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[var(--color-text-muted)] block">تولید کلینکر دوره</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono tabular-nums mt-0.5 inline-block">
              {formatPersianNumber(Math.round(activeSummary.clinkerTon))}{' '}
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">تن</span>
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">
              تناژ سیمان تیپ ۲ (<span className="font-mono">C.</span>)
            </span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono tabular-nums mt-0.5 inline-block">
              {formatPersianNumber(Math.round(activeSummary.cementTon))}{' '}
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">تن</span>
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">
              اختلاف کلینکر و سیمان (<span className="font-mono">CCD</span>)
            </span>
            <span
              className={`text-sm font-bold font-mono tabular-nums mt-0.5 inline-block ${
                activeSummary.ccdTon >= 0
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
              dir="ltr"
            >
              {formatSignedInt(activeSummary.ccdTon)}{' '}
              <span className="text-[11px] font-normal text-[var(--color-text-muted)]">t</span>
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">انطباق دپارتمان‌ها (مرحله ۱)</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono tabular-nums mt-0.5 inline-block">
              {toPersianDigits(compliantDeptCount)} از {toPersianDigits(activeSummary.departments.length)} واحد
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-muted)] block">روزهای ثبت‌شده در دوره</span>
            <span className="text-sm font-bold text-[var(--color-text-primary)] font-mono tabular-nums mt-0.5 inline-block">
              {toPersianDigits(activeSummary.daysCount)} روز
            </span>
          </div>
        </div>
      </section>

      {/* بخش ۱: شاخص‌های رگرسیونی برق و حرارت کل سازمان (Y_elec و Y_thermal) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* کارت رگرسیون برق کل سازمان */}
        <div className="enms-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text-primary)]">
                  {config.regressionModels.electrical.title}
                </h4>
              </div>
              <p
                className="text-xs font-mono text-[var(--color-text-muted)] mt-1 tabular-nums"
                dir="ltr"
              >
                {config.regressionModels.electrical.formulaText}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold shrink-0 ${elecRegStatus.textClass}`}>
              <ElecStatusIcon className="w-4 h-4" />
              <span>{elecRegStatus.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--color-border)]">
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">
                مصرف برق واقعی سازمان (Actual)
              </span>
              <div className="text-xl font-extrabold text-[var(--color-text-primary)] font-mono tabular-nums mt-1">
                {formatPersianNumber(Math.round(activeSummary.electricalRegression.actualTotal))}
                <span className="text-xs font-normal text-[var(--color-text-muted)] mr-1">
                  {config.regressionModels.electrical.totalUnit}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono tabular-nums">
                SEC واقعی:{' '}
                {activeSummary.electricalRegression.actualSpecific !== null
                  ? toPersianDigits(activeSummary.electricalRegression.actualSpecific.toFixed(2))
                  : '—'}{' '}
                {config.regressionModels.electrical.specificUnit}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">
                خط مبنای رگرسیونی (Expected Y_elec)
              </span>
              <div className="text-xl font-extrabold text-[var(--color-primary)] font-mono tabular-nums mt-1">
                {formatPersianNumber(Math.round(activeSummary.electricalRegression.expectedTotal))}
                <span className="text-xs font-normal text-[var(--color-text-muted)] mr-1">
                  {config.regressionModels.electrical.totalUnit}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono tabular-nums">
                SEC خط مبنا:{' '}
                {activeSummary.electricalRegression.expectedSpecific !== null
                  ? toPersianDigits(activeSummary.electricalRegression.expectedSpecific.toFixed(2))
                  : '—'}{' '}
                {config.regressionModels.electrical.specificUnit}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              {activeSummary.electricalRegression.diffTotal <= 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              )}
              <span>اختلاف از خط مبنا:</span>
              <strong
                className={`font-mono tabular-nums ${elecRegStatus.textClass}`}
                dir="ltr"
              >
                {formatSignedInt(activeSummary.electricalRegression.diffTotal)} kWh
              </strong>
            </div>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className={elecRegStatus.textClass} dir="ltr">
                {formatSignedDecimal(activeSummary.electricalRegression.diffPct, 1)}%
              </span>
              <span className="text-[var(--color-text-muted)]" dir="ltr">
                ({formatSignedDecimal(activeSummary.electricalRegression.diffSpecific, 2)} kWh/t)
              </span>
            </div>
          </div>
        </div>

        {/* کارت رگرسیون حرارتی کل سازمان */}
        <div className="enms-card p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-sm sm:text-base font-extrabold text-[var(--color-text-primary)]">
                  {config.regressionModels.thermal.title}
                </h4>
              </div>
              <p
                className="text-xs font-mono text-[var(--color-text-muted)] mt-1 tabular-nums"
                dir="ltr"
              >
                {config.regressionModels.thermal.formulaText}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-bold shrink-0 ${thermalRegStatus.textClass}`}>
              <ThermalStatusIcon className="w-4 h-4" />
              <span>{thermalRegStatus.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--color-border)]">
            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">
                مصرف حرارتی واقعی سازمان (Actual)
              </span>
              <div className="text-xl font-extrabold text-[var(--color-text-primary)] font-mono tabular-nums mt-1">
                {formatPersianNumber(Math.round(activeSummary.thermalRegression.actualTotal))}
                <span className="text-xs font-normal text-[var(--color-text-muted)] mr-1">
                  {config.regressionModels.thermal.totalUnit}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono tabular-nums">
                شاخص واقعی:{' '}
                {activeSummary.thermalRegression.actualSpecific !== null
                  ? toPersianDigits(activeSummary.thermalRegression.actualSpecific.toFixed(2))
                  : '—'}{' '}
                {config.regressionModels.thermal.specificUnit}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[var(--color-text-muted)] block">
                خط مبنای رگرسیونی (Expected Y_thermal)
              </span>
              <div className="text-xl font-extrabold text-amber-500 font-mono tabular-nums mt-1">
                {formatPersianNumber(Math.round(activeSummary.thermalRegression.expectedTotal))}
                <span className="text-xs font-normal text-[var(--color-text-muted)] mr-1">
                  {config.regressionModels.thermal.totalUnit}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] font-mono tabular-nums">
                شاخص خط مبنا:{' '}
                {activeSummary.thermalRegression.expectedSpecific !== null
                  ? toPersianDigits(activeSummary.thermalRegression.expectedSpecific.toFixed(2))
                  : '—'}{' '}
                {config.regressionModels.thermal.specificUnit}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              {activeSummary.thermalRegression.diffTotal <= 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              )}
              <span>اختلاف از خط مبنا:</span>
              <strong
                className={`font-mono tabular-nums ${thermalRegStatus.textClass}`}
                dir="ltr"
              >
                {formatSignedInt(activeSummary.thermalRegression.diffTotal)} Nm³
              </strong>
            </div>
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className={thermalRegStatus.textClass} dir="ltr">
                {formatSignedDecimal(activeSummary.thermalRegression.diffPct, 1)}%
              </span>
              <span className="text-[var(--color-text-muted)]" dir="ltr">
                ({formatSignedDecimal(activeSummary.thermalRegression.diffSpecific, 2)} Nm³/t)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* بخش ۲: مقایسه SEC دپارتمان‌ها در برابر اهداف مرحله اول */}
      <section className="enms-card p-5 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h4 className="text-base font-extrabold text-[var(--color-text-primary)]">
              پایش مصرف ویژه انرژی (SEC) دپارتمان‌ها در برابر اهداف مرحله اول
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              محاسبه‌شده مستقیم از گزارش تولید روزانه و لاگ مصرف انرژی پست‌های ۱ تا ۵ و سوخت کوره
            </p>
          </div>
          <span className="text-xs font-mono text-[var(--color-text-muted)] tabular-nums">
            آستانه هشدار مجاز: +{toPersianDigits(config.toleranceWarningPct)}٪
          </span>
        </div>

        {/* ردیف ۵ شاخص دپارتمانی بدون تودرتویی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {activeSummary.departments.map((dept) => {
            const st = getStatusPresentation(dept.status);
            const StatusIcon = st.Icon;
            const ratioPct =
              dept.actualSec !== null && dept.targetSec > 0
                ? Math.min(140, (dept.actualSec / dept.targetSec) * 100)
                : 0;
            return (
              <div
                key={dept.id}
                className="p-3.5 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-bold text-[var(--color-text-primary)] leading-snug">
                      {dept.name}
                    </h5>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      مبنا: {dept.productionBasisLabel}
                    </span>
                  </div>
                  <StatusIcon className={`w-4 h-4 shrink-0 ${st.textClass}`} />
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                    <span className="text-lg font-extrabold text-[var(--color-text-primary)]">
                      {dept.actualSec !== null
                        ? toPersianDigits(dept.actualSec.toFixed(2))
                        : '—'}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{dept.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1 font-mono tabular-nums">
                    <span className="text-[var(--color-text-muted)]">
                      هدف: {toPersianDigits(dept.targetSec.toFixed(2))}
                    </span>
                    <span className={`font-bold ${st.textClass}`} dir="ltr">
                      {dept.deviationPct !== null ? `${formatSignedDecimal(dept.deviationPct, 1)}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* نوار پیشرفت نسبت به هدف */}
                <div className="w-full h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, ratioPct)}%`,
                      backgroundColor: st.barColor,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* نمودار مقایسه‌ای SEC برق دپارتمان‌ها + کارت مقایسه حرارتی کوره */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-text-primary)]">
                مقایسه SEC واقعی برق واحدها با هدف مرحله اول (kWh/t)
              </span>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                سنگ‌شکن · آسیاب مواد خام · پخت · آسیاب سیمان
              </span>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={electricDeptChartData}
                  margin={{ top: 12, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: axisTextColor, fontSize: 11 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisTextColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" kWh/t"
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => [
                      `${toPersianDigits(Number(value).toFixed(2))} kWh/t`,
                      name === 'actual' ? 'SEC واقعی' : 'هدف مرحله اول',
                    ]}
                  />
                  <Legend
                    formatter={(value) =>
                      value === 'actual' ? 'SEC واقعی دوره' : 'هدف مرحله اول'
                    }
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="actual"
                    name="actual"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                  <Bar
                    dataKey="target"
                    name="target"
                    fill={isDark ? '#64748b' : '#94a3b8'}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* پنل تفکیکی انرژی حرارتی پخت */}
          {kilnThermalDept && (
            <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">
                    شاخص حرارتی دپارتمان پخت
                  </span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                  مبنای محاسبه: انرژی حرارتی گاز طبیعی و مازوت بر تناژ کلینکر تولیدی
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between font-mono tabular-nums">
                  <span className="text-xs text-[var(--color-text-secondary)]">SEC حرارتی واقعی</span>
                  <span className="text-2xl font-extrabold text-[var(--color-text-primary)]">
                    {kilnThermalDept.actualSec !== null
                      ? toPersianDigits(kilnThermalDept.actualSec.toFixed(1))
                      : '—'}{' '}
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">kcal/kg</span>
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono tabular-nums">
                  <span className="text-xs text-[var(--color-text-secondary)]">هدف مرحله اول</span>
                  <span className="text-sm font-bold text-amber-500">
                    {toPersianDigits(kilnThermalDept.targetSec.toFixed(2))} kcal/kg
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        kilnThermalDept.actualSec !== null
                          ? (kilnThermalDept.actualSec / (kilnThermalDept.targetSec * 1.2)) * 100
                          : 0
                      )}%`,
                      backgroundColor: getStatusPresentation(kilnThermalDept.status).barColor,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)] space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-sans">مصرف گاز طبیعی:</span>
                  <span className="text-[var(--color-text-primary)]">
                    {formatPersianNumber(Math.round(activeSummary.gasNm3))} Nm³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-sans">مصرف مازوت:</span>
                  <span className="text-[var(--color-text-primary)]">
                    {formatPersianNumber(Math.round(activeSummary.fuelOilLiter))} لیتر
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)] font-sans">وضعیت انطباق:</span>
                  <span
                    className={`font-sans font-bold ${
                      getStatusPresentation(kilnThermalDept.status).textClass
                    }`}
                  >
                    {getStatusPresentation(kilnThermalDept.status).label} (
                    {formatSignedDecimal(kilnThermalDept.deviationAbs, 1)} kcal/kg)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* جدول دقیق ممیزی SEC دپارتمان‌ها */}
        <div className="overflow-x-auto pt-2 border-t border-[var(--color-border)]">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="py-2.5 px-3 font-semibold">واحد / دپارتمان</th>
                <th className="py-2.5 px-3 font-semibold">حامل انرژی</th>
                <th className="py-2.5 px-3 font-semibold">مبنای تولید (تن)</th>
                <th className="py-2.5 px-3 font-semibold">مصرف دوره</th>
                <th className="py-2.5 px-3 font-semibold">SEC واقعی</th>
                <th className="py-2.5 px-3 font-semibold">هدف مرحله اول</th>
                <th className="py-2.5 px-3 font-semibold">انحراف</th>
                <th className="py-2.5 px-3 font-semibold">وضعیت انطباق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {activeSummary.departments.map((dept) => {
                const st = getStatusPresentation(dept.status);
                const StatusIcon = st.Icon;
                return (
                  <tr
                    key={dept.id}
                    className="hover:bg-[var(--color-bg-hover)] transition-colors"
                  >
                    <td className="py-2.5 px-3 font-bold text-[var(--color-text-primary)]">
                      {dept.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-secondary)]">
                      {dept.carrier}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-text-primary)]">
                      {formatPersianNumber(Math.round(dept.totalProductionTon))}{' '}
                      <span className="text-[10px] text-[var(--color-text-muted)] font-sans">
                        ({dept.productionBasisLabel})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-text-secondary)]">
                      {formatPersianNumber(Math.round(dept.totalEnergy))} {dept.energyUnit}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-[var(--color-text-primary)]">
                      {dept.actualSec !== null
                        ? `${toPersianDigits(dept.actualSec.toFixed(2))} ${dept.unit}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-[var(--color-text-secondary)]">
                      {toPersianDigits(dept.targetSec.toFixed(2))} {dept.unit}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-mono tabular-nums font-bold ${st.textClass}`}
                      dir="ltr"
                    >
                      {dept.deviationAbs !== null
                        ? `${formatSignedDecimal(dept.deviationAbs, 2)} (${formatSignedDecimal(
                            dept.deviationPct,
                            1
                          )}%)`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${st.textClass}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{st.label}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* بخش ۳: روند ماهانه Actual در برابر Baseline رگرسیونی (Y_elec / Y_thermal) */}
      <section className="enms-card p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h4 className="text-base font-extrabold text-[var(--color-text-primary)]">
              روند ماهانه مصرف واقعی کل سازمان در برابر خط مبنای رگرسیونی (Actual vs. Y)
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              مقایسه ماه‌به‌ماه مصرف واقعی با مقدار مورد انتظار مدل بر اساس تغییرات CCD و C.
            </p>
          </div>
          <div className="inline-flex items-center p-1 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] self-start">
            <button
              onClick={() => setTrendCarrier('electric')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                trendCarrier === 'electric'
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>برق سازمان (Y_elec)</span>
            </button>
            <button
              onClick={() => setTrendCarrier('thermal')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap flex items-center gap-1.5 ${
                trendCarrier === 'thermal'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>حرارت سازمان (Y_thermal)</span>
            </button>
          </div>
        </div>

        <div className="h-[290px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={regressionTrendChartData}
              margin={{ top: 12, right: 16, left: 4, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: axisTextColor, fontSize: 10 }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: axisTextColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit={trendCarrier === 'electric' ? ' MWh' : ' kNm³'}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(val: any, name: any) => {
                  const unit = trendCarrier === 'electric' ? 'MWh' : 'هزار Nm³';
                  const labelMap: Record<string, string> = {
                    actualElecMwh: 'مصرف واقعی برق',
                    expectedElecMwh: 'خط مبنای رگرسیونی (Y_elec)',
                    actualThermalKnm3: 'مصرف واقعی حرارتی',
                    expectedThermalKnm3: 'خط مبنای رگرسیونی (Y_thermal)',
                  };
                  return [
                    `${formatPersianNumber(Number(val))} ${unit}`,
                    labelMap[String(name)] || name,
                  ];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(val) => {
                  const map: Record<string, string> = {
                    actualElecMwh: 'مصرف واقعی برق (MWh)',
                    expectedElecMwh: 'خط مبنای Y_elec (MWh)',
                    actualThermalKnm3: 'مصرف واقعی حرارتی (هزار Nm³)',
                    expectedThermalKnm3: 'خط مبنای Y_thermal (هزار Nm³)',
                  };
                  return map[val] || val;
                }}
              />
              <ReferenceLine y={0} stroke={gridColor} />
              {trendCarrier === 'electric' ? (
                <>
                  <Bar
                    dataKey="actualElecMwh"
                    fill="#10b981"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedElecMwh"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="actualThermalKnm3"
                    fill="#f59e0b"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Line
                    type="monotone"
                    dataKey="expectedThermalKnm3"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* جدول فشرده تاریخچه ماهانه رگرسیون */}
        <div className="overflow-x-auto max-h-[300px] border-t border-[var(--color-border)] pt-2">
          <table className="w-full text-xs text-right border-collapse">
            <thead className="sticky top-0 bg-[var(--color-bg-surface)] z-10">
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                <th className="py-2 px-3 font-semibold">دوره</th>
                <th className="py-2 px-3 font-semibold">کلینکر (تن)</th>
                <th className="py-2 px-3 font-semibold">سیمان C. (تن)</th>
                <th className="py-2 px-3 font-semibold">CCD (تن)</th>
                <th className="py-2 px-3 font-semibold">
                  {trendCarrier === 'electric' ? 'برق واقعی (kWh)' : 'حرارت واقعی (Nm³)'}
                </th>
                <th className="py-2 px-3 font-semibold">
                  {trendCarrier === 'electric' ? 'خط مبنا Y_elec' : 'خط مبنا Y_thermal'}
                </th>
                <th className="py-2 px-3 font-semibold">انحراف (٪)</th>
                <th className="py-2 px-3 font-semibold">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {[...monthlySeries].reverse().map((row) => {
                const reg =
                  trendCarrier === 'electric'
                    ? row.electricalRegression
                    : row.thermalRegression;
                const st = getStatusPresentation(reg.status);
                const isSelectedRow =
                  filterMode === 'monthly' && row.periodKey === activeSummary.periodKey;
                return (
                  <tr
                    key={row.periodKey}
                    onClick={() => {
                      setFilterMode('monthly');
                      setSelectedMonth(row.periodKey);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelectedRow
                        ? 'bg-[var(--color-primary-bg)]'
                        : 'hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                      {toPersianDigits(row.label)}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-[var(--color-text-secondary)]">
                      {formatPersianNumber(Math.round(row.clinkerTon))}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-[var(--color-text-secondary)]">
                      {formatPersianNumber(Math.round(row.cementTon))}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-[var(--color-text-secondary)]" dir="ltr">
                      {formatSignedInt(row.ccdTon)}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums font-semibold text-[var(--color-text-primary)]">
                      {formatPersianNumber(Math.round(reg.actualTotal))}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-[var(--color-primary)] font-semibold">
                      {formatPersianNumber(Math.round(reg.expectedTotal))}
                    </td>
                    <td
                      className={`py-2 px-3 font-mono tabular-nums font-bold ${st.textClass}`}
                      dir="ltr"
                    >
                      {reg.diffPct !== null ? `${formatSignedDecimal(reg.diffPct, 1)}%` : '—'}
                    </td>
                    <td className={`py-2 px-3 font-semibold whitespace-nowrap ${st.textClass}`}>
                      {st.shortLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* بخش ۴: شبیه‌ساز تعاملی رگرسیون EnPI (What-If Simulator) */}
      <section className="enms-card p-5 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <div>
              <h4 className="text-base font-extrabold text-[var(--color-text-primary)]">
                شبیه‌ساز تحلیلی خط مبنای رگرسیونی سازمان (What-If Simulator)
              </h4>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                برآورد مصرف مجاز برقی و حرارتی بر اساس سناریوهای تولید کلینکر و سیمان تیپ ۲ (۳۲.۵)
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncSimulator}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] transition self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>همگام‌سازی با دوره فعلی</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ورودی‌های شبیه‌ساز */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                تولید کلینکر سناریو (تن)
              </label>
              <input
                type="number"
                value={simClinker}
                onChange={(e) => setSimClinker(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                سیمان تیپ ۲ — C. (تن)
              </label>
              <input
                type="number"
                value={simCement}
                onChange={(e) => setSimCement(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                برق واقعی فرضی (kWh)
              </label>
              <input
                type="number"
                value={simActualElec}
                onChange={(e) => setSimActualElec(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                حرارت واقعی فرضی (Nm³ معادل)
              </label>
              <input
                type="number"
                value={simActualThermal}
                onChange={(e) => setSimActualThermal(Math.max(0, Number(e.target.value) || 0))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)] flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                متغیر محاسبه‌شده <strong className="font-mono">CCD = Clinker - C.</strong>
              </span>
              <span className="font-mono font-bold text-sm text-[var(--color-text-primary)] tabular-nums" dir="ltr">
                {formatSignedInt(simulatorResult.ccdTon)} t
              </span>
            </div>
          </div>

          {/* خروجی‌های زنده شبیه‌ساز */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(() => {
              const simElSt = getStatusPresentation(simulatorResult.electrical.status);
              const simThSt = getStatusPresentation(simulatorResult.thermal.status);
              const SimElIcon = simElSt.Icon;
              const SimThIcon = simThSt.Icon;
              return (
                <>
                  <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        خروجی مدل برق (Y_elec)
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${simElSt.textClass}`}>
                        <SimElIcon className="w-3.5 h-3.5" />
                        {simElSt.shortLabel}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-[var(--color-primary)] font-mono tabular-nums">
                      {formatPersianNumber(Math.round(simulatorResult.electrical.expectedTotal))}{' '}
                      <span className="text-xs font-normal text-[var(--color-text-muted)]">kWh</span>
                    </div>
                    <div className="space-y-1 text-xs font-mono tabular-nums pt-2 border-t border-[var(--color-border)]">
                      <div className="flex justify-between">
                        <span className="font-sans text-[var(--color-text-muted)]">SEC خط مبنا:</span>
                        <span>
                          {simulatorResult.electrical.expectedSpecific !== null
                            ? `${toPersianDigits(
                                simulatorResult.electrical.expectedSpecific.toFixed(2)
                              )} kWh/t`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans text-[var(--color-text-muted)]">اختلاف سناریو:</span>
                        <span className={`font-bold ${simElSt.textClass}`} dir="ltr">
                          {formatSignedInt(simulatorResult.electrical.diffTotal)} kWh (
                          {formatSignedDecimal(simulatorResult.electrical.diffPct, 1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-text-primary)]">
                        خروجی مدل حرارت (Y_thermal)
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${simThSt.textClass}`}>
                        <SimThIcon className="w-3.5 h-3.5" />
                        {simThSt.shortLabel}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-amber-500 font-mono tabular-nums">
                      {formatPersianNumber(Math.round(simulatorResult.thermal.expectedTotal))}{' '}
                      <span className="text-xs font-normal text-[var(--color-text-muted)]">Nm³ معادل</span>
                    </div>
                    <div className="space-y-1 text-xs font-mono tabular-nums pt-2 border-t border-[var(--color-border)]">
                      <div className="flex justify-between">
                        <span className="font-sans text-[var(--color-text-muted)]">شاخص خط مبنا:</span>
                        <span>
                          {simulatorResult.thermal.expectedSpecific !== null
                            ? `${toPersianDigits(
                                simulatorResult.thermal.expectedSpecific.toFixed(2)
                              )} Nm³/t`
                            : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-sans text-[var(--color-text-muted)]">اختلاف سناریو:</span>
                        <span className={`font-bold ${simThSt.textClass}`} dir="ltr">
                          {formatSignedInt(simulatorResult.thermal.diffTotal)} Nm³ (
                          {formatSignedDecimal(simulatorResult.thermal.diffPct, 1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </section>
    </div>
  );
};

export default EnpiDashboardView;
