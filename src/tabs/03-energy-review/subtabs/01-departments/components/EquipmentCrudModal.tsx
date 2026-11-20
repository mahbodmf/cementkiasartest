import React, { useState, useEffect } from 'react';
import { Cpu, Save, X, Zap, Shield, Gauge } from 'lucide-react';
import { CrudModal } from '../../../components/CrudModal';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface EquipmentCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipmentData: any) => void;
  initialData?: any | null;
  departmentName: string;
}

export const EquipmentCrudModal: React.FC<EquipmentCrudModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  departmentName,
}) => {
  const isEdit = Boolean(initialData);

  const [form, setForm] = useState({
    tag: '',
    name: '',
    type: 'تجهیز فرآیندی',
    energyType: 'الکتریکی (برق)',
    powerKw: 100,
    voltage: '400 V',
    capacity: '-',
    criticality: 'عادی',
    isSeu: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        tag: initialData.tag || '',
        name: initialData.name || '',
        type: initialData.type || 'تجهیز فرآیندی',
        energyType: initialData.energyType || 'الکتریکی (برق)',
        powerKw: initialData.powerKw || 0,
        voltage: initialData.voltage || '400 V',
        capacity: initialData.capacity || '-',
        criticality: initialData.criticality || 'عادی',
        isSeu: Boolean(initialData.isSeu),
      });
    } else {
      setForm({
        tag: '',
        name: '',
        type: 'تجهیز فرآیندی',
        energyType: 'الکتریکی (برق)',
        powerKw: 100,
        voltage: '400 V',
        capacity: '-',
        criticality: 'عادی',
        isSeu: false,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.tag.trim()) return;

    onSave({
      ...form,
      powerKw: Number(form.powerKw) || 0,
    });
    onClose();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `ویرایش شناسنامه تجهیز: ${form.name}` : `افزودن تجهیز جدید به ${departmentName}`}
      subtitle="شناسنامه فنی، وضعیت مصرف بارز (SEU) و سطح ولتاژ و توان بر اساس استاندارد ISO 50001"
      icon={<Cpu className="w-5 h-5 text-amber-500" />}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs" dir="rtl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              تگ استاندارد تجهیز (Tag) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              placeholder="مثال: 111.HC.030"
              className="enms-input w-full font-mono text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              نام رسمی تجهیز <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: الکتروموتور آسیاب یا فن مکنده..."
              className="enms-input w-full font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">دسته‌بندی مکانیزم</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="enms-select w-full"
            >
              <option value="تجهیز فرآیندی">تجهیز فرآیندی</option>
              <option value="ترابری مواد">ترابری مواد</option>
              <option value="فن اصلی فرآیند">فن اصلی فرآیند</option>
              <option value="سایش و پودرسازی">سایش و پودرسازی</option>
              <option value="سیستم احتراق حرارتی">سیستم احتراق حرارتی</option>
              <option value="تاسیسات و یوتیلیتی">تاسیسات و یوتیلیتی</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">نوع حامل انرژی مصرفی</label>
            <select
              value={form.energyType}
              onChange={(e) => setForm({ ...form, energyType: e.target.value })}
              className="enms-select w-full"
            >
              <option value="الکتریکی (برق)">الکتریکی (برق)</option>
              <option value="حرارتی (گاز طبیعی)">حرارتی (گاز طبیعی)</option>
              <option value="حرارتی (سوخت مازوت)">حرارتی (سوخت مازوت)</option>
              <option value="سوخت جایگزین (RDF)">سوخت جایگزین (RDF)</option>
              <option value="گازوئیل دیزل">گازوئیل دیزل</option>
              <option value="هوای فشرده">هوای فشرده</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">درجه بحرانیت تجهیز</label>
            <select
              value={form.criticality}
              onChange={(e) => setForm({ ...form, criticality: e.target.value })}
              className="enms-select w-full"
            >
              <option value="عادی">عادی</option>
              <option value="بحرانی">بحرانی</option>
              <option value="فوق بحرانی">فوق بحرانی</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">توان نامی (kW)</label>
            <input
              type="number"
              value={form.powerKw}
              onChange={(e) => setForm({ ...form, powerKw: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold text-amber-500"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">سطح ولتاژ کاری</label>
            <input
              type="text"
              value={form.voltage}
              onChange={(e) => setForm({ ...form, voltage: e.target.value })}
              placeholder="مثال: 400 V یا 6.3 kV"
              className="enms-input w-full font-mono text-center"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">ظرفیت فرآیندی نامی</label>
            <input
              type="text"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              placeholder="مثال: 650 t/h یا -"
              className="enms-input w-full text-center"
            />
          </div>
        </div>

        {/* وضعیت بارز بودن انرژی (SEU Flag) */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <div>
            <span className="font-bold text-[var(--color-text-primary)] block">
              وضعیت مصرف بارز انرژی (SEU)
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
              آیا این تجهیز سهم قابل توجهی در مصرف دپارتمان دارد یا پتانسیل بالایی برای بهبود انرژی ارائه می‌دهد؟
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.isSeu}
              onChange={(e) => setForm({ ...form, isSeu: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--color-border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
          <button type="button" onClick={onClose} className="enms-button enms-button-secondary text-xs">
            انصراف
          </button>
          <button type="submit" className="enms-button enms-button-primary text-xs flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'ذخیره مشخصات تجهیز' : 'ثبت تجهیز در سیستم'}</span>
          </button>
        </div>
      </form>
    </CrudModal>
  );
};

export default EquipmentCrudModal;