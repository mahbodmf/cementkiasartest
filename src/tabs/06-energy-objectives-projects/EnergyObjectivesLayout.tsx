import React, { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  GitFork,
  Kanban,
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  EnergyObjectivesSubTabId,
  EnergyProjectsMasterData,
  EnergyOpportunityItem,
  CascadedTargetItem,
  EnergyProjectItem,
  FinancialAndMVItem,
} from '../../types';
import { OpportunitiesView } from './subtabs/01-opportunities';
import { GoalCascadeView } from './subtabs/02-goal-cascade';
import { ProjectTrackerView } from './subtabs/03-project-tracker';
import { FinancialMvView } from './subtabs/04-financial-mv';
import { toPersianDigits, formatPersianNumber } from '../../utils/persianUtils';

const STORAGE_KEY = 'enms_energy_projects_data_v1';

interface EnergyObjectivesLayoutProps {
  activeSubTab?: EnergyObjectivesSubTabId;
  onSubTabChange?: (tab: EnergyObjectivesSubTabId) => void;
}

export const EnergyObjectivesLayout: React.FC<EnergyObjectivesLayoutProps> = ({
  activeSubTab: externalSubTab,
  onSubTabChange: externalOnChange,
}) => {
  const [internalSubTab, setInternalSubTab] = useState<EnergyObjectivesSubTabId>('opportunities');
  const activeSubTab = externalSubTab || internalSubTab;

  const [data, setData] = useState<EnergyProjectsMasterData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const setSubTab = (tab: EnergyObjectivesSubTabId) => {
    setInternalSubTab(tab);
    if (externalOnChange) externalOnChange(tab);
  };

  const calculateSummary = (
    opps: EnergyOpportunityItem[] = [],
    prjs: EnergyProjectItem[] = []
  ) => {
    const oppList = opps || [];
    const prjList = prjs || [];
    const activeProjects = prjList.filter((p) => p.status !== 'پایان‌یافته');
    const totalCapex = prjList.reduce((sum, p) => sum + (p.capexBudgetMillionRials || 0), 0);
    const approvedOpps = oppList.filter((o) => (o.status || '').includes('تصویب'));
    const totalSaving = approvedOpps.reduce(
      (sum, o) => sum + (o.estimatedFinancialSavingMillionRials || 0),
      0
    );
    const avgProgress =
      prjList.length > 0
        ? Math.round(prjList.reduce((sum, p) => sum + (p.progressPct || 0), 0) / prjList.length)
        : 0;

    return {
      totalOpportunitiesCount: oppList.length,
      activeProjectsCount: activeProjects.length,
      totalCapexBudgetMillionRials: totalCapex,
      totalAnnualFinancialSavingMillionRials: totalSaving,
      achievedSavingPct: avgProgress,
    };
  };

  const persistData = useCallback((newData: EnergyProjectsMasterData) => {
    const updatedSummary = calculateSummary(newData.opportunities, newData.projects);
    const finalData: EnergyProjectsMasterData = {
      ...newData,
      summary: updatedSummary,
    };
    setData(finalData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
    } catch (e) {
      console.error('خطا در ذخیره‌سازی داده‌ها در localStorage:', e);
    }
  }, []);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as EnergyProjectsMasterData;
        if (parsed.opportunities && parsed.projects) {
          setData(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('عدم امکان بازخوانی کش لوکال، دریافت از فایل پشتیبان:', e);
    }

    fetch('/data/06-energy-objectives-projects/energy-projects.json')
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.text();
      })
      .then((text) => {
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) {
          throw new Error('Non-JSON response');
        }
        const json = JSON.parse(text) as EnergyProjectsMasterData;
        setData(json);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        } catch (err) {
          console.warn('ذخیره اولیه در localStorage ناموفق بود:', err);
        }
        setIsLoading(false);
      })
      .catch(() => {
        const fallbackData: EnergyProjectsMasterData = {
          opportunities: [],
          targetsCascade: [],
          projects: [],
          financialAndMV: [],
          summary: {
            totalOpportunitiesCount: 0,
            activeProjectsCount: 0,
            totalCapexBudgetMillionRials: 0,
            totalAnnualFinancialSavingMillionRials: 0,
            achievedSavingPct: 0,
          },
        };
        setData(fallbackData);
        setIsLoading(false);
      });
  }, []);

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'آیا از بازنشانی کامل داده‌های اهداف و پروژه‌ها به مقادیر اولیه اطمینان دارید؟ تمام تغییرات اعمال‌شده بازگردانی خواهند شد.'
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      loadData();
      showNotification('داده‌ها با موفقیت به مقادیر پیش‌فرض بازنشانی شدند.');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==================== هندلرهای ساب‌تب ۱: فرصت‌های بهبود ====================
  const handleAddOpportunity = (item: EnergyOpportunityItem) => {
    if (!data) return;
    const updatedOpps = [item, ...data.opportunities];
    persistData({
      ...data,
      opportunities: updatedOpps,
    });
    showNotification(`فرصت بهبود "${item.title}" با موفقیت ثبت گردید.`);
  };

  const handleUpdateOpportunity = (item: EnergyOpportunityItem) => {
    if (!data) return;
    const updatedOpps = data.opportunities.map((o) => (o.id === item.id ? item : o));
    persistData({
      ...data,
      opportunities: updatedOpps,
    });
    showNotification(`تغییرات فرصت "${item.title}" با موفقیت ذخیره شد.`);
  };

  const handleDeleteOpportunity = (id: string) => {
    if (!data) return;
    const updatedOpps = data.opportunities.filter((o) => o.id !== id);
    persistData({
      ...data,
      opportunities: updatedOpps,
    });
    showNotification('فرصت بهبود با موفقیت حذف گردید.');
  };

  const handlePromoteOpportunity = (opp: EnergyOpportunityItem) => {
    if (!data) return;
    const newProjectId = `PRJ-EN-0${data.projects.length + 1}`;

    const newProject: EnergyProjectItem = {
      id: newProjectId,
      sourceOpportunityId: opp.id,
      title: opp.title,
      department: opp.department,
      targetSEU: opp.targetSEU,
      projectManager: opp.identifiedBy || 'مدیر انرژی و بهینه‌سازی',
      priority: opp.type === 'سرمایه‌ای (CAPEX)' ? 'بالا' : 'متوسط',
      phase: 'طراحی و تأمین',
      startDate: '۱۴۰۵/۰۱/۱۵',
      plannedEndDate: '۱۴۰۵/۰۹/۳۰',
      progressPct: 5,
      capexBudgetMillionRials: opp.estimatedCapexMillionRials,
      capexSpentMillionRials: 0,
      financialVarianceMillionRials: opp.estimatedCapexMillionRials,
      status: 'در حال پیشرفت',
    };

    const updatedOpps = data.opportunities.map((o) =>
      o.id === opp.id
        ? {
            ...o,
            status: 'تصویب‌شده (تبدیل به پروژه)' as const,
            promotedToProjectId: newProjectId,
          }
        : o
    );

    const updatedProjects = [newProject, ...data.projects];

    persistData({
      ...data,
      opportunities: updatedOpps,
      projects: updatedProjects,
    });

    showNotification(
      `فرصت "${opp.title}" تصویب شد و پروژه "${newProjectId}" در کارتابل ایجاد گردید.`
    );
  };

  // ==================== هندلرهای ساب‌تب ۲: آبشار اهداف ====================
  const handleAddTarget = (tgt: CascadedTargetItem) => {
    if (!data) return;
    const updated = [tgt, ...data.targetsCascade];
    persistData({
      ...data,
      targetsCascade: updated,
    });
    showNotification(`هدف کمّی "${tgt.kpiTitle}" با موفقیت تعریف شد.`);
  };

  const handleUpdateTarget = (tgt: CascadedTargetItem) => {
    if (!data) return;
    const updated = data.targetsCascade.map((t) => (t.id === tgt.id ? tgt : t));
    persistData({
      ...data,
      targetsCascade: updated,
    });
    showNotification(`هدف کمّی "${tgt.kpiTitle}" با موفقیت بروزرسانی شد.`);
  };

  const handleDeleteTarget = (id: string) => {
    if (!data) return;
    const updated = data.targetsCascade.filter((t) => t.id !== id);
    persistData({
      ...data,
      targetsCascade: updated,
    });
    showNotification('هدف کمّی با موفقیت حذف گردید.');
  };

  // ==================== هندلرهای ساب‌تب ۳: کارتابل پروژه‌ها ====================
  const handleAddProject = (p: EnergyProjectItem) => {
    if (!data) return;
    const updated = [p, ...data.projects];
    persistData({
      ...data,
      projects: updated,
    });
    showNotification(`پروژه بهینه‌سازی "${p.title}" با موفقیت اضافه شد.`);
  };

  const handleUpdateProject = (p: EnergyProjectItem) => {
    if (!data) return;
    const updated = data.projects.map((item) => (item.id === p.id ? p : item));
    persistData({
      ...data,
      projects: updated,
    });
    showNotification(`مشخصات پروژه "${p.title}" با موفقیت ذخیره شد.`);
  };

  const handleDeleteProject = (id: string) => {
    if (!data) return;
    const updated = data.projects.filter((p) => p.id !== id);
    persistData({
      ...data,
      projects: updated,
    });
    showNotification('پروژه بهینه‌سازی با موفقیت حذف گردید.');
  };

  // ==================== هندلرهای ساب‌تب ۴: M&V و مالی ====================
  const handleAddFinancialMv = (item: FinancialAndMVItem) => {
    if (!data) return;
    const updated = [item, ...data.financialAndMV];
    persistData({
      ...data,
      financialAndMV: updated,
    });
    showNotification(`رکورد صحه‌گذاری M&V برای پروژه "${item.projectTitle}" ثبت شد.`);
  };

  const handleUpdateFinancialMv = (item: FinancialAndMVItem) => {
    if (!data) return;
    const updated = data.financialAndMV.map((m) =>
      m.projectId === item.projectId ? item : m
    );
    persistData({
      ...data,
      financialAndMV: updated,
    });
    showNotification(`رکورد صحه‌گذاری پروژه "${item.projectTitle}" بروزرسانی شد.`);
  };

  const handleDeleteFinancialMv = (projectId: string) => {
    if (!data) return;
    const updated = data.financialAndMV.filter((m) => m.projectId !== projectId);
    persistData({
      ...data,
      financialAndMV: updated,
    });
    showNotification('رکورد M&V با موفقیت حذف گردید.');
  };

  const subTabs = [
    {
      id: 'opportunities' as EnergyObjectivesSubTabId,
      title: 'بانک فرصت‌های بهبود',
      code: '۶.۲-الف',
      icon: Lightbulb,
    },
    {
      id: 'cascade' as EnergyObjectivesSubTabId,
      title: 'آبشار و شکست اهداف',
      code: '۶.۲-ب',
      icon: GitFork,
    },
    {
      id: 'tracker' as EnergyObjectivesSubTabId,
      title: 'کارتابل و گانت پروژه‌ها',
      code: '۶.۲-ج',
      icon: Kanban,
    },
    {
      id: 'financial-mv' as EnergyObjectivesSubTabId,
      title: 'ارزیابی مالی و M&V',
      code: '۶.۲-د / ۹.۱',
      icon: Calculator,
    },
  ];

  if (isLoading || !data) {
    return (
      <div className="tab-viewport flex items-center justify-center p-12">
        <div className="text-[var(--color-text-muted)] text-sm animate-pulse">
          در حال بارگذاری مرکز اهداف، فرصت‌ها و پروژه‌های انرژی سیمان کیاسر...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* پیام اعلان شناور */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[var(--color-bg-card)] border border-emerald-500/40 text-[var(--color-text-primary)] shadow-xl px-4 py-3 rounded-xl flex items-center gap-3 animate-slideUp text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* هدر ماژول طرح‌ریزی و پروژه‌ها */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="enms-badge badge-success font-semibold">بند ۶.۲ استاندارد ISO 50001:2018</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">
                Objectives, Targets & Action Planning
              </span>
            </div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
              اهداف خرد، فرصت‌های بهبود و مدیریت پروژه‌های انرژی
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              سیستم یکپارچه غربالگری فرصت‌های بهینه‌سازی، شکست آبشاری اهداف، کنترل پیشرفت پروژه‌ها و صحه‌گذاری صرفه‌جویی (M&V)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleResetToDefault}
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
              title="بازگردانی به مقادیر اولیه فایل JSON"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>بازنشانی به داده‌های پیش‌فرض</span>
            </button>

            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
              پروژه‌های فعال: <strong className="text-[var(--color-primary)] font-bold">{toPersianDigits(data.summary.activeProjectsCount)}</strong> مورد
            </span>
          </div>
        </div>

        {/* نوار دکمه‌های قرصی ۴ ساب‌تب */}
        <div className="enms-tab-pills mt-4 overflow-x-auto">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`enms-tab-pill ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
                <span className="text-[10px] opacity-75 font-mono">{toPersianDigits(tab.code)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ناحیه رندرینگ ساب‌تب فعال */}
      <div className="transition-all duration-200">
        {activeSubTab === 'opportunities' && (
          <OpportunitiesView
            opportunities={data.opportunities}
            onAddOpportunity={handleAddOpportunity}
            onUpdateOpportunity={handleUpdateOpportunity}
            onDeleteOpportunity={handleDeleteOpportunity}
            onPromoteOpportunity={handlePromoteOpportunity}
          />
        )}

        {activeSubTab === 'cascade' && (
          <GoalCascadeView
            targets={data.targetsCascade}
            projects={data.projects}
            onAddTarget={handleAddTarget}
            onUpdateTarget={handleUpdateTarget}
            onDeleteTarget={handleDeleteTarget}
          />
        )}

        {activeSubTab === 'tracker' && (
          <ProjectTrackerView
            projects={data.projects}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeSubTab === 'financial-mv' && (
          <FinancialMvView
            financialData={data.financialAndMV}
            summary={data.summary}
            projects={data.projects}
            onAddFinancialMv={handleAddFinancialMv}
            onUpdateFinancialMv={handleUpdateFinancialMv}
            onDeleteFinancialMv={handleDeleteFinancialMv}
          />
        )}
      </div>
    </div>
  );
};

export default EnergyObjectivesLayout;
