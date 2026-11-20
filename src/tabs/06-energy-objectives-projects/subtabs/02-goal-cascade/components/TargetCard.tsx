import React from 'react';
import { Pencil, Trash2, UserCheck, Calendar, Link as LinkIcon, PlusCircle } from 'lucide-react';
import { CascadedTargetItem, EnergyProjectItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface TargetCardProps {
  target: CascadedTargetItem;
  linkedProjects: EnergyProjectItem[];
  onEdit: (tgt: CascadedTargetItem) => void;
  onDelete: (id: string, title: string) => void;
  onAttachMoreProjects: (tgt: CascadedTargetItem) => void;
}

export const TargetCard: React.FC<TargetCardProps> = ({
  target,
  linkedProjects,
  onEdit,
  onDelete,
  onAttachMoreProjects,
}) => {
  return (
    <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-purple-500/40 transition-all flex flex-col gap-3 shadow-xs">
      {/* هدر هدف خرد */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {target.id}
          </span>
          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
            {target.kpiTitle}
          </h4>
          <span className="text-xs text-[var(--color-text-secondary)]">
            ({target.department} - {target.targetSeu})
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap justify-between lg:justify-end">
          <div className="flex items-center gap-2 bg-[var(--color-bg-app)] px-3 py-1 rounded-lg border border-[var(--color-border-subtle)]">
            <span className="text-[var(--color-text-muted)] text-[11px]">مبنا:</span>
            <strong className="font-mono">{toPersianDigits(target.baselineValue)} {target.baselineUnit}</strong>
            <span className="text-[var(--color-text-muted)]">←</span>
            <span className="text-[var(--color-text-muted)] text-[11px]">هدف:</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">{toPersianDigits(target.targetValue)} {target.targetUnit}</strong>
            <span className="enms-badge badge-success text-[10px] mr-1">
              {toPersianDigits(target.expectedSavingPct)}٪ بهبود
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(target)}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
              title="ویرایش هدف خرد"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(target.id, target.kpiTitle)}
              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="حذف هدف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* اطلاعات مسئولیت و مهلت */}
      <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)] flex-wrap">
        <span className="flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>مسئول: <strong className="text-[var(--color-text-secondary)]">{target.responsible}</strong></span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>سررسید: <strong className="font-mono text-[var(--color-text-secondary)]">{toPersianDigits(target.deadline)}</strong></span>
        </span>
      </div>

      {/* بخش پروژه‌های اقدام تخصیص‌یافته (پشتیبانی از چندین پروژه) */}
      <div className="mt-1 pt-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>پروژه‌های اقدام و برنامه‌های عملیاتی ({toPersianDigits(linkedProjects.length)} پروژه متصل):</span>
          </span>
          <button
            onClick={() => onAttachMoreProjects(target)}
            className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>مدیریت/اتصال پروژه‌ها</span>
          </button>
        </div>

        {linkedProjects.length === 0 ? (
          <div className="p-2.5 rounded-lg bg-[var(--color-bg-app)] text-[11px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] text-center">
            هنوز پروژه‌ای به این هدف متصل نشده است. از دکمه «مدیریت/اتصال پروژه‌ها» استفاده کنید.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {linkedProjects.map((p) => (
              <div
                key={p.id}
                className="p-2.5 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border-subtle)] flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                    {p.title}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
                    کد: <span className="text-[var(--color-primary)] font-bold">{p.id}</span> | مدیر: {p.projectManager}
                  </div>
                </div>

                <div className="shrink-0 text-left">
                  <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
                    {toPersianDigits(p.progressPct)}٪
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};