import React, { useState } from 'react';
import { Settings, X, Save, RotateCcw } from 'lucide-react';
import { OperationsTargets, DEFAULT_TARGETS } from '../types';

export interface TargetsSettingsModalProps {
  isOpen: boolean;
  currentTargets?: OperationsTargets;
  targets?: OperationsTargets;
  onClose: () => void;
  onSave: (newTargets: OperationsTargets) => void;
  onReset?: () => void;
}

export const TargetsSettingsModal: React.FC<TargetsSettingsModalProps> = ({
  isOpen,
  currentTargets,
  targets,
  onClose,
  onSave,
  onReset,
}) => {
  const activeTargets = currentTargets || targets || DEFAULT_TARGETS;
  const [formData, setFormData] = useState<OperationsTargets>(activeTargets);

  React.useEffect(() => {
    setFormData(activeTargets);
  }, [currentTargets, targets, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof OperationsTargets, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setFormData(DEFAULT_TARGETS);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
        {/* سربرگ مودال تنظیمات */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              تنظیم شاخص‌ها و حدود پذیرش استاندارد (Acceptance Thresholds)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فیلدهای ورودی شاخص‌ها */}
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="text-[var(--color-text-secondary)] block mb-1">
              سقف مجاز مصرف ویژه حرارتی خط پخت (kcal/kg clinker):
            </label>
            <input
              type="number"
              value={formData.secThermalMax}
              onChange={(e) => handleChange('secThermalMax', Number(e.target.value))}
              className="enms-input w-full font-mono"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
              معیار استاندارد ملی ISIRI 7873 (پیش‌فرض: ۸۲۰ kcal/kg)
            </span>
          </div>

          <div>
            <label className="text-[var(--color-text-secondary)] block mb-1">
              سقف مجاز مصرف ویژه برق کل کارخانه (kWh/ton cement):
            </label>
            <input
              type="number"
              value={formData.secElectricMax}
              onChange={(e) => handleChange('secElectricMax', Number(e.target.value))}
              className="enms-input w-full font-mono"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
              سقف مصرف بر مبنای توان ترانس‌ها و نوع سیمان (پیش‌فرض: ۱۰۵ kWh/t)
            </span>
          </div>

          <div>
            <label className="text-[var(--color-text-secondary)] block mb-1">
              شاخص هدف OEE کوره دوار (درصد):
            </label>
            <input
              type="number"
              value={formData.targetKilnOee}
              onChange={(e) => handleChange('targetKilnOee', Number(e.target.value))}
              className="enms-input w-full font-mono"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
              حداقل اثربخشی کلی مطلوب خط پخت (پیش‌فرض: ۷۵٪)
            </span>
          </div>

          <div>
            <label className="text-[var(--color-text-secondary)] block mb-1">
              کف تعهد بارگیری و دیسپاچینگ روزانه (تن):
            </label>
            <input
              type="number"
              value={formData.targetDailyDispatch}
              onChange={(e) => handleChange('targetDailyDispatch', Number(e.target.value))}
              className="enms-input w-full font-mono"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
              بودجه تحویل روزانه بارگیرخانه به بازار (پیش‌فرض: ۱,۰۰۰ تن در روز)
            </span>
          </div>

          <div>
            <label className="text-[var(--color-text-secondary)] block mb-1">
              حداقل موجودی اطمینان دپوی کلینکر (تن):
            </label>
            <input
              type="number"
              value={formData.minClinkerSafetyStock}
              onChange={(e) => handleChange('minClinkerSafetyStock', Number(e.target.value))}
              className="enms-input w-full font-mono"
            />
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">
              بافر ایمنی انبار کلینکر جهت پایداری تولید سیمان در توقفات کوره (پیش‌فرض: ۴۰,۰۰۰ تن)
            </span>
          </div>
        </div>

        {/* دکمه‌های کنترل پایین فرم */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <button
            onClick={handleReset}
            className="enms-button enms-button-secondary flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>

          <button
            onClick={handleSave}
            className="enms-button enms-button-primary flex items-center gap-1.5 text-xs font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>ذخیره و اعمال اهداف</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TargetsSettingsModal;