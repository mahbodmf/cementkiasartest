import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Zap,
  Flame,
  Check,
  Power,
} from 'lucide-react';
import { DepartmentGroupWithEquipments } from '../../../../../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { EquipmentCrudModal } from './EquipmentCrudModal';

interface EquipmentInventorySectionProps {
  departmentsEquipment: DepartmentGroupWithEquipments[];
  isEditing?: boolean;
  onUpdateInventory?: (updatedGroups: DepartmentGroupWithEquipments[]) => void;
}

export const EquipmentInventorySection: React.FC<EquipmentInventorySectionProps> = ({
  departmentsEquipment: initialGroups = [],
  isEditing = false,
  onUpdateInventory,
}) => {
  const [groups, setGroups] = useState<DepartmentGroupWithEquipments[]>(initialGroups || []);

  // همگام‌سازی استیت با پراپس
  React.useEffect(() => {
    setGroups(initialGroups || []);
  }, [initialGroups]);

  // فیلترهای بالا
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [seuOnly, setSeuOnly] = useState(false);

  // استیت مدال تجهیز
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);

  // اطلاع‌رسانی به والد در صورت تغییر
  const updateGroupsState = (newGroups: DepartmentGroupWithEquipments[]) => {
    setGroups(newGroups);
    if (onUpdateInventory) {
      onUpdateInventory(newGroups);
    }
  };

  // ۱. تغییر وضعیت بارز / غیربارز بودن دپارتمان
  const handleToggleDeptSeu = (deptId: string) => {
    const updated = groups.map((g) => {
      if (g.id === deptId) {
        const isCurrentSeu = g.seuStatus.includes('بارز انرژی');
        return {
          ...g,
          seuStatus: isCurrentSeu ? 'دپارتمان غیر بارز' : 'دپارتمان بارز انرژی (SEU)',
        };
      }
      return g;
    });
    updateGroupsState(updated);
  };

  // ۲. تغییر وضعیت SEU یک تجهیز درون جدول
  const handleToggleEquipmentSeu = (deptId: string, eqTag: string) => {
    const updated = groups.map((g) => {
      if (g.id === deptId) {
        return {
          ...g,
          equipments: (g.equipments || []).map((eq) =>
            eq.tag === eqTag ? { ...eq, isSeu: !eq.isSeu } : eq
          ),
        };
      }
      return g;
    });
    updateGroupsState(updated);
  };

  // ۳. باز کردن مدال افزودن تجهیز به دپارتمان مشخص
  const handleOpenAddEquipment = (deptId: string) => {
    setTargetDeptId(deptId);
    setEditingEquipment(null);
    setIsModalOpen(true);
  };

  // ۴. باز کردن مدال ویرایش تجهیز
  const handleOpenEditEquipment = (deptId: string, eq: any) => {
    setTargetDeptId(deptId);
    setEditingEquipment(eq);
    setIsModalOpen(true);
  };

  // ۵. ذخیره تجهیز (ایجاد یا ویرایش)
  const handleSaveEquipment = (eqData: any) => {
    const updated = groups.map((g) => {
      if (g.id === targetDeptId) {
        let newEquipments = [...(g.equipments || [])];
        if (editingEquipment) {
          newEquipments = newEquipments.map((eq) =>
            eq.tag === editingEquipment.tag ? eqData : eq
          );
        } else {
          newEquipments.push(eqData);
        }

        // محاسبه مجدد توان الکتریکی نصب‌شده
        const totalPower = newEquipments.reduce(
          (sum, eq) => sum + (Number(eq.powerKw) || 0),
          0
        );

        return {
          ...g,
          installedPowerKw: totalPower,
          equipments: newEquipments,
        };
      }
      return g;
    });

    updateGroupsState(updated);
  };

  // ۶. حذف تجهیز
  const handleDeleteEquipment = (deptId: string, eqTag: string, eqName: string) => {
    if (!window.confirm(`آیا از حذف تجهیز «${eqName}» با تگ «${eqTag}» اطمینان دارید؟`)) {
      return;
    }

    const updated = groups.map((g) => {
      if (g.id === deptId) {
        const newEquipments = (g.equipments || []).filter((eq) => eq.tag !== eqTag);
        const totalPower = newEquipments.reduce(
          (sum, eq) => sum + (Number(eq.powerKw) || 0),
          0
        );
        return {
          ...g,
          installedPowerKw: totalPower,
          equipments: newEquipments,
        };
      }
      return g;
    });

    updateGroupsState(updated);
  };

  // اعمال فیلترهای جستجو بر روی تجهیزات
  const filteredGroups = useMemo(() => {
    return (groups || [])
      .filter((g) => deptFilter === 'all' || g.id === deptFilter)
      .map((g) => {
        const equipmentsList = g.equipments || [];
        const filteredEqs = equipmentsList.filter((eq) => {
          const matchSearch =
            searchQuery.trim() === '' ||
            eq.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            eq.tag?.toLowerCase().includes(searchQuery.toLowerCase());

          const matchCarrier =
            carrierFilter === 'all' ||
            (eq.energyType && eq.energyType.includes(carrierFilter));

          const matchSeu = !seuOnly || Boolean(eq.isSeu);

          return matchSearch && matchCarrier && matchSeu;
        });

        return {
          ...g,
          equipments: filteredEqs,
        };
      })
      .filter((g) => (g.equipments && g.equipments.length > 0) || searchQuery === '');
  }, [groups, deptFilter, carrierFilter, seuOnly, searchQuery]);

  const targetDeptName = groups.find((g) => g.id === targetDeptId)?.name || '';

  return (
    <div className="space-y-6 text-xs animate-fadeIn" dir="rtl">
      {/* هدر بخش و فیلترهای بالای جدول */}
      <div className="enms-card p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                سیاهه و شناسنامه تجهیزات دپارتمان‌ها
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                مشخصات توان الکتریکی، ظرفیت حرارتی مشعل‌ها، درجه بحرانیت و وضعیت مصرف بارز (SEU) مطابق استاندارد ISO 50001
              </p>
            </div>
          </div>
        </div>

        {/* فیلترهای هوشمند بالا */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی تگ یا نام تجهیز..."
              className="enms-input w-full pr-8 text-xs"
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="enms-select w-full text-xs"
            >
              <option value="all">همه دپارتمان‌ها</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="enms-select w-full text-xs"
            >
              <option value="all">همه حامل‌های انرژی</option>
              <option value="برق">الکتریکی (برق)</option>
              <option value="گاز">حرارتی (گاز طبیعی)</option>
              <option value="مازوت">سوخت مازوت</option>
              <option value="دیزل">گازوئیل دیزل</option>
            </select>
          </div>

          <div className="flex items-center justify-end px-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[var(--color-text-secondary)] font-medium">
              <input
                type="checkbox"
                checked={seuOnly}
                onChange={(e) => setSeuOnly(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--color-border)] text-emerald-500 focus:ring-0"
              />
              <span>فقط مصارف بارز (SEU)</span>
            </label>
          </div>
        </div>
      </div>

      {/* لیست گروه‌های دپارتمان‌ها و جداول تجهیزات */}
      {filteredGroups.map((dept) => {
        const isDeptSeu = dept.seuStatus.includes('بارز انرژی');

        return (
          <div key={dept.id} className="enms-card p-4 space-y-3">
            {/* سربرگ دپارتمان */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-bold text-[var(--color-text-primary)]">
                  {dept.name}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                  {dept.code}
                </span>

                {/* دکمه سوئیچ وضعیت بارز / غیربارز دپارتمان */}
                <button
                  onClick={() => handleToggleDeptSeu(dept.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
                    isDeptSeu
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title="جهت تغییر وضعیت بارز/غیربارز کلیک کنید"
                >
                  <Power className="w-3 h-3" />
                  <span>{dept.seuStatus}</span>
                </button>

                <span className="text-xs text-[var(--color-text-muted)]">
                  {dept.description}
                </span>
              </div>

              {/* متادیتا و دکمه افزودن تجهیز */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <span>
                    توان الکتریکی:{' '}
                    <strong className="text-[var(--color-text-primary)] font-mono font-bold">
                      {toPersianDigits(formatPersianNumber(dept.installedPowerKw || 0))} kW
                    </strong>
                  </span>

                  {dept.secBenchmark > 0 && (
                    <span>
                      بنچ‌مارک برق:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {toPersianDigits(dept.secBenchmark)} {dept.secUnit}
                      </strong>
                    </span>
                  )}

                  <span>
                    سهم برق:{' '}
                    <strong className="text-purple-600 dark:text-purple-400 font-mono">
                      {toPersianDigits(dept.sharePct)}٪
                    </strong>
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAddEquipment(dept.id)}
                  className="enms-button enms-button-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ افزودن تجهیز</span>
                </button>
              </div>
            </div>

            {/* جدول تجهیزات این دپارتمان */}
            <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                  <tr>
                    <th className="p-2.5 text-center">تگ تجهیز</th>
                    <th className="p-2.5">نام تجهیز</th>
                    <th className="p-2.5 text-center">دسته‌بندی مکانیزم</th>
                    <th className="p-2.5 text-center">نوع حامل و سوخت</th>
                    <th className="p-2.5 text-center">توان نامی / ظرفیت حرارتی</th>
                    <th className="p-2.5 text-center">سطح ولتاژ / دمای کاری</th>
                    <th className="p-2.5 text-center">ظرفیت فرآیندی</th>
                    <th className="p-2.5 text-center">درجه بحرانیت</th>
                    <th className="p-2.5 text-center">وضعیت SEU</th>
                    <th className="p-2.5 text-center w-16">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {dept.equipments.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-4 text-center text-[var(--color-text-muted)]">
                        هیچ تجهیزی برای این دپارتمان یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    dept.equipments.map((eq: any) => (
                      <tr
                        key={eq.tag}
                        className="hover:bg-[var(--color-bg-card-subtle)]/50 transition-colors"
                      >
                        <td className="p-2.5 font-mono text-center font-bold text-[var(--color-primary)]">
                          {eq.tag}
                        </td>
                        <td className="p-2.5 font-bold text-[var(--color-text-primary)]">
                          {eq.name}
                        </td>
                        <td className="p-2.5 text-center text-[var(--color-text-muted)]">
                          {eq.type || 'تجهیز فرآیندی'}
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            {eq.energyType || 'الکتریکی (برق)'}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-center font-bold text-[var(--color-text-primary)]">
                          {toPersianDigits(formatPersianNumber(eq.powerKw))} kW
                        </td>
                        <td className="p-2.5 font-mono text-center text-[var(--color-text-muted)]">
                          {eq.voltage || '400 V'}
                        </td>
                        <td className="p-2.5 text-center text-[var(--color-text-muted)] font-mono">
                          {eq.capacity || '-'}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              eq.criticality === 'فوق بحرانی'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                : eq.criticality === 'بحرانی'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                            }`}
                          >
                            {eq.criticality || 'عادی'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleToggleEquipmentSeu(dept.id, eq.tag)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                              eq.isSeu
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                            }`}
                            title="تغییر وضعیت مصرف بارز (SEU)"
                          >
                            {eq.isSeu ? 'بارز (SEU)' : 'غیر بارز'}
                          </button>
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditEquipment(dept.id, eq)}
                              className="p-1 rounded text-[var(--color-text-muted)] hover:text-purple-600 hover:bg-purple-500/10 transition-colors"
                              title="ویرایش تجهیز"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(dept.id, eq.tag, eq.name)}
                              className="p-1 rounded text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="حذف تجهیز"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* مدال افزودن و ویرایش تجهیز */}
      <EquipmentCrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEquipment}
        initialData={editingEquipment}
        departmentName={targetDeptName}
      />
    </div>
  );
};

export default EquipmentInventorySection;