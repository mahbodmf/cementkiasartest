import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Award,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { EnergyReviewKeyPersonnel } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface CompetencePersonsViewProps {
  keyPersonnel?: EnergyReviewKeyPersonnel[];
  onChange?: (updated: EnergyReviewKeyPersonnel[]) => void;
  isEditing?: boolean;
}

export const CompetencePersonsView: React.FC<CompetencePersonsViewProps> = ({
  keyPersonnel = [],
  onChange,
  isEditing = false,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleFieldChange = (index: number, field: keyof EnergyReviewKeyPersonnel, value: any) => {
    if (!onChange) return;
    const updated = [...keyPersonnel];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    if (!onChange) return;
    const newPerson: EnergyReviewKeyPersonnel = {
      id: `KP-0${keyPersonnel.length + 1}`,
      role: 'عنوان نقش سازمانی جدید',
      department: 'واحد بهره‌برداری / نت',
      affectedSeu: 'تجهیز یا فرآیند بارز',
      energyImpact: 'شرح نحوه اثرگذاری بر مصارف و عملکرد انرژی...',
      requiredCompetence: 'صلاحیت و آموزش‌های الزامی بر اساس استاندارد ISO 50001...',
      trainingStatus: 'منطبق',
      monitoringMethod: 'مکانیسم نظارت و ممیزی فردی...',
    };
    onChange([...keyPersonnel, newPerson]);
  };

  const handleDelete = (index: number) => {
    if (!onChange) return;
    onChange((keyPersonnel || []).filter((_, i) => i !== index));
  };

  const filtered = (keyPersonnel || []).filter((person) => {
    const matchStatus = selectedStatusFilter === 'all' || person.trainingStatus === selectedStatusFilter;
    const matchSearch =
      !searchTerm ||
      person.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.affectedSeu?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const compliantCount = (keyPersonnel || []).filter((p) => p.trainingStatus === 'منطبق').length;
  const inProgressCount = (keyPersonnel || []).filter((p) => p.trainingStatus === 'در حال آموزش').length;
  const nonCompliantCount = (keyPersonnel || []).filter((p) => p.trainingStatus === 'نیازمند آموزش').length;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* کارت‌های خلاصه وضعیت شایستگی افراد کلیدی (بند ۷.۲) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">کل پست‌های مؤثر بر SEU</span>
            <Users className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[var(--color-primary)] mt-2">
            {toPersianDigits(keyPersonnel.length)}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] mt-1">شناسایی شده مطابق بند ۷.۲</div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">شایستگی کامل و منطبق</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-500 mt-2">
            {toPersianDigits(compliantCount)}
          </div>
          <div className="text-[11px] text-emerald-500 mt-1">گواهی آموزش و ارزیابی تایید شده</div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">در حال طی دوره‌های آموزشی</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-2">
            {toPersianDigits(inProgressCount)}
          </div>
          <div className="text-[11px] text-amber-500 mt-1">دوره بهره‌برداری بهینه و پایش EnMS</div>
        </div>

        <div className="enms-card p-4 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">نیازمند آموزش و بازآموزی</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-2">
            {toPersianDigits(nonCompliantCount)}
          </div>
          <div className="text-[11px] text-rose-500 mt-1">دارای اولویت در برنامه آموزش سالانه</div>
        </div>
      </div>

      <div className="enms-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                ماتریس شایستگی، آگاهی و صلاحیت افراد کلیدی مؤثر بر مصرف انرژی (بند ۷.۲ استاندارد ISO 50001)
              </h3>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
              تعیین نقش‌های اثرگذار بر مصرف‌کننده‌های بارز انرژی (SEUs)، الزامات شایستگی، سوابق آموزشی و پایش عملکرد رفتاری کارکنان
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="enms-select text-xs"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="منطبق">منطبق</option>
              <option value="در حال آموزش">در حال آموزش</option>
              <option value="نیازمند آموزش">نیازمند آموزش</option>
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در نقش، دپارتمان یا SEU..."
                className="enms-input text-xs pr-8 pl-3 w-56"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
            </div>

            {isEditing && (
              <button
                onClick={handleAdd}
                className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن فرد / نقش کلیدی</span>
              </button>
            )}
          </div>
        </div>

        {/* جدول ماتریس شایستگی افراد کلیدی */}
        <div className="enms-table-container mt-4 overflow-x-auto">
          <table className="enms-table text-xs w-full">
            <thead>
              <tr>
                <th className="text-center w-16 py-3">کد نقش</th>
                <th className="text-right w-48 py-3">عنوان نقش سازمانی</th>
                <th className="text-right w-36 py-3">دپارتمان</th>
                <th className="text-right w-44 py-3">SEU و تجهیز متأثر</th>
                <th className="text-right min-w-[240px] py-3">نحوه اثرگذاری بر مصرف انرژی</th>
                <th className="text-right min-w-[240px] py-3">شایستگی و آموزش‌های الزامی</th>
                <th className="text-center w-28 py-3">وضعیت صلاحیت</th>
                <th className="text-right min-w-[200px] py-3">مکانیسم پایش و نظارت فردی</th>
                {isEditing && <th className="text-center w-12 py-3">عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isEditing ? 9 : 8} className="text-center py-8 text-[var(--color-text-muted)] text-xs">
                    هیچ رکوردی برای نمایش وجود ندارد.
                  </td>
                </tr>
              ) : (
                filtered.map((person, idx) => (
                  <tr key={person.id || idx}>
                    <td className="text-center font-mono font-bold text-[var(--color-primary)] py-3">
                      {person.id}
                    </td>

                    <td className="py-3 font-bold text-[var(--color-text-primary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={person.role}
                          onChange={(e) => handleFieldChange(idx, 'role', e.target.value)}
                        />
                      ) : (
                        person.role
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={person.department}
                          onChange={(e) => handleFieldChange(idx, 'department', e.target.value)}
                        />
                      ) : (
                        person.department
                      )}
                    </td>

                    <td className="py-3 font-mono text-amber-500">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full font-mono"
                          value={person.affectedSeu}
                          onChange={(e) => handleFieldChange(idx, 'affectedSeu', e.target.value)}
                        />
                      ) : (
                        person.affectedSeu
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={person.energyImpact}
                          onChange={(e) => handleFieldChange(idx, 'energyImpact', e.target.value)}
                        />
                      ) : (
                        person.energyImpact
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-muted)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={person.requiredCompetence}
                          onChange={(e) => handleFieldChange(idx, 'requiredCompetence', e.target.value)}
                        />
                      ) : (
                        person.requiredCompetence
                      )}
                    </td>

                    <td className="text-center py-3">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs"
                          value={person.trainingStatus}
                          onChange={(e) => handleFieldChange(idx, 'trainingStatus', e.target.value as any)}
                        >
                          <option value="منطبق">منطبق</option>
                          <option value="در حال آموزش">در حال آموزش</option>
                          <option value="نیازمند آموزش">نیازمند آموزش</option>
                        </select>
                      ) : (
                        <span
                          className={`enms-badge text-[10px] ${
                            person.trainingStatus === 'منطبق'
                              ? 'badge-success'
                              : person.trainingStatus === 'در حال آموزش'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}
                        >
                          {person.trainingStatus}
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-muted)] leading-relaxed">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          className="enms-textarea text-xs w-full resize-none"
                          value={person.monitoringMethod}
                          onChange={(e) => handleFieldChange(idx, 'monitoringMethod', e.target.value)}
                        />
                      ) : (
                        person.monitoringMethod
                      )}
                    </td>

                    {isEditing && (
                      <td className="text-center py-3">
                        <button
                          onClick={() => handleDelete(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1.5 rounded"
                          title="حذف رکورد"
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

export const KeyPersonnelView = CompetencePersonsView;
export default CompetencePersonsView;
