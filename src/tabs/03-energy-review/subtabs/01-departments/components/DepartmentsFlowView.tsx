import React, { useState, useEffect } from 'react';
import {
  Factory,
  Cpu,
  Zap,
  Flame,
  Wind,
  Plus,
  Pencil,
  Copy,
  ArrowDownRight,
  Sparkles,
  Fuel,
  Radio,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { DepartmentCrudModal } from './DepartmentCrudModal';
import { EquipmentVariablesPanel } from './EquipmentVariablesPanel';

interface DepartmentsFlowViewProps {
  flowData: any;
  periodMultiplier: number;
  timeHorizon: string;
  activeFlowDeptId: string;
  onSelectDept: (id: string) => void;
  onUpdateDepartments?: (updatedFlows: any[]) => void;
  onNavigateToVariablesTab?: () => void;
}

export const DepartmentsFlowView: React.FC<DepartmentsFlowViewProps> = ({
  flowData,
  periodMultiplier,
  timeHorizon,
  activeFlowDeptId,
  onSelectDept,
  onUpdateDepartments,
  onNavigateToVariablesTab,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);
  const [selectedEquipmentTag, setSelectedEquipmentTag] = useState<string>('');

  const departments: any[] = flowData?.departmentFlows || [];
  const activeFlowDept = departments.find((d) => d.id === activeFlowDeptId) || departments[0];

  // به محض تغییر دپارتمان یا لود اولیه، اولین تجهیز فعال و انتخاب می‌شود
  useEffect(() => {
    if (activeFlowDept?.keyEquipments && activeFlowDept.keyEquipments.length > 0) {
      setSelectedEquipmentTag(activeFlowDept.keyEquipments[0].tag);
    } else {
      setSelectedEquipmentTag('');
    }
  }, [activeFlowDeptId, activeFlowDept]);

  if (!flowData || !flowData.departmentFlows) return null;

  const handleOpenAdd = () => {
    setEditingDept(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleDuplicate = (dept: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated = {
      ...dept,
      id: `${dept.id}_copy_${Date.now()}`,
      name: `${dept.name} (خط ۲ / موازی)`,
      code: `${dept.code}-B`,
    };
    if (onUpdateDepartments) {
      onUpdateDepartments([...departments, duplicated]);
    }
  };

  const handleSaveDepartment = (deptData: any) => {
    if (!onUpdateDepartments) return;
    if (editingDept) {
      const updated = departments.map((d) => (d.id === deptData.id ? deptData : d));
      onUpdateDepartments(updated);
    } else {
      onUpdateDepartments([...departments, deptData]);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    if (!onUpdateDepartments) return;
    const filtered = departments.filter((d) => d.id !== id);
    onUpdateDepartments(filtered);
    if (activeFlowDeptId === id && filtered.length > 0) {
      onSelectDept(filtered[0].id);
    }
  };

  const currentSelectedEquipment = activeFlowDept?.keyEquipments?.find(
    (eq: any) => eq.tag === selectedEquipmentTag
  ) || activeFlowDept?.keyEquipments?.[0];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* سطح اول: کارت ورودی کل کارخانه */}
      <div className="enms-card relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  مرکز کل کارخانه سیمان کیاسر (سطح کلان سازمان)
                </h3>
                <span className="enms-badge badge-neutral text-[10px] font-mono">
                  {timeHorizon === 'current_month' ? 'دوره ۱ ماهه' : 'سال مالی کامل'}
                </span>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                مجموع انرژی هم‌ارز ورودی:{' '}
                <strong className="text-[var(--color-primary)] font-mono">
                  {toPersianDigits(
                    formatPersianNumber(
                      Math.round((flowData.plantTotalFlow?.totalEquivalentGj || 1885000) * periodMultiplier)
                    )
                  )}{' '}
                  GJ
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--color-text-muted)] text-[10px]">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>برق شبکه</span>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
                {toPersianDigits(
                  formatPersianNumber(
                    Math.round((flowData.plantTotalFlow?.electricityMwh || 65000) * periodMultiplier)
                  )
                )}{' '}
                <span className="text-[10px] text-[var(--color-text-muted)]">MWh</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--color-text-muted)] text-[10px]">
                <Flame className="w-3 h-3 text-[var(--color-primary)]" />
                <span>گاز طبیعی</span>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
                {toPersianDigits(
                  formatPersianNumber(
                    Math.round(((flowData.plantTotalFlow?.naturalGasNm3 || 48500000) * periodMultiplier) / 1000000),
                    1
                  )
                )}{' '}
                <span className="text-[10px] text-[var(--color-text-muted)]">M.Nm³</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--color-text-muted)] text-[10px]">
                <Flame className="w-3 h-3 text-rose-500" />
                <span>سوخت مازوت</span>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
                {toPersianDigits(
                  formatPersianNumber(
                    Math.round(((flowData.plantTotalFlow?.fuelOilLiter || 4200000) * periodMultiplier) / 1000)
                  )
                )}{' '}
                <span className="text-[10px] text-[var(--color-text-muted)]">k.Lit</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-center">
              <div className="flex items-center justify-center gap-1 text-[var(--color-text-muted)] text-[10px]">
                <Wind className="w-3 h-3 text-sky-500" />
                <span>هوای فشرده</span>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--color-text-primary)] mt-0.5">
                {toPersianDigits(
                  formatPersianNumber(
                    Math.round(((flowData.plantTotalFlow?.compressedAirNm3 || 18500000) * periodMultiplier) / 1000000),
                    1
                  )
                )}{' '}
                <span className="text-[10px] text-[var(--color-text-muted)]">M.Nm³</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-1.5 font-mono">
            <span>انشعاب و موازنه به {toPersianDigits(departments.length)} دپارتمان فرآیندی خطوط تولید</span>
            <ArrowDownRight className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <button
            onClick={handleOpenAdd}
            className="enms-button enms-button-primary !py-1 !px-3 text-xs flex items-center gap-1.5 shadow-sm self-end sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ تعریف واحد فرآیندی جدید</span>
          </button>
        </div>
      </div>

      {/* سطح دوم: کارت‌های دپارتمان‌های فرآیندی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {departments.map((dept) => {
          const isSelected = dept.id === activeFlowDeptId;
          const deptGj = Math.round((dept.energyShareGj || 1000) * periodMultiplier);
          const deptElec = Math.round((dept.electricityMwh || 0) * periodMultiplier);

          return (
            <div
              key={dept.id}
              onClick={() => onSelectDept(dept.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden select-none group ${
                isSelected
                  ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary-border)] shadow-md ring-1 ring-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
              }`}
            >
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${
                  (dept.energySharePct || 0) > 50
                    ? 'bg-rose-500'
                    : (dept.electricSharePct || 0) > 30
                    ? 'bg-emerald-500'
                    : 'bg-purple-600'
                }`}
              />

              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-[var(--color-text-primary)] truncate" title={dept.name}>
                    {dept.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(dept, e)}
                      className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-purple-600 dark:hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="ویرایش مشخصات واحد"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicate(dept, e)}
                      className="p-1 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="تکثیر این واحد"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="text-xs text-[var(--color-text-muted)] flex items-baseline justify-between">
                    <span>سهم کل انرژی:</span>
                    <strong className="text-[var(--color-primary)] font-mono font-bold text-sm">
                      {toPersianDigits(dept.energySharePct || 0)}٪
                    </strong>
                  </div>
                  <div className="text-[11px] font-mono text-[var(--color-text-secondary)] mt-0.5">
                    {toPersianDigits(formatPersianNumber(deptGj))} GJ
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" /> برق:
                    </span>
                    <span className="font-mono text-[var(--color-text-primary)]">
                      {toPersianDigits(formatPersianNumber(deptElec))} MWh
                    </span>
                  </div>

                  {dept.naturalGasNm3 > 0 && (
                    <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-cyan-500" /> گاز:
                      </span>
                      <span className="font-mono text-[var(--color-text-primary)]">
                        {toPersianDigits(
                          formatPersianNumber(Math.round((dept.naturalGasNm3 * periodMultiplier) / 1000))
                        )}{' '}
                        k.Nm³
                      </span>
                    </div>
                  )}

                  {dept.rdfTon > 0 && (
                    <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Sparkles className="w-3 h-3" /> RDF:
                      </span>
                      <span className="font-mono text-[var(--color-text-primary)]">
                        {toPersianDigits(formatPersianNumber(dept.rdfTon))} تن
                      </span>
                    </div>
                  )}

                  {dept.dieselLiter > 0 && (
                    <div className="flex items-center justify-between text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Fuel className="w-3 h-3" /> گازوئیل:
                      </span>
                      <span className="font-mono text-[var(--color-text-primary)]">
                        {toPersianDigits(formatPersianNumber(dept.dieselLiter))} لیتر
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px]">
                <span className="text-[var(--color-text-muted)]">تجهیزات پرمصرف</span>
                <span
                  className={`font-bold ${
                    isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
                  }`}
                >
                  {toPersianDigits(dept.keyEquipments?.length || 0)} تجهیز
                </span>
              </div>
            </div>
          );
        })}

        <div
          onClick={handleOpenAdd}
          className="p-3.5 rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 select-none group min-h-[160px]"
        >
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--color-text-primary)] block">افزودن دپارتمان</span>
            <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5 block">از کاتالوگ یا سفارشی</span>
          </div>
        </div>
      </div>

      {/* سطح سوم: تفکیک تجهیزات پرمصرف انرژی دپارتمان انتخاب‌شده */}
      {activeFlowDept && (
        <div className="enms-card p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    تجهیزات پر مصرف انرژی در: {activeFlowDept.name}
                  </h4>
                  <span className="enms-badge badge-warning text-[10px] font-mono">
                    {activeFlowDept.code}
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-muted)] mt-0.5 block">
                  حامل اصلی: {activeFlowDept.primaryCarrier} | با کلیک روی هر تجهیز، جدول متغیرهای آن جابجا می‌شود
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activeFlowDept.secThermalActual > 0 && (
                <span className="enms-badge badge-danger text-xs font-mono">
                  مبنای حرارتی: {toPersianDigits(activeFlowDept.secThermalActual)} kcal/kg
                </span>
              )}
              {activeFlowDept.secElectricActual > 0 && (
                <span className="enms-badge badge-neutral text-xs font-mono">
                  مبنای برق: {toPersianDigits(activeFlowDept.secElectricActual)} kWh/t
                </span>
              )}
            </div>
          </div>

          {/* کارت‌های تعاملی تجهیزات پرمصرف با چراغ فعال/غیرفعال صریح */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            {(!activeFlowDept.keyEquipments || activeFlowDept.keyEquipments.length === 0) ? (
              <div className="col-span-full p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
                هنوز هیچ تجهیز پرمصرفی برای این دپارتمان ثبت نشده است.
              </div>
            ) : (
              activeFlowDept.keyEquipments.map((eq: any, idx: number) => {
                const isEqSelected = selectedEquipmentTag === eq.tag;

                return (
                  <div
                    key={eq.tag || idx}
                    onClick={() => setSelectedEquipmentTag(eq.tag)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none relative ${
                      isEqSelected
                        ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-md'
                        : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                          {eq.tag}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {eq.shareOfDeptPct ? (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                              {toPersianDigits(eq.shareOfDeptPct)}٪ از دپارتمان
                            </span>
                          ) : null}
                          {/* نشانگر رادیویی فعال بودن */}
                          <span
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              isEqSelected
                                ? 'bg-emerald-500 ring-2 ring-emerald-500/40 animate-pulse'
                                : 'bg-[var(--color-border)]'
                            }`}
                            title={isEqSelected ? 'در حال نمایش متغیرها' : 'جهت نمایش متغیرها کلیک کنید'}
                          />
                        </div>
                      </div>
                      <h5 className="text-xs font-bold text-[var(--color-text-primary)] mt-2 line-clamp-1" title={eq.name}>
                        {eq.name}
                      </h5>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">توان نامی:</span>
                      <strong className="text-[var(--color-text-primary)] font-mono">
                        {toPersianDigits(eq.powerKw)} kW
                      </strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* پنل متغیرهای تاثیرگذار (همیشه باز است و با تغییر انتخاب تجهیز، بلافاصله به‌روز می‌شود) */}
          {currentSelectedEquipment && (
            <EquipmentVariablesPanel
              equipment={currentSelectedEquipment}
              departmentName={activeFlowDept.name}
              onNavigateToVariablesTab={onNavigateToVariablesTab}
            />
          )}
        </div>
      )}

      {/* مدال افزودن/ویرایش دپارتمان */}
      <DepartmentCrudModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDepartment}
        onDelete={handleDeleteDepartment}
        initialData={editingDept}
        existingCount={departments.length}
      />
    </div>
  );
};

export default DepartmentsFlowView;