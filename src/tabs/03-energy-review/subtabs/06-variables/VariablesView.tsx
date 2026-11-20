import React, { useState } from 'react';
import {
  Sliders,
  Search,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  Layers,
  BarChart2,
  Info,
} from 'lucide-react';
import { RelevantVariableItem } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface VariablesViewProps {
  variables?: RelevantVariableItem[];
  onChange?: (updated: RelevantVariableItem[]) => void;
  isEditing?: boolean;
}

export const VariablesView: React.FC<VariablesViewProps> = ({
  variables = [],
  onChange,
  isEditing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [activeAnalysisView, setActiveAnalysisView] = useState<'matrix' | 'correlations'>('matrix');

  const handleFieldChange = (index: number, field: keyof RelevantVariableItem, value: any) => {
    if (!onChange) return;
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    if (!onChange) return;
    const newRow: RelevantVariableItem = {
      id: `RV-0${variables.length + 1}`,
      variableName: '',
      department: '',
      targetSeu: '',
      variableType: 'متغیر فرآیندی',
      unit: '',
      typicalRange: '',
      impactOnEnPI: '',
      correlationLevel: 'قوی',
      monitoringMethod: '',
    };
    onChange([...variables, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    if (!onChange) return;
    const updated = (variables || []).filter((_, i) => i !== index);
    onChange(updated);
  };

  const filteredVariables = (variables || []).filter((v) => {
    const matchSearch =
      !searchTerm ||
      v.variableName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.targetSeu?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = selectedTypeFilter === 'all' || v.variableType === selectedTypeFilter;
    return matchSearch && matchType;
  });

  // آمار متغیرها
  const stats = {
    total: (variables || []).length,
    processVars: (variables || []).filter((v) => v.variableType === 'متغیر فرآیندی').length,
    qualityVars: (variables || []).filter((v) => v.variableType === 'متغیر کیفی و مواد').length,
    environmentalVars: (variables || []).filter((v) => v.variableType === 'متغیر محیطی').length,
    staticFactors: (variables || []).filter((v) => v.variableType === 'عامل استاتیک').length,
    highCorrelation: (variables || []).filter((v) => v.correlationLevel === 'بسیار قوی' || v.correlationLevel === 'قوی').length,
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* کارت‌های خلاصه متغیرها و همبستگی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">کل متغیرها و عوامل استاتیک</span>
            <Sliders className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-primary)] mt-2">
            {toPersianDigits(stats.total)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">
            {toPersianDigits(stats.highCorrelation)} متغیر با همبستگی قوی و بسیار قوی
          </div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">متغیرهای فرآیندی</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-2">
            {toPersianDigits(stats.processVars)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">تغذیه کوره، دبی، دمای پیش‌گرمکن</div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">کیفیت مواد و محیطی</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {toPersianDigits(stats.qualityVars + stats.environmentalVars)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">نرمی بلین، رطوبت و دمای محیط</div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">عوامل استاتیک (Static)</span>
            <BarChart2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-500 mt-2">
            {toPersianDigits(stats.staticFactors)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">طراحی پایدار، نوع آسیاب و کوره</div>
        </div>
      </div>

      <div className="enms-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                ماتریس شناسایی و تعیین متغیرهای تأثیرگذار بر مصرف انرژی و عوامل استاتیک
              </h3>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
              انطباق با الزامات بند ۶.۳ استاندارد ISO 50001:2018 جهت شناسایی متغیرهای مؤثر (Relevant Variables) و عوامل ثابت (Static Factors) مؤثر بر خطوط مبنا (EnB) و شاخص‌های EnPI
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="enms-select text-xs"
            >
              <option value="all">همه دسته‌ها</option>
              <option value="متغیر فرآیندی">متغیر فرآیندی</option>
              <option value="متغیر کیفی و مواد">متغیر کیفی و مواد</option>
              <option value="متغیر محیطی">متغیر محیطی</option>
              <option value="عامل استاتیک">عامل استاتیک</option>
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در متغیرها یا تجهیزات..."
                className="enms-input text-xs pr-8 pl-3 w-52"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
            </div>

            {isEditing && (
              <button
                onClick={handleAddRow}
                className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1"
                title="افزودن متغیر تأثیرگذار جدید"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن متغیر</span>
              </button>
            )}
          </div>
        </div>

        {/* جدول ماتریس متغیرها */}
        <div className="enms-table-container mt-4 overflow-x-auto">
          <table className="enms-table text-xs w-full">
            <thead>
              <tr>
                <th className="text-center w-12 py-3">ردیف</th>
                <th className="text-right w-56 py-3">نام متغیر تأثیرگذار</th>
                <th className="text-center w-36 py-3">دسته‌بندی متغیر</th>
                <th className="text-right w-48 py-3">دپارتمان و SEU متأثر</th>
                <th className="text-center w-28 py-3">واحد سنجش</th>
                <th className="text-center w-28 py-3">محدوده نرمال کاری</th>
                <th className="text-right min-w-[280px] py-3">نحوه اثرگذاری بر شاخص عملکرد انرژی (EnPI)</th>
                <th className="text-center w-28 py-3">شدت همبستگی</th>
                <th className="text-right min-w-[200px] py-3">روش پایش و اندازه‌گیری</th>
                {isEditing && <th className="text-center w-12 py-3">عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVariables.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 10 : 9} className="text-center py-8 text-[var(--color-text-muted)] text-xs">
                    داده‌ای در جدول متغیرهای تأثیرگذار یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredVariables.map((v, idx) => (
                  <tr key={v.id || idx}>
                    <td className="text-center font-mono text-[var(--color-text-muted)] py-3">{toPersianDigits(idx + 1)}</td>

                    <td className="py-3 font-bold text-[var(--color-text-primary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={v.variableName}
                          onChange={(e) => handleFieldChange(idx, 'variableName', e.target.value)}
                        />
                      ) : (
                        <div>
                          <div>{v.variableName}</div>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{v.id}</span>
                        </div>
                      )}
                    </td>

                    <td className="text-center py-3">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs"
                          value={v.variableType}
                          onChange={(e) => handleFieldChange(idx, 'variableType', e.target.value as any)}
                        >
                          <option value="متغیر فرآیندی">متغیر فرآیندی</option>
                          <option value="متغیر کیفی و مواد">متغیر کیفی و مواد</option>
                          <option value="متغیر محیطی">متغیر محیطی</option>
                          <option value="عامل استاتیک">عامل استاتیک</option>
                        </select>
                      ) : (
                        <span
                          className={`enms-badge text-[10px] ${
                            v.variableType === 'متغیر فرآیندی'
                              ? 'badge-primary'
                              : v.variableType === 'عامل استاتیک'
                              ? 'badge-neutral'
                              : v.variableType === 'متغیر کیفی و مواد'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {v.variableType}
                        </span>
                      )}
                    </td>

                    <td className="py-3">
                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <input
                            className="enms-input text-xs"
                            value={v.department}
                            onChange={(e) => handleFieldChange(idx, 'department', e.target.value)}
                            placeholder="دپارتمان"
                          />
                          <input
                            className="enms-input text-xs font-mono"
                            value={v.targetSeu}
                            onChange={(e) => handleFieldChange(idx, 'targetSeu', e.target.value)}
                            placeholder="SEU مرتبط"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-[var(--color-text-primary)] font-medium">{v.department}</div>
                          <div className="text-amber-500 text-[11px] font-mono mt-0.5">{v.targetSeu}</div>
                        </div>
                      )}
                    </td>

                    <td className="text-center font-mono text-[var(--color-text-secondary)] py-3">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs text-center w-20 font-mono"
                          value={v.unit}
                          onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                        />
                      ) : (
                        v.unit
                      )}
                    </td>

                    <td className="text-center font-mono text-[var(--color-primary)] font-bold py-3">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs text-[var(--color-primary)] text-center w-24 font-mono"
                          value={v.typicalRange}
                          onChange={(e) => handleFieldChange(idx, 'typicalRange', e.target.value)}
                        />
                      ) : (
                        toPersianDigits(v.typicalRange)
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={v.impactOnEnPI}
                          onChange={(e) => handleFieldChange(idx, 'impactOnEnPI', e.target.value)}
                        />
                      ) : (
                        v.impactOnEnPI
                      )}
                    </td>

                    <td className="text-center py-3">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs"
                          value={v.correlationLevel}
                          onChange={(e) => handleFieldChange(idx, 'correlationLevel', e.target.value as any)}
                        >
                          <option value="بسیار قوی">بسیار قوی</option>
                          <option value="قوی">قوی</option>
                          <option value="متوسط">متوسط</option>
                        </select>
                      ) : (
                        <span
                          className={`enms-badge text-[10px] ${
                            v.correlationLevel === 'بسیار قوی'
                              ? 'badge-danger'
                              : v.correlationLevel === 'قوی'
                              ? 'badge-success'
                              : 'badge-neutral'
                          }`}
                        >
                          {v.correlationLevel}
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-muted)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={v.monitoringMethod}
                          onChange={(e) => handleFieldChange(idx, 'monitoringMethod', e.target.value)}
                        />
                      ) : (
                        v.monitoringMethod
                      )}
                    </td>

                    {isEditing && (
                      <td className="text-center py-3">
                        <button
                          onClick={() => handleDeleteRow(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1.5 rounded"
                          title="حذف متغیر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const RelevantVariablesView = VariablesView;
export default VariablesView;
