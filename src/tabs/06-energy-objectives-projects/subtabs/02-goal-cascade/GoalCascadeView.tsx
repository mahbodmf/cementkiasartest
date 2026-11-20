import React, { useState, useEffect, useMemo } from 'react';
import {
  GitFork,
  Plus,
  Compass,
  ChevronDown,
  ChevronUp,
  Search,
  Target,
  BarChart3,
  Layers,
  FolderKanban,
  FileSpreadsheet,
  Network,
  ListFilter,
  AlertTriangle,
} from 'lucide-react';
import { CascadedTargetItem, EnergyProjectItem } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { TargetModal } from './components/TargetModal';
import { TargetCard } from './components/TargetCard';
import { GoalAlignmentGraph } from './components/GoalAlignmentGraph';
import { safeFetchPublicJson } from '../../../../services/configService';

export interface BscKpiItem {
  perspective?: string;
  kpiName: string;
  formula?: string;
  unit?: string;
  target?: string;
  period?: string;
  responsible?: string;
  departments?: string[];
}

export interface BscStrategyItem {
  code: string;
  title: string;
  description?: string;
  perspective?: string;
  kpis?: BscKpiItem[];
}

interface GoalCascadeViewProps {
  targets: CascadedTargetItem[];
  projects: EnergyProjectItem[];
  onAddTarget?: (tgt: CascadedTargetItem) => void;
  onUpdateTarget?: (tgt: CascadedTargetItem) => void;
  onDeleteTarget?: (id: string) => void;
}

export const GoalCascadeView: React.FC<GoalCascadeViewProps> = ({
  targets,
  projects,
  onAddTarget,
  onUpdateTarget,
  onDeleteTarget,
}) => {
  const [viewMode, setViewMode] = useState<'accordion' | 'topology'>('accordion');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<CascadedTargetItem | null>(null);
  const [prefilledStrategicCode, setPrefilledStrategicCode] = useState<string | undefined>(undefined);

  const [allRawStrategies, setAllRawStrategies] = useState<BscStrategyItem[]>([]);
  const [isLoadingBsc, setIsLoadingBsc] = useState<boolean>(true);
  const [collapsedStrategies, setCollapsedStrategies] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    safeFetchPublicJson<{ strategies?: BscStrategyItem[] }>(
      '/data/02-organization-context/strategies-bsc.json',
      { strategies: [] },
      { storageKey: 'enms_strategies_bsc_v1' }
    )
      .then((data) => {
        if (isMounted && data && Array.isArray(data.strategies)) {
          setAllRawStrategies(data.strategies);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingBsc(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * شرط تشخیص شاخص با مسئولیت مدیریت انرژی
   */
  const isEnergyResponsibleKpi = (kpi: BscKpiItem): boolean => {
    const resp = (kpi.responsible || '').toLowerCase();
    const depts = Array.isArray(kpi.departments) ? kpi.departments.join(' ').toLowerCase() : '';
    const name = (kpi.kpiName || '').toLowerCase();

    return (
      resp.includes('مدیریت انرژی') ||
      resp.includes('مدیر انرژی') ||
      resp.includes('واحد انرژی') ||
      depts.includes('مدیریت انرژی') ||
      depts.includes('مدیر انرژی') ||
      depts.includes('واحد انرژی') ||
      name.includes('انرژی') ||
      name.includes('حرارتی') ||
      name.includes('برق') ||
      name.includes('کلینکر')
    );
  };

  /**
   * ساختار سلسله‌مراتبی:
   * کلیه استراتژی‌هایی که شاخص انرژی دارند لیست می‌شوند (چه هدف خرد داشته باشند چه نداشته باشند)
   */
  const cascadeHierarchy = useMemo(() => {
    const result: {
      strategy: BscStrategyItem;
      macroKpis: BscKpiItem[];
      microTargets: CascadedTargetItem[];
      perspective: string;
      rollupProgress: number;
      hasWarningNoTarget: boolean;
    }[] = [];

    allRawStrategies.forEach((rawStrat) => {
      const allKpis = rawStrat.kpis || [];
      const energyKpis = allKpis.filter(isEnergyResponsibleKpi);

      const assignedTargets = (targets || []).filter((t) => {
        const codes = t.strategicCodes || [t.strategicCode];
        return codes.some((c) => {
          const tgtCode = (c || '').trim().toLowerCase();
          const stratCode = (rawStrat.code || '').trim().toLowerCase();
          return tgtCode === stratCode || stratCode.includes(tgtCode) || tgtCode.includes(stratCode);
        });
      });

      // اگر استراتژی دارای شاخص انرژی است یا هدفی به آن منتسب شده، حتماً نمایش داده شود
      if (energyKpis.length > 0 || assignedTargets.length > 0) {
        let totalProgressSum = 0;
        let count = 0;

        assignedTargets.forEach((t) => {
          const linked = (projects || []).filter((p) => (t.linkedProjectIds || []).includes(p.id));
          if (linked.length > 0) {
            const targetAvg = linked.reduce((sum, p) => sum + p.progressPct, 0) / linked.length;
            totalProgressSum += targetAvg;
            count++;
          }
        });

        const rollupProgress = count > 0 ? Math.round(totalProgressSum / count) : 0;
        const hasWarningNoTarget = assignedTargets.length === 0;

        result.push({
          strategy: rawStrat,
          macroKpis: energyKpis.length > 0 ? energyKpis : allKpis,
          microTargets: assignedTargets,
          perspective: rawStrat.perspective || energyKpis[0]?.perspective || 'فرآیندهای داخلی',
          rollupProgress,
          hasWarningNoTarget,
        });
      }
    });

    return result;
  }, [allRawStrategies, targets, projects]);

  const filteredHierarchy = useMemo(() => {
    if (!searchQuery.trim()) return cascadeHierarchy;
    const query = searchQuery.trim().toLowerCase();

    return cascadeHierarchy
      .map((group) => {
        const matchedMicroTargets = group.microTargets.filter(
          (t) =>
            t.id.toLowerCase().includes(query) ||
            t.kpiTitle.toLowerCase().includes(query) ||
            t.department.toLowerCase().includes(query) ||
            t.targetSeu.toLowerCase().includes(query)
        );

        const stratMatches =
          group.strategy.code.toLowerCase().includes(query) ||
          group.strategy.title.toLowerCase().includes(query);

        if (stratMatches || matchedMicroTargets.length > 0) {
          return {
            ...group,
            microTargets: stratMatches ? group.microTargets : matchedMicroTargets,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof cascadeHierarchy;
  }, [cascadeHierarchy, searchQuery]);

  const summaryMetrics = useMemo(() => {
    const totalStrategies = cascadeHierarchy.length;
    const totalMacroKpis = cascadeHierarchy.reduce((acc, curr) => acc + curr.macroKpis.length, 0);
    const totalMicroTargets = targets.length;
    const linkedProjectIds = new Set<string>();
    targets.forEach((t) => {
      (t.linkedProjectIds || []).forEach((pid) => linkedProjectIds.add(pid));
    });

    return {
      totalStrategies,
      totalMacroKpis,
      totalMicroTargets,
      totalLinkedProjects: linkedProjectIds.size,
    };
  }, [cascadeHierarchy, targets]);

  const toggleGroupCollapse = (code: string) => {
    setCollapsedStrategies((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleOpenAddForStrategy = (stratCode: string) => {
    setEditingTarget(null);
    setPrefilledStrategicCode(stratCode);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tgt: CascadedTargetItem) => {
    setEditingTarget(tgt);
    setPrefilledStrategicCode(tgt.strategicCode);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`آیا از حذف هدف کمّی «${title}» اطمینان دارید؟`)) {
      if (onDeleteTarget) onDeleteTarget(id);
    }
  };

  const handleSave = (item: CascadedTargetItem) => {
    if (editingTarget && onUpdateTarget) {
      onUpdateTarget(item);
    } else if (onAddTarget) {
      onAddTarget(item);
    }
  };

  const getPerspectiveBadgeClass = (perspective: string) => {
    if (perspective.includes('مالی')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (perspective.includes('مشتری')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (perspective.includes('یادگیری') || perspective.includes('رشد')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* سربرگ معرفی آبشار و دکمه‌های نما */}
      <div className="enms-card p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                شکست سلسله‌مراتبی و آبشار اهداف انرژی (Goal Cascade Model)
              </h2>
              <span className="enms-badge bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] font-mono">
                بند ۶.۲ ایزو ۵۰۰۰۱
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
              اتصال پویا: <strong className="text-[var(--color-text-primary)]">اهداف و شاخص‌های کلان کارت امتیازی (BSC)</strong> ←{' '}
              <strong className="text-[var(--color-text-primary)]">مقاصد کمّی تجهیزات بارز (SEU)</strong> ←{' '}
              <strong className="text-[var(--color-text-primary)]">پروژه‌های اجرایی بهبود</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="enms-tab-pills !p-1 text-xs flex items-center">
            <button
              onClick={() => setViewMode('accordion')}
              className={`enms-tab-pill !py-1.5 !px-3 flex items-center gap-1.5 ${viewMode === 'accordion' ? 'active' : ''}`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>نمای آکاردئونی</span>
            </button>
            <button
              onClick={() => setViewMode('topology')}
              className={`enms-tab-pill !py-1.5 !px-3 flex items-center gap-1.5 ${viewMode === 'topology' ? 'active' : ''}`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>چارت درختی ارتباطات (Topology)</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTarget(null);
              setPrefilledStrategicCode(undefined);
              setIsModalOpen(true);
            }}
            className="enms-button enms-button-primary text-xs flex items-center gap-2 shrink-0 px-4 py-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف هدف کمّی جدید</span>
          </button>
        </div>
      </div>

      {/* خلاصه آماری ۴ شاخص کلیدی */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-muted)]">استراتژی‌های کلان انرژی</div>
            <div className="text-base font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
              {toPersianDigits(summaryMetrics.totalStrategies)} <span className="text-[11px] font-normal text-[var(--color-text-muted)]">راهبرد</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-muted)]">شاخص‌های کلان BSC انرژی</div>
            <div className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {toPersianDigits(summaryMetrics.totalMacroKpis)} <span className="text-[11px] font-normal text-[var(--color-text-muted)]">شاخص</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-muted)]">مقاصد کمّی تجهیزات بارز</div>
            <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {toPersianDigits(summaryMetrics.totalMicroTargets)} <span className="text-[11px] font-normal text-[var(--color-text-muted)]">هدف خرد</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-muted)]">پروژه‌های اقدام متصل</div>
            <div className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">
              {toPersianDigits(summaryMetrics.totalLinkedProjects)} <span className="text-[11px] font-normal text-[var(--color-text-muted)]">پروژه</span>
            </div>
          </div>
        </div>
      </div>

      {/* حالت ۱: نمای چارت درختی تعاملی */}
      {viewMode === 'topology' && (
        <GoalAlignmentGraph
          strategies={cascadeHierarchy.map((c) => c.strategy)}
          targets={targets}
          projects={projects}
          onSelectTarget={handleOpenEdit}
          onAddTargetForStrategy={handleOpenAddForStrategy}
        />
      )}

      {/* حالت ۲: نمای آکاردئونی ۳ سطحی */}
      {viewMode === 'accordion' && (
        <>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--color-bg-card)] p-3 rounded-xl border border-[var(--color-border)]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="جستجو در استراتژی‌ها، شاخص‌های BSC و اهداف خرد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="enms-input w-full pr-9 pl-3 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
              <button
                onClick={() => setCollapsedStrategies({})}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-secondary)] transition-colors"
              >
                گسترش همه
              </button>
              <button
                onClick={() => {
                  const allCollapsed: Record<string, boolean> = {};
                  cascadeHierarchy.forEach((item) => {
                    allCollapsed[item.strategy.code] = true;
                  });
                  setCollapsedStrategies(allCollapsed);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-card-subtle)] text-[var(--color-text-secondary)] transition-colors"
              >
                جمع‌کردن همه
              </button>
            </div>
          </div>

          {isLoadingBsc ? (
            <div className="p-8 text-center bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] animate-pulse">
              در حال بارگذاری و انطباق آنلاین استراتژی‌های BSC و مقاصد کمّی...
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {filteredHierarchy.map(({ strategy, macroKpis, microTargets, perspective, rollupProgress, hasWarningNoTarget }) => {
                const isCollapsed = collapsedStrategies[strategy.code];

                return (
                  <div
                    key={strategy.code}
                    className="enms-card p-0 overflow-hidden border border-[var(--color-border)] rounded-2xl shadow-xs transition-all"
                  >
                    {/* سطح ۱: هدر استراتژی کلان مادر */}
                    <div className="p-4 sm:p-5 bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div
                        onClick={() => toggleGroupCollapse(strategy.code)}
                        className="flex items-start sm:items-center gap-3.5 cursor-pointer select-none flex-1"
                      >
                        <span className="font-mono font-bold text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white shadow-xs shrink-0 tracking-wider">
                          {strategy.code}
                        </span>
                        <div className="w-full max-w-xl">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                              {strategy.title}
                            </h3>
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium ${getPerspectiveBadgeClass(
                                perspective
                              )}`}
                            >
                              منظر BSC: {perspective}
                            </span>
                            {hasWarningNoTarget ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>فاقد هدف خرد مصوب (اقدام لازم)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--color-bg-card)] border border-[var(--color-border)] text-purple-600 dark:text-purple-400 font-bold">
                                {toPersianDigits(rollupProgress)}٪ تحقق کلان
                              </span>
                            )}
                          </div>

                          <div className="w-full bg-[var(--color-bg-app)] h-1.5 rounded-full mt-2 overflow-hidden border border-[var(--color-border-subtle)]">
                            <div
                              className="bg-purple-600 h-full rounded-full transition-all duration-700"
                              style={{ width: `${rollupProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddForStrategy(strategy.code);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ افزودن هدف خرد به این استراتژی</span>
                        </button>

                        <div
                          onClick={() => toggleGroupCollapse(strategy.code)}
                          className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] transition-colors"
                        >
                          <span className="text-xs font-mono">
                            {toPersianDigits(microTargets.length)} هدف خرد
                          </span>
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                          ) : (
                            <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* سطح ۲ و سطح ۳ در صورت باز بودن */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 flex flex-col gap-6 bg-[var(--color-bg-surface)]">
                        {/* سطح ۲: جدول شاخص‌های کلان BSC */}
                        {macroKpis.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                              <h4 className="text-xs font-bold text-[var(--color-text-secondary)]">
                                شاخص‌های کلان ارزیابی عملکرد کارت امتیازی (BSC Macro KPIs)
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                {toPersianDigits(macroKpis.length)} شاخص کلان واحد انرژی
                              </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-2xs">
                              <table className="w-full text-right text-xs">
                                <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                  <tr>
                                    <th className="p-2.5">منظر BSC</th>
                                    <th className="p-2.5">شاخص کلان (KPI)</th>
                                    <th className="p-2.5 text-center">واحد سنجش</th>
                                    <th className="p-2.5 text-center">مقدار هدف</th>
                                    <th className="p-2.5">فرمول محاسبه</th>
                                    <th className="p-2.5 text-center">دوره پایش</th>
                                    <th className="p-2.5 text-center">مسئول پیگیری</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                  {macroKpis.map((kpi, idx) => (
                                    <tr
                                      key={idx}
                                      className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors"
                                    >
                                      <td className="p-2.5 whitespace-nowrap">
                                        <span
                                          className={`text-[10px] px-2 py-0.5 rounded-full border ${getPerspectiveBadgeClass(
                                            kpi.perspective || perspective
                                          )}`}
                                        >
                                          {kpi.perspective || perspective}
                                        </span>
                                      </td>
                                      <td className="p-2.5 font-semibold text-[var(--color-text-primary)]">
                                        {kpi.kpiName}
                                      </td>
                                      <td className="p-2.5 font-mono text-center text-[var(--color-text-secondary)] whitespace-nowrap">
                                        {kpi.unit || '-'}
                                      </td>
                                      <td className="p-2.5 font-mono font-bold text-center text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                        {toPersianDigits(kpi.target || '-')}
                                      </td>
                                      <td className="p-2.5 text-[11px] text-[var(--color-text-muted)] font-mono max-w-xs truncate" title={kpi.formula}>
                                        {toPersianDigits(kpi.formula || '-')}
                                      </td>
                                      <td className="p-2.5 text-center whitespace-nowrap text-[var(--color-text-secondary)]">
                                        {kpi.period || 'ماهانه'}
                                      </td>
                                      <td className="p-2.5 text-center whitespace-nowrap text-[var(--color-text-secondary)]">
                                        <span className="px-2 py-0.5 rounded bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] text-[11px] font-semibold text-[var(--color-primary)]">
                                          {kpi.responsible || 'مدیر انرژی'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* سطح ۳: مقاصد کمّی خرد SEUها و پروژه‌ها */}
                        <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border-subtle)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-emerald-500" />
                              <h4 className="text-xs font-bold text-[var(--color-text-secondary)]">
                                مقاصد کمّی خرد تجهیزات بارز (SEU) و پروژه‌های اقدام تخصیص‌یافته
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                {toPersianDigits(microTargets.length)} مقصد کمّی شکست‌یافته
                              </span>
                            </div>

                            <button
                              onClick={() => handleOpenAddForStrategy(strategy.code)}
                              className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>افزودن هدف خرد جدید</span>
                            </button>
                          </div>

                          {microTargets.length === 0 ? (
                            <div className="p-5 text-center bg-amber-500/5 rounded-xl border border-dashed border-amber-500/40 flex flex-col items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                برای این استراتژی کلان هنوز هیچ هدف کمّی خردی (Target) به تجهیزات بارز تخصیص داده نشده است.
                              </p>
                              <button
                                onClick={() => handleOpenAddForStrategy(strategy.code)}
                                className="enms-button enms-button-primary text-xs flex items-center gap-1.5 mt-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>تعریف هدف خرد برای رفع عدم انطباق ممیزی</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {microTargets.map((tgt) => {
                                const linked = (projects || []).filter((p) =>
                                  (tgt.linkedProjectIds || []).includes(p.id)
                                );
                                return (
                                  <TargetCard
                                    key={tgt.id}
                                    target={tgt}
                                    linkedProjects={linked}
                                    onEdit={handleOpenEdit}
                                    onDelete={handleDelete}
                                    onAttachMoreProjects={handleOpenEdit}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* مودال پویا بدون هاردکد */}
      <TargetModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTarget(null);
          setPrefilledStrategicCode(undefined);
        }}
        onSave={handleSave}
        initialData={editingTarget}
        existingCount={targets.length}
        availableProjects={projects}
        defaultStrategicCode={prefilledStrategicCode}
      />
    </div>
  );
};

export default GoalCascadeView;