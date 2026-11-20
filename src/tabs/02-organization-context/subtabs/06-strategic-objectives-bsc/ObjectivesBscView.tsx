import React, { useState, useEffect, useMemo } from 'react';
import {
  Target,
  DollarSign,
  Users,
  Cpu,
  GraduationCap,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { safeFetchPublicJson } from '../../../../services/configService';

interface BscKpiItem {
  perspective: 'فرآیندهای داخلی' | 'مشتری' | 'مالی' | 'یادگیری و رشد' | string;
  kpiName: string;
  formula: string;
  unit: string;
  target: string;
  period: string;
  responsible: string;
  departments?: string[];
}

interface StrategyGroup {
  code: string;
  title: string;
  description: string;
  kpis: BscKpiItem[];
}

export const ObjectivesBscView: React.FC = () => {
  const [bscData, setBscData] = useState<{ strategies: StrategyGroup[] } | null>({ strategies: [] });

  // استیت‌های فیلتر چندبعدی
  const [selectedPerspective, setSelectedPerspective] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // کنترل آکاردئون‌ها (کدهای استراتژی باز)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'WO-1': true,
    'WO-2': true,
    'WO-3': false,
    'WO-4': false,
    'WO-5': false,
    'WO-6': false,
    'WO-7': false,
    'WO-8': false,
  });

  useEffect(() => {
    let isMounted = true;
    safeFetchPublicJson<{ strategies: StrategyGroup[] }>(
      '/data/02-organization-context/strategies-bsc.json',
      { strategies: [] },
      { storageKey: 'enms_strategies_bsc_v1' }
    ).then((data) => {
      if (isMounted && data && Array.isArray(data.strategies)) {
        setBscData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleCard = (code: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const expandAll = () => {
    if (!bscData) return;
    const allOpen: Record<string, boolean> = {};
    bscData.strategies.forEach((s) => (allOpen[s.code] = true));
    setExpandedCards(allOpen);
  };

  const collapseAll = () => {
    if (!bscData) return;
    const allClosed: Record<string, boolean> = {};
    bscData.strategies.forEach((s) => (allClosed[s.code] = false));
    setExpandedCards(allClosed);
  };

  const resetFilters = () => {
    setSelectedPerspective('all');
    setSelectedDepartment('all');
    setSelectedPeriod('all');
    setSearchTerm('');
  };

  // استخراج لیست یکتای دپارتمان‌ها جهت فیلتر
  const departmentOptions = useMemo(() => {
    return [
      { id: 'all', title: 'همه دپارتمان‌ها و واحدها' },
      { id: 'انرژی', title: 'واحد مدیریت انرژی' },
      { id: 'تولید', title: 'مدیریت تولید' },
      { id: 'فروش', title: 'مدیریت بازاریابی و فروش' },
      { id: 'مالی', title: 'مدیریت مالی' },
      { id: 'HSE', title: 'واحد بهداشت، ایمنی و محیط زیست (HSE)' },
      { id: 'محیط زیست', title: 'واحد محیط زیست' },
      { id: 'منابع انسانی', title: 'مدیریت منابع انسانی' },
      { id: 'shared', title: 'مسئولیت‌های مشترک (بین‌واحدی) ⚡' },
    ];
  }, []);

  // فیلتر هوشمند استراتژی‌ها و شاخص‌های فرزند
  const filteredStrategies = useMemo(() => {
    if (!bscData || !bscData.strategies) return [];

    return bscData.strategies
      .map((strategy) => {
        const matchingKpis = (strategy.kpis || []).filter((kpi) => {
          // ۱. فیلتر منظر BSC
          const matchPerspective =
            selectedPerspective === 'all' || kpi.perspective.includes(selectedPerspective);

          // ۲. فیلتر مسئول / دپارتمان
          let matchDepartment = true;
          if (selectedDepartment === 'shared') {
            // آیا اقدام مشترک است؟
            matchDepartment = Boolean(
              kpi.responsible.includes('+') ||
              kpi.responsible.includes('و') ||
              (kpi.departments && kpi.departments.length > 1)
            );
          } else if (selectedDepartment !== 'all') {
            matchDepartment = Boolean(
              kpi.responsible.includes(selectedDepartment) ||
              (kpi.departments && kpi.departments.includes(selectedDepartment))
            );
          }

          // ۳. فیلتر دوره گزارش‌گیری
          const matchPeriod =
            selectedPeriod === 'all' || kpi.period === selectedPeriod;

          // ۴. جستجوی متنی
          const matchSearch =
            searchTerm === '' ||
            strategy.title.includes(searchTerm) ||
            strategy.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            kpi.kpiName.includes(searchTerm) ||
            kpi.formula.includes(searchTerm) ||
            kpi.responsible.includes(searchTerm);

          return matchPerspective && matchDepartment && matchPeriod && matchSearch;
        });

        return {
          ...strategy,
          matchingKpis,
        };
      })
      .filter((s) => s.matchingKpis.length > 0);
  }, [bscData, selectedPerspective, selectedDepartment, selectedPeriod, searchTerm]);

  // مجموع تعداد شاخص‌های نمایش داده شده
  const totalVisibleKpis = useMemo(() => {
    return filteredStrategies.reduce((acc, s) => acc + s.matchingKpis.length, 0);
  }, [filteredStrategies]);

  const getPerspectiveMeta = (p: string) => {
    switch (p) {
      case 'مالی':
        return {
          icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />,
          badgeClass: 'badge-success',
          border: 'border-emerald-500/30',
        };
      case 'مشتری':
        return {
          icon: <Users className="w-3.5 h-3.5 text-sky-500" />,
          badgeClass: 'badge-info',
          border: 'border-sky-500/30',
        };
      case 'فرآیندهای داخلی':
        return {
          icon: <Cpu className="w-3.5 h-3.5 text-amber-500" />,
          badgeClass: 'badge-warning',
          border: 'border-amber-500/30',
        };
      default:
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-purple-500" />,
          badgeClass: 'badge-purple',
          border: 'border-purple-500/30',
        };
    }
  };

  if (!bscData) {
    return (
      <div className="enms-card p-12 text-center text-[var(--color-text-muted)] animate-pulse">
        در حال بارگذاری اهداف کلان و استراتژی‌های BSC سیمان کیاسر...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" dir="rtl">
      {/* ۱. سربرگ بخش اهداف کلان */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۶.۲ استاندارد ISO 50001:2018</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  Balanced Scorecard (BSC) & Action Plans
                </span>
              </div>
              <h1 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                اهداف کلان، مقاصد خرد و کارت امتیازی متوازن (BSC) سیمان کیاسر
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                ماتریس راهبردهای WO-1 الی WO-8، شاخص‌های ارزیابی عملکرد، فرمول‌های محاسبه، مقادیر هدف و مسئولین پایش
              </p>
            </div>
          </div>

          {/* کلیدهای کنترل باز/بسته کردن سریع */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={expandAll}
              className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs flex items-center gap-1"
              title="نمایش جزئیات تمامی استراتژی‌ها"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>باز کردن همه</span>
            </button>
            <button
              onClick={collapseAll}
              className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs flex items-center gap-1"
              title="بستن تمام کرکره‌ها جهت مشاهده فشرده"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>بستن همه</span>
            </button>
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              شاخص‌های فیلترشده: <strong className="text-[var(--color-primary)] font-bold">{toPersianDigits(totalVisibleKpis)}</strong> از ۲۸
            </span>
          </div>
        </div>

        {/* ۲. نوار فیلتر چندبعدی پیشرفته */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* فیلتر منظر BSC */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] mb-1 block">
              منظر کارت امتیازی (BSC):
            </label>
            <select
              value={selectedPerspective}
              onChange={(e) => setSelectedPerspective(e.target.value)}
              className="enms-select text-xs w-full"
            >
              <option value="all">همه مناظر چهارگانه</option>
              <option value="مالی">منظر مالی</option>
              <option value="مشتری">منظر مشتری و بازار</option>
              <option value="فرآیندهای داخلی">منظر فرآیندهای داخلی</option>
              <option value="یادگیری و رشد">منظر رشد و یادگیری</option>
            </select>
          </div>

          {/* فیلتر متولی و دپارتمان */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] mb-1 block">
              مسئول پایش و دپارتمان:
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="enms-select text-xs w-full"
            >
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          {/* فیلتر دوره پایش */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] mb-1 block">
              تناوب پایش / دوره گزارش:
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="enms-select text-xs w-full"
            >
              <option value="all">همه دوره‌ها (ماهانه، فصلی، سالانه)</option>
              <option value="ماهانه">ماهانه</option>
              <option value="فصلی">فصلی</option>
              <option value="سالانه">سالانه</option>
            </select>
          </div>

          {/* جستجوی زنده */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-text-muted)] mb-1 block">
              جستجو در عناوین و فرمول‌ها:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="عنوان شاخص، فرمول یا مسئول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="enms-input text-xs pr-8 pl-3 w-full"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            </div>
          </div>
        </div>

        {/* دکمه ریست فیلتر در صورت فعال بودن فیلترها */}
        {(selectedPerspective !== 'all' ||
          selectedDepartment !== 'all' ||
          selectedPeriod !== 'all' ||
          searchTerm !== '') && (
          <div className="mt-3 flex items-center justify-between text-xs bg-[var(--color-bg-hover)] p-2 rounded-lg">
            <span className="text-[var(--color-text-secondary)]">فیلترهای سفارشی بر روی لیست اعمال گردیده است.</span>
            <button
              onClick={resetFilters}
              className="text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>پاک‌سازی فیلترها</span>
            </button>
          </div>
        )}
      </div>

      {/* ۳. لیست آکاردئونی استراتژی‌های مادر و جداول زیرمجموعه */}
      <div className="flex flex-col gap-3">
        {filteredStrategies.length === 0 ? (
          <div className="enms-card p-8 text-center text-[var(--color-text-muted)]">
            هیچ هدفی با فیلترهای انتخابی مطابقت ندارد.
          </div>
        ) : (
          filteredStrategies.map((strat) => {
            const isExpanded = !!expandedCards[strat.code];
            return (
              <div
                key={strat.code}
                className="enms-card p-0 overflow-hidden border border-[var(--color-border)] shadow-xs transition-all"
              >
                {/* هدر آکاردئون استراتژی مادر */}
                <button
                  onClick={() => toggleCard(strat.code)}
                  className="w-full p-4 flex items-center justify-between bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-hover)] transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-8 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] text-[var(--color-primary)] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {strat.code}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {strat.title}
                      </h3>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                        {strat.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {toPersianDigits(strat.matchingKpis.length)} شاخص
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                  </div>
                </button>

                {/* بدنه آکاردئون: جدول شاخص‌های ارزیابی (KPI) */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-app)]">
                    <div className="enms-table-container border-0 rounded-none overflow-x-auto">
                      <table className="enms-table text-xs">
                        <thead>
                          <tr className="bg-[var(--color-bg-card-subtle)]">
                            <th className="w-28 text-center">منظر BSC</th>
                            <th className="min-w-[180px]">شاخص ارزیابی (KPI)</th>
                            <th className="min-w-[220px]">فرمول محاسبه</th>
                            <th className="w-16 text-center">واحد</th>
                            <th className="w-28 text-center">مقدار هدف</th>
                            <th className="w-20 text-center">دوره</th>
                            <th className="w-32 text-center">مسئول پایش</th>
                          </tr>
                        </thead>
                        <tbody>
                          {strat.matchingKpis.map((kpi, kIdx) => {
                            const meta = getPerspectiveMeta(kpi.perspective);
                            const isShared =
                              kpi.responsible.includes('+') ||
                              kpi.responsible.includes('و') ||
                              (kpi.departments && kpi.departments.length > 1);

                            return (
                              <tr
                                key={kIdx}
                                className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)] transition-colors"
                              >
                                {/* منظر BSC */}
                                <td className="text-center">
                                  <span className={`enms-badge ${meta.badgeClass} text-[10px]`}>
                                    {meta.icon}
                                    <span>{kpi.perspective}</span>
                                  </span>
                                </td>

                                {/* عنوان شاخص */}
                                <td className="font-semibold text-[var(--color-text-primary)]">
                                  {kpi.kpiName}
                                </td>

                                {/* فرمول محاسبه */}
                                <td className="text-[11px] font-mono text-[var(--color-text-muted)] dir-ltr text-right">
                                  {kpi.formula}
                                </td>

                                {/* واحد */}
                                <td className="text-center font-mono text-[11px] text-[var(--color-text-secondary)]">
                                  {kpi.unit}
                                </td>

                                {/* هدف */}
                                <td className="text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                  {toPersianDigits(kpi.target)}
                                </td>

                                {/* دوره */}
                                <td className="text-center text-[var(--color-text-muted)] font-medium">
                                  {kpi.period}
                                </td>

                                {/* مسئول پایش */}
                                <td className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span
                                      className={`text-xs font-semibold ${
                                        isShared ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--color-text-primary)]'
                                      }`}
                                    >
                                      {kpi.responsible}
                                    </span>
                                    {isShared && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                                        title="مسئولیت مشترک بین چند دپارتمان"
                                      />
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ObjectivesBscView;