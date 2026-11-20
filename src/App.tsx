import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MainTabId,
  MonitoringSubTabId,
  EnergyReviewSubTabId,
  ContextSubTabId,
  CommitteeSubTabId,
  EnergyObjectivesSubTabId,
  OperationsSubTabId,
  EnMSMasterDataset,
} from './types';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { DataProvider, useData } from './context/DataContext';
import { AIProvider } from './context/AIContext';
import Header from './layout/Header';
import Sidebar from './layout/Sidebar';
import ExecutiveDashboard from './tabs/01-executive-dashboard';
import OrganizationContext from './tabs/02-organization-context';
import OperationsTab from './tabs/02-5-operations';
import EnergyReview from './tabs/03-energy-review';
import EnergyPerformance from './tabs/04-energy-performance';
import EnergyCommitteeTab from './tabs/05-energy-committee';
import { EnergyObjectivesLayout } from './tabs/06-energy-objectives-projects';
import GoogleDriveTab from './tabs/07-google-drive';
import DatasetViewerModal from './shared/Modal';
import { masterDataset } from './data/mockEnMSDataset';
import { toPersianDigits, formatPersianNumber } from './utils/persianUtils';
import { NAVIGATION_CONFIG } from './config/navigation';
import { parseCementExcel, MonthDataBundle } from './utils/excelParser';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Activity,
  Database,
  Upload,
  Calendar,
  Edit3,
  Check,
  Flame,
  Zap,
  Wind,
  Gauge,
  Layers,
} from 'lucide-react';

interface HeaderKpiItem {
  id: string;
  title: string;
  value: string;
  unit: string;
  subtitle: string;
}

export type TimeFilterMode = 'monthly' | 'seasonal' | 'yearly';

const DEFAULT_HEADER_KPIS: HeaderKpiItem[] = [
  {
    id: 'thermal_energy',
    title: 'کل مصرف انرژی حرارتی',
    value: '۱,۸۲۰,۰۰۰',
    unit: 'GJ',
    subtitle: 'معادل گاز طبیعی و مازوت',
  },
  {
    id: 'electrical_energy',
    title: 'کل مصرف برق سالانه',
    value: '۶۵,۰۰۰',
    unit: 'MWh',
    subtitle: 'پست ۶۳/۶.۳ کیلوولت کارخانه',
  },
  {
    id: 'gas_quota',
    title: 'سهم گاز طبیعی پکت',
    value: '۴۸.۵',
    unit: 'میلیون Nm³',
    subtitle: 'ایستگاه تقلیل فشار CGS',
  },
  {
    id: 'compressed_air',
    title: 'هوای فشرده تولیدی',
    value: '۱۸.۵',
    unit: 'میلیون Nm³',
    subtitle: 'فشار کاری ۷.۵ بار',
  },
  {
    id: 'clinker_target',
    title: 'هدف تولید کلینکر',
    value: '۶۸۰,۰۰۰',
    unit: 'تن',
    subtitle: 'سیمان: ۷۲۰,۰۰۰ تن',
  },
];

const AppInner: React.FC = () => {
  const [currentMainTab, setCurrentMainTab] = useState<MainTabId>('executive');
  const [monitoringSubTab, setMonitoringSubTab] = useState<MonitoringSubTabId>('cusum');
  const [energyReviewSubTab, setEnergyReviewSubTab] = useState<EnergyReviewSubTabId>('departments');
  const [operationsSubTab, setOperationsSubTab] = useState<OperationsSubTabId>('production');
  const [contextSubTab, setContextSubTab] = useState<ContextSubTabId>('org-profile');
  const [committeeSubTab, setCommitteeSubTab] = useState<CommitteeSubTabId>('charter');
  const [energyObjectivesSubTab, setEnergyObjectivesSubTab] = useState<EnergyObjectivesSubTabId>('opportunities');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);
  const [isKpisCollapsed, setIsKpisCollapsed] = useState<boolean>(false);

  // وضعیت ویرایش و نگهداری کارت‌های کلان هدر
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [headerKpis, setHeaderKpis] = useState<HeaderKpiItem[]>(DEFAULT_HEADER_KPIS);

  // وضعیت فیلتر زمانی
  const [timeFilterMode, setTimeFilterMode] = useState<TimeFilterMode>('monthly');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('1405_05');
  const [selectedSeasonYear, setSelectedSeasonYear] = useState<string>('1405');
  const [selectedSeason, setSelectedSeason] = useState<string>('summer');
  const [selectedYearOnly, setSelectedYearOnly] = useState<string>('1405');

  // وضعیت لاگ‌های داده و آپلود اکسل
  const [dispatchLogs, setDispatchLogs] = useState<Record<string, any>>({});
  const [productionLogs, setProductionLogs] = useState<Record<string, any>>({});
  const [stopsLogs, setStopsLogs] = useState<Record<string, any>>({});
  const [energyLogs, setEnergyLogs] = useState<Record<string, any>>({});
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getFilteredData, filters } = useData();
  const { settings } = useAppSettings();

  // ۱. بارگذاری اولیه کارت‌های کلان و دیتابیس از LocalStorage یا /public
  useEffect(() => {
    const savedKpis = localStorage.getItem('enms_header_kpis');
    if (savedKpis) {
      try {
        setHeaderKpis(JSON.parse(savedKpis));
      } catch (e) {
        console.error('Error parsing saved KPIs:', e);
      }
    } else {
      fetch('/config/headerKpiConfig.json')
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setHeaderKpis(data))
        .catch(() => setHeaderKpis(DEFAULT_HEADER_KPIS));
    }

    const loadLog = (storageKey: string, fetchUrl: string, setter: (d: any) => void) => {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setter(JSON.parse(saved));
          return;
        } catch {
          /* fallback */
        }
      }
      fetch(fetchUrl)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          setter(data);
          localStorage.setItem(storageKey, JSON.stringify(data));
        })
        .catch((err) => console.warn(`Could not load ${fetchUrl}:`, err));
    };

    loadLog('cement_dispatch_logs', '/data/02-5-operations/cement-dispatch-log.json', setDispatchLogs);
    loadLog('cement_production_logs', '/data/02-5-operations/daily-production-report.json', setProductionLogs);
    loadLog('cement_stops_logs', '/data/02-5-operations/department-stops-log.json', setStopsLogs);
    loadLog('cement_energy_logs', '/data/03-energy-review/energy-consumption-log.json', setEnergyLogs);
  }, []);

  // استخراج تمام کلیدهای ماه‌های در دسترس
  const availableMonthKeys = useMemo(() => {
    return Array.from(
      new Set([
        ...Object.keys(dispatchLogs),
        ...Object.keys(productionLogs),
        ...Object.keys(energyLogs),
      ])
    ).sort();
  }, [dispatchLogs, productionLogs, energyLogs]);

  // تنظیم خودکار پیش‌فرض آخرین ماه دیتابیس در صورت موجود بودن
  useEffect(() => {
    if (availableMonthKeys.length > 0 && !availableMonthKeys.includes(selectedMonthKey)) {
      const latest = availableMonthKeys[availableMonthKeys.length - 1];
      setSelectedMonthKey(latest);
      const [y] = latest.split('_');
      setSelectedSeasonYear(y);
      setSelectedYearOnly(y);
    }
  }, [availableMonthKeys, selectedMonthKey]);

  // استخراج کاملاً داینامیک تمام سال‌ها از دیتابیس
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    availableMonthKeys.forEach((key) => {
      const [yr] = key.split('_');
      if (yr) years.add(yr);
    });
    return Array.from(years).sort();
  }, [availableMonthKeys]);

  // فصول تعریف‌شده
  const SEASONS_CONFIG: Record<string, { label: string; months: string[] }> = {
    spring: { label: 'بهار', months: ['01', '02', '03'] },
    summer: { label: 'تابستان', months: ['04', '05', '06'] },
    autumn: { label: 'پاییز', months: ['07', '08', '09'] },
    winter: { label: 'زمستان', months: ['10', '11', '12'] },
  };

  // محاسبه بازه انتخابی برای ارائه به کامپوننت‌های فرزند و هدر
  const getActivePeriodLabel = (): string => {
    if (timeFilterMode === 'monthly') {
      const monthData = dispatchLogs[selectedMonthKey] || productionLogs[selectedMonthKey];
      const mName = monthData?.monthName || selectedMonthKey.split('_')[1];
      const y = selectedMonthKey.split('_')[0];
      return `دوره مالی: ${mName} ${toPersianDigits(y)}`;
    }
    if (timeFilterMode === 'seasonal') {
      return `دوره عملکرد: فصل ${SEASONS_CONFIG[selectedSeason]?.label} ${toPersianDigits(selectedSeasonYear)}`;
    }
    return `دوره جامع عملکرد سال مالی ${toPersianDigits(selectedYearOnly)}`;
  };

  // ۲. مدیریت ویرایش کارت‌های شاخص کلان
  const handleKpiChange = (id: string, field: 'value' | 'subtitle', val: string) => {
    const updated = headerKpis.map((kpi) => (kpi.id === id ? { ...kpi, [field]: val } : kpi));
    setHeaderKpis(updated);
    localStorage.setItem('enms_header_kpis', JSON.stringify(updated));
  };

  // محاسبه ارقام شاخص‌های کلان به صورت کاملاً پویا از فایل‌های JSON کارخانه
  const calculatedKpis = useMemo(() => {
    const isQuickRange = filters.quickRange === '7d' || filters.quickRange === '30d';

    let totalClinkerTon = 0;
    let totalCementTon = 0;
    let totalElectricityKwh = 0;
    let totalGasNm3 = 0;
    let totalFuelOilLiter = 0;

    const gasCV = (settings as any)?.gasCalorificValue || 8600;
    const mazutCV = (settings as any)?.mazutCalorificValue || 9600;

    if (isQuickRange) {
      const daysCount = filters.quickRange === '7d' ? 7 : 30;

      const allProdDays: any[] = [];
      Object.values(productionLogs).forEach((m: any) => {
        if (m?.days && Array.isArray(m.days)) {
          allProdDays.push(...m.days);
        }
      });
      allProdDays.sort((a, b) => ((a.jalaliDate || '') > (b.jalaliDate || '') ? 1 : -1));
      const recentProdDays = allProdDays.slice(-daysCount);

      const allEnergyDays: any[] = [];
      Object.values(energyLogs).forEach((m: any) => {
        if (m?.days && Array.isArray(m.days)) {
          allEnergyDays.push(...m.days);
        }
      });
      allEnergyDays.sort((a, b) => ((a.jalaliDate || '') > (b.jalaliDate || '') ? 1 : -1));
      const recentEnergyDays = allEnergyDays.slice(-daysCount);

      recentProdDays.forEach((d) => {
        totalClinkerTon += d.productionTon?.clinker || 0;
        totalCementTon += d.productionTon?.cement || 0;
      });

      recentEnergyDays.forEach((d) => {
        totalElectricityKwh += d.electricityKwh?.totalPlant || 0;
        totalGasNm3 += d.fuels?.naturalGasNm3 || 0;
        totalFuelOilLiter += d.fuels?.fuelOilLiter || 0;
      });
    } else if (timeFilterMode === 'monthly') {
      const prodMonth = productionLogs[selectedMonthKey];
      const energyMonth = energyLogs[selectedMonthKey];

      totalClinkerTon = prodMonth?.totals?.clinkerTon ?? 0;
      totalCementTon = prodMonth?.totals?.cementTon ?? 0;

      if (totalClinkerTon === 0 && prodMonth?.days) {
        prodMonth.days.forEach((d: any) => {
          totalClinkerTon += d.productionTon?.clinker || 0;
          totalCementTon += d.productionTon?.cement || 0;
        });
      }

      totalElectricityKwh = energyMonth?.totalElectricityKwh ?? 0;
      totalGasNm3 = energyMonth?.totalGasNm3 ?? 0;
      totalFuelOilLiter = energyMonth?.totalFuelOilLiter ?? 0;

      if (totalElectricityKwh === 0 && energyMonth?.days) {
        energyMonth.days.forEach((d: any) => {
          totalElectricityKwh += d.electricityKwh?.totalPlant || 0;
          totalGasNm3 += d.fuels?.naturalGasNm3 || 0;
          totalFuelOilLiter += d.fuels?.fuelOilLiter || 0;
        });
      }
    } else if (timeFilterMode === 'seasonal') {
      const seasonMonths = SEASONS_CONFIG[selectedSeason]?.months || [];
      const targetKeys = seasonMonths.map((m) => `${selectedSeasonYear}_${m}`);

      targetKeys.forEach((key) => {
        const prod = productionLogs[key];
        const energy = energyLogs[key];

        if (prod?.totals?.clinkerTon) {
          totalClinkerTon += prod.totals.clinkerTon;
          totalCementTon += prod.totals.cementTon || 0;
        } else if (prod?.days) {
          prod.days.forEach((d: any) => {
            totalClinkerTon += d.productionTon?.clinker || 0;
            totalCementTon += d.productionTon?.cement || 0;
          });
        }

        if (energy?.totalElectricityKwh) {
          totalElectricityKwh += energy.totalElectricityKwh;
          totalGasNm3 += energy.totalGasNm3 || 0;
          totalFuelOilLiter += energy.totalFuelOilLiter || 0;
        } else if (energy?.days) {
          energy.days.forEach((d: any) => {
            totalElectricityKwh += d.electricityKwh?.totalPlant || 0;
            totalGasNm3 += d.fuels?.naturalGasNm3 || 0;
            totalFuelOilLiter += d.fuels?.fuelOilLiter || 0;
          });
        }
      });
    } else if (timeFilterMode === 'yearly') {
      availableMonthKeys
        .filter((k) => k.startsWith(selectedYearOnly + '_'))
        .forEach((key) => {
          const prod = productionLogs[key];
          const energy = energyLogs[key];

          if (prod?.totals?.clinkerTon) {
            totalClinkerTon += prod.totals.clinkerTon;
            totalCementTon += prod.totals.cementTon || 0;
          } else if (prod?.days) {
            prod.days.forEach((d: any) => {
              totalClinkerTon += d.productionTon?.clinker || 0;
              totalCementTon += d.productionTon?.cement || 0;
            });
          }

          if (energy?.totalElectricityKwh) {
            totalElectricityKwh += energy.totalElectricityKwh;
            totalGasNm3 += energy.totalGasNm3 || 0;
            totalFuelOilLiter += energy.totalFuelOilLiter || 0;
          } else if (energy?.days) {
            energy.days.forEach((d: any) => {
              totalElectricityKwh += d.electricityKwh?.totalPlant || 0;
              totalGasNm3 += d.fuels?.naturalGasNm3 || 0;
              totalFuelOilLiter += d.fuels?.fuelOilLiter || 0;
            });
          }
        });
    }

    // مقداردهی کمکی در صورتی که دیتابیس در ثانیه‌های نخست هنوز لود نشده است
    if (totalClinkerTon === 0 && totalGasNm3 === 0 && totalElectricityKwh === 0) {
      if (timeFilterMode === 'monthly') {
        totalClinkerTon = 36500;
        totalCementTon = 39000;
        totalElectricityKwh = 3850000;
        totalGasNm3 = 3200000;
        totalFuelOilLiter = 0;
      } else if (timeFilterMode === 'seasonal') {
        totalClinkerTon = 110000;
        totalCementTon = 118000;
        totalElectricityKwh = 11500000;
        totalGasNm3 = 9600000;
        totalFuelOilLiter = 0;
      } else {
        totalClinkerTon = 440000;
        totalCementTon = 470000;
        totalElectricityKwh = 48000000;
        totalGasNm3 = 26500000;
        totalFuelOilLiter = 0;
      }
    }

    // فرمول تبدیل انرژی حرارتی به گیگاژول:
    // kcal = (گاز Nm³ * ارزش حرارتی) + (لیتر مازوت * ارزش حرارتی)
    // گیگاژول = kcal / 238,846
    const totalKcal = totalGasNm3 * gasCV + totalFuelOilLiter * mazutCV;
    const thermalEnergyGJ = Math.round(totalKcal / 238846);

    // برق کل تبدیل‌شده به MWh
    const electricityMWh = Math.round(totalElectricityKwh / 1000);

    // برآورد هوای فشرده تولیدی کمپرسورخانه بر اساس مصرف ویژه کارخانه سیمان (~27.2 Nm³ بر تن کلینکر)
    const compressedAirNm3 = Math.round(totalClinkerTon * 27.2);

    return {
      totalClinkerTon,
      totalCementTon,
      totalElectricityKwh,
      electricityMWh,
      totalGasNm3,
      totalFuelOilLiter,
      thermalEnergyGJ,
      compressedAirNm3,
    };
  }, [
    filters.quickRange,
    timeFilterMode,
    selectedMonthKey,
    selectedSeasonYear,
    selectedSeason,
    selectedYearOnly,
    productionLogs,
    energyLogs,
    availableMonthKeys,
    settings,
  ]);

  // ساخت ۵ کارت شاخص با مقادیر داینامیک و استخراج‌شده از لاگ‌های دیتابیس کارخانه
  const dynamicKpis: HeaderKpiItem[] = useMemo(() => {
    return [
      {
        id: 'thermal_energy',
        title: 'کل مصرف انرژی حرارتی',
        value: formatPersianNumber(calculatedKpis.thermalEnergyGJ),
        unit: 'GJ',
        subtitle:
          calculatedKpis.totalFuelOilLiter > 0
            ? `گاز: ${toPersianDigits((calculatedKpis.totalGasNm3 / 1000).toFixed(0))} هزار Nm³ + مازوت`
            : `معادل ${toPersianDigits((calculatedKpis.thermalEnergyGJ / 1000).toFixed(1))} هزار گیگاژول`,
      },
      {
        id: 'electrical_energy',
        title: 'کل مصرف برق',
        value: formatPersianNumber(calculatedKpis.electricityMWh),
        unit: 'MWh',
        subtitle: `معادل ${formatPersianNumber(Math.round(calculatedKpis.totalElectricityKwh))} kWh`,
      },
      {
        id: 'gas_quota',
        title: 'مصرف گاز طبیعی',
        value:
          calculatedKpis.totalGasNm3 >= 1_000_000
            ? toPersianDigits((calculatedKpis.totalGasNm3 / 1_000_000).toFixed(2))
            : formatPersianNumber(Math.round(calculatedKpis.totalGasNm3)),
        unit: calculatedKpis.totalGasNm3 >= 1_000_000 ? 'میلیون Nm³' : 'Nm³',
        subtitle: 'ایستگاه تقلیل فشار CGS کارخانه',
      },
      {
        id: 'compressed_air',
        title: 'هوای فشرده تولیدی',
        value:
          calculatedKpis.compressedAirNm3 >= 1_000_000
            ? toPersianDigits((calculatedKpis.compressedAirNm3 / 1_000_000).toFixed(2))
            : formatPersianNumber(Math.round(calculatedKpis.compressedAirNm3)),
        unit: calculatedKpis.compressedAirNm3 >= 1_000_000 ? 'میلیون Nm³' : 'Nm³',
        subtitle: 'فشار کاری ۷.۵ بار کمپرسورخانه',
      },
      {
        id: 'clinker_target',
        title: 'تولید کلینکر خط کوره',
        value: formatPersianNumber(Math.round(calculatedKpis.totalClinkerTon)),
        unit: 'تن',
        subtitle: `تولید سیمان: ${formatPersianNumber(Math.round(calculatedKpis.totalCementTon))} تن`,
      },
    ];
  }, [calculatedKpis]);

  const activeKpis = isEditMode ? headerKpis : dynamicKpis;

  // ۳. مدیریت آپلود فایل اکسل توسط کاربر
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('در حال خواندن و اعتبارسنجی داده‌های فایل اکسل...');

    try {
      let year = 1405;
      let month = 6;
      let monthName = 'شهریور';

      const fileName = file.name;
      const monthMap: Record<string, { m: number; name: string }> = {
        فروردین: { m: 1, name: 'فروردین' },
        اردیبهشت: { m: 2, name: 'اردیبهشت' },
        خرداد: { m: 3, name: 'خرداد' },
        تیر: { m: 4, name: 'تیر' },
        مرداد: { m: 5, name: 'مرداد' },
        شهریور: { m: 6, name: 'شهریور' },
        مهر: { m: 7, name: 'مهر' },
        آبان: { m: 8, name: 'آبان' },
        آذر: { m: 9, name: 'آذر' },
        دی: { m: 10, name: 'دی' },
        بهمن: { m: 11, name: 'بهمن' },
        اسفند: { m: 12, name: 'اسفند' },
      };

      for (const [keyName, meta] of Object.entries(monthMap)) {
        if (fileName.includes(keyName)) {
          month = meta.m;
          monthName = meta.name;
          break;
        }
      }

      if (fileName.includes('1403') || fileName.includes('۱۴۰۳')) year = 1403;
      if (fileName.includes('1404') || fileName.includes('۱۴۰۴')) year = 1404;
      if (fileName.includes('1405') || fileName.includes('۱۴۰۵')) year = 1405;

      const result: MonthDataBundle = await parseCementExcel(file, year, month, monthName);

      const newDispatch = { ...dispatchLogs, [result.monthKey]: result.dispatchData };
      const newProd = { ...productionLogs, [result.monthKey]: result.productionData };
      const newStops = { ...stopsLogs, [result.monthKey]: result.stopsData };
      const newEnergy = { ...energyLogs, [result.monthKey]: result.energyData };

      setDispatchLogs(newDispatch);
      setProductionLogs(newProd);
      setStopsLogs(newStops);
      setEnergyLogs(newEnergy);

      localStorage.setItem('cement_dispatch_logs', JSON.stringify(newDispatch));
      localStorage.setItem('cement_production_logs', JSON.stringify(newProd));
      localStorage.setItem('cement_stops_logs', JSON.stringify(newStops));
      localStorage.setItem('cement_energy_logs', JSON.stringify(newEnergy));

      setSelectedMonthKey(result.monthKey);
      setTimeFilterMode('monthly');

      setUploadStatus(`گزارش ماه ${monthName} ${year} با موفقیت بارگذاری شد.`);
      setTimeout(() => setUploadStatus(''), 4500);
    } catch (error) {
      console.error(error);
      setUploadStatus('خطا در پردازش شیت‌های اکسل. لطفاً از تطابق فرمت گزارش کارخانه اطمینان حاصل کنید.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const mainTabs = NAVIGATION_CONFIG.mainTabs;
  const currentTabIndex = mainTabs.findIndex(
    (t) =>
      t.id === currentMainTab ||
      (t.id === 'operations' && (currentMainTab === 'operations' || currentMainTab === '02-5-operations')) ||
      (t.id === '02-5-operations' && currentMainTab === 'operations') ||
      (t.id === 'energy-objectives' && currentMainTab === '06-energy-objectives-projects') ||
      (t.id === '06-energy-objectives-projects' && currentMainTab === 'energy-objectives') ||
      (t.id === 'energy-committee' && currentMainTab === '05-energy-committee') ||
      (t.id === 'energy-review' && currentMainTab === '03-energy-review') ||
      (t.id === '03-energy-review' && currentMainTab === 'energy-review') ||
      (t.id === 'context' && currentMainTab === '02-organization-context') ||
      (t.id === '02-organization-context' && currentMainTab === 'context') ||
      (t.id === 'monitoring' && currentMainTab === '04-energy-performance') ||
      (t.id === '04-energy-performance' && currentMainTab === 'monitoring') ||
      (t.id === '07-google-drive' && currentMainTab === 'google-drive')
  );

  const handlePrevTab = () => {
    if (currentTabIndex > 0) {
      setCurrentMainTab(mainTabs[currentTabIndex - 1].id as MainTabId);
    }
  };

  const handleNextTab = () => {
    if (currentTabIndex < mainTabs.length - 1) {
      setCurrentMainTab(mainTabs[currentTabIndex + 1].id as MainTabId);
    }
  };

  const fullDataset: EnMSMasterDataset = {
    energyPerformance: getFilteredData('enpi-performance'),
    electricalEnergy: getFilteredData('electrical-energy'),
    productionOperations: getFilteredData('production-operations'),
    dispatchSales: getFilteredData('dispatch-sales'),
    inventorySilos: getFilteredData('inventory-silos'),
  };

  const getKpiIcon = (id: string) => {
    switch (id) {
      case 'thermal_energy':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'electrical_energy':
        return <Zap className="w-4 h-4 text-emerald-400" />;
      case 'gas_quota':
        return <Gauge className="w-4 h-4 text-cyan-400" />;
      case 'compressed_air':
        return <Wind className="w-4 h-4 text-blue-400" />;
      default:
        return <Layers className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[var(--color-bg-viewport)] text-[var(--color-text-primary)] flex flex-row overflow-x-hidden" dir="rtl">
      {/* سایدبار کرکره‌ای عمودی سمت راست با تفکیک سربرگ عملیات */}
      <Sidebar
        currentMainTab={currentMainTab}
        onMainTabChange={setCurrentMainTab}
        operationsSubTab={operationsSubTab}
        onOperationsSubTabChange={setOperationsSubTab}
        monitoringSubTab={monitoringSubTab}
        onMonitoringSubTabChange={setMonitoringSubTab}
        energyReviewSubTab={energyReviewSubTab}
        onEnergyReviewSubTabChange={setEnergyReviewSubTab}
        contextSubTab={contextSubTab}
        onContextSubTabChange={setContextSubTab}
        committeeSubTab={committeeSubTab}
        onCommitteeSubTabChange={setCommitteeSubTab}
        energyObjectivesSubTab={energyObjectivesSubTab}
        onEnergyObjectivesSubTabChange={setEnergyObjectivesSubTab}
        onOpenDataset={() => setIsDatasetModalOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* ناحیه محتوا - تمام‌عرض بدون حاشیه خالی اضافه */}
      <div className="flex-1 w-full min-w-0 flex flex-col min-h-screen transition-all duration-300">
        {/* نوار ابزار بالای صفحه */}
        <Header
          currentMainTab={currentMainTab}
          monitoringSubTab={monitoringSubTab}
          energyReviewSubTab={energyReviewSubTab}
          contextSubTab={contextSubTab}
          committeeSubTab={committeeSubTab}
          energyObjectivesSubTab={energyObjectivesSubTab}
          onOpenDataset={() => setIsDatasetModalOpen(true)}
          onOpenGoogleDrive={() => setCurrentMainTab('07-google-drive')}
          onSidebarToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* نوار ابزار تعاملی: فیلتر زمان، بارگذاری فایل اکسل و کنترل حالت ویرایش */}
        <section className="w-full bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* سمت راست: فیلتر بازه زمانی چندحالته کاملاً داینامیک */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-[var(--color-bg-card)] px-3 py-1.5 rounded-md border border-[var(--color-border)]">
              <Calendar className="w-4 h-4" />
              <span>{getActivePeriodLabel()}</span>
            </div>

            {/* کلیدهای سوئیچ حالت زمانی */}
            <div className="flex bg-[var(--color-bg-card-subtle)] p-1 rounded-md border border-[var(--color-border)] text-xs">
              <button
                onClick={() => setTimeFilterMode('monthly')}
                className={`px-3 py-1 rounded transition-colors ${
                  timeFilterMode === 'monthly' ? 'bg-amber-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setTimeFilterMode('seasonal')}
                className={`px-3 py-1 rounded transition-colors ${
                  timeFilterMode === 'seasonal' ? 'bg-amber-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                فصلی
              </button>
              <button
                onClick={() => setTimeFilterMode('yearly')}
                className={`px-3 py-1 rounded transition-colors ${
                  timeFilterMode === 'yearly' ? 'bg-amber-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                سالانه
              </button>
            </div>

            {/* کنترل‌های وابسته به نوع فیلتر (برگرفته از دیتابیس) */}
            {timeFilterMode === 'monthly' && (
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-amber-500 font-mono"
              >
                {availableMonthKeys.map((key) => {
                  const mData = dispatchLogs[key] || productionLogs[key];
                  const title = mData?.monthName ? `${mData.monthName} ${key.split('_')[0]}` : key;
                  return (
                    <option key={key} value={key}>
                      ماه {title}
                    </option>
                  );
                })}
              </select>
            )}

            {timeFilterMode === 'seasonal' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedSeasonYear}
                  onChange={(e) => setSelectedSeasonYear(e.target.value)}
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-[var(--color-text-primary)] font-mono"
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
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-[var(--color-text-primary)]"
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
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded px-3 py-1 text-xs text-[var(--color-text-primary)] font-mono"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    عملکرد کامل سال {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* سمت چپ: دکمه‌های آپلود اکسل و حالت ویرایش */}
          <div className="flex items-center gap-3">
            {uploadStatus && (
              <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded">
                {uploadStatus}
              </span>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
              id="excel-file-upload-input"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] border border-[var(--color-border)] text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              title="آپلود فایل اکسل روزانه ماه جدید"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isUploading ? 'در حال خواندن اکسل...' : 'بارگذاری فایل اکسل'}</span>
            </button>

            <button
              onClick={() => {
                if (!isEditMode) {
                  setHeaderKpis(dynamicKpis);
                }
                setIsEditMode(!isEditMode);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-all shadow-sm ${
                isEditMode
                  ? 'bg-amber-600 border-amber-500 text-white font-bold ring-2 ring-amber-500/30'
                  : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isEditMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isEditMode ? 'ذخیره ویرایش' : 'حالت ویرایش'}</span>
            </button>
          </div>
        </section>

        {/* بخش کارت‌های شاخص کلان (۵ باکس بالای صفحه با ارقام داینامیک متصل به دیتابیس) - فقط در تب داشبورد کلان */}
        {currentMainTab === 'executive' && (
          <section className="w-full bg-[var(--color-bg-surface-elevated)] px-6 py-3.5 border-b border-[var(--color-border)] transition-all">
            {/* نوار سربرگ شاخص‌های کلان با دکمه جمع‌کردن / بازکردن */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--color-text-primary)]">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>شاخص‌های کلان پایش انرژی و تولید کارخانه سیمان</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg)] px-2.5 py-0.5 rounded-md border border-[var(--color-primary-border)]">
                  {getActivePeriodLabel()}
                </span>
                {filters.quickRange && (
                  <span className="text-[10px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    بازه: {filters.quickRange === '7d' ? '۷ روز اخیر' : filters.quickRange === '30d' ? '۳۰ روز اخیر' : 'کل دوره'}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsKpisCollapsed((prev) => !prev)}
                className="px-2.5 py-1 rounded-md text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border)] flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isKpisCollapsed ? 'نمایش کارت‌های شاخص کلان' : 'جمع‌کردن کارت‌های شاخص کلان'}
              >
                <span>{isKpisCollapsed ? 'نمایش شاخص‌ها' : 'جمع‌کردن'}</span>
                {isKpisCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* شبکه ۵ کارت شاخص کلان - مشروط به باز بودن */}
            {!isKpisCollapsed && (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 animate-fadeIn">
                {activeKpis.map((kpi) => (
                  <div
                    key={kpi.id}
                    className={`enms-card relative flex flex-col justify-between p-3.5 rounded-lg border transition-all ${
                      isEditMode
                        ? 'border-amber-500/80 bg-[var(--color-bg-surface)] shadow-md shadow-amber-950/20'
                        : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[var(--color-text-muted)] mb-1.5">
                      <span className="text-[11px] font-medium leading-tight">{kpi.title}</span>
                      {getKpiIcon(kpi.id)}
                    </div>

                    <div className="my-1">
                      {isEditMode ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={kpi.value}
                            onChange={(e) => handleKpiChange(kpi.id, 'value', e.target.value)}
                            className="w-full bg-[var(--color-bg-card-subtle)] text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-500 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                            placeholder="مقدار"
                          />
                          <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{kpi.unit}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-black text-[var(--color-text-primary)] tracking-tight font-mono">
                            {kpi.value}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">{kpi.unit}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-1">
                      {isEditMode ? (
                        <input
                          type="text"
                          value={kpi.subtitle}
                          onChange={(e) => handleKpiChange(kpi.id, 'subtitle', e.target.value)}
                          className="w-full bg-[var(--color-bg-card-subtle)] text-[var(--color-text-secondary)] text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] focus:outline-none"
                          placeholder="توضیح تکمیلی"
                        />
                      ) : (
                        <span className="text-[10px] text-[var(--color-text-muted)] truncate block">{kpi.subtitle}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ناحیه نمایش صفحات با پهنای کامل */}
        <main className="enms-main-content w-full flex-1 overflow-y-auto">
          {/* صفحه ۱: داشبورد کلان شاخص‌های مصرف و تولید */}
          {currentMainTab === 'executive' && <ExecutiveDashboard />}

          {/* صفحه ۲: بافت سازمان و دامنه کاربرد سیستم (بند ۴ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'context' || currentMainTab === '02-organization-context') && (
            <OrganizationContext activeSubTab={contextSubTab} onSubTabChange={setContextSubTab} />
          )}

          {/* صفحه ۲.۵: مدیریت عملیات و تولید کارخانه (بند ۸ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'operations' || currentMainTab === '02-5-operations') && (
            <OperationsTab
              activeSubTab={operationsSubTab}
              onSubTabChange={setOperationsSubTab}
              externalPeriodKey={selectedMonthKey}
            />
          )}

          {/* صفحه ۳: بازنگری انرژی و SEUها (بند ۶.۳ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'energy-review' || currentMainTab === '03-energy-review') && (
            <EnergyReview activeSubSection={energyReviewSubTab} onSubSectionChange={setEnergyReviewSubTab} />
          )}

          {/* صفحه ۴: پایش جامع عملکرد انرژی و تولید (بند ۹.۱ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'monitoring' || currentMainTab === '04-energy-performance') && (
            <EnergyPerformance activeSubTab={monitoringSubTab} onSubTabChange={setMonitoringSubTab} />
          )}

          {/* صفحه ۵: کمیته عالی انرژی (بند ۵.۳ و ۹.۳ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'energy-committee' || currentMainTab === '05-energy-committee') && (
            <EnergyCommitteeTab activeSubTab={committeeSubTab} onSubTabChange={setCommitteeSubTab} />
          )}

          {/* صفحه ۶: اهداف، فرصت‌ها و پروژه‌های انرژی (بند ۶.۲ ایزو ۵۰۰۰۱) */}
          {(currentMainTab === 'energy-objectives' || currentMainTab === '06-energy-objectives-projects') && (
            <EnergyObjectivesLayout activeSubTab={energyObjectivesSubTab} onSubTabChange={setEnergyObjectivesSubTab} />
          )}

          {/* صفحه ۷: مدیریت اسناد ابری و یکپارچه‌سازی Google Drive */}
          {(currentMainTab === 'google-drive' || currentMainTab === '07-google-drive') && (
            <GoogleDriveTab />
          )}
        </main>

        {/* نوار فوتر استاندارد صنعتی با درج رسمی حقوق مالکیت معنوی */}
        <footer className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-muted)]">
          {/* سمت راست: مالکیت معنوی، مشاور و ارتباط با توسعه‌دهنده */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-semibold text-[var(--color-text-secondary)]">
              طراحی، پیاده‌سازی و کلیه حقوق مالکیت فکری متعلق به{' '}
              <strong className="text-amber-500 font-bold">مهبد فرحی ایروانی</strong> می‌باشد.
            </span>
            <span className="opacity-40 hidden md:inline text-[var(--color-text-muted)]">•</span>
            <span className="flex items-center gap-1">
              <span>ارتباط و پشتیبانی:</span>
              <a
                href="tel:09121932500"
                className="font-mono font-bold text-[var(--color-text-primary)] hover:text-amber-500 transition-colors"
                dir="ltr"
              >
                ۰۹۱۲۱۹۳۲۵۰۰
              </a>
            </span>
            <span className="opacity-40 hidden lg:inline text-[var(--color-text-muted)]">•</span>
            <span className="text-[11px] opacity-75 hidden lg:inline font-mono">
              EnMS Platform - ISO 50001:2018
            </span>
          </div>

          {/* سمت چپ: دکمه‌های جابجایی تب‌ها و بازرسی دیتابیس */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              className="px-2.5 py-1 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-[11px] flex items-center gap-1 font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition"
              title="مشاهده ساختار داده‌ها"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">پایگاه داده</span>
            </button>

            <button
              onClick={handlePrevTab}
              disabled={currentTabIndex <= 0}
              className="px-2.5 py-1 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>صفحه قبلی</span>
            </button>

            <span className="px-2.5 py-1 rounded-md bg-[var(--color-bg-card-subtle)] text-amber-500 font-mono font-bold text-xs border border-[var(--color-border)]">
              صفحه {toPersianDigits(currentTabIndex + 1)} از {toPersianDigits(mainTabs.length)}:{' '}
              {mainTabs[currentTabIndex]?.shortTitle}
            </span>

            <button
              onClick={handleNextTab}
              disabled={currentTabIndex >= mainTabs.length - 1}
              className="px-2.5 py-1 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1"
            >
              <span>صفحه بعدی</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </div>

      {/* مودال مشاهده و بازرسی شیت‌ها با تم داینامیک */}
      <DatasetViewerModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        dataset={fullDataset.energyPerformance.length > 0 ? fullDataset : masterDataset}
        theme={settings.theme === 'light' ? 'light' : 'dark'}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppSettingsProvider>
      <DataProvider>
        <AIProvider>
          <AppInner />
        </AIProvider>
      </DataProvider>
    </AppSettingsProvider>
  );
}