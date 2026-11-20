import React, { useState, useEffect } from 'react';
import { GitFork, Save } from 'lucide-react';
import { CrudModal } from '../../../components/CrudModal';
import { CascadedTargetItem, EnergyProjectItem } from '../../../../../types';

interface BscStrategyOption {
  code: string;
  title: string;
  perspective: string;
}

interface DynamicDeptOption {
  id: string;
  name: string;
  seus: string[];
}

interface TargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (target: CascadedTargetItem) => void;
  initialData?: CascadedTargetItem | null;
  existingCount: number;
  availableProjects: EnergyProjectItem[];
  defaultStrategicCode?: string;
}

export const TargetModal: React.FC<TargetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCount,
  availableProjects,
  defaultStrategicCode,
}) => {
  const isEdit = Boolean(initialData);

  const [bscStrategies, setBscStrategies] = useState<BscStrategyOption[]>([]);
  const [departments, setDepartments] = useState<DynamicDeptOption[]>([]);

  const [form, setForm] = useState<CascadedTargetItem>({
    id: `TGT-2026-EN-0${existingCount + 1}`,
    strategicCode: defaultStrategicCode || '',
    department: '',
    targetSeu: '',
    kpiTitle: '',
    baselineValue: 100,
    baselineUnit: 'kcal/kg Clinker',
    targetValue: 95,
    targetUnit: 'kcal/kg Clinker',
    expectedSavingPct: 5.0,
    deadline: '۱۴۰۵/۱۲/۲۹',
    responsible: 'مدیر تولید و مهندسی فرآیند',
    linkedProjectIds: [],
  });

  // ۱. دریافت پویا و بدون هاردکد استراتژی‌های BSC از فایل داده بافت سازمان
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const fetchBsc = async () => {
      try {
        const res = await fetch('/data/02-organization-context/strategies-bsc.json');
        if (!res.ok) return;
        const text = await res.text();
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) return;
        const data = JSON.parse(text);
        if (isMounted && data && Array.isArray(data.strategies)) {
          const mapped: BscStrategyOption[] = data.strategies.map((s: any) => ({
            code: s.code || s.strategyCode,
            title: s.title || s.strategyTitle,
            perspective: s.perspective || 'فرآیندهای داخلی',
          }));
          setBscStrategies(mapped);
          if (!initialData && mapped.length > 0 && !defaultStrategicCode) {
            setForm((prev) => ({ ...prev, strategicCode: mapped[0].code }));
          }
        }
      } catch {
        // Fallback or ignore rate limit
      }
    };

    const fetchBoundaries = async () => {
      try {
        const res = await fetch('/data/02-organization-context/boundary-matrix.json');
        if (!res.ok) return;
        const text = await res.text();
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) return;
        const data = JSON.parse(text);
        if (isMounted && data && (Array.isArray(data.processBoundaries) || Array.isArray(data.boundaries))) {
          const list = data.processBoundaries || data.boundaries;
          const depts: DynamicDeptOption[] = list.map((b: any) => ({
            id: b.id || b.department,
            name: b.department,
            seus: Array.isArray(b.keyEquipment)
              ? b.keyEquipment
              : typeof b.equipment === 'string'
              ? b.equipment.split('،').map((x: string) => x.trim())
              : [b.keyEquipment || ''],
          }));
          setDepartments(depts);
          if (!initialData && depts.length > 0) {
            setForm((prev) => ({
              ...prev,
              department: depts[0].name,
              targetSeu: depts[0].seus[0] || '',
            }));
          }
        }
      } catch {
        // Fallback or ignore rate limit
      }
    };

    fetchBsc();
    fetchBoundaries();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    } else {
      setForm({
        id: `TGT-2026-EN-0${existingCount + 1}`,
        strategicCode: defaultStrategicCode || (bscStrategies[0]?.code ?? ''),
        department: departments[0]?.name ?? '',
        targetSeu: departments[0]?.seus[0] ?? '',
        kpiTitle: '',
        baselineValue: 100,
        baselineUnit: 'kcal/kg Clinker',
        targetValue: 95,
        targetUnit: 'kcal/kg Clinker',
        expectedSavingPct: 5.0,
        deadline: '۱۴۰۵/۱۲/۲۹',
        responsible: 'مدیر تولید و مهندسی فرآیند',
        linkedProjectIds: [],
      });
    }
  }, [initialData, existingCount, isOpen, defaultStrategicCode]);

  const handleValueChange = (field: 'baselineValue' | 'targetValue', val: number) => {
    const updated = { ...form, [field]: val };
    const b = field === 'baselineValue' ? val : form.baselineValue;
    const t = field === 'targetValue' ? val : form.targetValue;

    if (b > 0) {
      updated.expectedSavingPct = Number((((b - t) / b) * 100).toFixed(1));
    }
    setForm(updated);
  };

  const toggleProject = (projectId: string) => {
    const exists = form.linkedProjectIds.includes(projectId);
    if (exists) {
      setForm({
        ...form,
        linkedProjectIds: form.linkedProjectIds.filter((p) => p !== projectId),
      });
    } else {
      setForm({
        ...form,
        linkedProjectIds: [...form.linkedProjectIds, projectId],
      });
    }
  };

  const currentDeptObj = departments.find((d) => d.name === form.department);
  const availableSeus = currentDeptObj ? currentDeptObj.seus : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kpiTitle.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <CrudModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'ویرایش هدف کمّی خرد' : 'تعریف هدف کمّی جدید (شکست آبشاری اهداف کلان)'}
      subtitle="بند ۶.۲ استاندارد ISO 50001:2018 - پیوند مستقیم اهداف کلان راهبردی BSC با مقاصد کمّی SEUها"
      icon={<GitFork className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              کد شناسایی هدف خرد <span className="text-rose-500">*</span>
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
              هدف استراتژیک کلان مادر (پویا از فایل BSC) <span className="text-rose-500">*</span>
            </label>
            <select
              value={form.strategicCode}
              onChange={(e) => setForm({ ...form, strategicCode: e.target.value })}
              className="enms-select w-full"
            >
              {bscStrategies.map((s) => (
                <option key={s.code} value={s.code}>
                  [{s.code}] {s.title} ({s.perspective})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              دپارتمان مجری (پویا از بافت سازمان)
            </label>
            <select
              value={form.department}
              onChange={(e) => {
                const newDept = e.target.value;
                const dObj = departments.find((d) => d.name === newDept);
                setForm({
                  ...form,
                  department: newDept,
                  targetSeu: dObj && dObj.seus.length > 0 ? dObj.seus[0] : '',
                });
              }}
              className="enms-select w-full"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              تجهیز بارز (SEU) هدف <span className="text-rose-500">*</span>
            </label>
            {availableSeus.length > 0 ? (
              <select
                value={form.targetSeu}
                onChange={(e) => setForm({ ...form, targetSeu: e.target.value })}
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
                placeholder="نام تجهیز بارز هدف"
                value={form.targetSeu}
                onChange={(e) => setForm({ ...form, targetSeu: e.target.value })}
                className="enms-input w-full"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
            عنوان شاخص عملکردی (EnPI) و هدف کمّی خرد <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="مانند: کاهش مصرف ویژه حرارتی پخت کلینکر (SEC Thermal)"
            value={form.kpiTitle}
            onChange={(e) => setForm({ ...form, kpiTitle: e.target.value })}
            className="enms-input w-full font-semibold"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              مقدار مبنا (Baseline)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                value={form.baselineValue}
                onChange={(e) => handleValueChange('baselineValue', Number(e.target.value))}
                className="enms-input w-full font-mono text-center font-bold"
              />
              <input
                type="text"
                placeholder="واحد"
                value={form.baselineUnit}
                onChange={(e) => setForm({ ...form, baselineUnit: e.target.value, targetUnit: e.target.value })}
                className="enms-input w-28 text-center font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              مقدار هدف (Target)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                value={form.targetValue}
                onChange={(e) => handleValueChange('targetValue', Number(e.target.value))}
                className="enms-input w-full font-mono text-center text-emerald-600 dark:text-emerald-400 font-bold"
              />
              <span className="text-[11px] text-[var(--color-text-muted)] font-mono px-1">
                {form.targetUnit}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              درصد بهبود مورد انتظار
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={form.expectedSavingPct}
                onChange={(e) => setForm({ ...form, expectedSavingPct: Number(e.target.value) })}
                className="enms-input w-full font-mono text-center text-cyan-600 dark:text-cyan-400 font-bold"
              />
              <span className="text-xs font-bold text-[var(--color-text-secondary)]">%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              مهلت زمانی دستیابی (سررسید)
            </label>
            <input
              type="text"
              placeholder="۱۴۰۵/۱۲/۲۹"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="enms-input w-full text-center font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--color-text-secondary)] font-medium mb-1">
              مسئول تحقق هدف
            </label>
            <input
              type="text"
              placeholder="مانند: مدیر تولید و رئیس خط پخت"
              value={form.responsible}
              onChange={(e) => setForm({ ...form, responsible: e.target.value })}
              className="enms-input w-full"
            />
          </div>
        </div>

        {/* انتخاب چندین پروژه برای یک هدف خرد */}
        <div>
          <label className="block text-[var(--color-text-secondary)] font-medium mb-1.5">
            پروژه‌های اقدام و برنامه‌های عملیاتی پشتیبان این هدف:
          </label>
          <div className="p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border)] max-h-40 overflow-y-auto flex flex-col gap-2">
            {availableProjects.length === 0 ? (
              <span className="text-xs text-[var(--color-text-muted)]">هیچ پروژه‌ای تعریف نشده است.</span>
            ) : (
              availableProjects.map((p) => {
                const isSelected = form.linkedProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 cursor-pointer text-xs p-1.5 rounded hover:bg-[var(--color-bg-card)] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProject(p.id)}
                      className="rounded text-[var(--color-primary)] focus:ring-0"
                    />
                    <span className="font-mono font-bold text-[var(--color-primary)]">{p.id}</span>
                    <span className="text-[var(--color-text-secondary)] truncate">{p.title}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] mr-auto">({p.department})</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--color-border)] mt-2">
          <button type="button" onClick={onClose} className="enms-button enms-button-secondary text-xs">
            انصراف
          </button>
          <button type="submit" className="enms-button enms-button-primary text-xs flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            <span>{isEdit ? 'ذخیره تغییرات' : 'ثبت هدف کمّی خرد'}</span>
          </button>
        </div>
      </form>
    </CrudModal>
  );
};

export default TargetModal;