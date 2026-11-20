import React, { useState, useEffect } from 'react';
import { Lightbulb, Save, X } from 'lucide-react';
import { CrudModal } from '../../components/CrudModal';
import { EnergyOpportunityItem, OpportunityType, OpportunityStatus } from '../../../../types';

interface OpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (opportunity: EnergyOpportunityItem) => void;
  initialData?: EnergyOpportunityItem | null;
  existingCount: number;
}

export const OpportunityModal: React.FC<OpportunityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCount,
}) => {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState<EnergyOpportunityItem>({
    id: `OPP-EN-0${existingCount + 1}`,
    title: '',
    department: 'کوره و خنک‌کن',
    targetSEU: '',
    carrier: 'برق',
    type: 'متوسط',
    description: '',
    estimatedSavingMWh: 0,
    estimatedSavingGJ: 0,
    estimatedFinancialSavingMillionRials: 0,
    estimatedCapexMillionRials: 0,
    simplePaybackYears: 0,
    status: 'شناسایی‌شده',
    promotedToProjectId: null,
    identifiedDate: '۱۴۰۵/۰۱/۱۵',
    identifiedBy: 'کمیته عالی انرژی',
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: `OPP-EN-0${existingCount + 1}`,
        title: '',
        department: 'کوره و خنک‌کن',
        targetSEU: '',
        carrier: 'برق',
        type: 'متوسط',
        description: '',
        estimatedSavingMWh: 0,
        estimatedSavingGJ: 0,
        estimatedFinancialSavingMillionRials: 0,
        estimatedCapexMillionRials: 0,
        simplePaybackYears: 0,
        status: 'شناسایی‌شده',
        promotedToProjectId: null,
        identifiedDate: '۱۴۰۵/۰۱/۱۵',
        identifiedBy: 'کمیته عالی انرژی',
      });
    }
  }, [initialData, existingCount, isOpen]);

  // Auto calculate simple payback if Capex and Financial Saving are present
  const handleFinancialChange = (field: 'estimatedCapexMillionRials' | 'estimatedFinancialSavingMillionRials', val: number) => {
    const updatedForm = { ...form, [field]: val };
    const capex = field === 'estimatedCapexMillionRials' ? val : form.estimatedCapexMillionRials;
    const saving = field === 'estimatedFinancialSavingMillionRials' ? val : form.estimatedFinancialSavingMillionRials;

    if (saving > 0) {
      updatedForm.simplePaybackYears = Number((capex / saving).toFixed(2));
    } else {
      updatedForm.simplePaybackYears = 0;
    }
    setForm(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'ویرایش فرصت بهبود انرژی' : 'ثبت فرصت بهبود جدید'}
      subtitle="بند ۶.۲ استاندارد ISO 50001:2018 - شناسایی و غربالگری فرصت‌های بهینه‌سازی"
      icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              کد شناسایی فرصت <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              className="enms-input w-full font-mono text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              وضعیت غربالگری <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as OpportunityStatus })}
              className="enms-input w-full"
            >
              <option value="شناسایی‌شده">شناسایی‌شده</option>
              <option value="ارزیابی‌فنی">ارزیابی‌فنی</option>
              <option value="تصویب‌شده (تبدیل به پروژه)">تصویب‌شده (تبدیل به پروژه)</option>
              <option value="رد‌شده">رد‌شده</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
            عنوان اقدام یا فرصت بهبود <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="مانند: نصب درایو فرکانس متغیر روی الکتروفن بارز..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="enms-input w-full font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دپارتمان فرآیندی
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="enms-input w-full"
            >
              <option value="کوره و خنک‌کن">کوره و خنک‌کن</option>
              <option value="آسیاب مواد خام">آسیاب مواد خام</option>
              <option value="آسیاب سیمان">آسیاب سیمان</option>
              <option value="سنگ‌شکن و اختلاط">سنگ‌شکن و اختلاط</option>
              <option value="تاسیسات و یوتیلیتی">تاسیسات و یوتیلیتی</option>
              <option value="پست و توزیع برق">پست و توزیع برق</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              تجهیز بارز (SEU) هدف
            </label>
            <input
              type="text"
              placeholder="مانند: فن سیرکولاسیون (SEU-03)"
              value={form.targetSEU}
              onChange={(e) => setForm({ ...form, targetSEU: e.target.value })}
              className="enms-input w-full"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              حامل انرژی اصلی
            </label>
            <select
              value={form.carrier}
              onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              className="enms-input w-full"
            >
              <option value="برق">برق</option>
              <option value="گاز طبیعی">گاز طبیعی</option>
              <option value="مازوت">مازوت</option>
              <option value="هوای فشرده">هوای فشرده</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              سطح سرمایه‌گذاری
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as OpportunityType })}
              className="enms-input w-full"
            >
              <option value="بدون هزینه / کم‌هزینه">بدون هزینه / کم‌هزینه</option>
              <option value="متوسط">متوسط</option>
              <option value="سرمایه‌ای (CAPEX)">سرمایه‌ای (CAPEX)</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              شناسایی‌کننده و تاریخ
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="نام واحد یا فرد"
                value={form.identifiedBy}
                onChange={(e) => setForm({ ...form, identifiedBy: e.target.value })}
                className="enms-input w-full"
              />
              <input
                type="text"
                placeholder="۱۴۰۵/۰۱/۱۵"
                value={form.identifiedDate}
                onChange={(e) => setForm({ ...form, identifiedDate: e.target.value })}
                className="enms-input w-full text-center font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
            شرح راهکار فنی بهینه‌سازی
          </label>
          <textarea
            rows={3}
            placeholder="مکانیسم فنی کاهش اتلاف و بهینه‌سازی مصرف انرژی..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="enms-input w-full leading-relaxed"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              برآورد سرمایه CAPEX (م.ر)
            </label>
            <input
              type="number"
              min="0"
              value={form.estimatedCapexMillionRials}
              onChange={(e) => handleFinancialChange('estimatedCapexMillionRials', Number(e.target.value))}
              className="enms-input w-full font-mono text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              صرفه‌جویی مالی سالانه (م.ر)
            </label>
            <input
              type="number"
              min="0"
              value={form.estimatedFinancialSavingMillionRials}
              onChange={(e) => handleFinancialChange('estimatedFinancialSavingMillionRials', Number(e.target.value))}
              className="enms-input w-full font-mono text-center text-emerald-600 dark:text-emerald-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دوره بازگشت سرمایه (سال)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.simplePaybackYears}
              onChange={(e) => setForm({ ...form, simplePaybackYears: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center text-cyan-600 dark:text-cyan-400 font-bold"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)] mt-2">
          <button
            type="button"
            onClick={onClose}
            className="enms-button enms-button-secondary text-xs"
          >
            انصراف
          </button>
          <button
            type="submit"
            className="enms-button enms-button-primary text-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'ذخیره تغییرات' : 'ثبت فرصت بهبود'}</span>
          </button>
        </div>
      </form>
    </CrudModal>
  );
};

export default OpportunityModal;
