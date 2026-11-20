import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Layers,
  Search,
  Pencil,
  Bot,
  Sparkles,
  ShieldAlert,
  Loader2,
  X,
  Check,
  Tag,
  Factory,
} from 'lucide-react';
import { toPersianDigits } from '../../../../../utils/persianUtils';

export interface RelevantVariableItem {
  id: string;
  level?: 'department' | 'equipment';
  name: string;
  category: 'فرآیندی' | 'کیفی و مواد' | 'محیطی' | 'تاسیساتی' | 'عملیاتی تجهیز' | 'الکتریکال و درایو' | 'پایش وضعیت تجهیز';
  affectedDepartment: string;
  affectedSeuTag: string;
  affectedSeuName: string;
  measurementEquipment: string;
  hasOnlineMeter: boolean;
  normalRange: string;
  unit: string;
  correlationStrength: 'بسیار قوی' | 'قوی' | 'متوسط' | 'ضعیف';
  impactOnEnpi: string;
  sensitivityFactor?: string;
  isControllable?: boolean;
  isAiSuggested?: boolean;
}

interface EquipmentVariablesPanelProps {
  equipment: any;
  departmentName: string;
  onNavigateToVariablesTab?: () => void;
}

export const EquipmentVariablesPanel: React.FC<EquipmentVariablesPanelProps> = ({
  equipment,
  departmentName,
  onNavigateToVariablesTab,
}) => {
  const [allVariables, setAllVariables] = useState<RelevantVariableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // استیت فیلتر سطح متغیر (همه / سطح تجهیز / سطح دپارتمان)
  const [scopeFilter, setScopeFilter] = useState<'all' | 'equipment' | 'department'>('all');

  // استیت فرم ثبت / ویرایش
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVariableId, setEditingVariableId] = useState<string | null>(null);

  // استیت فیلترهای هوشمند بالای جدول
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [correlationFilter, setCorrelationFilter] = useState<string>('all');
  const [meteringFilter, setMeteringFilter] = useState<string>('all');

  // استیت ماژول هوش مصنوعی
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<RelevantVariableItem[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGuardWarning, setAiGuardWarning] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<RelevantVariableItem>>({
    name: '',
    level: 'equipment',
    category: 'عملیاتی تجهیز',
    measurementEquipment: '',
    hasOnlineMeter: true,
    normalRange: '',
    unit: '',
    correlationStrength: 'قوی',
    impactOnEnpi: '',
    sensitivityFactor: '',
  });

  // ۱. واکشی متمرکز از فایل JSON
  useEffect(() => {
    setIsLoading(true);
    fetch('/data/03-energy-review/relevant-variables.json')
      .then((res) => {
        if (!res.ok) throw new Error('فایل یافت نشد');
        return res.text();
      })
      .then((text) => {
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) {
          setAllVariables([]);
          return;
        }
        const data = JSON.parse(text);
        if (data && Array.isArray(data.variables)) {
          setAllVariables(data.variables);
        } else {
          setAllVariables([]);
        }
      })
      .catch(() => {
        setAllVariables([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ۲. استخراج متغیرهای مرتبط با این تجهیز و همچنین متغیرهای سطح دپارتمان والد
  const equipmentContextVariables = useMemo(() => {
    if (!equipment) return [];

    const eqTag = (equipment.tag || '').toLowerCase().trim();
    const eqName = (equipment.name || '').toLowerCase().trim();
    const eqTokens = eqTag.split(/[.\-_/\s]+/).filter(Boolean);
    const eqKeywords = eqName.replace(/[()]/g, '').split(/\s+/).filter((w: string) => w.length > 2);
    const deptClean = (departmentName || '').toLowerCase().trim();

    return allVariables.filter((v) => {
      const vTag = (v.affectedSeuTag || '').toLowerCase().trim();
      const vName = (v.affectedSeuName || '').toLowerCase().trim();
      const vDept = (v.affectedDepartment || '').toLowerCase().trim();

      // ۱. تطابق تجهیز:
      const vTokens = vTag.split(/[.\-_/\s]+/).filter(Boolean);
      const isTokenMatch =
        vTokens.length > 0 &&
        eqTokens.length > 0 &&
        (vTokens.every((t: string) => eqTokens.includes(t)) ||
         eqTokens.every((t: string) => vTokens.includes(t)));

      const isDirectTagMatch = vTag.length > 0 && (eqTag.includes(vTag) || vTag.includes(eqTag));
      const isNameMatch =
        (vName.length > 0 && (eqName.includes(vName) || vName.includes(eqName))) ||
        (eqKeywords.length > 0 && eqKeywords.some((kw: string) => vName.includes(kw)));

      const isEquipmentMatch = isTokenMatch || isDirectTagMatch || isNameMatch;

      // ۲. متغیرهای سطح کلان دپارتمان (مانند نرخ خوراک یا دمای محیط):
      const isDepartmentLevel =
        (v.level === 'department' || !v.level) &&
        vDept.length > 0 &&
        deptClean.includes(vDept);

      return isEquipmentMatch || isDepartmentLevel;
    });
  }, [allVariables, equipment, departmentName]);

  // ۳. اعمال فیلتر سطح (Scope)، جستجو و سایر فیلترها
  const displayedVariables = useMemo(() => {
    return equipmentContextVariables.filter((item) => {
      // فیلتر سطح (تجهیز در برابر دپارتمان)
      const itemScope = item.level === 'department' ? 'department' : 'equipment';
      if (scopeFilter !== 'all' && itemScope !== scopeFilter) {
        return false;
      }

      // جستجوی متنی
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.measurementEquipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.impactOnEnpi.toLowerCase().includes(searchQuery.toLowerCase());

      // فیلتر دسته‌‌بندی
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      // فیلتر شدت همبستگی
      const matchCorrelation = correlationFilter === 'all' || item.correlationStrength === correlationFilter;

      // فیلتر میترینگ
      const matchMetering =
        meteringFilter === 'all' ||
        (meteringFilter === 'online' && item.hasOnlineMeter) ||
        (meteringFilter === 'manual' && !item.hasOnlineMeter);

      return matchSearch && matchCategory && matchCorrelation && matchMetering;
    });
  }, [equipmentContextVariables, scopeFilter, searchQuery, categoryFilter, correlationFilter, meteringFilter]);

  // شمارش متغیرهای هر سطح جهت نمایش روی تب‌ها
  const countStats = useMemo(() => {
    let eqCount = 0;
    let deptCount = 0;
    equipmentContextVariables.forEach((v) => {
      if (v.level === 'department') deptCount++;
      else eqCount++;
    });
    return { eqCount, deptCount, total: equipmentContextVariables.length };
  }, [equipmentContextVariables]);

  // باز کردن فرم ویرایش
  const handleOpenEdit = (v: RelevantVariableItem) => {
    setEditingVariableId(v.id);
    setFormData({ ...v });
    setShowFormModal(true);
  };

  // باز کردن فرم ایجاد جدید
  const handleOpenCreate = () => {
    setEditingVariableId(null);
    setFormData({
      name: '',
      level: 'equipment',
      category: 'عملیاتی تجهیز',
      measurementEquipment: '',
      hasOnlineMeter: true,
      normalRange: '',
      unit: '',
      correlationStrength: 'قوی',
      impactOnEnpi: '',
      sensitivityFactor: '',
    });
    setShowFormModal(true);
  };

  // ذخیره فرم
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingVariableId) {
      setAllVariables((prev) =>
        prev.map((item) =>
          item.id === editingVariableId ? ({ ...item, ...formData } as RelevantVariableItem) : item
        )
      );
    } else {
      const created: RelevantVariableItem = {
        id: `rv_${Date.now()}`,
        level: formData.level || 'equipment',
        name: formData.name,
        category: (formData.category as any) || 'عملیاتی تجهیز',
        affectedDepartment: departmentName,
        affectedSeuTag: equipment.tag || '',
        affectedSeuName: equipment.name || '',
        measurementEquipment: formData.measurementEquipment || 'سنسور محلی',
        hasOnlineMeter: Boolean(formData.hasOnlineMeter),
        normalRange: formData.normalRange || '-',
        unit: formData.unit || '-',
        correlationStrength: (formData.correlationStrength as any) || 'قوی',
        impactOnEnpi: formData.impactOnEnpi || 'تاثیر مستقیم بر شاخص عملکرد انرژی',
        sensitivityFactor: formData.sensitivityFactor || '',
        isControllable: true,
      };
      setAllVariables((prev) => [...prev, created]);
    }
    setShowFormModal(false);
  };

  const handleDeleteVariable = (id: string) => {
    if (window.confirm('آیا از حذف این متغیر تاثیرگذار اطمینان دارید؟')) {
      setAllVariables((prev) => prev.filter((v) => v.id !== id));
    }
  };

  // پیشنهاد هوش مصنوعی با گارد ریل مهندسی
  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    setAiGuardWarning(null);
    setShowAiModal(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const eqTag = (equipment.tag || '').toUpperCase();
      const eqName = equipment.name || '';

      let generated: RelevantVariableItem[] = [];

      if (eqTag.includes('HC') || eqName.includes('سنگ‌شکن')) {
        generated = [
          {
            id: `ai_${Date.now()}_1`,
            level: 'equipment',
            name: 'سایش و لقی چکش‌های روتور سنگ‌شکن (Hammer Wear Clearance)',
            category: 'عملیاتی تجهیز',
            affectedDepartment: departmentName,
            affectedSeuTag: equipment.tag,
            affectedSeuName: equipment.name,
            measurementEquipment: 'گیج اندازه‌گیری لقی در توقفات دوره‌ای نت (PM)',
            hasOnlineMeter: false,
            normalRange: '۱۵ تا ۲۵',
            unit: 'mm',
            correlationStrength: 'بسیار قوی',
            sensitivityFactor: 'افزایش لقی بیش از ۳۰ میلی‌متر، خروجی درشت ایجاد کرده و بار مصرف انرژی آسیاب مواد را ۸٪ بالا می‌برد.',
            impactOnEnpi: 'سایش چکش‌ها باعث افزایش زمان خردایش و افزایش مصرف ویژه الکتریکی سنگ‌شکن می‌شود.',
            isAiSuggested: true,
          },
          {
            id: `ai_${Date.now()}_2`,
            level: 'equipment',
            name: 'ضریب پرشوندگی محفظه خردایش (Choke Level)',
            category: 'عملیاتی تجهیز',
            affectedDepartment: departmentName,
            affectedSeuTag: equipment.tag,
            affectedSeuName: equipment.name,
            measurementEquipment: 'سنسور اولتراسونیک سطح‌سنج هاپر خروجی',
            hasOnlineMeter: true,
            normalRange: '۶۰ تا ۸۰',
            unit: '٪',
            correlationStrength: 'قوی',
            sensitivityFactor: 'خالی کار کردن سنگ‌شکن، جریان بی‌باری را به هدر می‌دهد.',
            impactOnEnpi: 'تغذیه پیوسته و یکنواخت چوک، ضریب توان و راندمان موتور را به حداکثر می‌رساند.',
            isAiSuggested: true,
          },
        ];
      } else {
        generated = [
          {
            id: `ai_${Date.now()}_3`,
            level: 'equipment',
            name: `شاخص ارتعاشات و سلامت بیرینگ‌های ${eqName}`,
            category: 'پایش وضعیت تجهیز',
            affectedDepartment: departmentName,
            affectedSeuTag: equipment.tag,
            affectedSeuName: equipment.name,
            measurementEquipment: 'شتاب‌سنج آنلاین پیزوالکتریک سیستم CM',
            hasOnlineMeter: true,
            normalRange: 'کمتر از ۴.۵',
            unit: 'mm/s RMS',
            correlationStrength: 'قوی',
            sensitivityFactor: 'افزایش لرزش نشانه اصطکاک و هدررفت انرژی مکانیکی است.',
            impactOnEnpi: 'حفظ سلامت مکانیکی تلفات توان الکتروموتور را به حداقل می‌رساند.',
            isAiSuggested: true,
          },
        ];
      }

      setAiSuggestions(generated);
    } catch {
      setAiGuardWarning('خطا در فراخوانی هسته هوش مصنوعی.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAcceptAiSuggestion = (suggestion: RelevantVariableItem) => {
    setAllVariables((prev) => [...prev, suggestion]);
    setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  const getCorrelationBadge = (strength: string) => {
    switch (strength) {
      case 'بسیار قوی':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'قوی':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] animate-fadeIn text-xs" dir="rtl">
      {/* هدر پنل متغیرها با اشاره صریح به تجهیز انتخاب‌شده */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-bold text-[var(--color-text-primary)]">
                متغیرهای مرتبط با مصرف انرژی (Relevant Variables) - تجهیز: {equipment.name}
              </h5>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-primary)] font-bold">
                {equipment.tag}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
              شناسایی و پایش عوامل موثر بر EnPI بر اساس بند ۶.۳ استاندارد ISO 50001
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAiSuggest}
            className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 hover:border-purple-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>پیشنهاد متغیر با AI</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ متغیر دستی</span>
          </button>

          {onNavigateToVariablesTab && (
            <button
              onClick={onNavigateToVariablesTab}
              className="enms-button enms-button-primary !py-1 !px-2.5 text-xs flex items-center gap-1"
              title="انتقال به ساب‌تب جامع متغیرها و همبستگی"
            >
              <span>ماتریس جامع</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* تب‌های تفکیک شفاف سطح متغیر (سطح تجهیز در برابر سطح دپارتمان) */}
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              scopeFilter === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            همه متغیرها ({toPersianDigits(countStats.total)})
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('equipment')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              scopeFilter === 'equipment'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>سطح تجهیز ({toPersianDigits(countStats.eqCount)})</span>
          </button>

          <button
            type="button"
            onClick={() => setScopeFilter('department')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              scopeFilter === 'department'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Factory className="w-3 h-3" />
            <span>سطح دپارتمان ({toPersianDigits(countStats.deptCount)})</span>
          </button>
        </div>

        <span className="text-[11px] text-[var(--color-text-muted)]">
          {scopeFilter === 'equipment' && `نمایش پارامترهای کنترل عملیاتی مختص ${equipment.name}`}
          {scopeFilter === 'department' && `نمایش پارامترهای کیفی و فرآیندی کلان واحد ${departmentName}`}
          {scopeFilter === 'all' && 'نمایش توأم متغیرهای اختصاصی تجهیز و متغیرهای فرآیندی واحد'}
        </span>
      </div>

      {/* نوار فیلترهای هوشمند بالای جدول */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] mb-3">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام، سنسور یا اثرگذاری..."
            className="enms-input w-full pr-8 text-xs"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="enms-select w-full text-xs"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            <option value="عملیاتی تجهیز">عملیاتی تجهیز</option>
            <option value="الکتریکال و درایو">الکتریکال و درایو</option>
            <option value="پایش وضعیت تجهیز">پایش وضعیت تجهیز</option>
            <option value="فرآیندی">فرآیندی</option>
            <option value="کیفی و مواد">کیفی و مواد</option>
            <option value="تاسیساتی">تاسیساتی</option>
          </select>
        </div>

        <div>
          <select
            value={correlationFilter}
            onChange={(e) => setCorrelationFilter(e.target.value)}
            className="enms-select w-full text-xs"
          >
            <option value="all">همه شدت‌های همبستگی</option>
            <option value="بسیار قوی">بسیار قوی</option>
            <option value="قوی">قوی</option>
            <option value="متوسط">متوسط</option>
          </select>
        </div>

        <div>
          <select
            value={meteringFilter}
            onChange={(e) => setMeteringFilter(e.target.value)}
            className="enms-select w-full text-xs"
          >
            <option value="all">همه روش‌های میترینگ</option>
            <option value="online">دارای میترینگ آنلاین (SCADA)</option>
            <option value="manual">پایش دستی / آزمایشگاهی</option>
          </select>
        </div>
      </div>

      {/* وضعیت لودینگ و جدول متغیرها */}
      {isLoading ? (
        <div className="p-6 text-center text-[var(--color-text-muted)]">در حال بارگذاری متغیرها...</div>
      ) : displayedVariables.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] space-y-2">
          <Layers className="w-8 h-8 mx-auto opacity-30 text-[var(--color-text-muted)]" />
          <p>
            {equipmentContextVariables.length === 0
              ? `هنوز هیچ متغیری برای تجهیز «${equipment.name}» ثبت نشده است.`
              : 'هیچ متغیری با فیلترهای انتخابی مطابقت ندارد.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleAiSuggest}
              className="enms-button enms-button-secondary !py-1 !px-3 text-xs inline-flex items-center gap-1 text-purple-600 dark:text-purple-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>پیشنهاد متغیر با AI</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="enms-button enms-button-primary !py-1 !px-3 text-xs inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت متغیر دستی</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-2xs">
          <table className="w-full text-right text-xs">
            <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
              <tr>
                <th className="p-2.5">نام متغیر تاثیرگذار</th>
                <th className="p-2.5 text-center">سطح تاثیر</th>
                <th className="p-2.5 text-center">دسته‌بندی</th>
                <th className="p-2.5 text-center">محدوده نرمال</th>
                <th className="p-2.5 text-center">شدت همبستگی</th>
                <th className="p-2.5">تجهیز و روش اندازه‌گیری (میترینگ)</th>
                <th className="p-2.5 text-center">میترینگ آنلاین</th>
                <th className="p-2.5">نحوه اثرگذاری بر شاخص عملکرد انرژی (EnPI)</th>
                <th className="p-2.5 text-center w-16">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {displayedVariables.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors">
                  <td className="p-2.5 font-bold text-[var(--color-text-primary)]">
                    <div className="flex items-center gap-1.5">
                      {item.isAiSuggested && (
                        <span className="p-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400" title="پیشنهاد هوش مصنوعی">
                          <Bot className="w-3 h-3" />
                        </span>
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  {/* ستون تفکیک صریح سطح دپارتمان / سطح تجهیز */}
                  <td className="p-2.5 text-center whitespace-nowrap">
                    {item.level === 'department' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                        سطح دپارتمان
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        سطح تجهیز
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      {item.category}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-center text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">
                    {toPersianDigits(item.normalRange)} {item.unit}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getCorrelationBadge(item.correlationStrength)}`}>
                      {item.correlationStrength}
                    </span>
                  </td>
                  <td className="p-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    {item.measurementEquipment}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    {item.hasOnlineMeter ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>دارد (SCADA)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>آزمایشگاهی / دستی</span>
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-[11px] text-[var(--color-text-muted)] max-w-xs leading-relaxed">
                    <div>{item.impactOnEnpi}</div>
                    {item.sensitivityFactor && (
                      <div className="text-[10px] text-[var(--color-primary)] font-mono mt-0.5">
                        {item.sensitivityFactor}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                        title="ویرایش این متغیر"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVariable(item.id)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="حذف متغیر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* مدال ایجاد / ویرایش متغیر با تعیین سطح صریح */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="enms-card max-w-2xl w-full p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                {editingVariableId ? `ویرایش متغیر: ${formData.name}` : `تعریف متغیر جدید`}
              </h4>
              <button onClick={() => setShowFormModal(false)} className="text-[var(--color-text-muted)] hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">نام متغیر:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="enms-input w-full text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">سطح تاثیر:</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="enms-select w-full text-xs font-bold"
                  >
                    <option value="equipment">سطح تجهیز ({equipment.tag})</option>
                    <option value="department">سطح دپارتمان ({departmentName})</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">دسته‌بندی:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="enms-select w-full text-xs"
                  >
                    <option value="عملیاتی تجهیز">عملیاتی تجهیز</option>
                    <option value="الکتریکال و درایو">الکتریکال و درایو</option>
                    <option value="پایش وضعیت تجهیز">پایش وضعیت تجهیز</option>
                    <option value="فرآیندی">فرآیندی</option>
                    <option value="کیفی و مواد">کیفی و مواد</option>
                    <option value="تاسیساتی">تاسیساتی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">شدت همبستگی:</label>
                  <select
                    value={formData.correlationStrength}
                    onChange={(e) => setFormData({ ...formData, correlationStrength: e.target.value as any })}
                    className="enms-select w-full text-xs"
                  >
                    <option value="بسیار قوی">بسیار قوی</option>
                    <option value="قوی">قوی</option>
                    <option value="متوسط">متوسط</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">محدوده نرمال:</label>
                  <input
                    type="text"
                    value={formData.normalRange}
                    onChange={(e) => setFormData({ ...formData, normalRange: e.target.value })}
                    className="enms-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">واحد سنجش:</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="enms-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">تجهیز اندازه‌گیری:</label>
                  <input
                    type="text"
                    value={formData.measurementEquipment}
                    onChange={(e) => setFormData({ ...formData, measurementEquipment: e.target.value })}
                    className="enms-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">میترینگ آنلاین:</label>
                  <select
                    value={formData.hasOnlineMeter ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, hasOnlineMeter: e.target.value === 'yes' })}
                    className="enms-select w-full text-xs"
                  >
                    <option value="yes">دارد (SCADA / DCS)</option>
                    <option value="no">ندارد (دستی / آزمایشگاهی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--color-text-secondary)] mb-1">نحوه اثرگذاری بر EnPI:</label>
                <input
                  type="text"
                  value={formData.impactOnEnpi}
                  onChange={(e) => setFormData({ ...formData, impactOnEnpi: e.target.value })}
                  className="enms-input w-full text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setShowFormModal(false)} className="enms-button enms-button-secondary text-xs">
                  انصراف
                </button>
                <button type="submit" className="enms-button enms-button-primary text-xs">
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مدال پیشنهادهای هوش مصنوعی */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="enms-card max-w-2xl w-full p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                  پیشنهاد متغیرهای بهینه بر پایه AI برای: {equipment.name}
                </h4>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-[var(--color-text-muted)] hover:text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            {aiGuardWarning && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{aiGuardWarning}</span>
              </div>
            )}

            {isAiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs text-[var(--color-text-muted)]">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span>در حال تحلیل و استخراج متغیرهای استاندارد صنعت سیمان...</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {aiSuggestions.map((sug) => (
                  <div key={sug.id} className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--color-text-primary)]">{sug.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">سطح تجهیز</span>
                        <span className="font-mono text-[10px] text-emerald-600 font-bold">{sug.normalRange} {sug.unit}</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">{sug.impactOnEnpi}</p>
                    </div>
                    <button
                      onClick={() => handleAcceptAiSuggestion(sug)}
                      className="enms-button enms-button-primary !py-1 !px-2.5 text-xs flex items-center gap-1 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>تایید و افزودن</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-end">
              <button onClick={() => setShowAiModal(false)} className="enms-button enms-button-secondary text-xs">
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentVariablesPanel;