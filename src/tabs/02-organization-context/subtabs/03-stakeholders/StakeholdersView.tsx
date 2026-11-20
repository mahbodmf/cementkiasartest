import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Building,
  Zap,
  Tag,
  LayoutGrid,
  Table as TableIcon,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { OrganizationStakeholder } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface StakeholdersViewProps {
  stakeholders?: OrganizationStakeholder[];
  onChange?: (updated: OrganizationStakeholder[]) => void;
  isEditing?: boolean;
}

export const StakeholdersView: React.FC<StakeholdersViewProps> = ({
  stakeholders = [],
  onChange,
  isEditing = false,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedGroup, setSelectedGroup] = useState<string>('همه');
  const [selectedType, setSelectedType] = useState<'همه' | 'نیاز' | 'انتظار'>('همه');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('همه');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const safeStakeholders = useMemo(() => Array.isArray(stakeholders) ? stakeholders : [], [stakeholders]);

  // استخراج دسته‌ها و دوره‌های پایش
  const uniqueGroups = useMemo(() => {
    return ['همه', ...Array.from(new Set(safeStakeholders.map((s) => s.group || 'سایر')))];
  }, [safeStakeholders]);

  const uniquePeriods = useMemo(() => {
    return ['همه', ...Array.from(new Set(safeStakeholders.map((s) => s.monitoringPeriod || '-')))];
  }, [safeStakeholders]);

  // فیلتر هوشمند
  const filteredStakeholders = useMemo(() => {
    return safeStakeholders.filter((item) => {
      const matchGroup = selectedGroup === 'همه' || item.group === selectedGroup;
      const matchType = selectedType === 'همه' || item.type === selectedType;
      const matchPeriod = selectedPeriod === 'همه' || item.monitoringPeriod === selectedPeriod;
      const matchSearch =
        !searchTerm ||
        item.name.includes(searchTerm) ||
        (item.description && item.description.includes(searchTerm)) ||
        (item.risks && item.risks.includes(searchTerm)) ||
        (item.monitoringResponsible && item.monitoringResponsible.includes(searchTerm));
      return matchGroup && matchType && matchPeriod && matchSearch;
    });
  }, [safeStakeholders, selectedGroup, selectedType, selectedPeriod, searchTerm]);

  // آمار شاخص‌ها
  const needCount = safeStakeholders.filter((s) => s.type === 'نیاز').length;
  const expectationCount = safeStakeholders.filter((s) => s.type?.includes('انتظار')).length;
  const energyStakeholdersCount = safeStakeholders.filter(
    (s) => s.group?.includes('انرژی') || s.name.includes('گاز') || s.name.includes('برق')
  ).length;

  const handleFieldChange = (
    index: number,
    field: keyof OrganizationStakeholder,
    val: string
  ) => {
    const updated = [...safeStakeholders];
    updated[index] = { ...updated[index], [field]: val };
    onChange?.(updated);
  };

  const handleAdd = () => {
    const newStakeholder: OrganizationStakeholder = {
      id: `stk-${Date.now()}`,
      group: 'نهادهای نظارتی و قانونی',
      name: 'ذی‌نفع جدید',
      type: 'نیاز',
      description: 'شرح کامل نیازمندی یا انتظارات اعلام‌شده...',
      impactOnIMS: 'چگونگی تأثیر بر خط تولید و عملکرد انرژی...',
      risks: 'ریسک‌های ناشی از عدم انطباق...',
      opportunities: 'فرصت‌های حاصل از پاسخ‌گویی به نیاز...',
      monitoringMethod: 'روش پایش و کنترل فرآیندی...',
      monitoringPeriod: 'شش‌ماهه',
      monitoringResponsible: 'مدیر واحد مربوطه',
      reviewPeriod: 'سالانه',
      reviewResponsible: 'نماینده مدیریت IMS',
    };
    onChange?.([...safeStakeholders, newStakeholder]);
  };

  const handleDelete = (index: number) => {
    onChange?.(safeStakeholders.filter((_, i) => i !== index));
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'نیاز') {
      return 'badge-success';
    }
    return 'badge-info';
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* سربرگ معرفی و کنترل‌های داشبورد */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="enms-logo-icon">
              <Users className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۴.۲ استاندارد ISO 50001:2018</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">Stakeholder Matrix (Form F01-05)</span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                ماتریس راهبردی مدیریت نیازها، انتظارات، ریسک‌ها و پایش ذی‌نفعان سیمان کیاسر
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* انتخاب نحوه نمایش (جدول / کارت) */}
            <div className="enms-tab-pills">
              <button
                onClick={() => setViewMode('table')}
                className={`enms-tab-pill flex items-center gap-1.5 ${viewMode === 'table' ? 'active' : ''}`}
                title="نمای ماتریس جدولی جامع"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>ماتریس جدولی</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`enms-tab-pill flex items-center gap-1.5 ${viewMode === 'cards' ? 'active' : ''}`}
                title="نمای شناسنامه تفصیلی کارت‌ها"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>شناسنامه کارت‌ها</span>
              </button>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-2.5" />
              <input
                type="text"
                className="enms-input text-xs w-full pr-9 pl-3 py-1.5"
                placeholder="جستجو در نام، ریسک، مسئول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isEditing && (
              <button
                onClick={handleAdd}
                className="enms-button enms-button-primary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن سطر جدید</span>
              </button>
            )}
          </div>
        </div>

        {/* کارت‌های شاخص‌های بالادستی */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">گروه‌های طرف ذی‌نفع</span>
                <div className="text-xl font-bold font-mono text-[var(--color-primary)]">
                  {toPersianDigits(uniqueGroups.length - 1)} <span className="text-xs text-[var(--color-text-muted)] font-sans">نهاد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-neutral text-[10px] font-mono">
              ۳۰ مؤلفه فعال
            </span>
          </div>

          <div
            onClick={() => setSelectedType(selectedType === 'نیاز' ? 'همه' : 'نیاز')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'نیاز'
                ? 'bg-[var(--color-primary-bg)] border-[var(--color-primary-border)]'
                : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">الزامات اجباری (نیازها)</span>
                <div className="text-xl font-bold font-mono text-[var(--color-primary)]">
                  {toPersianDigits(needCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-success text-[10px]">الزام حقوقی و مقرراتی</span>
          </div>

          <div
            onClick={() => setSelectedType(selectedType === 'انتظار' ? 'همه' : 'انتظار')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedType === 'انتظار'
                ? 'bg-[var(--color-info-bg)] border-blue-500'
                : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-info-bg)] border border-[var(--color-border)] flex items-center justify-center text-blue-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">انتظارات فراتر از قانون</span>
                <div className="text-xl font-bold font-mono text-blue-500">
                  {toPersianDigits(expectationCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-info text-[10px]">توسعه پایدار و تعالی</span>
          </div>

          <div
            onClick={() => setSelectedGroup(selectedGroup.includes('انرژی') ? 'همه' : 'تأمین‌کنندگان حامل‌های انرژی')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
              selectedGroup.includes('انرژی')
                ? 'bg-amber-500/10 border-amber-500'
                : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-[var(--color-text-muted)] block">ذی‌نفعان حیاتی انرژی</span>
                <div className="text-xl font-bold font-mono text-amber-500">
                  {toPersianDigits(energyStakeholdersCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مؤلفه</span>
                </div>
              </div>
            </div>
            <span className="enms-badge badge-warning text-[10px]">برق، گاز و فرآورده</span>
          </div>
        </div>

        {/* فیلترهای ماتریسی */}
        <div className="flex items-center justify-between gap-4 mt-4 pt-3 border-t border-[var(--color-border)] flex-wrap text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[var(--color-text-muted)] shrink-0 font-medium ml-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> فیلتر حوزه:
            </span>
            <div className="enms-tab-pills">
              {uniqueGroups.map((grp) => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`enms-tab-pill ${selectedGroup === grp ? 'active' : ''}`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-muted)] shrink-0">دوره پایش:</span>
            <select
              className="enms-select text-xs"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {uniquePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ۱. نمای ماتریس جدولی جامع (Enterprise Data Grid) */}
      {viewMode === 'table' && (
        <div className="enms-card">
          <div className="enms-table-container">
            <table className="enms-table">
              <thead>
                <tr className="text-xs">
                  <th className="text-center w-12 py-3">ردیف</th>
                  <th className="text-right w-36 py-3">عنوان طرف ذی‌نفع</th>
                  <th className="text-center w-20 py-3">نوع مؤلفه</th>
                  <th className="text-right py-3 min-w-[280px]">شرح نیاز یا انتظار</th>
                  <th className="text-right py-3 min-w-[220px]">ریسک‌های عدم انطباق</th>
                  <th className="text-right py-3 min-w-[220px]">فرصت‌های سازمانی</th>
                  <th className="text-center w-24 py-3">دوره پایش</th>
                  <th className="text-center w-36 py-3">مسئول پایش</th>
                  {isEditing && <th className="text-center w-12 py-3">عملیات</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStakeholders.map((item, idx) => {
                  const realIdx = stakeholders.findIndex((s) => s.id === item.id);
                  const targetIndex = realIdx !== -1 ? realIdx : idx;

                  return (
                    <tr
                      key={item.id || idx}
                      className="text-xs"
                    >
                      <td className="text-center font-mono text-[var(--color-text-muted)] py-3">
                        {toPersianDigits(targetIndex + 1)}
                      </td>

                      <td className="py-3 font-bold text-[var(--color-text-primary)]">
                        {isEditing ? (
                          <input
                            className="enms-input text-xs w-full"
                            value={item.name}
                            onChange={(e) => handleFieldChange(targetIndex, 'name', e.target.value)}
                          />
                        ) : (
                          <div>
                            <span>{item.name}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] block font-normal mt-0.5">
                              {item.group}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="text-center py-3">
                        <span className={`enms-badge ${getTypeBadge(item.type)} text-[10px]`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            className="enms-textarea text-xs w-full resize-none"
                            value={item.description}
                            onChange={(e) =>
                              handleFieldChange(targetIndex, 'description', e.target.value)
                            }
                          />
                        ) : (
                          item.description
                        )}
                      </td>

                      <td className="py-3 text-rose-500 leading-relaxed bg-[var(--color-danger-bg)] rounded">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            className="enms-textarea border-rose-500 text-xs w-full resize-none"
                            value={item.risks || ''}
                            onChange={(e) => handleFieldChange(targetIndex, 'risks', e.target.value)}
                          />
                        ) : (
                          item.risks || '-'
                        )}
                      </td>

                      <td className="py-3 text-[var(--color-primary)] leading-relaxed bg-[var(--color-primary-bg)] rounded">
                        {isEditing ? (
                          <textarea
                            rows={2}
                            className="enms-textarea text-xs w-full resize-none"
                            value={item.opportunities || ''}
                            onChange={(e) =>
                              handleFieldChange(targetIndex, 'opportunities', e.target.value)
                            }
                          />
                        ) : (
                          item.opportunities || '-'
                        )}
                      </td>

                      <td className="text-center py-3 font-mono text-[var(--color-text-secondary)]">
                        {isEditing ? (
                          <input
                            className="enms-input text-center text-xs w-20"
                            value={item.monitoringPeriod}
                            onChange={(e) =>
                              handleFieldChange(targetIndex, 'monitoringPeriod', e.target.value)
                            }
                          />
                        ) : (
                          item.monitoringPeriod
                        )}
                      </td>

                      <td className="text-center py-3">
                        <span className="enms-badge badge-neutral text-[11px] block font-medium">
                          {item.monitoringResponsible}
                        </span>
                      </td>

                      {isEditing && (
                        <td className="text-center py-3">
                          <button
                            onClick={() => handleDelete(targetIndex)}
                            className="text-rose-500 hover:text-rose-600 p-1"
                            title="حذف سطر"
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
      )}

      {/* ۲. نمای شناسنامه تفصیلی کارت‌ها (Executive Detailed Cards) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredStakeholders.map((item, originalIndex) => {
            const realIdx = stakeholders.findIndex((s) => s.id === item.id);
            const targetIndex = realIdx !== -1 ? realIdx : originalIndex;
            const isExpanded = expandedId === item.id;
            const isNeed = item.type === 'نیاز';

            return (
              <div
                key={item.id || originalIndex}
                className="enms-card transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isNeed
                          ? 'bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] text-[var(--color-primary)]'
                          : 'bg-[var(--color-info-bg)] border border-[var(--color-border)] text-blue-500'
                      }`}
                    >
                      {isNeed ? 'نیاز' : 'انتظار'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{item.name}</h3>
                        <span className="enms-badge badge-neutral text-[10px] font-mono">
                          STK-{toPersianDigits(targetIndex + 1)}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] font-mono">• {item.group}</span>
                      </div>
                      <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
                        مسئول پایش: <strong className="text-[var(--color-text-primary)]">{item.monitoringResponsible}</strong> • دوره:{' '}
                        <strong className="text-[var(--color-text-primary)]">{item.monitoringPeriod}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
                    >
                      <span>{isExpanded ? 'خلاصه کارت' : 'مشاهده کل ابعاد ممیزی'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isEditing && (
                      <button
                        onClick={() => handleDelete(targetIndex)}
                        className="text-rose-500 hover:text-rose-600 p-1.5"
                        title="حذف این مورد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* شرح نیاز یا انتظار */}
                <div className="mt-3">
                  <span className="text-[11px] font-bold text-[var(--color-text-muted)] block mb-1">
                    شرح مؤلفه اعلام‌شده:
                  </span>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed bg-[var(--color-bg-card-subtle)] p-3 rounded-xl border border-[var(--color-border)]">
                    {item.description}
                  </p>
                </div>

                {/* بازشونده تحلیلی ریسک و فرصت و متد پایش */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-4 text-xs animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ریسک‌ها */}
                      <div className="p-3.5 rounded-xl bg-[var(--color-danger-bg)] border border-[var(--color-border)] flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>ریسک‌های ناشی از عدم برآورده‌سازی:</span>
                        </span>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.risks || 'فاقد ریسک بحرانی'}</p>
                      </div>

                      {/* فرصت‌ها */}
                      <div className="p-3.5 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          <span>فرصت‌های سازمانی و بهره‌وری:</span>
                        </span>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.opportunities || 'ثبت نشده'}</p>
                      </div>
                    </div>

                    {/* اثرگذاری بر سیستم مدیریت یکپارچه و نحوه پایش */}
                    <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col gap-2.5">
                      <div>
                        <span className="text-xs font-bold text-[var(--color-text-primary)] block mb-1">
                          چگونگی تأثیر در سیستم مدیریت یکپارچه (IMS / EnMS):
                        </span>
                        <p className="text-[var(--color-text-muted)] leading-relaxed">{item.impactOnIMS || '-'}</p>
                      </div>

                      <div className="pt-2 border-t border-[var(--color-border)] flex flex-col gap-1">
                        <span className="text-xs font-bold text-blue-500 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>نحوه پایش و مکانیسم ارزیابی انطباق:</span>
                        </span>
                        <p className="text-[var(--color-text-secondary)] leading-relaxed">{item.monitoringMethod || 'پایش ادواری'}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)] font-mono">
                        <span>دوره پایش: <strong className="text-[var(--color-text-primary)]">{item.monitoringPeriod}</strong></span>
                        <span>مسئول پایش: <strong className="text-[var(--color-text-primary)]">{item.monitoringResponsible}</strong></span>
                        <span>دوره بازنگری: <strong className="text-[var(--color-text-primary)]">{item.reviewPeriod}</strong></span>
                        <span>مسئول بازنگری: <strong className="text-[var(--color-text-primary)]">{item.reviewResponsible}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StakeholdersView;