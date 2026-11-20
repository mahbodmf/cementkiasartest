import React, { useState } from 'react';
import {
  Kanban,
  Clock,
  Calendar,
  CheckSquare,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { EnergyProjectItem } from '../../../../types';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { ProjectModal } from './ProjectModal';

interface ProjectTrackerViewProps {
  projects: EnergyProjectItem[];
  onAddProject?: (p: EnergyProjectItem) => void;
  onUpdateProject?: (p: EnergyProjectItem) => void;
  onDeleteProject?: (id: string) => void;
}

export const ProjectTrackerView: React.FC<ProjectTrackerViewProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<EnergyProjectItem | null>(null);

  const filtered = projects.filter((p) =>
    filterPhase === 'all' ? true : p.phase === filterPhase
  );

  const handleOpenAdd = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: EnergyProjectItem) => {
    setEditingProject(p);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`آیا از حذف پروژه "${title}" با کد ${id} اطمینان دارید؟`)) {
      if (onDeleteProject) {
        onDeleteProject(id);
      }
    }
  };

  const handleSave = (item: EnergyProjectItem) => {
    if (editingProject && onUpdateProject) {
      onUpdateProject(item);
    } else if (onAddProject) {
      onAddProject(item);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" dir="rtl">
      {/* جدول کارتابل پیشرفت پروژه‌ها */}
      <div className="enms-card p-0 overflow-hidden shadow-sm">
        <div className="p-4 bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Kanban className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              کارتابل اجرایی پروژه‌های بهینه‌سازی انرژی (Action Plan Tracker)
            </span>

            <div className="flex items-center gap-1 enms-tab-pills !p-0.5 text-xs mr-2">
              {['all', 'طراحی و تأمین', 'اجرا و نصب', 'تحویل و صحه‌گذاری', 'پایان‌یافته'].map((ph) => (
                <button
                  key={ph}
                  onClick={() => setFilterPhase(ph)}
                  className={`enms-tab-pill !py-1 !px-2.5 ${filterPhase === ph ? 'active' : ''}`}
                >
                  {ph === 'all' ? 'همه فازها' : ph}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="enms-button enms-button-primary text-xs flex items-center gap-1.5 shrink-0 justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف پروژه بهینه‌سازی جدید</span>
          </button>
        </div>

        <div className="enms-table-container border-0 rounded-none overflow-x-auto">
          <table className="enms-table text-xs">
            <thead>
              <tr>
                <th className="w-16 text-center">کد</th>
                <th className="min-w-[200px]">عنوان پروژه</th>
                <th className="w-24 text-center">دپارتمان</th>
                <th className="w-28 text-center">مدیر پروژه</th>
                <th className="w-28 text-center">فاز اجرایی</th>
                <th className="w-36 text-center">پیشرفت فیزیکی</th>
                <th className="w-28 text-center">بودجه / هزینه‌کرد (م.ر)</th>
                <th className="w-24 text-center">سررسید</th>
                <th className="w-24 text-center">وضعیت</th>
                <th className="w-16 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="text-center font-mono font-bold text-[var(--color-primary)]">
                    {p.id}
                  </td>
                  <td className="font-bold text-[var(--color-text-primary)]">
                    <div>{p.title}</div>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-normal">
                      تجهیز: {p.targetSEU}
                    </span>
                  </td>
                  <td className="text-center text-[var(--color-text-secondary)]">
                    {p.department}
                  </td>
                  <td className="text-center text-[var(--color-text-primary)]">
                    {p.projectManager}
                  </td>
                  <td className="text-center">
                    <span className="enms-badge badge-info text-[10px]">{p.phase}</span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-[var(--color-border)] rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${p.progressPct}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[11px] text-[var(--color-text-primary)] w-8">
                        {toPersianDigits(p.progressPct)}٪
                      </span>
                    </div>
                  </td>
                  <td className="text-center font-mono text-[11px]">
                    <span className="text-[var(--color-text-primary)] font-bold">
                      {formatPersianNumber(p.capexBudgetMillionRials)}
                    </span>
                    <span className="text-[var(--color-text-muted)] mx-0.5">/</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {formatPersianNumber(p.capexSpentMillionRials)}
                    </span>
                  </td>
                  <td className="text-center font-mono text-[11px] text-[var(--color-text-muted)]">
                    {toPersianDigits(p.plannedEndDate)}
                  </td>
                  <td className="text-center">
                    <span
                      className={`enms-badge text-[10px] ${
                        p.status === 'پایان‌یافته'
                          ? 'badge-success'
                          : p.status === 'معوق'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        title="ویرایش پروژه"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="حذف پروژه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال ایجاد و ویرایش پروژه */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingProject}
        existingCount={projects.length}
      />
    </div>
  );
};

export default ProjectTrackerView;
