import React from 'react';
import {
  MainTabId,
  OperationsSubTabId,
  EnergyReviewSubTabId,
  MonitoringSubTabId,
  ContextSubTabId,
  CommitteeSubTabId,
  EnergyObjectivesSubTabId,
} from '../../types';
import {
  LayoutDashboard,
  Building2,
  Factory,
  Zap,
  Activity,
  Users2,
  Target,
  ChevronDown,
  ChevronRight,
  LineChart,
  Clock,
  Truck,
  Layers,
  Fuel,
  BarChart2,
  TrendingUp,
  UserCheck,
  FileText,
  Compass,
  Users,
  Scale,
  ShieldCheck,
  BarChart,
  TrendingDown,
  GitCommit,
  BookOpen,
  Lightbulb,
  GitPullRequest,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Archive,
  Gauge,
  HardDrive,
} from 'lucide-react';

interface SidebarProps {
  currentMainTab: MainTabId;
  onMainTabChange: (tab: MainTabId) => void;
  operationsSubTab: OperationsSubTabId;
  onOperationsSubTabChange: (subTab: OperationsSubTabId) => void;
  energyReviewSubTab: EnergyReviewSubTabId;
  onEnergyReviewSubTabChange: (subTab: EnergyReviewSubTabId) => void;
  monitoringSubTab: MonitoringSubTabId;
  onMonitoringSubTabChange: (subTab: MonitoringSubTabId) => void;
  contextSubTab: ContextSubTabId;
  onContextSubTabChange: (subTab: ContextSubTabId) => void;
  committeeSubTab: CommitteeSubTabId;
  onCommitteeSubTabChange: (subTab: CommitteeSubTabId) => void;
  energyObjectivesSubTab: EnergyObjectivesSubTabId;
  onEnergyObjectivesSubTabChange: (subTab: EnergyObjectivesSubTabId) => void;
  onOpenDataset: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMainTab,
  onMainTabChange,
  operationsSubTab,
  onOperationsSubTabChange,
  energyReviewSubTab,
  onEnergyReviewSubTabChange,
  contextSubTab,
  onContextSubTabChange,
  monitoringSubTab,
  onMonitoringSubTabChange,
  committeeSubTab,
  onCommitteeSubTabChange,
  energyObjectivesSubTab,
  onEnergyObjectivesSubTabChange,
  isCollapsed,
}) => {
  const isContextActive = currentMainTab === 'context' || currentMainTab === '02-organization-context';
  const isOperationsActive = currentMainTab === 'operations' || currentMainTab === '02-5-operations';
  const isEnergyReviewActive = currentMainTab === 'energy-review' || currentMainTab === '03-energy-review';
  const isMonitoringActive = currentMainTab === 'monitoring' || currentMainTab === '04-energy-performance';
  const isCommitteeActive = currentMainTab === 'energy-committee' || currentMainTab === '05-energy-committee';
  const isObjectivesActive = currentMainTab === 'energy-objectives' || currentMainTab === '06-energy-objectives-projects';
  const isGoogleDriveActive = currentMainTab === 'google-drive' || currentMainTab === '07-google-drive';

  const activeMainClass = 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-bold border border-[var(--color-primary-border)] shadow-sm';
  const inactiveMainClass = 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]';

  const activeSubClass = 'bg-[var(--color-bg-hover)] text-[var(--color-primary)] font-bold border-r-2 border-[var(--color-primary)]';
  const inactiveSubClass = 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]';

  return (
    <aside
      className={`bg-[var(--color-bg-app)] border-l border-[var(--color-border)] text-[var(--color-text-primary)] transition-all duration-300 select-none flex flex-col shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      dir="rtl"
    >
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] font-bold shrink-0">
            En
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="text-xs font-bold text-[var(--color-text-primary)]">سیمان کیاسر</h1>
              <p className="text-[10px] text-[var(--color-text-muted)]">مدیریت استراتژیک انرژی</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* ۱. داشبورد کلان */}
        <button
          onClick={() => onMainTabChange('executive')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
            currentMainTab === 'executive' ? activeMainClass : inactiveMainClass
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>داشبورد کلان مدیریتی</span>}
        </button>

        {/* ۲. بافت سازمان و راهبرد کلان */}
        <div>
          <button
            onClick={() => onMainTabChange('02-organization-context')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isContextActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>بافت سازمان و راهبرد کلان</span>}
            </div>
            {!isCollapsed && (isContextActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isContextActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onContextSubTabChange('org-profile')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'org-profile' ? activeSubClass : inactiveSubClass
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>شناسنامه و محدوده شمول</span>
              </button>
              <button
                onClick={() => onContextSubTabChange('scope')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'scope' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>تحلیل بافت سازمان</span>
              </button>
              <button
                onClick={() => onContextSubTabChange('stakeholders')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'stakeholders' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ماتریس ذینفعان انرژی</span>
              </button>
              <button
                onClick={() => onContextSubTabChange('legal-requirements')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'legal-requirements' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>الزامات قانونی و مقرراتی</span>
              </button>
              <button
                onClick={() => onContextSubTabChange('energy-policy')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'energy-policy' ? activeSubClass : inactiveSubClass
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>خط‌مشی جامع انرژی</span>
              </button>
              <button
                onClick={() => onContextSubTabChange('bsc')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  contextSubTab === 'bsc' ? activeSubClass : inactiveSubClass
                }`}
              >
                <BarChart className="w-3.5 h-3.5" />
                <span>کارت امتیازی متوازن (BSC)</span>
              </button>
            </div>
          )}
        </div>

        {/* ۳. عملیات تولید و بهره‌برداری */}
        <div>
          <button
            onClick={() => onMainTabChange('operations')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isOperationsActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Factory className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>عملیات تولید و بهره‌برداری</span>}
            </div>
            {!isCollapsed && (isOperationsActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isOperationsActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onOperationsSubTabChange('production')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  operationsSubTab === 'production' ? activeSubClass : inactiveSubClass
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span>پایش و مدیریت تولید</span>
              </button>
              <button
                onClick={() => onOperationsSubTabChange('stops')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  operationsSubTab === 'stops' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>پایش توقفات و کارکرد خطوط</span>
              </button>
              <button
                onClick={() => onOperationsSubTabChange('dispatch')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  operationsSubTab === 'dispatch' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>تحویل و بارگیرخانه</span>
              </button>
              <button
                onClick={() => onOperationsSubTabChange('analytics')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  operationsSubTab === 'analytics' ? activeSubClass : inactiveSubClass
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                <span>تحلیل و هوش عملیات (OEE)</span>
              </button>
            </div>
          )}
        </div>

        {/* ۴. بازنگری انرژی و تحلیل SEU */}
        <div>
          <button
            onClick={() => onMainTabChange('03-energy-review')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isEnergyReviewActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>بازنگری انرژی و تحلیل SEU</span>}
            </div>
            {!isCollapsed && (isEnergyReviewActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isEnergyReviewActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onEnergyReviewSubTabChange('departments')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyReviewSubTab === 'departments' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>دپارتمان‌ها و تجهیزات</span>
              </button>
              <button
                onClick={() => onEnergyReviewSubTabChange('energy-ingestion')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyReviewSubTab === 'energy-ingestion' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>ورودی مصارف انرژی</span>
              </button>
              <button
                onClick={() => onEnergyReviewSubTabChange('variables')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyReviewSubTab === 'variables' ? activeSubClass : inactiveSubClass
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>متغیرهای مرتبط و همبستگی</span>
              </button>
              <button
                onClick={() => onEnergyReviewSubTabChange('efficiency-opportunities')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyReviewSubTab === 'efficiency-opportunities' ? activeSubClass : inactiveSubClass
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>راندمان و فرصت‌های بهینه‌سازی</span>
              </button>
              <button
                onClick={() => onEnergyReviewSubTabChange('competence-persons')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyReviewSubTab === 'competence-persons' ? activeSubClass : inactiveSubClass
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>افراد کلیدی و شایستگی</span>
              </button>
            </div>
          )}
        </div>

        {/* ۵. پایش عملکرد، خطوط مبنا و تحلیل */}
        <div>
          <button
            onClick={() => onMainTabChange('04-energy-performance')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isMonitoringActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>پایش عملکرد و خطوط مبنا</span>}
            </div>
            {!isCollapsed && (isMonitoringActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isMonitoringActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onMonitoringSubTabChange('cusum')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  monitoringSubTab === 'cusum' ? activeSubClass : inactiveSubClass
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>پایش انحرافات و CUSUM</span>
              </button>
              <button
                onClick={() => onMonitoringSubTabChange('enpis')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  monitoringSubTab === 'enpis' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>شاخص‌های عملکرد انرژی (EnPIs)</span>
              </button>
              <button
                onClick={() => onMonitoringSubTabChange('baseline')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  monitoringSubTab === 'baseline' ? activeSubClass : inactiveSubClass
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>خطوط مبنا و تحلیل رگرسیون</span>
              </button>
            </div>
          )}
        </div>

        {/* ۶. کمیته عالی انرژی (تمام ۵ ساب‌تب ثبت شد) */}
        <div>
          <button
            onClick={() => onMainTabChange('05-energy-committee')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isCommitteeActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users2 className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>کمیته عالی انرژی</span>}
            </div>
            {!isCollapsed && (isCommitteeActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isCommitteeActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onCommitteeSubTabChange('charter')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  committeeSubTab === 'charter' ? activeSubClass : inactiveSubClass
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>نظام‌نامه و آیین‌نامه کمیته</span>
              </button>
              <button
                onClick={() => onCommitteeSubTabChange('members')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  committeeSubTab === 'members' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>اعضای کمیته و ماتریس مسئولیت</span>
              </button>
              {/* ماژول صورتجلسات */}
              <button
                onClick={() => onCommitteeSubTabChange('minutes')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  committeeSubTab === 'minutes' ? activeSubClass : inactiveSubClass
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>صورتجلسات کمیته انرژی</span>
              </button>
              {/* ماژول مصوبات و اقدامات */}
              <button
                onClick={() => onCommitteeSubTabChange('actions')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  committeeSubTab === 'actions' ? activeSubClass : inactiveSubClass
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>پیگیری مصوبات و اقدامات</span>
              </button>
              {/* ماژول آرشیو */}
              <button
                onClick={() => onCommitteeSubTabChange('archive')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  committeeSubTab === 'archive' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>آرشیو و مستندات پیوست</span>
              </button>
            </div>
          )}
        </div>

        {/* ۷. اهداف، فرصت‌ها و پروژه‌ها */}
        <div>
          <button
            onClick={() => onMainTabChange('06-energy-objectives-projects')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition ${
              isObjectivesActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Target className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>اهداف، فرصت‌ها و پروژه‌ها</span>}
            </div>
            {!isCollapsed && (isObjectivesActive ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
          </button>

          {!isCollapsed && isObjectivesActive && (
            <div className="pr-6 pt-1 space-y-0.5 border-r border-[var(--color-border)] mr-4">
              <button
                onClick={() => onEnergyObjectivesSubTabChange('opportunities')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyObjectivesSubTab === 'opportunities' ? activeSubClass : inactiveSubClass
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>بانک فرصت‌های بهبود</span>
              </button>
              <button
                onClick={() => onEnergyObjectivesSubTabChange('targets')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition text-[11px] ${
                  energyObjectivesSubTab === 'targets' ? activeSubClass : inactiveSubClass
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>آبشار و شکست اهداف</span>
              </button>
            </div>
          )}
        </div>

        {/* ۸. اسناد ابری و Google Drive */}
        <div className="pt-2 mt-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => onMainTabChange('07-google-drive')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition ${
              isGoogleDriveActive ? activeMainClass : inactiveMainClass
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>اسناد ابری (Google Drive)</span>}
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;