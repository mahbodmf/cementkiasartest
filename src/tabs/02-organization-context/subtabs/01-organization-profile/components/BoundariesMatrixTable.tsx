import React from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { BoundaryMatrixItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface BoundariesMatrixTableProps {
  boundaries: BoundaryMatrixItem[];
  isEditing: boolean;
  selectedDeptHighlight: string | null;
  onClearHighlight: () => void;
  onBoundaryChange: (index: number, field: keyof BoundaryMatrixItem, value: any) => void;
  onAddRow: () => void;
  onDeleteRow: (index: number) => void;
}

export const BoundariesMatrixTable: React.FC<BoundariesMatrixTableProps> = ({
  boundaries,
  isEditing,
  selectedDeptHighlight,
  onClearHighlight,
  onBoundaryChange,
  onAddRow,
  onDeleteRow,
}) => {
  const getStatusBadge = (status: string) => {
    if (status === 'مشمول') return 'badge-success';
    if (status === 'مشمول غیرمستقیم') return 'badge-info';
    return 'badge-neutral';
  };

  const getSeuBadge = (seu: string) => {
    if (!seu || seu === '-') return 'text-[var(--color-text-muted)] font-mono';
    if (seu.includes('اصلی') || seu.includes('بالا')) return 'enms-badge badge-danger';
    if (seu.includes('متوسط') || seu.includes('اثرگذار')) return 'enms-badge badge-warning';
    if (seu.includes('پایین')) return 'enms-badge badge-success';
    return 'text-[var(--color-text-muted)]';
  };

  return (
    <div className="enms-card">
      <div className="enms-card-header">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="enms-card-title">
            ماتریس تفصیلی مرزبندی فرآیندها، تجهیزات، حامل‌های انرژی و وضعیت SEU
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {selectedDeptHighlight && (
            <button
              onClick={onClearHighlight}
              className="text-[11px] text-amber-500 hover:underline cursor-pointer"
            >
              پاکسازی فیلتر شماتیک ({selectedDeptHighlight})
            </button>
          )}
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            تعداد ردیف‌ها: {toPersianDigits(boundaries.length)}
          </span>
          {isEditing && (
            <button
              onClick={onAddRow}
              className="enms-button enms-button-primary text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن ردیف</span>
            </button>
          )}
        </div>
      </div>

      <div className="enms-table-container">
        <table className="enms-table text-xs">
          <thead>
            <tr>
              <th className="text-center w-12 py-3">ردیف</th>
              <th className="text-right py-3 w-48">بخش / واحد / فرآیند</th>
              <th className="text-right py-3 min-w-[200px]">شرح محدوده</th>
              <th className="text-center w-24 py-3">داخل دامنه EnMS</th>
              <th className="text-center w-24 py-3">داخل مرز فیزیکی</th>
              <th className="text-center w-28 py-3">وضعیت شمول</th>
              <th className="text-right py-3 min-w-[160px]">حامل‌های انرژی مرتبط</th>
              <th className="text-right py-3 min-w-[180px]">تجهیزات / سامانه‌های اصلی</th>
              <th className="text-center w-28 py-3">پیمانکار / برون‌سپاری</th>
              <th className="text-center py-3 min-w-[160px]">اهمیت انرژی / وضعیت SEU</th>
              {isEditing && <th className="text-center w-12 py-3">عملیات</th>}
            </tr>
          </thead>
          <tbody>
            {boundaries.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 11 : 10} className="text-center py-8 text-[var(--color-text-muted)] text-xs">
                  داده‌ای در جدول مرزبندی فرآیندها یافت نشد.
                </td>
              </tr>
            ) : (
              boundaries.map((item, idx) => {
                const isHighlighted = selectedDeptHighlight && item.department?.includes(selectedDeptHighlight);
                const isExcluded = item.status === 'مستثنی';
                return (
                  <tr
                    key={item.row || idx}
                    className={`transition-colors ${
                      isHighlighted
                        ? 'bg-[var(--color-primary-bg)] font-bold border-l-4 border-[var(--color-primary)]'
                        : isExcluded
                        ? 'opacity-60 hover:opacity-100'
                        : ''
                    }`}
                  >
                    <td className="text-center font-mono text-[var(--color-text-muted)] py-3">
                      {toPersianDigits(item.row || idx + 1)}
                    </td>

                    <td className="py-3 font-bold text-[var(--color-text-primary)]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={item.department}
                          onChange={(e) => onBoundaryChange(idx, 'department', e.target.value)}
                        />
                      ) : (
                        item.department
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={item.scopeDescription}
                          onChange={(e) => onBoundaryChange(idx, 'scopeDescription', e.target.value)}
                        />
                      ) : (
                        item.scopeDescription
                      )}
                    </td>

                    <td className="text-center py-3 font-mono">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs font-mono"
                          value={item.insideEnMS}
                          onChange={(e) => onBoundaryChange(idx, 'insideEnMS', e.target.value)}
                        >
                          <option value="بلی">بلی</option>
                          <option value="بلی (از حیث اثرگذاری)">بلی (از حیث اثرگذاری)</option>
                          <option value="خیر">خیر</option>
                        </select>
                      ) : (
                        <span
                          className={`enms-badge ${
                            item.insideEnMS?.includes('بلی') ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {item.insideEnMS}
                        </span>
                      )}
                    </td>

                    <td className="text-center py-3 font-mono">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs font-mono"
                          value={item.insidePhysical}
                          onChange={(e) => onBoundaryChange(idx, 'insidePhysical', e.target.value)}
                        >
                          <option value="بلی">بلی</option>
                          <option value="خیر (مرز مستقل)">خیر (مرز مستقل)</option>
                          <option value="خیر">خیر</option>
                        </select>
                      ) : (
                        <span
                          className={`enms-badge ${
                            item.insidePhysical?.includes('بلی') ? 'badge-success' : 'badge-neutral'
                          }`}
                        >
                          {item.insidePhysical}
                        </span>
                      )}
                    </td>

                    <td className="text-center py-3">
                      {isEditing ? (
                        <select
                          className="enms-select text-xs font-mono"
                          value={item.status}
                          onChange={(e) => onBoundaryChange(idx, 'status', e.target.value)}
                        >
                          <option value="مشمول">مشمول</option>
                          <option value="مشمول غیرمستقیم">مشمول غیرمستقیم</option>
                          <option value="مستثنی">مستثنی</option>
                        </select>
                      ) : (
                        <span className={`enms-badge ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)] font-mono text-[11px]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full font-mono"
                          value={item.energyCarriers}
                          onChange={(e) => onBoundaryChange(idx, 'energyCarriers', e.target.value)}
                        />
                      ) : (
                        item.energyCarriers
                      )}
                    </td>

                    <td className="py-3 text-[var(--color-text-secondary)] text-[11px] leading-relaxed">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full"
                          value={item.equipment}
                          onChange={(e) => onBoundaryChange(idx, 'equipment', e.target.value)}
                        />
                      ) : (
                        item.equipment
                      )}
                    </td>

                    <td className="text-center py-3 font-mono text-[11px]">
                      {isEditing ? (
                        <input
                          className="enms-input text-center text-xs w-24 font-mono"
                          value={item.outsourced}
                          onChange={(e) => onBoundaryChange(idx, 'outsourced', e.target.value)}
                        />
                      ) : (
                        <span
                          className={`enms-badge ${
                            item.outsourced?.includes('بلی') ? 'badge-warning' : 'badge-neutral'
                          }`}
                        >
                          {item.outsourced}
                        </span>
                      )}
                    </td>

                    <td className="text-center py-3 text-[11px]">
                      {isEditing ? (
                        <input
                          className="enms-input text-xs w-full text-center"
                          value={item.seuStatus}
                          onChange={(e) => onBoundaryChange(idx, 'seuStatus', e.target.value)}
                        />
                      ) : (
                        <span className={getSeuBadge(item.seuStatus)}>{item.seuStatus}</span>
                      )}
                    </td>

                    {isEditing && (
                      <td className="text-center py-3">
                        <button
                          onClick={() => onDeleteRow(idx)}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="حذف سطر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
