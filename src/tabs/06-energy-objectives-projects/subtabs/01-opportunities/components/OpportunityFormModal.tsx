import React, { useState, useEffect } from 'react';
import { X, Bot, Sparkles } from 'lucide-react';
import { EnergyOpportunityItem, OpportunityType, OpportunityStatus } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';
import { useAI } from '../../../../../context/AIContext';

export interface DynamicDepartmentOption {
  id: string;
  name: string;
  seus: string[];
  carriers: string[];
}

interface OpportunityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: EnergyOpportunityItem) => void;
  initialData?: EnergyOpportunityItem | null;
  departments: DynamicDepartmentOption[];
}

export const OpportunityFormModal: React.FC<OpportunityFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  departments,
}) => {
  const { requestAI, isProcessing } = useAI();

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    department: '',
    targetSEU: '',
    carrier: 'برق',
    type: 'متوسط' as OpportunityType,
    description: '',
    estimatedSavingGJ: 0,
    estimatedSavingMWh: 0,
    estimatedFinancialSavingMillionRials: 0,
    estimatedCapexMillionRials: 0,
    simplePaybackYears: 1.0,
    status: 'شناسایی‌شده' as OpportunityStatus,
  });

  const [aiMessage, setAiMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        title: initialData.title,
        department: initialData.department,
        targetSEU: initialData.targetSEU,
        carrier: initialData.carrier as any,
        type: initialData.type,
        description: initialData.description,
        estimatedSavingGJ: initialData.estimatedSavingGJ || 0,
        estimatedSavingMWh: initialData.estimatedSavingMWh || 0,
        estimatedFinancialSavingMillionRials: initialData.estimatedFinancialSavingMillionRials,
        estimatedCapexMillionRials: initialData.estimatedCapexMillionRials,
        simplePaybackYears: initialData.simplePaybackYears,
        status: initialData.status,
      });
    } else {
      const defaultDept = departments.length > 0 ? departments[0].name : '';
      const defaultSeu = departments.length > 0 && departments[0].seus.length > 0 ? departments[0].seus[0] : '';
      const defaultCarrier = departments.length > 0 && departments[0].carriers.length > 0 ? departments[0].carriers[0] : 'برق';

      setFormData({
        id: `OPP-${Math.floor(100 + Math.random() * 900)}`,
        title: '',
        department: defaultDept,
        targetSEU: defaultSeu,
        carrier: defaultCarrier,
        type: 'متوسط',
        description: '',
        estimatedSavingGJ: 0,
        estimatedSavingMWh: 0,
        estimatedFinancialSavingMillionRials: 0,
        estimatedCapexMillionRials: 0,
        simplePaybackYears: 1.0,
        status: 'شناسایی‌شده',
      });
    }
    setAiMessage(null);
  }, [initialData, departments, isOpen]);

  useEffect(() => {
    if (formData.estimatedFinancialSavingMillionRials > 0) {
      const pb = Number((formData.estimatedCapexMillionRials / formData.estimatedFinancialSavingMillionRials).toFixed(2));
      setFormData((prev) => ({ ...prev, simplePaybackYears: pb }));
    }
  }, [formData.estimatedFinancialSavingMillionRials, formData.estimatedCapexMillionRials]);

  const currentDeptObj = departments.find((d) => d.name === formData.department);
  const availableSeus = currentDeptObj ? currentDeptObj.seus : [];
  const availableCarriers = currentDeptObj && currentDeptObj.carriers.length > 0 ? currentDeptObj.carriers : ['برق', 'گاز طبیعی', 'هوای فشرده', 'مازوت'];

  const handleAiConsult = async () => {
    if (!formData.title.trim()) {
      setAiMessage('لطفاً عنوان فرصت یا کلمه کلیدی اقدام را وارد کنید تا هوش مصنوعی آن را تحلیل کند.');
      return;
    }

    setAiMessage(null);

    const response = await requestAI({
      scope: 'opportunity-analysis',
      prompt: formData.title,
      departmentContext: formData.department,
      targetEquipment: formData.targetSEU,
    });

    if (response.success && response.data) {
      const aiData = response.data;
      setFormData((prev) => ({
        ...prev,
        title: aiData.title || prev.title,
        description: aiData.description || prev.description,
        estimatedCapexMillionRials: aiData.estimatedCapexMillionRials || prev.estimatedCapexMillionRials,
        estimatedFinancialSavingMillionRials: aiData.estimatedFinancialSavingMillionRials || prev.estimatedFinancialSavingMillionRials,
        simplePaybackYears: aiData.simplePaybackYears || prev.simplePaybackYears,
      }));
      setAiMessage(`تحلیل هوشمند (${response.provider}) تکمیل شد. اطلاعات مالی و فنی بر اساس کانتکست دپارتمان ${formData.department} به‌روزرسانی شدند.`);
    } else {
      setAiMessage(response.error || 'خطا در ارتباط با دستیار مهندسی هوش مصنوعی.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      identifiedDate: initialData?.identifiedDate || '۱۴۰۵/۰۱/۰۱',
      identifiedBy: initialData?.identifiedBy || 'کمیته عالی انرژی',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn" dir="rtl">
      <div className="enms-card max-w-3xl w-full p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              {initialData ? `ویرایش فرصت بهینه‌سازی: ${initialData.id}` : 'ثبت فرصت بهبود انرژی جدید'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-rose-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* جعبه دستیار هوش مصنوعی متصل به سرویس مرکزی */}
        <div className="p-3.5 mb-4 rounded-xl bg-purple-500/10 border border-purple-500/25 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">دستیار مهندسی هوش مصنوعی (EnMS Central Copilot):</span>
            </div>
            <button
              type="button"
              onClick={handleAiConsult}
              disabled={isProcessing}
              className="enms-button bg-purple-600 hover:bg-purple-700 text-white !py-1 !px-3 text-xs flex items-center gap-1 shadow-sm disabled:opacity-50 self-end sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'در حال تحلیل مهندسی...' : 'تخمین هوشمند بر مبنای واحد'}</span>
            </button>
          </div>
          {aiMessage && (
            <div className="text-[11px] text-purple-700 dark:text-purple-300 bg-purple-500/15 p-2 rounded-lg leading-relaxed animate-fadeIn">
              {aiMessage}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
              <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">
                دپارتمان / واحد سازمانی (پویا از بافت سازمان):
              </label>
              <select
                value={formData.department}
                onChange={(e) => {
                  const newDept = e.target.value;
                  const targetObj = departments.find((d) => d.name === newDept);
                  setFormData({
                    ...formData,
                    department: newDept,
                    targetSEU: targetObj && targetObj.seus.length > 0 ? targetObj.seus[0] : '',
                    carrier: targetObj && targetObj.carriers.length > 0 ? targetObj.carriers[0] : 'برق',
                  });
                }}
                className="enms-select w-full"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">تجهیز یا SEU هدف:</label>
              {availableSeus.length > 0 ? (
                <select
                  value={formData.targetSEU}
                  onChange={(e) => setFormData({ ...formData, targetSEU: e.target.value })}
                  className="enms-select w-full"
                >
                  {availableSeus.map((seu, idx) => (
                    <option key={idx} value={seu}>{seu}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={formData.targetSEU}
                  onChange={(e) => setFormData({ ...formData, targetSEU: e.target.value })}
                  className="enms-input w-full"
                  placeholder="نام تجهیز را وارد کنید"
                />
              )}
            </div>
            <div>
              <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">حامل انرژی:</label>
              <select
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                className="enms-select w-full"
              >
                {availableCarriers.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
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
              <label className="block mb-1 font-bold text-[var(--color-text-secondary)]">دوره بازگشت سرمایه (محاسبه خودکار):</label>
              <div className="enms-input w-full font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-[var(--color-bg-card-subtle)] flex items-center justify-between">
                <span>{toPersianDigits(formData.simplePaybackYears)}</span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-sans">سال</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-[var(--color-border)] pt-3">
            <button type="button" onClick={onClose} className="enms-button enms-button-secondary text-xs px-3.5 py-1.5">
              انصراف
            </button>
            <button type="submit" className="enms-button enms-button-primary text-xs px-4 py-1.5">
              ذخیره اطلاعات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};