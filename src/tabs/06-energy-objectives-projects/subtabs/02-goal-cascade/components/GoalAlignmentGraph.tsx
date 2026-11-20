import React from 'react';
import { Compass, Target, FolderKanban, AlertTriangle, Plus, ChevronLeft, Link as LinkIcon } from 'lucide-react';
import { CascadedTargetItem, EnergyProjectItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';
import { BscStrategyItem } from '../GoalCascadeView';

interface GoalAlignmentGraphProps {
  strategies: BscStrategyItem[];
  targets: CascadedTargetItem[];
  projects: EnergyProjectItem[];
  onSelectTarget?: (tgt: CascadedTargetItem) => void;
  onAddTargetForStrategy?: (stratCode: string) => void;
}

export const GoalAlignmentGraph: React.FC<GoalAlignmentGraphProps> = ({
  strategies,
  targets,
  projects,
  onSelectTarget,
  onAddTargetForStrategy,
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* راهنمای چارت */}
      <div className="p-4 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h3 className="font-bold text-[var(--color-text-primary)]">
            نمای گراف درختی و ساختار سلسله‌مراتبی اهداف (Alignment Tree Topology)
          </h3>
          <p className="text-[var(--color-text-muted)] mt-0.5">
            ارتباط شفاف و مستقیم: هر استراتژی کلان شاخه‌های اهداف خرد و سپس پروژه‌های زیرمجموعه خود را به تفکیک نشان می‌دهد.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> سطح ۱: استراتژی کلان
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> سطح ۲: مقصد خرد SEU
          </span>
          <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span> سطح ۳: پروژه اقدام
          </span>
        </div>
      </div>

      {/* خوشه‌های درختی مستقل برای هر استراتژی کلان */}
      <div className="flex flex-col gap-8">
        {strategies.map((strat) => {
          // استخراج تمام مقاصد خرد متعلق به این استراتژی
          const relatedTargets = targets.filter((t) => {
            const codes = t.strategicCodes || [t.strategicCode];
            return codes.some((c) => c.includes(strat.code) || strat.code.includes(c));
          });

          // محاسبه پیشرفت تجمیعی این استراتژی
          let totalProjProgress = 0;
          let totalProjCount = 0;

          relatedTargets.forEach((t) => {
            const linked = projects.filter((p) => (t.linkedProjectIds || []).includes(p.id));
            linked.forEach((p) => {
              totalProjProgress += p.progressPct;
              totalProjCount++;
            });
          });

          const stratProgress = totalProjCount > 0 ? Math.round(totalProjProgress / totalProjCount) : 0;

          return (
            <div
              key={strat.code}
              className="p-5 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xs flex flex-col gap-4 relative"
            >
              {/* بخش سطح ۱: کارت استراتژی والد */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/25">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white shadow-xs tracking-wider">
                    {strat.code}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {strat.title}
                      </h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[var(--color-bg-card)] border border-purple-500/30 text-purple-600 dark:text-purple-400 font-medium">
                        منظر BSC: {strat.perspective || 'فرآیندهای داخلی'}
                      </span>
                    </div>
                    {strat.description && (
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {strat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-left">
                    <span className="text-[11px] text-[var(--color-text-muted)] block">پیشرفت تجمیعی کلان:</span>
                    <strong className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                      {toPersianDigits(stratProgress)}٪
                    </strong>
                  </div>
                  <button
                    onClick={() => onAddTargetForStrategy && onAddTargetForStrategy(strat.code)}
                    className="enms-button enms-button-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ هدف خرد جدید</span>
                  </button>
                </div>
              </div>

              {/* خطوط اتصال و شاخه‌های زیرمجموعه (سطح ۲ و ۳) */}
              {relatedTargets.length === 0 ? (
                /* حالت عدم انطباق: استراتژی شاخص انرژی دارد اما هدف خرد ندارد */
                <div className="mr-6 pr-4 border-r-2 border-dashed border-amber-500/50 py-3">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold block">عدم انطباق با بند ۶.۲: فاقد مقصد کمّی خرد (Target)</span>
                        <span className="text-[11px] text-[var(--color-text-muted)] mt-0.5 block">
                          برای شاخص‌های این استراتژی هنوز هیچ هدف مشخصی برای تجهیزات بارز (SEU) تعیین نشده است.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddTargetForStrategy && onAddTargetForStrategy(strat.code)}
                      className="enms-button bg-amber-600 hover:bg-amber-700 text-white !py-1.5 !px-3 text-xs shrink-0 flex items-center gap-1 self-end sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>تعریف هدف خرد برای رفع نقص</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* لیست شاخه‌ای اهداف خرد و پروژه‌های زیرمجموعه */
                <div className="mr-4 pr-4 border-r-2 border-purple-500/40 flex flex-col gap-5 py-2">
                  {relatedTargets.map((tgt) => {
                    const linkedProjects = projects.filter((p) =>
                      (tgt.linkedProjectIds || []).includes(p.id)
                    );

                    // محاسبه درصد پیشرفت هدف خرد از پروژه‌ها
                    const tgtProgress =
                      linkedProjects.length > 0
                        ? Math.round(
                            linkedProjects.reduce((acc, p) => acc + p.progressPct, 0) /
                              linkedProjects.length
                          )
                        : 0;

                    return (
                      <div key={tgt.id} className="flex flex-col gap-3 relative">
                        {/* کارت سطح ۲: هدف خرد SEU */}
                        <div
                          onClick={() => onSelectTarget && onSelectTarget(tgt)}
                          className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs relative"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              {tgt.id}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs font-bold text-[var(--color-text-primary)]">
                                  {tgt.kpiTitle}
                                </h5>
                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                  ({tgt.department} - {tgt.targetSeu})
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 flex items-center gap-2 font-mono">
                                <span>مبنا: {toPersianDigits(tgt.baselineValue)} {tgt.baselineUnit}</span>
                                <span>←</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  هدف: {toPersianDigits(tgt.targetValue)} {tgt.targetUnit} ({toPersianDigits(tgt.expectedSavingPct)}٪ بهبود)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            <div className="text-left">
                              <span className="text-[10px] text-[var(--color-text-muted)] block">پیشرفت فیزیکی:</span>
                              <strong className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {toPersianDigits(tgtProgress)}٪
                              </strong>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                              {toPersianDigits(linkedProjects.length)} پروژه
                            </span>
                          </div>
                        </div>

                        {/* کارت‌های سطح ۳: پروژه‌های اقدام مستقیماً زیر دست این هدف خرد */}
                        {linkedProjects.length > 0 && (
                          <div className="mr-6 pr-4 border-r-2 border-emerald-500/30 grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {linkedProjects.map((p) => (
                              <div
                                key={p.id}
                                className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-cyan-500/20 flex items-center justify-between gap-2"
                              >
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5">
                                    <LinkIcon className="w-3 h-3 text-cyan-600 shrink-0" />
                                    <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                                      {p.title}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-mono">
                                    کد: <span className="text-cyan-600 font-bold">{p.id}</span> | فاز: {p.phase}
                                  </div>
                                </div>
                                <div className="text-left shrink-0">
                                  <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                    {toPersianDigits(p.progressPct)}٪
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalAlignmentGraph;