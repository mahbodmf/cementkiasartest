import React, { useState, useMemo, useEffect } from 'react';
import {
  Lightbulb,
  ArrowUpRight,
  TrendingDown,
  Sliders,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Edit2,
  Trash2,
  Plus,
  X,
  Sparkles,
  Bot,
  Zap,
  RotateCcw,
  HelpCircle,
} from 'lucide-react';
import { EnergyOpportunityItem, AHPWeightCriteria, OpportunityType, OpportunityStatus } from '../../../../types';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { DEFAULT_AHP_WEIGHTS, calculateAHPScore } from '../../../../utils/ahpCalculator';

interface OpportunitiesViewProps {
  opportunities: EnergyOpportunityItem[];
  onAddOpportunity?: (newOp: EnergyOpportunityItem) => void;
  onUpdateOpportunity?: (updated: EnergyOpportunityItem) => void;
  onDeleteOpportunity?: (id: string) => void;
  onPromoteOpportunity?: (opportunity: EnergyOpportunityItem) => void;
  onPromoteToProject?: (opportunity: EnergyOpportunityItem) => void;
}

// دیتابیس هوشمند راهکارهای ممیزی انرژی صنعت سیمان (BAT Library)
const CEMENT_BAT_KNOWLEDGE_BASE: Record<string, {
  targetSEU: string;
  carrier: 'برق' | 'گاز طبیعی' | 'هوای فشرده';
  type: OpportunityType;
  description: string;
  estSavingMWh?: number;
  estSavingGJ?: number;
  estSavingRials: number;
  estCapex: number;
  ahpDefaults: { saving: number; eco: number; risk: number; hse: number; supply: number };
}> = {
  'اصلاح آب‌بندی گریت کولر': {
    targetSEU: 'کوره دوار و کولر (SEU-01)',
    carrier: 'گاز طبیعی',
    type: 'سرمایه‌ای (CAPEX)',
    description: 'کاهش اتلاف حرارتی تشعشعی و هوای کاذب از طریق نصب سیل‌های نسل جدید و عایق‌کاری سیکلون ۴ و ۵ کوره',
    estSavingGJ: 125000,
    estSavingRials: 62000,
    estCapex: 85000,
    ahpDefaults: { saving: 5, eco: 4, risk: 4, hse: 4, supply: 4 },
  },
  'نصب درایو فرکانس متغیر (VFD) فن آسیاب': {
    targetSEU: 'الکتروفن آسیاب مواد خام (SEU-03)',
    carrier: 'برق',
    type: 'متوسط',
    description: 'حذف دمپرهای مکانیکی و تنظیم دبی هوا با استفاده از اینورتر ولتاژ متوسط ۱۶۰۰ کیلووات با کاهش مصرف بیست درصدی توان فن',
    estSavingMWh: 2400,
    estSavingRials: 36000,
    estCapex: 42000,
    ahpDefaults: { saving: 4, eco: 4, risk: 4, hse: 3, supply: 3 },
  },
  'بهینه‌سازی بار گلوله و دیافراگم آسیاب': {
    targetSEU: 'آسیاب گلوله‌ای سیمان (SEU-04)',
    carrier: 'برق',
    type: 'بدون هزینه / کم‌هزینه',
    description: 'تغییر دانه‌بندی شارژ بار گلوله، تفکیک زون‌های خردایش و اصلاح دیافراگم میانی جهت ارتقای نرخ تناژ تولیدی بر ساعت',
    estSavingMWh: 1100,
    estSavingRials: 16500,
    estCapex: 8000,
    ahpDefaults: { saving: 4, eco: 5, risk: 5, hse: 3, supply: 5 },
  },
  'مدیریت نشتی‌های شبکه هوای فشرده': {
    targetSEU: 'ایستگاه کمپرسورهای مرکزی',
    carrier: 'هوای فشرده',
    type: 'بدون هزینه / کم‌هزینه',
    description: 'بازرسی التراسونیک زون‌های هوای فشرده، تعویض تله‌های آبگیر معیوب و قطع اتوماتیک مدار مصرف‌کننده‌ها هنگام توقف خط',
    estSavingMWh: 650,
    estSavingRials: 9750,
    estCapex: 3500,
    ahpDefaults: { saving: 3, eco: 5, risk: 5, hse: 3, supply: 5 },
  },
  'بهره‌گیری از سوخت‌های جایگزین (RDF)': {
    targetSEU: 'کلساینر پیش‌گرمکن کوره (SEU-01)',
    carrier: 'گاز طبیعی',
    type: 'سرمایه‌ای (CAPEX)',
    description: 'تزریق سوخت مشتق از پسماند و ضایعات لاستیک خردشده به کلساینر کوره جهت جایگزینی سوخت فسیلی و کاهش ردپای کربن',
    estSavingGJ: 180000,
    estSavingRials: 85000,
    estCapex: 120000,
    ahpDefaults: { saving: 5, eco: 4, risk: 3, hse: 4, supply: 3 },
  },
};

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  onAddOpportunity,
  onUpdateOpportunity,
  onDeleteOpportunity,
  onPromoteOpportunity,
  onPromoteToProject,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [sortByAHP, setSortByAHP] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<'table' | 'cards' | 'matrix'>('table');

  // استیت اوزان AHP
  const [weights, setWeights] = useState<AHPWeightCriteria>(DEFAULT_AHP_WEIGHTS);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // استیت ارزیابی AHP
  const [evaluatingOpportunity, setEvaluatingOpportunity] = useState<EnergyOpportunityItem | null>(null);
  const [criteriaScores, setCriteriaScores] = useState({
    energySavingScore: 4,
    economicScore: 4,
    feasibilityRiskScore: 3,
    hseImpactScore: 3,
    supplyChainScore: 4,
  });

  // استیت فرم ثبت / ویرایش
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<EnergyOpportunityItem | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiSuggestionMessage, setAiSuggestionMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    department: 'کوره و خنک‌کن',
    targetSEU: '',
    carrier: 'برق' as 'برق' | 'گاز طبیعی' | 'مازوت' | 'هوای فشرده',
    type: 'متوسط' as OpportunityType,
    description: '',
    estimatedSavingGJ: 0,
    estimatedSavingMWh: 0,
    estimatedFinancialSavingMillionRials: 0,
    estimatedCapexMillionRials: 0,
    simplePaybackYears: 1.0,
    status: 'شناسایی‌شده' as OpportunityStatus,
  });

  // محاسبه خودکار و زنده بازگشت سرمایه در فرم
  useEffect(() => {
    if (formData.estimatedFinancialSavingMillionRials > 0) {
      const pb = Number((formData.estimatedCapexMillionRials / formData.estimatedFinancialSavingMillionRials).toFixed(2));
      setFormData((prev) => ({ ...prev, simplePaybackYears: pb }));
    }
  }, [formData.estimatedFinancialSavingMillionRials, formData.estimatedCapexMillionRials]);

  // محاسبه خودکار نمرات AHP برای آیتم‌های فاقد نمره
  const processedOpportunities = useMemo(() => {
    return opportunities.map((op) => {
      if (!op.ahp) {
        const defaultSaving = op.estimatedSavingGJ ? 5 : 4;
        const defaultEco = op.simplePaybackYears <= 1.0 ? 5 : op.simplePaybackYears <= 2.0 ? 4 : 2;
        const defaultRisk = op.type.includes('بدون') ? 5 : op.type.includes('متوسط') ? 4 : 3;
        const autoAHP = calculateAHPScore(
          {
            energySavingScore: defaultSaving,
            economicScore: defaultEco,
            feasibilityRiskScore: defaultRisk,
            hseImpactScore: 3,
            supplyChainScore: 4,
          },
          weights
        );
        return { ...op, ahp: autoAHP };
      }
      return op;
    });
  }, [opportunities, weights]);

  // فیلتر و مرتب‌سازی
  const filteredAndSorted = useMemo(() => {
    let list = processedOpportunities.filter((op) =>
      filterType === 'all' ? true : op.type === filterType
    );

    if (sortByAHP) {
      list = [...list].sort((a, b) => (b.ahp?.finalScore || 0) - (a.ahp?.finalScore || 0));
    }
    return list;
  }, [processedOpportunities, filterType, sortByAHP]);

  // عملیات دستیار هوش مصنوعی
  const handleAiConsult = (presetTitle?: string) => {
    setIsAiThinking(true);
    setAiSuggestionMessage(null);

    const titleToAnalyze = presetTitle || formData.title;

    setTimeout(() => {
      // جستجو در پایگاه دانش BAT صنعت سیمان
      let matched = Object.entries(CEMENT_BAT_KNOWLEDGE_BASE).find(([key]) =>
        titleToAnalyze.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(titleToAnalyze.toLowerCase())
      );

      if (!matched && presetTitle) {
        matched = [presetTitle, CEMENT_BAT_KNOWLEDGE_BASE[presetTitle]];
      }

      if (matched) {
        const [matchedKey, bat] = matched;
        setFormData((prev) => ({
          ...prev,
          title: matchedKey,
          targetSEU: bat.targetSEU,
          carrier: bat.carrier,
          type: bat.type,
          description: bat.description,
          estimatedFinancialSavingMillionRials: bat.estSavingRials,
          estimatedCapexMillionRials: bat.estCapex,
          estimatedSavingGJ: bat.estSavingGJ || 0,
          estimatedSavingMWh: bat.estSavingMWh || 0,
        }));
        setAiSuggestionMessage(
          `تحلیل هوشمند انجام شد: اقدام تطبیق داده شده با راهنمای BAT سیمان (${matchedKey}). مقادیر مالی و SEU هدف بارگذاری گردید.`
        );
      } else {
        // تحلیل عمومی بر مبنای دپارتمان
        const isKiln = formData.department.includes('کوره');
        setFormData((prev) => ({
          ...prev,
          targetSEU: isKiln ? 'کوره دوار (SEU-01)' : 'آسیاب سیمان (SEU-04)',
          carrier: isKiln ? 'گاز طبیعی' : 'برق',
          description: `طرح بهینه‌سازی فرآیندی در واحد ${formData.department} با تمرکز بر ارتقای راندمان حرارتی/الکتریکی مطابق استاندارد ایزو ۵۰۰۰۱.`,
          estimatedFinancialSavingMillionRials: isKiln ? 45000 : 22000,
          estimatedCapexMillionRials: isKiln ? 38000 : 18000,
        }));
        setAiSuggestionMessage(
          'دستیار EnMS پارامترهای تخمینی را بر مبنای نرم مصرف تجهیزات دپارتمان پیشنهاد داد. مقادیر را بررسی و نهایی نمایید.'
        );
      }
      setIsAiThinking(false);
    }, 700);
  };

  const handleOpenEdit = (op: EnergyOpportunityItem) => {
    setEditingOpportunity(op);
    setAiSuggestionMessage(null);
    setFormData({
      id: op.id,
      title: op.title,
      department: op.department,
      targetSEU: op.targetSEU,
      carrier: op.carrier as any,
      type: op.type,
      description: op.description,
      estimatedSavingGJ: op.estimatedSavingGJ || 0,
      estimatedSavingMWh: op.estimatedSavingMWh || 0,
      estimatedFinancialSavingMillionRials: op.estimatedFinancialSavingMillionRials,
      estimatedCapexMillionRials: op.estimatedCapexMillionRials,
      simplePaybackYears: op.simplePaybackYears,
      status: op.status,
    });
    setIsFormModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingOpportunity(null);
    setAiSuggestionMessage(null);
    const newId = `OPP-${Math.floor(100 + Math.random() * 900)}`;
    setFormData({
      id: newId,
      title: '',
      department: 'کوره و خنک‌کن',
      targetSEU: '',
      carrier: 'برق',
      type: 'متوسط',
      description: '',
      estimatedSavingGJ: 0,
      estimatedSavingMWh: 0,
      estimatedFinancialSavingMillionRials: 0,
      estimatedCapexMillionRials: 0,
      simplePaybackYears: 1.0,
      status: 'شناسایی‌شده',
    });
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOpportunity) {
      const updated: EnergyOpportunityItem = {
        ...editingOpportunity,
        ...formData,
      };
      if (onUpdateOpportunity) onUpdateOpportunity(updated);
    } else {
      const newOp: EnergyOpportunityItem = {
        ...formData,
        identifiedDate: '۱۴۰۵/۰۱/۰۱',
        identifiedBy: 'کمیته انرژی و ممیزی',
      };
      if (onAddOpportunity) onAddOpportunity(newOp);
    }
    setIsFormModalOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`آیا از حذف فرصت بهبود «${title}» اطمینان دارید؟`)) {
      if (onDeleteOpportunity) onDeleteOpportunity(id);
    }
  };

  const handleOpenEvaluation = (op: EnergyOpportunityItem) => {
    setEvaluatingOpportunity(op);
    if (op.ahp) {
      setCriteriaScores({
        energySavingScore: op.ahp.energySavingScore,
        economicScore: op.ahp.economicScore,
        feasibilityRiskScore: op.ahp.feasibilityRiskScore,
        hseImpactScore: op.ahp.hseImpactScore,
        supplyChainScore: op.ahp.supplyChainScore,
      });
    }
  };

  const handleSaveEvaluation = () => {
    if (!evaluatingOpportunity) return;
    const newAHP = calculateAHPScore(criteriaScores, weights);
    const updated = {
      ...evaluatingOpportunity,
      ahp: newAHP,
    };
    if (onUpdateOpportunity) {
      onUpdateOpportunity(updated);
    }
    setEvaluatingOpportunity(null);
  };

  const getRankBadgeClass = (rank?: string) => {
    if (rank?.includes('الف')) return 'badge-success border-emerald-500/40 text-emerald-600 dark:text-emerald-400';
    if (rank?.includes('ب')) return 'badge-info border-sky-500/40 text-sky-600 dark:text-sky-400';
    return 'badge-warning border-amber-500/40 text-amber-600 dark:text-amber-400';
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" dir="rtl">
      {/* هدر بخش اولویت‌بندی AHP */}
      <div className="enms-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)]">
              بانک فرصت‌ها و اولویت‌بندی چندمعیاره AHP (بند ۶.۲ و ۶.۳)
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              ممیزی فنی، غربالگری چندمعیاره AHP، محاسبات بازگشت سرمایه و ارتقا به پروژه اجرایی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* دکمه افزودن فرصت جدید */}
          <button
            onClick={handleOpenAdd}
            className="enms-button enms-button-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت فرصت جدید</span>
          </button>

          {/* سوئیچ نمای ردیفی / کارتی / ماتریس */}
          <div className="enms-tab-pills !p-0.5 text-xs flex items-center">
            <button
              onClick={() => setDisplayMode('table')}
              className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${displayMode === 'table' ? 'active' : ''}`}
              title="نمای ردیفی و جدولی (پیشنهادی)"
            >
              <List className="w-3.5 h-3.5" />
              <span>جدولی</span>
            </button>
            <button
              onClick={() => setDisplayMode('cards')}
              className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${displayMode === 'cards' ? 'active' : ''}`}
              title="نمای جعبه‌ای و کارت‌ها"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>کارت‌ها</span>
            </button>
            <button
              onClick={() => setDisplayMode('matrix')}
              className={`enms-tab-pill !py-1 !px-2.5 flex items-center gap-1 ${displayMode === 'matrix' ? 'active' : ''}`}
              title="ماتریس دوبعدی اثرگذاری"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ماتریس</span>
            </button>
          </div>

          {/* دکمه تنظیم اوزان AHP */}
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="enms-button enms-button-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>اوزان AHP</span>
          </button>
        </div>
      </div>

      {/* نوار فیلتر و مرتب‌سازی */}
      <div className="enms-card p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="font-bold text-[var(--color-text-muted)]">دسته‌بندی سرمایه:</span>
          <div className="enms-tab-pills !p-0.5 text-xs overflow-x-auto">
            {['all', 'بدون هزینه / کم‌هزینه', 'متوسط', 'سرمایه‌ای (CAPEX)'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`enms-tab-pill !py-1 !px-2.5 ${filterType === t ? 'active' : ''}`}
              >
                {t === 'all' ? 'همه موارد' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-[var(--color-text-secondary)] font-medium">
            <input
              type="checkbox"
              checked={sortByAHP}
              onChange={(e) => setSortByAHP(e.target.checked)}
              className="rounded accent-[var(--color-primary)]"
            />
            <span>مرتب‌سازی بر اساس امتیاز AHP</span>
          </label>
        </div>
      </div>

      {/* حالت اول: نمای ردیفی / جدولی */}
      {displayMode === 'table' && (
        <div className="enms-card p-0 overflow-hidden">
          <div className="enms-table-container border-0 rounded-none overflow-x-auto">
            <table className="enms-table text-xs">
              <thead>
                <tr>
                  <th className="w-12 text-center">رتبه</th>
                  <th className="w-20 text-center">کد</th>
                  <th className="min-w-[200px]">عنوان فرصت بهینه‌سازی</th>
                  <th className="w-24 text-center">دپارتمان</th>
                  <th className="w-28 text-center">تجهیز (SEU)</th>
                  <th className="w-24 text-center">صرفه‌جویی (م.ر)</th>
                  <th className="w-24 text-center">سرمایه (م.ر)</th>
                  <th className="w-20 text-center">بازگشت</th>
                  <th className="w-28 text-center">امتیاز AHP</th>
                  <th className="w-28 text-center">وضعیت رتبه</th>
                  <th className="w-32 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((op, idx) => (
                  <tr key={op.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="text-center font-mono font-bold text-[var(--color-text-muted)]">
                      #{toPersianDigits(idx + 1)}
                    </td>
                    <td className="text-center font-mono font-bold text-[var(--color-primary)]">
                      {op.id}
                    </td>
                    <td>
                      <div className="font-bold text-[var(--color-text-primary)]">{op.title}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-xs">{op.description}</div>
                    </td>
                    <td className="text-center text-[var(--color-text-secondary)]">{op.department}</td>
                    <td className="text-center text-[var(--color-text-secondary)]">{op.targetSEU}</td>
                    <td className="text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPersianNumber(op.estimatedFinancialSavingMillionRials)}
                    </td>
                    <td className="text-center font-mono">{formatPersianNumber(op.estimatedCapexMillionRials)}</td>
                    <td className="text-center font-mono text-cyan-600 dark:text-cyan-400">
                      {toPersianDigits(op.simplePaybackYears)} سال
                    </td>
                    <td className="text-center">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-primary)]">
                        {toPersianDigits(op.ahp?.finalScore || 0)} / ۱۰۰
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`enms-badge text-[10px] font-bold ${getRankBadgeClass(op.ahp?.priorityRank)}`}>
                        {op.ahp?.priorityRank}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEvaluation(op)}
                          className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-amber-500"
                          title="امتیازدهی AHP"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(op)}
                          className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                          title="ویرایش فرصت"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(op.id, op.title)}
                          className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-rose-500"
                          title="حذف فرصت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {op.promotedToProjectId ? (
                          <span className="text-[10px] font-mono text-emerald-500 font-bold px-1" title="تبدیل شده به پروژه">
                            ✓ {op.promotedToProjectId}
                          </span>
                        ) : (
                          <button
                            onClick={() => onPromoteToProject && onPromoteToProject(op)}
                            className="p-1 rounded bg-[var(--color-primary-bg)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                            title="ارتقا به پروژه اجرایی"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* حالت دوم: نمای کارتی */}
      {displayMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAndSorted.map((op, idx) => {
            const ahp = op.ahp;
            return (
              <div
                key={op.id}
                className="enms-card p-5 flex flex-col justify-between border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[var(--color-primary-bg)] text-[var(--color-primary)] text-xs font-mono font-bold flex items-center justify-center">
                        #{toPersianDigits(idx + 1)}
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--color-text-muted)]">
                        {op.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`enms-badge text-[10px] font-bold ${getRankBadgeClass(ahp?.priorityRank)}`}>
                        {ahp?.priorityRank}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs font-mono font-bold text-[var(--color-primary)]">
                        {toPersianDigits(ahp?.finalScore || 0)} / ۱۰۰
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--color-text-primary)] leading-snug">
                    {op.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)] mt-1.5 flex-wrap">
                    <span>واحد: <strong className="text-[var(--color-text-secondary)]">{op.department}</strong></span>
                    <span>•</span>
                    <span>تجهیز: <strong className="text-[var(--color-text-secondary)]">{op.targetSEU}</strong></span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] mt-2.5 leading-relaxed text-justify bg-[var(--color-bg-card-subtle)] p-2.5 rounded-lg border border-[var(--color-border-subtle)]">
                    {op.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] grid grid-cols-5 gap-1 text-center text-[10px]">
                    <div className="p-1 rounded bg-[var(--color-bg-app)]">
                      <span className="text-[var(--color-text-muted)] block">صرفه‌جویی</span>
                      <strong className="text-amber-500 font-bold">{toPersianDigits(ahp?.energySavingScore || 0)}/۵</strong>
                    </div>
                    <div className="p-1 rounded bg-[var(--color-bg-app)]">
                      <span className="text-[var(--color-text-muted)] block">اقتصادی</span>
                      <strong className="text-emerald-500 font-bold">{toPersianDigits(ahp?.economicScore || 0)}/۵</strong>
                    </div>
                    <div className="p-1 rounded bg-[var(--color-bg-app)]">
                      <span className="text-[var(--color-text-muted)] block">سهولت</span>
                      <strong className="text-sky-500 font-bold">{toPersianDigits(ahp?.feasibilityRiskScore || 0)}/۵</strong>
                    </div>
                    <div className="p-1 rounded bg-[var(--color-bg-app)]">
                      <span className="text-[var(--color-text-muted)] block">HSE</span>
                      <strong className="text-purple-500 font-bold">{toPersianDigits(ahp?.hseImpactScore || 0)}/۵</strong>
                    </div>
                    <div className="p-1 rounded bg-[var(--color-bg-app)]">
                      <span className="text-[var(--color-text-muted)] block">تأمین</span>
                      <strong className="text-indigo-500 font-bold">{toPersianDigits(ahp?.supplyChainScore || 0)}/۵</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(op)}
                      className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(op.id, op.title)}
                      className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-rose-500"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEvaluation(op)}
                      className="enms-button enms-button-secondary !py-1 !px-2 text-xs flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3 text-[var(--color-primary)]" />
                      <span>امتیازدهی AHP</span>
                    </button>

                    {op.promotedToProjectId ? (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>پروژه {op.promotedToProjectId}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onPromoteToProject && onPromoteToProject(op)}
                        className="enms-button enms-button-primary !py-1 !px-2.5 text-xs flex items-center gap-1"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>ارتقا به پروژه</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* حالت سوم: ماتریس دوبعدی */}
      {displayMode === 'matrix' && (
        <div className="enms-card p-6">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
            ماتریس اولویت‌بندی دوبعدی دستاوردها (Quick Wins vs Strategic)
          </h3>
          <div className="grid grid-cols-2 gap-3 min-h-[350px]">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ⚡ دستاوردهای سریع و طلایی (Quick Wins)
              </span>
              <div className="space-y-1.5 my-2">
                {filteredAndSorted
                  .filter((op) => (op.ahp?.finalScore || 0) >= 75)
                  .map((op) => (
                    <div key={op.id} className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-between bg-[var(--color-bg-card)] p-2 rounded border border-[var(--color-border)]">
                      <span>{op.title}</span>
                      <span className="font-mono text-emerald-600 font-bold">{toPersianDigits(op.ahp?.finalScore || 0)}</span>
                    </div>
                  ))}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">اقدام فوری</span>
            </div>

            <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-col justify-between">
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                🏛️ پروژه‌های استراتژیک سرمایه‌ای (CAPEX بالا)
              </span>
              <div className="space-y-1.5 my-2">
                {filteredAndSorted
                  .filter((op) => (op.ahp?.finalScore || 0) >= 60 && (op.ahp?.finalScore || 0) < 75)
                  .map((op) => (
                    <div key={op.id} className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-between bg-[var(--color-bg-card)] p-2 rounded border border-[var(--color-border)]">
                      <span>{op.title}</span>
                      <span className="font-mono text-sky-600 font-bold">{toPersianDigits(op.ahp?.finalScore || 0)}</span>
                    </div>
                  ))}
              </div>
              <span className="text-[10px] text-sky-600 font-semibold">تأمین مالی</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                🔧 بهبودهای روتین نگهداری
              </span>
              <div className="space-y-1.5 my-2">
                {filteredAndSorted
                  .filter((op) => op.type.includes('بدون') && (op.ahp?.finalScore || 0) < 60)
                  .map((op) => (
                    <div key={op.id} className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-between bg-[var(--color-bg-card)] p-2 rounded border border-[var(--color-border)]">
                      <span>{op.title}</span>
                      <span className="font-mono text-amber-600 font-bold">{toPersianDigits(op.ahp?.finalScore || 0)}</span>
                    </div>
                  ))}
              </div>
              <span className="text-[10px] text-amber-600 font-semibold">عملیات نت</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                ⏳ اولویت ج و مشروط
              </span>
              <div className="space-y-1.5 my-2">
                {filteredAndSorted
                  .filter((op) => (op.ahp?.finalScore || 0) < 55)
                  .map((op) => (
                    <div key={op.id} className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center justify-between bg-[var(--color-bg-card)] p-2 rounded border border-[var(--color-border)]">
                      <span>{op.title}</span>
                      <span className="font-mono text-rose-600 font-bold">{toPersianDigits(op.ahp?.finalScore || 0)}</span>
                    </div>
                  ))}
              </div>
              <span className="text-[10px] text-rose-600 font-semibold">تعلیق موقت</span>
            </div>
          </div>
        </div>
      )}

      {/* مدال هوشمند افزودن / ویرایش همراه با دستیار EnMS Copilot */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="enms-card max-w-3xl w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {editingOpportunity ? `ویرایش فرصت بهینه‌سازی: ${editingOpportunity.id}` : 'ثبت فرصت بهبود انرژی جدید'}
                </h3>
              </div>
              <button onClick={() => setIsFormModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* نوار بالایی: دستیار هوشمند و کتابخانه BAT سیمان */}
            <div className="p-3.5 mb-4 rounded-xl bg-purple-500/10 border border-purple-500/25 flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">دستیار مهندسی هوش مصنوعی (EnMS Copilot):</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) handleAiConsult(e.target.value);
                    }}
                    defaultValue=""
                    className="enms-select !py-1 !px-2 text-[11px] font-medium"
                  >
                    <option value="" disabled>کتابخانه تجارب برتر سیمان (BAT)...</option>
                    {Object.keys(CEMENT_BAT_KNOWLEDGE_BASE).map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => handleAiConsult()}
                    disabled={isAiThinking}
                    className="enms-button bg-purple-600 hover:bg-purple-700 text-white !py-1 !px-2.5 text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiThinking ? 'در حال تحلیل...' : 'تحلیل هوشمند عنوان'}</span>
                  </button>
                </div>
              </div>

              {aiSuggestionMessage && (
                <div className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-500/15 p-2 rounded-lg leading-relaxed animate-fadeIn">
                  {aiSuggestionMessage}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">عنوان فرصت بهینه‌سازی:</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="enms-input w-full"
                    placeholder="مثلاً اصلاح آب‌بندی گریت کولر"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">دپارتمان / واحد:</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="enms-select w-full"
                  >
                    <option value="کوره و خنک‌کن">کوره و خنک‌کن</option>
                    <option value="آسیاب مواد خام">آسیاب مواد خام</option>
                    <option value="آسیاب سیمان">آسیاب سیمان</option>
                    <option value="تاسیسات و یوتیلیتی">تاسیسات و یوتیلیتی</option>
                    <option value="سنگ‌شکن">سنگ‌شکن</option>
                    <option value="بارگیرخانه">بارگیرخانه</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">تجهیز یا SEU هدف:</label>
                  <input
                    type="text"
                    required
                    value={formData.targetSEU}
                    onChange={(e) => setFormData({ ...formData, targetSEU: e.target.value })}
                    className="enms-input w-full"
                    placeholder="مثلاً کوره دوار (SEU-01)"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">حامل انرژی:</label>
                  <select
                    value={formData.carrier}
                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value as any })}
                    className="enms-select w-full"
                  >
                    <option value="برق">برق</option>
                    <option value="گاز طبیعی">گاز طبیعی</option>
                    <option value="مازوت">مازوت</option>
                    <option value="هوای فشرده">هوای فشرده</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">نوع سرمایه‌گذاری:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as OpportunityType })}
                    className="enms-select w-full"
                  >
                    <option value="بدون هزینه / کم‌هزینه">بدون هزینه / کم‌هزینه</option>
                    <option value="متوسط">متوسط</option>
                    <option value="سرمایه‌ای (CAPEX)">سرمایه‌ای (CAPEX)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">شرح فنی اقدام ممیزی:</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="enms-input w-full leading-relaxed"
                  placeholder="شرح جزئیات فنی اقدام بهینه‌سازی..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">صرفه‌جویی مالی سالانه (میلیون ریال):</label>
                  <input
                    type="number"
                    value={formData.estimatedFinancialSavingMillionRials}
                    onChange={(e) => setFormData({ ...formData, estimatedFinancialSavingMillionRials: Number(e.target.value) })}
                    className="enms-input w-full font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">سرمایه‌گذاری CAPEX (میلیون ریال):</label>
                  <input
                    type="number"
                    value={formData.estimatedCapexMillionRials}
                    onChange={(e) => setFormData({ ...formData, estimatedCapexMillionRials: Number(e.target.value) })}
                    className="enms-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">
                    دوره بازگشت سرمایه (محاسبه خودکار):
                  </label>
                  <div className="enms-input w-full font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-[var(--color-bg-card-subtle)] flex items-center justify-between">
                    <span>{toPersianDigits(formData.simplePaybackYears)}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-sans">سال</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="enms-button enms-button-secondary text-xs px-3.5 py-1.5"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="enms-button enms-button-primary text-xs px-4 py-1.5"
                >
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال تنظیم اوزان AHP */}
      {isWeightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="enms-card max-w-lg w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
              تنظیم اوزان معیارهای فرایند تحلیل سلسله‌مراتبی (AHP Weights)
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              مجموع اوزان این ۵ معیار باید دقیقاً برابر ۱.۰۰ (۱۰۰٪) باشد.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span>پتانسیل صرفه‌جویی انرژی (کاهش Kcal و kWh):</span>
                  <strong className="font-mono">{(weights.energySavingWeight * 100).toFixed(0)}٪</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={weights.energySavingWeight * 100}
                  onChange={(e) =>
                    setWeights({ ...weights, energySavingWeight: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>توجیه اقتصادی و بازگشت سرمایه (Payback):</span>
                  <strong className="font-mono">{(weights.economicWeight * 100).toFixed(0)}٪</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={weights.economicWeight * 100}
                  onChange={(e) =>
                    setWeights({ ...weights, economicWeight: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>سهولت اجرا و عدم ریسک توقف کوره:</span>
                  <strong className="font-mono">{(weights.feasibilityRiskWeight * 100).toFixed(0)}٪</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={weights.feasibilityRiskWeight * 100}
                  onChange={(e) =>
                    setWeights({ ...weights, feasibilityRiskWeight: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>اثرات زیست‌محیطی، غبار و ایمنی (HSE):</span>
                  <strong className="font-mono">{(weights.hseImpactWeight * 100).toFixed(0)}٪</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={weights.hseImpactWeight * 100}
                  onChange={(e) =>
                    setWeights({ ...weights, hseImpactWeight: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span>قابلیت تأمین و استقلال از تحریم (Supply Chain):</span>
                  <strong className="font-mono">{(weights.supplyChainWeight * 100).toFixed(0)}٪</strong>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={weights.supplyChainWeight * 100}
                  onChange={(e) =>
                    setWeights({ ...weights, supplyChainWeight: Number(e.target.value) / 100 })
                  }
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
              <button
                onClick={() => setWeights(DEFAULT_AHP_WEIGHTS)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
              >
                بازنشانی به اوزان پیش‌فرض استاندارد
              </button>
              <button
                onClick={() => setIsWeightModalOpen(false)}
                className="enms-button enms-button-primary text-xs px-4 py-1.5"
              >
                تأیید و اعمال در ماتریس
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مدال امتیازدهی AHP */}
      {evaluatingOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="enms-card max-w-lg w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              امتیازدهی چندمعیاره AHP: {evaluatingOpportunity.title}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">
              امتیازدهی تخصصی از ۱ (بسیار ضعیف) تا ۵ (عالی) برای تجهیز {evaluatingOpportunity.targetSEU}
            </p>

            <div className="space-y-3.5 text-xs">
              {[
                { key: 'energySavingScore', title: '۱. پتانسیل صرفه‌جویی انرژی و کاهش شدت مصرف' },
                { key: 'economicScore', title: '۲. توجیه مالی، صرفه‌جویی ریالی و بازگشت سرمایه' },
                { key: 'feasibilityRiskScore', title: '۳. سهولت فنی اجرا و عدم ایجاد توقف اضطراری' },
                { key: 'hseImpactScore', title: '۴. کاهش غبار خروجی دودکش و بهبود شاخص‌های HSE' },
                { key: 'supplyChainScore', title: '۵. در دسترس بودن قطعات یدکی و امکان ساخت داخل' },
              ].map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-2 p-2 rounded bg-[var(--color-bg-app)]">
                  <span className="text-[var(--color-text-secondary)] font-medium">{c.title}</span>
                  <select
                    value={(criteriaScores as any)[c.key]}
                    onChange={(e) =>
                      setCriteriaScores({
                        ...criteriaScores,
                        [c.key]: Number(e.target.value),
                      })
                    }
                    className="enms-select !py-1 !px-2 font-mono font-bold text-xs"
                  >
                    <option value={5}>۵ - بسیار مطلوب (عالی)</option>
                    <option value={4}>۴ - مطلوب (خوب)</option>
                    <option value={3}>۳ - متوسط (قابل قبول)</option>
                    <option value={2}>۲ - نامطلوب (سخت/پرهزینه)</option>
                    <option value={1}>۱ - بحرانی / بسیار ضعیف</option>
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
              <button
                onClick={() => setEvaluatingOpportunity(null)}
                className="enms-button enms-button-secondary text-xs px-3 py-1.5"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveEvaluation}
                className="enms-button enms-button-primary text-xs px-4 py-1.5"
              >
                محاسبه رتبه و ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunitiesView;