import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Scale,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { OrganizationLegalRequirement } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface LegalViewProps {
  requirements?: OrganizationLegalRequirement[];
  onChange?: (updated: OrganizationLegalRequirement[]) => void;
  isEditing?: boolean;
}

export const LegalView: React.FC<LegalViewProps> = ({ requirements = [], onChange, isEditing = false }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('همه');
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');

  const safeRequirements = useMemo(() => Array.isArray(requirements) ? requirements : [], [requirements]);

  // استخراج دسته‌بندی‌های منحصربه‌فرد
  const categories = useMemo(() => {
    return ['همه', ...Array.from(new Set(safeRequirements.map((r) => r.category || 'عمومی')))];
  }, [safeRequirements]);

  // فیلتر کردن هوشمند
  const filteredRequirements = useMemo(() => {
    return safeRequirements.filter((item) => {
      const matchStatus = selectedStatus === 'همه' || item.complianceStatus?.includes(selectedStatus);
      const matchCategory = selectedCategory === 'همه' || item.category === selectedCategory;
      const matchSearch =
        !searchTerm ||
        item.reference?.includes(searchTerm) ||
        item.scopeDescription?.includes(searchTerm) ||
        item.responsible?.includes(searchTerm) ||
        item.preventiveAction?.includes(searchTerm) ||
        item.nonComplianceRisk?.includes(searchTerm);
      return matchStatus && matchCategory && matchSearch;
    });
  }, [safeRequirements, selectedStatus, selectedCategory, searchTerm]);

  // آمار کلیدی
  const totalCount = safeRequirements.length;
  const nonCompliantCount = safeRequirements.filter((r) => r.complianceStatus === 'عدم انطباق').length;
  const compliantCount = safeRequirements.filter((r) => r.complianceStatus?.includes('منطبق')).length;
  const highRiskCount = safeRequirements.filter((r) => (r.rpn || 0) >= 15).length;

  const handleFieldChange = (targetRow: number, field: keyof OrganizationLegalRequirement, val: any) => {
    const updated = safeRequirements.map((item, idx) => {
      const currentRow = item.row || idx + 1;
      if (currentRow !== targetRow) return item;

      const newItem = { ...item, [field]: val };

      // محاسبه خودکار و آنی RPN
      if (field === 'severity' || field === 'probability') {
        const s = field === 'severity' ? Number(val) : newItem.severity || 1;
        const o = field === 'probability' ? Number(val) : newItem.probability || 1;
        newItem.rpn = s * o;
      }

      return newItem;
    });

    onChange?.(updated);
  };

  const handleAdd = () => {
    const maxRow = safeRequirements.reduce((max, r, idx) => Math.max(max, r.row || idx + 1), 0);
    const newReq: OrganizationLegalRequirement = {
      row: maxRow + 1,
      category: selectedCategory !== 'همه' ? selectedCategory : 'استاندارد اجباری انرژی',
      reference: 'عنوان سند قانونی / بخشنامه جدید',
      sourceLink: '',
      scopeDescription: 'شرح کاربردپذیری در سیمان کیاسر را وارد کنید...',
      complianceStatus: 'در حال پیاده‌سازی',
      evidences: 'شواهد و مستندات انطباق...',
      responsible: 'مدیر انرژی',
      monitoringFrequency: 'ماهانه',
      nonComplianceRisk: 'پیامد و ریسک ناشی از عدم اجرا...',
      severity: 3,
      probability: 2,
      rpn: 6,
      actionThreshold: 'آستانه اقدام کنترلی...',
      preventiveAction: 'اقدامات پیشگیرانه / کنترلی...',
    };

    onChange?.([...safeRequirements, newReq]);
  };

  const handleDelete = (targetRow: number) => {
    const updated = safeRequirements
      .filter((item, idx) => (item.row || idx + 1) !== targetRow)
      .map((item, idx) => ({ ...item, row: idx + 1 }));
    onChange?.(updated);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return 'enms-badge badge-neutral';
    if (status === 'عدم انطباق') {
      return 'enms-badge badge-danger';
    }
    if (status.includes('منطبق')) {
      return 'enms-badge badge-success';
    }
    if (status.includes('پیاده‌سازی')) {
      return 'enms-badge badge-info';
    }
    return 'enms-badge badge-warning';
  };

  const getRpnBadge = (rpn: number) => {
    if (rpn >= 20) {
      return 'enms-badge badge-danger font-bold';
    }
    if (rpn >= 12) {
      return 'enms-badge badge-warning font-bold';
    }
    return 'enms-badge badge-success';
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* سربرگ معرفی، آمار و کنترل‌ها */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="enms-logo-icon">
              <Scale className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بندهای ۴.۲، ۴.۴ و ۹.۱.۲ استاندارد ISO 50001:2018</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">Legal & Other Requirements Register</span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                ماتریس ارزیابی انطباق الزامات قانونی، مقرراتی و استانداردهای اجباری انرژی
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-2.5" />
              <input
                type="text"
                className="enms-input text-xs w-full pr-9 pl-3 py-1.5"
                placeholder="جستجو در قوانین، مسئولین و اقدامات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* دکمه افزودن */}
            <button
              onClick={handleAdd}
              className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm shrink-0"
              title="افزودن سطر الزام قانونی جدید"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن الزام جدید</span>
            </button>
          </div>
        </div>

        {/* کارت‌های خلاصه وضعیت و ریسک‌های قانونی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">کل الزامات شناسایی‌شده</span>
                <div className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
                  {toPersianDigits(totalCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">قانون و استاندارد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-neutral text-[10px] font-mono">ISO 50001</span>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'عدم انطباق' ? 'همه' : 'عدم انطباق')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedStatus === 'عدم انطباق'
                ? 'bg-[var(--color-danger-bg)] border-rose-500'
                : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-danger-bg)] border border-[var(--color-border)] flex items-center justify-center text-rose-500">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">موارد عدم انطباق قطعی</span>
                <div className="text-xl font-bold font-mono text-rose-500">
                  {toPersianDigits(nonCompliantCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-danger text-[10px]">اولویت اصلاحی</span>
          </div>

          <div
            onClick={() => setSelectedStatus(selectedStatus === 'منطبق' ? 'همه' : 'منطبق')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedStatus === 'منطبق'
                ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary-border)]'
                : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">انطباق کامل یا نیازمند پایش</span>
                <div className="text-xl font-bold font-mono text-[var(--color-primary)]">
                  {toPersianDigits(compliantCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-success text-[10px]">وضعیت پایدار</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">ریسک‌های بحرانی (RPN ≥ ۱۵)</span>
                <div className="text-xl font-bold font-mono text-amber-500">
                  {toPersianDigits(highRiskCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">بند قانونی</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-warning text-[10px]">ماده ۱۶ و پیک‌سایی</span>
          </div>
        </div>

        {/* فیلترهای ماتریسی */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[var(--color-border)] flex-wrap text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[var(--color-text-muted)] shrink-0 font-medium ml-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> فیلتر حوزه:
            </span>
            <div className="enms-tab-pills">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`enms-tab-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-muted)] shrink-0">فیلتر وضعیت:</span>
            <select
              className="enms-select text-xs"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="همه">همه وضعیت‌ها</option>
              <option value="عدم انطباق">عدم انطباق</option>
              <option value="منطبق">منطبق</option>
              <option value="پیاده‌سازی">در حال پیاده‌سازی</option>
              <option value="بررسی">در دست بررسی</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول ماتریس جامع ارزیابی انطباق قانونی */}
      <div className="enms-card">
        <div className="enms-table-container">
          <table className="enms-table">
            <thead>
              <tr className="text-xs">
                <th className="text-center w-12 py-3">ردیف</th>
                <th className="text-right w-44 py-3">دسته الزام</th>
                <th className="text-right w-64 py-3">مرجع / سند قانونی</th>
                <th className="text-right min-w-[240px] py-3">شرح کاربردپذیری برای سیمان کیاسر</th>
                <th className="text-center w-36 py-3">وضعیت انطباق فعلی</th>
                <th className="text-right min-w-[180px] py-3">شواهد / مستندات</th>
                <th className="text-center w-36 py-3">مسئول اصلی</th>
                <th className="text-center w-28 py-3">تناوب پایش / بازنگری</th>
                <th className="text-right min-w-[200px] py-3">ریسک عدم اجرا (پیامد)</th>
                <th className="text-center w-14 py-3">شدت (S)</th>
                <th className="text-center w-14 py-3">احتمال (O)</th>
                <th className="text-center w-16 py-3">RPN</th>
                <th className="text-right min-w-[180px] py-3">آستانه اقدام</th>
                <th className="text-right min-w-[240px] py-3">اقدامات پیشگیرانه / کنترلی</th>
                {isEditing && <th className="text-center w-12 py-3">عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((item, idx) => {
                const targetRow = item.row || idx + 1;

                return (
                  <tr
                    key={targetRow}
                    className="text-xs"
                  >
                    {/* ردیف */}
                    <td className="text-center font-mono text-[var(--color-text-muted)] py-3">
                      {toPersianDigits(targetRow)}
                    </td>

                    {/* دسته الزام */}
                    <td className="py-3 font-semibold text-[var(--color-text-primary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={item.category}
                          onChange={(e) => handleFieldChange(targetRow, 'category', e.target.value)}
                        />
                      ) : (
                        item.category
                      )}
                    </td>

                    {/* مرجع / سند قانونی */}
                    <td className="py-3">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            className="enms-input text-xs font-bold"
                            value={item.reference}
                            onChange={(e) => handleFieldChange(targetRow, 'reference', e.target.value)}
                            placeholder="نام قانون یا بخشنامه"
                          />
                          <input
                            className="enms-input text-[11px] font-mono text-blue-500"
                            value={item.sourceLink || ''}
                            onChange={(e) => handleFieldChange(targetRow, 'sourceLink', e.target.value)}
                            placeholder="آدرس اینترنتی (URL)"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-[var(--color-text-primary)] block leading-relaxed">{item.reference}</span>
                          {item.sourceLink && (
                            <a
                              href={item.sourceLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 font-mono"
                            >
                              <span>مشاهده متن قانون</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </td>

                    {/* شرح کاربردپذیری */}
                    <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={item.scopeDescription}
                          onChange={(e) => handleFieldChange(targetRow, 'scopeDescription', e.target.value)}
                        />
                      ) : (
                        item.scopeDescription
                      )}
                    </td>

                    {/* وضعیت انطباق */}
                    <td className="text-center py-3">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs"
                          value={item.complianceStatus}
                          onChange={(e) => handleFieldChange(targetRow, 'complianceStatus', e.target.value)}
                        >
                          <option value="عدم انطباق">عدم انطباق</option>
                          <option value="منطبق">منطبق</option>
                          <option value="منطبق - نیازمند پایش">منطبق - نیازمند پایش</option>
                          <option value="در حال پیاده‌سازی">در حال پیاده‌سازی</option>
                          <option value="در دست بررسی (برای پروژه‌های جدید)">در دست بررسی</option>
                        </select>
                      ) : (
                        <span className={getStatusBadge(item.complianceStatus)}>
                          {item.complianceStatus}
                        </span>
                      )}
                    </td>

                    {/* شواهد و مستندات */}
                    <td className="py-3 text-[var(--color-text-secondary)]">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={item.evidences}
                          onChange={(e) => handleFieldChange(targetRow, 'evidences', e.target.value)}
                        />
                      ) : (
                        item.evidences
                      )}
                    </td>

                    {/* مسئول اصلی */}
                    <td className="text-center py-3 font-medium text-[var(--color-text-primary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs text-center w-full"
                          value={item.responsible}
                          onChange={(e) => handleFieldChange(targetRow, 'responsible', e.target.value)}
                        />
                      ) : (
                        <span className="enms-badge badge-neutral text-[11px]">
                          {item.responsible}
                        </span>
                      )}
                    </td>

                    {/* تناوب پایش */}
                    <td className="text-center py-3 font-mono text-[var(--color-text-muted)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs text-center w-full font-mono"
                          value={item.monitoringFrequency}
                          onChange={(e) => handleFieldChange(targetRow, 'monitoringFrequency', e.target.value)}
                        />
                      ) : (
                        item.monitoringFrequency
                      )}
                    </td>

                    {/* پیامد و ریسک */}
                    <td className="py-3 text-rose-500 leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea border-rose-500 text-xs text-rose-500 resize-none"
                          value={item.nonComplianceRisk}
                          onChange={(e) => handleFieldChange(targetRow, 'nonComplianceRisk', e.target.value)}
                        />
                      ) : (
                        item.nonComplianceRisk
                      )}
                    </td>

                    {/* شدت (S) */}
                    <td className="text-center py-3 font-mono">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs font-mono"
                          value={item.severity || 1}
                          onChange={(e) => handleFieldChange(targetRow, 'severity', Number(e.target.value))}
                        >
                          <option value={1}>۱</option>
                          <option value={2}>۲</option>
                          <option value={3}>۳</option>
                          <option value={4}>۴</option>
                          <option value={5}>۵</option>
                        </select>
                      ) : (
                        <span className="font-bold text-[var(--color-text-primary)]">{toPersianDigits(item.severity || 0)}</span>
                      )}
                    </td>

                    {/* احتمال (O) */}
                    <td className="text-center py-3 font-mono">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs font-mono"
                          value={item.probability || 1}
                          onChange={(e) => handleFieldChange(targetRow, 'probability', Number(e.target.value))}
                        >
                          <option value={1}>۱</option>
                          <option value={2}>۲</option>
                          <option value={3}>۳</option>
                          <option value={4}>۴</option>
                          <option value={5}>۵</option>
                        </select>
                      ) : (
                        <span className="font-bold text-[var(--color-text-primary)]">{toPersianDigits(item.probability || 0)}</span>
                      )}
                    </td>

                    {/* RPN با محاسبه لحظه‌ای */}
                    <td className="text-center py-3 font-mono">
                      <span className={getRpnBadge(item.rpn || 0)}>
                        {toPersianDigits(item.rpn || 0)}
                      </span>
                    </td>

                    {/* آستانه اقدام */}
                    <td className="py-3 text-amber-500 font-mono text-[11px]">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs resize-none font-mono"
                          value={item.actionThreshold}
                          onChange={(e) => handleFieldChange(targetRow, 'actionThreshold', e.target.value)}
                        />
                      ) : (
                        item.actionThreshold
                      )}
                    </td>

                    {/* اقدامات کنترلی */}
                    <td className="py-3 text-[var(--color-primary)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs resize-none"
                          value={item.preventiveAction}
                          onChange={(e) => handleFieldChange(targetRow, 'preventiveAction', e.target.value)}
                        />
                      ) : (
                        item.preventiveAction
                      )}
                    </td>

                    {/* عملیات حذف سطر */}
                    {isEditing && (
                      <td className="text-center py-3">
                        <button
                          onClick={() => handleDelete(targetRow)}
                          className="text-rose-500 hover:text-rose-600 p-1.5 rounded transition-colors"
                          title="حذف این الزام"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LegalView;