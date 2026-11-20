import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, 
  DollarSign, 
  Lightbulb, 
  AlertOctagon, 
  Search, 
  RefreshCw
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { DailyEfficiencyTrackingSection, DailyEfficiencyItem } from './DailyEfficiencyTrackingSection';

export interface EfficiencyOpportunitiesViewProps {
  equipmentEfficiency?: any[];
  actionPlans?: any[];
  onEquipmentChange?: (updated: any) => void;
  onActionPlansChange?: (updated: any) => void;
  isEditing?: boolean;
}

interface SignificantEquipment {
  tag: string;
  name: string;
  department: string;
  nominalCapacity: string;
  operatingEfficiency: number;
  benchmarkEfficiency: number;
  lossFactors: string;
  correctiveAction: string;
  status: 'critical' | 'needs_improvement' | 'moderate' | 'optimal' | 'in_progress';
}

interface EfficiencyKpiCardConfig {
  id: string;
  title: string;
  value: string;
  unit: string;
  subtitle: string;
  type: string;
}

const DEFAULT_KPI_CARDS: EfficiencyKpiCardConfig[] = [
  { id: '1', title: 'میانگین راندمان تجهیزات بارز', value: '۷۲', unit: '٪', subtitle: 'فاصله تا بنچ‌مارک استاندارد: ۶٪', type: 'gauge' },
  { id: '2', title: 'تعداد فرصت‌های بهبود (EnOP)', value: '۴', unit: 'پروژه', subtitle: '۲ پروژه در حال پیگیری و اجرا', type: 'lightbulb' },
  { id: '3', title: 'سرمایه‌گذاری پروژه‌های بهینه‌سازی', value: '۸۴,۵۰۰', unit: 'م.ریال', subtitle: 'دوره بازگشت سرمایه میانگین: ۱۱ ماه', type: 'dollar' },
  { id: '4', title: 'تجهیزات نیازمند بهینه‌سازی', value: '۲', unit: 'دستگاه', subtitle: 'اتلاف حرارتی و مکانیکی نیازمند اقدام فوری', type: 'alert' },
];

export const EfficiencyOpportunitiesView: React.FC<EfficiencyOpportunitiesViewProps> = () => {
  const [equipmentList, setEquipmentList] = useState<SignificantEquipment[]>([]);
  const [kpiCards, setKpiCards] = useState<EfficiencyKpiCardConfig[]>(DEFAULT_KPI_CARDS);
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'enop_projects'>('benchmarks');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [allProdData, setAllProdData] = useState<Record<string, any>>({});
  const [selectedPeriodKey, setSelectedPeriodKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ۱. واکشی داده‌های پیکربندی و تجهیزات از فایل‌های JSON در پوشه public
  useEffect(() => {
    const loadConfiguration = async () => {
      setIsLoading(true);
      try {
        // خواندن لیست تجهیزات بارز و بنچ‌مارک‌ها
        const equipRes = await fetch('/data/03-energy-review/equipment-benchmarks.json');
        if (equipRes.ok) {
          const equipData = await equipRes.json();
          const rawList = Array.isArray(equipData) ? equipData : (equipData.equipmentBenchmarks || []);
          const normalized: SignificantEquipment[] = rawList.map((item: any) => ({
            tag: item.tag || '',
            name: item.name || '',
            department: item.department || '',
            nominalCapacity: item.nominalCapacity || '',
            operatingEfficiency: item.operatingEfficiency ?? item.operatingEfficiencyPct ?? 65,
            benchmarkEfficiency: item.benchmarkEfficiency ?? item.benchmarkEfficiencyPct ?? 70,
            lossFactors: Array.isArray(item.lossFactors) ? item.lossFactors.join('؛ ') : (item.lossFactors || ''),
            correctiveAction: item.correctiveAction || '',
            status: item.status || 'needs_improvement',
          }));
          setEquipmentList(normalized);
        }

        // خواندن کارت‌های شاخص کلیدی بالای صفحه
        const kpiRes = await fetch('/data/03-energy-review/efficiency-kpis-config.json');
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          if (Array.isArray(kpiData)) {
            setKpiCards(kpiData);
          } else if (kpiData.kpiCards && Array.isArray(kpiData.kpiCards)) {
            setKpiCards(kpiData.kpiCards);
          } else {
            setKpiCards(DEFAULT_KPI_CARDS);
          }
        } else {
          setKpiCards(DEFAULT_KPI_CARDS);
        }

        // خواندن لاگ‌های تولید کارخانه
        const savedProd = localStorage.getItem('cement_production_logs');
        if (savedProd) {
          const parsed = JSON.parse(savedProd);
          setAllProdData(parsed);
          const keys = Object.keys(parsed).sort();
          if (keys.length > 0) {
            setSelectedPeriodKey(keys[keys.length - 1]);
          }
        } else {
          const prodRes = await fetch('/data/02-5-operations/daily-production-report.json');
          if (prodRes.ok) {
            const parsed = await prodRes.json();
            setAllProdData(parsed);
            localStorage.setItem('cement_production_logs', JSON.stringify(parsed));
            const keys = Object.keys(parsed).sort();
            if (keys.length > 0) {
              setSelectedPeriodKey(keys[keys.length - 1]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching efficiency data and configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfiguration();
  }, []);

  // ۲. استخراج کاملاً داینامیک رکوردهای روزانه راندمان
  const currentPeriodData = allProdData[selectedPeriodKey] || {};
  const rawDays: any[] = currentPeriodData.days || currentPeriodData.dailyRecords || [];

  const dailyRecords: DailyEfficiencyItem[] = useMemo(() => {
    return rawDays.map((d: any, idx: number) => {
      const prod = d.productionTon || {};
      const kilnFeed = d.kilnFeedTon ?? prod.kilnFeed ?? 0;
      const clinker = d.clinkerTon ?? prod.clinker ?? 0;
      const cement = d.totalCementTon ?? prod.cement ?? 0;

      const kilnEff = d.kilnEfficiencyPct ?? (clinker > 0 ? Math.min(99, Math.round((clinker / 2000) * 100)) : 0);
      const millEff = d.cementMillEfficiencyPct ?? (cement > 0 ? Math.min(98, Math.round((cement / 2200) * 100)) : 0);

      return {
        dayNumber: d.dayNumber || idx + 1,
        jalaliDate: d.jalaliDate || '',
        kilnFeedTon: Number(kilnFeed.toFixed(1)),
        clinkerTon: Number(clinker.toFixed(1)),
        totalCementTon: Number(cement.toFixed(1)),
        kilnEfficiencyPct: kilnEff,
        cementMillEfficiencyPct: millEff,
        notes: d.notes || '',
      };
    });
  }, [rawDays]);

  // ۳. محاسبه و انطباق داینامیک راندمان کوره و آسیاب سیمان بر اساس دوره جاری
  const dynamicEquipmentList = useMemo(() => {
    if (dailyRecords.length === 0 || equipmentList.length === 0) return equipmentList;

    const validKiln = dailyRecords.filter((r) => r.kilnEfficiencyPct > 0);
    const avgKiln = validKiln.length > 0 
      ? +(validKiln.reduce((s, r) => s + r.kilnEfficiencyPct, 0) / validKiln.length).toFixed(1) 
      : 0;

    const validMill = dailyRecords.filter((r) => r.cementMillEfficiencyPct > 0);
    const avgMill = validMill.length > 0 
      ? +(validMill.reduce((s, r) => s + r.cementMillEfficiencyPct, 0) / validMill.length).toFixed(1) 
      : 0;

    return equipmentList.map((eq) => {
      if (eq.tag === 'KL.100.431' && avgKiln > 0) {
        return { ...eq, operatingEfficiency: avgKiln };
      }
      if (eq.tag === 'BM.010.531' && avgMill > 0) {
        return { ...eq, operatingEfficiency: avgMill };
      }
      return eq;
    });
  }, [equipmentList, dailyRecords]);

  // استخراج بنچ‌مارک‌های کوره و آسیاب از فایل تجهیزات (بدون هاردکد عددی)
  const kilnBenchmark = dynamicEquipmentList.find((e) => e.tag === 'KL.100.431')?.benchmarkEfficiency || 68.0;
  const millBenchmark = dynamicEquipmentList.find((e) => e.tag === 'BM.010.531')?.benchmarkEfficiency || 78.0;

  const filteredEquipment = dynamicEquipmentList.filter(
    (e) =>
      e.name.includes(searchFilter) ||
      e.department.includes(searchFilter) ||
      e.tag.includes(searchFilter)
  );

  const periodTitle = currentPeriodData.monthName
    ? `${currentPeriodData.monthName} ${toPersianDigits(currentPeriodData.year)}`
    : selectedPeriodKey || '';

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'gauge':
        return <Gauge className="w-6 h-6 text-cyan-500/80" />;
      case 'lightbulb':
        return <Lightbulb className="w-6 h-6 text-emerald-500/80" />;
      case 'dollar':
        return <DollarSign className="w-6 h-6 text-amber-500/80" />;
      default:
        return <AlertOctagon className="w-6 h-6 text-rose-500/80" />;
    }
  };

  const getStatusBadge = (status: SignificantEquipment['status']) => {
    switch (status) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/80">بحرانی</span>;
      case 'needs_improvement':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/80">نیازمند بهبود</span>;
      case 'moderate':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/60 text-yellow-400 border border-yellow-800/80">متوسط</span>;
      case 'optimal':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80">مطلوب</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-400 border border-cyan-800/80">در حال اقدام</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--color-text-muted)] gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
        <span>در حال بارگذاری شناسنامه تجهیزات و بنچ‌مارک‌های استاندارد...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn text-xs" dir="rtl">
      {/* رندر کاملاً داینامیک باکس‌های شاخص کلیدی از فایل کانفیگ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((card) => (
          <div key={card.id} className="enms-kpi-card p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between shadow-xs">
            <div>
              <span className="enms-kpi-title text-[11px] text-[var(--color-text-muted)] block">{card.title}</span>
              <div className="enms-kpi-value text-xl font-bold font-mono text-[var(--color-text-primary)] mt-1">
                {toPersianDigits(card.value)} <span className="enms-kpi-unit text-xs font-sans text-[var(--color-text-muted)]">{card.unit}</span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">{card.subtitle}</span>
            </div>
            {getCardIcon(card.type)}
          </div>
        ))}
      </div>

      {/* جدول شناسنامه تجهیزات بارز و ارزیابی انطباق */}
      <div className="enms-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'benchmarks'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>ارزیابی راندمان و بنچ‌مارک تجهیزات کلیدی</span>
            </button>
            <button
              onClick={() => setActiveTab('enop_projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'enop_projects'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>فرصت‌های بهبود و پروژه‌های EnOP (برنامه‌های اقدام)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* انتخاب‌گر دوره جهت پایش زنده راندمان */}
            <select
              value={selectedPeriodKey}
              onChange={(e) => setSelectedPeriodKey(e.target.value)}
              className="bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded px-2.5 py-1 text-xs text-amber-400 font-mono focus:outline-none"
            >
              {Object.keys(allProdData).sort().map((k) => (
                <option key={k} value={k}>
                  {allProdData[k]?.monthName || 'ماه'} {allProdData[k]?.year ? toPersianDigits(allProdData[k].year) : ''} ({k})
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="جستجو در تجهیزات، دپارتمان یا پروژه‌ها..."
                className="enms-input text-xs pl-8 w-56"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute left-2 top-2.5" />
            </div>
          </div>
        </div>

        {activeTab === 'benchmarks' && (
          <div className="enms-table-container">
            <table className="enms-table text-xs">
              <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                <tr>
                  <th className="p-2.5 text-center">کد تگ</th>
                  <th className="p-2.5">نام تجهیز بارز</th>
                  <th className="p-2.5 text-center">دپارتمان</th>
                  <th className="p-2.5 text-center">ظرفیت نامی</th>
                  <th className="p-2.5 text-center text-amber-500 font-bold">راندمان کاری</th>
                  <th className="p-2.5 text-center">بنچ‌مارک استاندارد</th>
                  <th className="p-2.5">عوامل اتلاف حرارتی یا الکتریکی</th>
                  <th className="p-2.5">اقدام اصلاحی جهت ارتقای راندمان</th>
                  <th className="p-2.5 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-mono">
                {filteredEquipment.map((item) => (
                  <tr key={item.tag} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition">
                    <td className="p-2.5 text-center text-[var(--color-primary)] font-bold">{item.tag}</td>
                    <td className="p-2.5 font-semibold text-[var(--color-text-primary)] font-sans">{item.name}</td>
                    <td className="p-2.5 text-center text-[var(--color-text-muted)] font-sans">{item.department}</td>
                    <td className="p-2.5 text-center text-[var(--color-text-secondary)]">{item.nominalCapacity}</td>
                    <td className="p-2.5 text-center font-bold text-amber-400">٪{toPersianDigits(item.operatingEfficiency)}</td>
                    <td className="p-2.5 text-center text-[var(--color-text-muted)]">٪{toPersianDigits(item.benchmarkEfficiency)}</td>
                    <td className="p-2.5 text-[11px] font-sans text-[var(--color-text-muted)] max-w-xs">{item.lossFactors}</td>
                    <td className="p-2.5 text-[11px] font-sans text-emerald-400/90 max-w-xs">{item.correctiveAction}</td>
                    <td className="p-2.5 text-center font-sans">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* کارنامه تفکیکی راندمان روزانه کوره و آسیاب سیمان */}
      <DailyEfficiencyTrackingSection
        dailyRecords={dailyRecords}
        periodTitle={periodTitle}
        kilnBenchmarkPct={kilnBenchmark}
        millBenchmarkPct={millBenchmark}
      />
    </div>
  );
};

export const EquipmentEfficiencyView = EfficiencyOpportunitiesView;
export const ActionPlansView = EfficiencyOpportunitiesView;
export default EfficiencyOpportunitiesView;