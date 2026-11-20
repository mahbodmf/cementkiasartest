import React, { useState, useEffect } from 'react';
import { Calculator, Save } from 'lucide-react';
import { CrudModal } from '../../components/CrudModal';
import { FinancialAndMVItem, EnergyProjectItem } from '../../../../types';

interface FinancialMvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: FinancialAndMVItem) => void;
  initialData?: FinancialAndMVItem | null;
  availableProjects: EnergyProjectItem[];
}

export const FinancialMvModal: React.FC<FinancialMvModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  availableProjects,
}) => {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState<FinancialAndMVItem>({
    projectId: availableProjects[0]?.id || 'PRJ-EN-01',
    projectTitle: availableProjects[0]?.title || '',
    mvOption: 'Option A (جداسازی تجهیز)',
    baselinePeriod: '۱۴۰۴ (۱۲ ماه)',
    reportingPeriod: '۱۴۰۵ (۶ ماه اخیر)',
    verifiedSavingMWhYear: 0,
    verifiedSavingGJYear: 0,
    verifiedFinancialSavingMillionRialsYear: 0,
    npvMillionRials: 0,
    irrPct: 0,
    paybackActualYears: 0,
    mvStatus: 'منطبق بر IPMVP',
    verifier: 'شرکت ممیزی انرژی معتمد / تیم پایش EnMS',
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else if (availableProjects.length > 0) {
      setForm({
        projectId: availableProjects[0].id,
        projectTitle: availableProjects[0].title,
        mvOption: 'Option A (جداسازی تجهیز)',
        baselinePeriod: '۱۴۰۴ (۱۲ ماه)',
        reportingPeriod: '۱۴۰۵ (۶ ماه اخیر)',
        verifiedSavingMWhYear: 0,
        verifiedSavingGJYear: 0,
        verifiedFinancialSavingMillionRialsYear: 0,
        npvMillionRials: 0,
        irrPct: 0,
        paybackActualYears: 0,
        mvStatus: 'منطبق بر IPMVP',
        verifier: 'شرکت ممیزی انرژی معتمد / تیم پایش EnMS',
      });
    }
  }, [initialData, availableProjects, isOpen]);

  const handleProjectSelect = (pId: string) => {
    const p = availableProjects.find((x) => x.id === pId);
    setForm({
      ...form,
      projectId: pId,
      projectTitle: p ? p.title : form.projectTitle,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) return;
    onSave(form);
    onClose();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'ویرایش رکورد صحه‌گذاری M&V' : 'ثبت رکورد جدید صحه‌گذاری بر اساس پروتکل IPMVP'}
      subtitle="بند ۶.۲ و ۹.۱ استاندارد ISO 50001:2018 - صحه‌گذاری کمّی صرفه‌جویی پروژه‌ها و بازده سرمایه‌گذاری"
      icon={<Calculator className="w-5 h-5 text-emerald-500" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              پروژه بهینه‌سازی هدف <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.projectId}
              onChange={(e) => handleProjectSelect(e.target.value)}
              className="enms-input w-full font-semibold"
            >
              {availableProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              رویکرد اندازه‌گیری پروتکل (IPMVP Option) <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.mvOption}
              onChange={(e) => setForm({ ...form, mvOption: e.target.value as any })}
              className="enms-input w-full"
            >
              <option value="Option A (جداسازی تجهیز)">Option A (جداسازی تجهیز - پارامتر کلیدی)</option>
              <option value="Option B (اندازه‌گیری تمام پارامترها)">Option B (اندازه‌گیری تمام پارامترها)</option>
              <option value="Option C (کل کارخانه/CUSUM)">Option C (کل کارخانه / رگرسیون و CUSUM)</option>
              <option value="Option D (شبیه‌سازی)">Option D (شبیه‌سازی کالبیراسیون‌شده فرآیند)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
            عنوان پروژه (ثبت‌شده در شناسنامه)
          </label>
          <input
            type="text"
            value={form.projectTitle}
            onChange={(e) => setForm({ ...form, projectTitle: e.target.value })}
            className="enms-input w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              بازه زمانی خط مبنا (Baseline Period)
            </label>
            <input
              type="text"
              placeholder="مانند: ۱۴۰۴ (۱۲ ماه کامل قبل از نصب)"
              value={form.baselinePeriod}
              onChange={(e) => setForm({ ...form, baselinePeriod: e.target.value })}
              className="enms-input w-full"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دوره گزارش‌گیری صحه‌گذاری (Reporting Period)
            </label>
            <input
              type="text"
              placeholder="مانند: ۱۴۰۵ (۶ ماه پس از بهره‌برداری)"
              value={form.reportingPeriod}
              onChange={(e) => setForm({ ...form, reportingPeriod: e.target.value })}
              className="enms-input w-full"
            />
          </div>
        </div>

        {/* مقادیر صرفه‌جویی و شاخص‌های مالی */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              صرفه‌جویی مالی سالانه (م.ر)
            </label>
            <input
              type="number"
              min="0"
              value={form.verifiedFinancialSavingMillionRialsYear}
              onChange={(e) =>
                setForm({
                  ...form,
                  verifiedFinancialSavingMillionRialsYear: Number(e.target.value),
                })
              }
              className="enms-input w-full font-mono text-center text-emerald-600 dark:text-emerald-400 font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              ارزش فعلی خالص NPV (م.ر)
            </label>
            <input
              type="number"
              value={form.npvMillionRials}
              onChange={(e) => setForm({ ...form, npvMillionRials: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold text-blue-600 dark:text-blue-400"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              نرخ بازده داخلی (IRR ٪)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.irrPct}
              onChange={(e) => setForm({ ...form, irrPct: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold text-cyan-600 dark:text-cyan-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دوره بازگشت واقعی (سال)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.paybackActualYears}
              onChange={(e) => setForm({ ...form, paybackActualYears: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              وضعیت صحه‌گذاری M&V
            </label>
            <select
              value={form.mvStatus}
              onChange={(e) => setForm({ ...form, mvStatus: e.target.value as any })}
              className="enms-input w-full"
            >
              <option value="منطبق بر IPMVP">منطبق بر IPMVP</option>
              <option value="در حال جمع‌آوری داده">در حال جمع‌آوری داده</option>
              <option value="عدم تحقق فرضیات">عدم تحقق فرضیات</option>
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              نهاد / شخص صحه‌گذار
            </label>
            <input
              type="text"
              value={form.verifier}
              onChange={(e) => setForm({ ...form, verifier: e.target.value })}
              className="enms-input w-full"
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
            <span>{isEdit ? 'ذخیره تغییرات' : 'ثبت رکورد M&V'}</span>
          </button>
        </div>
      </form>
    </CrudModal>
  );
};

export default FinancialMvModal;
