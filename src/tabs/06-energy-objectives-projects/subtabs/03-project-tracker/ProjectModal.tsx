import React, { useState, useEffect } from 'react';
import { Kanban, Save } from 'lucide-react';
import { CrudModal } from '../../components/CrudModal';
import { EnergyProjectItem, ProjectPriority, ProjectPhase } from '../../../../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: EnergyProjectItem) => void;
  initialData?: EnergyProjectItem | null;
  existingCount: number;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCount,
}) => {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState<EnergyProjectItem>({
    id: `PRJ-EN-0${existingCount + 1}`,
    title: '',
    department: 'کوره و خنک‌کن',
    targetSEU: '',
    projectManager: '',
    contractor: '',
    priority: 'بالا',
    phase: 'طراحی و تأمین',
    startDate: '۱۴۰۵/۰۱/۱۵',
    plannedEndDate: '۱۴۰۵/۰۸/۳۰',
    progressPct: 0,
    capexBudgetMillionRials: 0,
    capexSpentMillionRials: 0,
    financialVarianceMillionRials: 0,
    status: 'در حال پیشرفت',
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: `PRJ-EN-0${existingCount + 1}`,
        title: '',
        department: 'کوره و خنک‌کن',
        targetSEU: '',
        projectManager: '',
        contractor: '',
        priority: 'بالا',
        phase: 'طراحی و تأمین',
        startDate: '۱۴۰۵/۰۱/۱۵',
        plannedEndDate: '۱۴۰۵/۰۸/۳۰',
        progressPct: 0,
        capexBudgetMillionRials: 0,
        capexSpentMillionRials: 0,
        financialVarianceMillionRials: 0,
        status: 'در حال پیشرفت',
      });
    }
  }, [initialData, existingCount, isOpen]);

  const handleBudgetChange = (field: 'capexBudgetMillionRials' | 'capexSpentMillionRials', val: number) => {
    const updated = { ...form, [field]: val };
    const budget = field === 'capexBudgetMillionRials' ? val : form.capexBudgetMillionRials;
    const spent = field === 'capexSpentMillionRials' ? val : form.capexSpentMillionRials;
    updated.financialVarianceMillionRials = budget - spent;
    setForm(updated);
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
      title={isEdit ? 'ویرایش پروژه بهینه‌سازی انرژی' : 'تعریف پروژه جدید بهینه‌سازی'}
      subtitle="بند ۶.۲ استاندارد ISO 50001:2018 - برنامه‌ریزی عملیاتی، کنترل پیشرفت و بودجه CAPEX"
      icon={<Kanban className="w-5 h-5 text-blue-500" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              کد پروژه <span className="text-rose-500">*</span>
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
              وضعیت کلی پروژه <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="enms-input w-full"
            >
              <option value="در حال پیشرفت">در حال پیشرفت</option>
              <option value="معوق">معوق</option>
              <option value="تحت بررسی">تحت بررسی</option>
              <option value="پایان‌یافته">پایان‌یافته</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
            عنوان پروژه بهینه‌سازی <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="مانند: نصب سامانه هوشمند کنترل بار آسیاب مواد خام..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="enms-input w-full font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دپارتمان مجری
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
              <option value="برق و ابزار دقیق">برق و ابزار دقیق</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              تجهیز بارز (SEU) هدف <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مانند: فن ID کوره (331.FN.010)"
              value={form.targetSEU}
              onChange={(e) => setForm({ ...form, targetSEU: e.target.value })}
              className="enms-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              مدیر پروژه (داخلی) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="نام و نام خانوادگی مسئول پروژه"
              value={form.projectManager}
              onChange={(e) => setForm({ ...form, projectManager: e.target.value })}
              className="enms-input w-full"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              پیمانکار یا تأمین‌کننده
            </label>
            <input
              type="text"
              placeholder="نام شرکت پیمانکار (اختیاری)"
              value={form.contractor || ''}
              onChange={(e) => setForm({ ...form, contractor: e.target.value })}
              className="enms-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              اولویت راهبردی
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as ProjectPriority })}
              className="enms-input w-full font-bold"
            >
              <option value="فوق بحرانی">فوق بحرانی</option>
              <option value="بالا">بالا</option>
              <option value="متوسط">متوسط</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              فاز اجرایی WBS
            </label>
            <select
              value={form.phase}
              onChange={(e) => setForm({ ...form, phase: e.target.value as ProjectPhase })}
              className="enms-input w-full"
            >
              <option value="طراحی و تأمین">طراحی و تأمین</option>
              <option value="اجرا و نصب">اجرا و نصب</option>
              <option value="راه‌اندازی و تست">راه‌اندازی و تست</option>
              <option value="تحویل و صحه‌گذاری">تحویل و صحه‌گذاری</option>
              <option value="پایان‌یافته">پایان‌یافته</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              درصد پیشرفت فیزیکی ({form.progressPct}٪)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={form.progressPct}
                onChange={(e) => setForm({ ...form, progressPct: Number(e.target.value) })}
                className="w-full accent-[var(--color-primary)]"
              />
              <span className="font-mono font-bold text-[var(--color-primary)] w-8 text-left">
                {form.progressPct}٪
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              تاریخ شروع رسمی
            </label>
            <input
              type="text"
              placeholder="۱۴۰۵/۰۱/۱۵"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="enms-input w-full text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              تاریخ خاتمه برنامه‌ریزی‌شده
            </label>
            <input
              type="text"
              placeholder="۱۴۰۵/۰۸/۳۰"
              value={form.plannedEndDate}
              onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })}
              className="enms-input w-full text-center font-mono"
            />
          </div>
        </div>

        {/* بودجه مالی CAPEX */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              بودجه مصوب CAPEX (م.ر)
            </label>
            <input
              type="number"
              min="0"
              value={form.capexBudgetMillionRials}
              onChange={(e) => handleBudgetChange('capexBudgetMillionRials', Number(e.target.value))}
              className="enms-input w-full font-mono text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              هزینه‌کرد واقعی تاکنون (م.ر)
            </label>
            <input
              type="number"
              min="0"
              value={form.capexSpentMillionRials}
              onChange={(e) => handleBudgetChange('capexSpentMillionRials', Number(e.target.value))}
              className="enms-input w-full font-mono text-center text-amber-600 dark:text-amber-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              انحراف بودجه (م.ر)
            </label>
            <div className={`p-2 rounded font-mono text-center font-bold text-xs ${
              form.financialVarianceMillionRials >= 0
                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
            }`}>
              {form.financialVarianceMillionRials} م.ر
            </div>
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
            <span>{isEdit ? 'ذخیره تغییرات' : 'ثبت پروژه جدید'}</span>
          </button>
        </div>
      </form>
    </CrudModal>
  );
};

export default ProjectModal;
