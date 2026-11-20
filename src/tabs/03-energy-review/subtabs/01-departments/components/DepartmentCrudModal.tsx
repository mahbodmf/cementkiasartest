import React, { useState, useEffect } from 'react';
import { Factory, Save, Trash2, Cpu } from 'lucide-react';
import { CrudModal } from '../../../components/CrudModal';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface DepartmentCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (departmentData: any) => void;
  onDelete?: (id: string) => void;
  initialData?: any | null;
  existingCount: number;
}

export const DepartmentCrudModal: React.FC<DepartmentCrudModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  existingCount,
}) => {
  const isEdit = Boolean(initialData);
  const [catalog, setCatalog] = useState<any[]>([]);

  const [form, setForm] = useState({
    id: `dept_${existingCount + 1}`,
    name: 'واحد فرآیندی جدید',
    code: `Dept ${(existingCount + 1) * 100}`,
    category: 'فرآیندی',
    nominalCapacity: '',
    operatingHoursPerYear: 5000,
    installedElectricalPowerKw: 1000,
    installedThermalGjH: 0,
    energySharePct: 1.0,
    electricityMwh: 1000,
    electricSharePct: 2.0,
    naturalGasNm3: 0,
    fuelOilLiter: 0,
    rdfTon: 0,
    dieselLiter: 0,
    compressedAirPct: 5.0,
    secElectricActual: 10.0,
    secThermalActual: 0,
    primaryCarrier: 'برق و سوخت حرارتی',
    lineId: 'line1',
    status: 'در مدار تولید',
    feeders: [] as string[],
    keyEquipments: [] as any[],
  });

  // ۱. بارگذاری پویای کاتالوگ جامع استاندارد صنعت سیمان
  useEffect(() => {
    if (!isOpen) return;

    fetch('/data/03-energy-review/cement-departments-catalog.json')
      .then((res) => {
        if (!res.ok) throw new Error('عدم دسترسی به cement-departments-catalog.json');
        return res.text();
      })
      .then((text) => {
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) return;
        const data = JSON.parse(text);
        if (data && Array.isArray(data.catalogDepartments)) {
          setCatalog(data.catalogDepartments);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // ۲. همگام‌سازی استیت فرم با داده‌های ورودی
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        nominalCapacity: initialData.nominalCapacity || '',
        operatingHoursPerYear: initialData.operatingHoursPerYear || 5000,
        installedElectricalPowerKw: initialData.installedElectricalPowerKw || 0,
        installedThermalGjH: initialData.installedThermalGjH || 0,
        rdfTon: initialData.rdfTon || 0,
        dieselLiter: initialData.dieselLiter || 0,
        status: initialData.status || 'در مدار تولید',
        feeders: Array.isArray(initialData.feeders) ? initialData.feeders : [],
        keyEquipments: Array.isArray(initialData.keyEquipments) ? initialData.keyEquipments : [],
      });
    } else {
      setForm({
        id: `dept_${Date.now()}`,
        name: 'واحد فرآیندی جدید',
        code: `Dept ${(existingCount + 1) * 100}`,
        category: 'فرآیندی',
        nominalCapacity: '',
        operatingHoursPerYear: 5000,
        installedElectricalPowerKw: 1000,
        installedThermalGjH: 0,
        energySharePct: 1.0,
        electricityMwh: 1000,
        electricSharePct: 2.0,
        naturalGasNm3: 0,
        fuelOilLiter: 0,
        rdfTon: 0,
        dieselLiter: 0,
        compressedAirPct: 5.0,
        secElectricActual: 10.0,
        secThermalActual: 0,
        primaryCarrier: 'برق و سوخت حرارتی',
        lineId: 'line1',
        status: 'در مدار تولید',
        feeders: [],
        keyEquipments: [],
      });
    }
  }, [initialData, existingCount, isOpen]);

  // ۳. انتخاب سریع از کاتالوگ و پر کردن خودکار کلیه مشخصات مهندسی و تجهیزات
  const handleSelectCatalogPreset = (preset: any) => {
    setForm((prev) => ({
      ...prev,
      name: preset.defaultName,
      code: preset.code,
      category: preset.category || 'فرآیندی',
      primaryCarrier: preset.primaryCarrier || prev.primaryCarrier,
      nominalCapacity: preset.nominalCapacity || '',
      operatingHoursPerYear: preset.operatingHoursPerYear || 5000,
      installedElectricalPowerKw: preset.installedElectricalPowerKw || 0,
      installedThermalGjH: preset.installedThermalGjH || 0,
      secElectricActual: preset.secUnit?.includes('kWh') ? preset.defaultSecBenchmark : prev.secElectricActual,
      secThermalActual: preset.secUnit?.includes('kcal') ? preset.defaultSecBenchmark : prev.secThermalActual,
      feeders: preset.feeders || [],
      keyEquipments: preset.typicalEquipments || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // محاسبه انرژی معادل کل بر حسب گیگاژول (GJ)
    const totalGj = Math.round(
      (form.electricityMwh * 3.6) +
      (form.naturalGasNm3 * 0.035) +
      (form.fuelOilLiter * 0.040) +
      (form.rdfTon * 18.5) +
      (form.dieselLiter * 0.038)
    );

    onSave({
      ...form,
      energyShareGj: totalGj,
      keyEquipments: form.keyEquipments,
    });
    onClose();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `ویرایش مشخصات فنی واحد: ${form.name}` : 'تعریف / تکثیر واحد فرآیندی کارخانه'}
      subtitle="پیکربندی دپارتمان‌های فرآیندی، حامل‌های مصرفی و تجهیزات بارز (استاندارد ISO 50001)"
      icon={<Factory className="w-5 h-5 text-emerald-500" />}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs" dir="rtl">
        {/* انتخاب سریع از کاتالوگ استاندارد صنعت سیمان */}
        {!isEdit && catalog.length > 0 && (
          <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] space-y-1.5">
            <span className="font-bold text-[var(--color-text-secondary)] block">
              انتخاب سریع از کتابخانه دپارتمان‌های صنعت سیمان ایران:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap max-h-28 overflow-y-auto pt-1">
              {catalog.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelectCatalogPreset(item)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-surface)] hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-[var(--color-border-subtle)] text-[11px] font-medium transition-colors"
                >
                  {item.defaultName} ({item.code})
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              نام رسمی واحد فرآیندی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مانند: پخت خط ۲ یا آسیای سیمان ۳"
              className="enms-input w-full font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              کد شناسایی دپارتمان <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="مانند: Dept 400"
              className="enms-input w-full font-mono text-left"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              خط تولید و وضعیت عملیاتی
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.lineId}
                onChange={(e) => setForm({ ...form, lineId: e.target.value })}
                className="enms-select w-full"
              >
                <option value="line1">خط ۱ تولید</option>
                <option value="line2">خط ۲ تولید</option>
                <option value="common">مشترک / عمومی</option>
              </select>

              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="enms-select w-full"
              >
                <option value="در مدار تولید">در مدار</option>
                <option value="اورهال / توقف">اورهال</option>
                <option value="رزرو گرم">رزرو گرم</option>
              </select>
            </div>
          </div>
        </div>

        {/* مشخصات مهندسی و ساعات کارکرد */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              ظرفیت فرآیندی نامی
            </label>
            <input
              type="text"
              value={form.nominalCapacity}
              onChange={(e) => setForm({ ...form, nominalCapacity: e.target.value })}
              placeholder="مثال: ۱۸۰ تن در ساعت یا ۲۰۰۰ tpd"
              className="enms-input w-full"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              ساعات کارکرد سالانه (h/year)
            </label>
            <input
              type="number"
              value={form.operatingHoursPerYear}
              onChange={(e) => setForm({ ...form, operatingHoursPerYear: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              توان الکتریکی نصب‌شده (kW)
            </label>
            <input
              type="number"
              value={form.installedElectricalPowerKw}
              onChange={(e) => setForm({ ...form, installedElectricalPowerKw: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center font-bold text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>

        {/* حامل‌های انرژی این واحد */}
        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] space-y-3">
          <span className="font-bold text-[var(--color-text-primary)] block">
            تخصیص و موازنه حامل‌های انرژی مصرفی این واحد:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                برق سالانه (MWh):
              </label>
              <input
                type="number"
                value={form.electricityMwh}
                onChange={(e) => setForm({ ...form, electricityMwh: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-emerald-600 dark:text-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                گاز طبیعی (Nm³):
              </label>
              <input
                type="number"
                value={form.naturalGasNm3}
                onChange={(e) => setForm({ ...form, naturalGasNm3: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-cyan-600 dark:text-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                مازوت حرارتی (لیتر):
              </label>
              <input
                type="number"
                value={form.fuelOilLiter}
                onChange={(e) => setForm({ ...form, fuelOilLiter: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                سوخت جایگزین RDF (تن):
              </label>
              <input
                type="number"
                value={form.rdfTon}
                onChange={(e) => setForm({ ...form, rdfTon: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-purple-600 dark:text-purple-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                گازوئیل دیزل (لیتر):
              </label>
              <input
                type="number"
                value={form.dieselLiter}
                onChange={(e) => setForm({ ...form, dieselLiter: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[var(--color-text-muted)] mb-1">
                سهم هوای فشرده (%):
              </label>
              <input
                type="number"
                step="0.1"
                value={form.compressedAirPct}
                onChange={(e) => setForm({ ...form, compressedAirPct: Number(e.target.value) })}
                className="enms-input w-full font-mono font-bold text-center text-sky-500"
              />
            </div>
          </div>
        </div>

        {/* بنچ‌مارک‌های شاخص عملکرد انرژی (EnPI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              شاخص ویژه برق واقعی (SEC kWh/ton)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.secElectricActual}
              onChange={(e) => setForm({ ...form, secElectricActual: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center"
            />
          </div>

          <div>
            <label className="block font-medium text-[var(--color-text-secondary)] mb-1">
              شاخص ویژه حرارت (SEC kcal/kg کلینکر)
            </label>
            <input
              type="number"
              step="0.1"
              value={form.secThermalActual}
              onChange={(e) => setForm({ ...form, secThermalActual: Number(e.target.value) })}
              className="enms-input w-full font-mono text-center text-rose-500"
            />
          </div>
        </div>

        {/* نمایش تعداد تجهیزات متصل */}
        {form.keyEquipments.length > 0 && (
          <div className="p-2.5 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>تعداد تجهیزات بارز تخصیص‌یافته به این واحد:</span>
            </span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(form.keyEquipments.length)} تجهیز
            </strong>
          </div>
        )}

        {/* دکمه‌های اقدام */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] mt-2">
          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`آیا از حذف دپارتمان "${form.name}" از ترازنامه اطمینان دارید؟`)) {
                  onDelete(form.id);
                  onClose();
                }
              }}
              className="text-rose-500 hover:text-rose-600 text-xs flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف این واحد</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="enms-button enms-button-secondary text-xs">
              انصراف
            </button>
            <button type="submit" className="enms-button enms-button-primary text-xs flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>{isEdit ? 'ذخیره تغییرات واحد' : 'ثبت دپارتمان جدید'}</span>
            </button>
          </div>
        </div>
      </form>
    </CrudModal>
  );
};

export default DepartmentCrudModal;