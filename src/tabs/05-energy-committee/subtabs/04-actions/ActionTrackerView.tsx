import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  User,
  Sliders,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  History,
  GitCommit,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import {
  safeFetchGovernanceJson,
  DEFAULT_ACTION_ITEMS,
} from '../../utils/committeeDataService';

export const ActionTrackerView: React.FC = () => {
  const [actions, setActions] = useState<any[]>(DEFAULT_ACTION_ITEMS);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

  useEffect(() => {
    safeFetchGovernanceJson('action-items.json', DEFAULT_ACTION_ITEMS)
      .then((data) => setActions(Array.isArray(data) && data.length > 0 ? data : DEFAULT_ACTION_ITEMS))
      .catch(() => setActions(DEFAULT_ACTION_ITEMS));
  }, []);

  // فیلتر کردن اقدامات
  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      const matchStatus = statusFilter === 'all' || act.status === statusFilter;
      const matchPriority = priorityFilter === 'all' || act.priority === priorityFilter;
      const matchSearch =
        !searchQuery ||
        act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.responsible.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.targetSeu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.meetingNumber.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchPriority && matchSearch;
    });
  }, [actions, statusFilter, priorityFilter, searchQuery]);

  // شاخص‌های داشبورد کلان تصمیمات
  const totalCount = actions.length;
  const completedCount = actions.filter((a) => a.status === 'انجام‌شده').length;
  const inProgressCount = actions.filter((a) => a.status === 'در حال اقدام').length;
  const overdueCount = actions.filter((a) => a.status === 'معوق').length;
  const criticalCount = actions.filter((a) => a.priority === 'فوق بحرانی' || a.priority === 'بحرانی').length;

  const totalDelayDays = actions.reduce((acc, a) => acc + (a.delayDays || 0), 0);
  const totalBudget = actions.reduce((acc, a) => acc + (a.budgetRials || 0), 0);
  const totalActualCost = actions.reduce((acc, a) => acc + (a.actualCostRials || 0), 0);
  const overallProgressPct =
    totalCount > 0 ? Math.round(actions.reduce((acc, a) => acc + (a.progressPct || 0), 0) / totalCount) : 0;

  // تغییر دستی درصد پیشرفت
  const handleProgressChange = (id: string, newPct: number) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const status = newPct >= 100 ? 'انجام‌شده' : newPct > 0 ? 'در حال اقدام' : a.status;
          return { ...a, progressPct: newPct, status };
        }
        return a;
      })
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedActionId(expandedActionId === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ۱. داشبورد کلان وضعیت تصمیمات کمیته انرژی (Executive Decision Ribbon) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* کل تصمیمات و مصوبات */}
        <div className="enms-kpi-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>کل مصوبات ابلاغی</span>
            <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-text-primary)] mt-1">
            {toPersianDigits(totalCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مصوبه</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block font-mono">
            {toPersianDigits(criticalCount)} مصوبه در اولویت بحرانی
          </span>
        </div>

        {/* وضعیت تکمیل‌شده */}
        <div className="enms-kpi-card p-4">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
            <span>تکمیل‌شده (۱۰۰٪)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {toPersianDigits(completedCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
          </div>
          <span className="text-[10px] text-emerald-500 mt-1 block">
            تحقق ۱۰۰٪ اهداف بدون انحراف
          </span>
        </div>

        {/* جاری در حال اقدام */}
        <div className="enms-kpi-card p-4">
          <div className="flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400">
            <span>در حال اقدام / پیگیری</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {toPersianDigits(inProgressCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
          </div>
          <span className="text-[10px] text-cyan-500 mt-1 block">
            در برنامه زمان‌بندی دپارتمان‌ها
          </span>
        </div>

        {/* مصوبات معوق و انحراف زمانی */}
        <div className="enms-kpi-card p-4">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
            <span>معوق / دارای انحراف</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {toPersianDigits(overdueCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">مورد</span>
          </div>
          <span className="text-[10px] text-rose-500 mt-1 block font-mono">
            مجموع تاخیر: {toPersianDigits(totalDelayDays)} روز تقویمی
          </span>
        </div>

        {/* شاخص میانگین تحقق و پیشرفت کل */}
        <div className="enms-kpi-card p-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
            <span>میانگین پیشرفت فیزیکی</span>
            <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-primary)] mt-1">
            {toPersianDigits(overallProgressPct)}٪
          </div>
          <div className="enms-progress-bar h-1.5 mt-2">
            <div
              className="enms-progress-fill"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ۲. جدول ماتریس جامع با قابلیت باز شدن جزئیات، انحراف زمانی و چرخه گردش */}
      <div className="enms-card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                ماتریس پایش، پیشرفت، انحراف زمانی و ردگیری مصوبات کمیته انرژی
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                برای مشاهده جزئیات گردش جلسات، علل تاخیر و اقدامات اصلاحی روی هر ردیف کلیک کنید
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* فیلتر وضعیت */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="enms-select text-xs"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="در حال اقدام">در حال اقدام</option>
              <option value="انجام‌شده">تکمیل‌شده</option>
              <option value="معوق">معوق و دارای تاخیر</option>
            </select>

            {/* فیلتر اولویت */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="enms-select text-xs"
            >
              <option value="all">همه اولویت‌ها</option>
              <option value="فوق بحرانی">فوق بحرانی</option>
              <option value="بحرانی">بحرانی</option>
              <option value="متوسط">متوسط</option>
            </select>

            {/* جستجو */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی اقدام، کد جلسه، SEU..."
                className="enms-input text-xs pr-8 pl-3 w-52"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>

        <div className="enms-table-container">
          <table className="enms-table text-xs">
            <thead>
              <tr>
                <th className="w-10 text-center">جزئیات</th>
                <th className="w-28">کد اقدام / جلسه</th>
                <th className="min-w-[240px]">شرح مصوبه کمیته عالی</th>
                <th>مسئول اجرا / واحد</th>
                <th className="w-28 text-center">مهلت (ددلاین)</th>
                <th className="w-28 text-center">انحراف زمانی</th>
                <th>تجهیز بارز (SEU)</th>
                <th className="w-32 text-center">پیشرفت فیزیکی</th>
                <th className="w-24 text-center">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-[var(--color-text-muted)]">
                    هیچ مصوبه‌ای با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredActions.map((act) => {
                  const isDone = act.status === 'انجام‌شده';
                  const isLate = act.status === 'معوق' || (act.delayDays && act.delayDays > 0 && !isDone);
                  const isExpanded = expandedActionId === act.id;

                  return (
                    <React.Fragment key={act.id}>
                      <tr
                        onClick={() => toggleExpand(act.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-emerald-500/10'
                            : isDone
                            ? 'opacity-85'
                            : ''
                        }`}
                      >
                        {/* آیکون باز/بسته شدن کشو */}
                        <td className="text-center text-[var(--color-text-muted)]">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-[var(--color-primary)] mx-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mx-auto" />
                          )}
                        </td>

                        {/* کد اقدام و جلسه مبدا */}
                        <td>
                          <div className="flex flex-col">
                            <span className="font-mono text-[var(--color-primary)] font-bold">
                              {act.id}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-card-subtle)] px-1 rounded">
                                {act.meetingNumber}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                                ({act.fiscalQuarter})
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* عنوان مصوبه و اولویت */}
                        <td>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`enms-badge text-[9px] ${
                                act.priority === 'فوق بحرانی'
                                  ? 'badge-danger'
                                  : act.priority === 'بحرانی'
                                  ? 'badge-warning'
                                  : 'badge-neutral'
                              }`}
                            >
                              {act.priority}
                            </span>
                            <span className="font-medium text-[var(--color-text-primary)]">
                              {act.title}
                            </span>
                          </div>
                          {act.resultSummary && (
                            <span className="text-[11px] text-[var(--color-text-muted)] block line-clamp-1">
                              {act.resultSummary}
                            </span>
                          )}
                        </td>

                        {/* واحد و مسئول */}
                        <td>
                          <span className="text-[var(--color-text-primary)] block font-medium">
                            {act.responsible}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">
                            {act.department}
                          </span>
                        </td>

                        {/* مهلت */}
                        <td className="font-mono text-center text-[var(--color-text-secondary)]">
                          {toPersianDigits(act.deadline)}
                        </td>

                        {/* انحراف زمانی (Schedule Variance) */}
                        <td className="text-center font-mono text-xs">
                          {isDone ? (
                            <span className="enms-badge badge-success text-[11px]">
                              به‌موقع
                            </span>
                          ) : act.delayDays && act.delayDays > 0 ? (
                            <span className="enms-badge badge-danger text-[11px] flex items-center justify-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{toPersianDigits(act.delayDays)} روز تأخیر</span>
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-muted)] text-[11px]">در برنامه</span>
                          )}
                        </td>

                        {/* SEU */}
                        <td>
                          <span className="text-[var(--color-text-secondary)] font-mono text-[11px] flex items-center gap-1">
                            <Cpu className="w-3 h-3 text-cyan-500 shrink-0" />
                            <span className="truncate max-w-[140px]" title={act.targetSeu}>
                              {act.targetSeu || '-'}
                            </span>
                          </span>
                        </td>

                        {/* درصد پیشرفت فیزیکی تعاملی */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={act.progressPct}
                              onChange={(e) => handleProgressChange(act.id, Number(e.target.value))}
                              className="w-16 accent-emerald-500 cursor-pointer h-1.5 bg-[var(--color-bg-card-subtle)] rounded-lg"
                            />
                            <span className="font-mono text-xs text-[var(--color-text-primary)] w-8 text-left">
                              {toPersianDigits(act.progressPct)}٪
                            </span>
                          </div>
                        </td>

                        {/* برچسب وضعیت */}
                        <td className="text-center">
                          <span
                            className={`enms-badge ${
                              isDone ? 'badge-success' : isLate ? 'badge-danger' : 'badge-warning'
                            }`}
                          >
                            {act.status}
                          </span>
                        </td>
                      </tr>

                      {/* ۳. پنل آکاردئونی تفصیلی گردش کار و علل انحراف (Drill-Down Drawer) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0 bg-[var(--color-bg-card-subtle)] border-b border-[var(--color-border)]">
                            <div className="p-4 space-y-4 text-xs animate-fadeIn">
                              {/* ردیف بالا: خلاصه تصمیم صورت‌جلسه و بودجه */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                                  <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">
                                    صورت‌جلسه مبدا تصمیم‌گیری:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                                    <strong className="text-[var(--color-text-primary)]">
                                      {act.meetingNumber} - {act.meetingTitle || 'جلسه کمیته عالی'}
                                    </strong>
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                                  <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">
                                    وضعیت مالی و بودجه تخصیص‌یافته:
                                  </span>
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono text-[var(--color-text-secondary)]">
                                      بودجه: {toPersianDigits(formatPersianNumber(act.budgetRials || 0))} ریال
                                    </span>
                                    <span className="font-mono text-[var(--color-primary)] font-bold">
                                      هزینه: {toPersianDigits(formatPersianNumber(act.actualCostRials || 0))} ریال
                                    </span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                                  <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">
                                    روش راستی‌آزمایی و اثربخشی (Verification):
                                  </span>
                                  <span className="text-[var(--color-text-secondary)] leading-snug block">
                                    {act.verificationMethod || 'بررسی در ممیزی داخلی سیستم مدیریت انرژی'}
                                  </span>
                                </div>
                              </div>

                              {/* ردیف پایین: گردش مذاکرات در جلسات و علل تاخیر */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* تاریخچه و چرخه پیگیری در جلسات متوالی */}
                                <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2.5">
                                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)] text-cyan-600 dark:text-cyan-400 font-bold">
                                    <History className="w-4 h-4" />
                                    <span>گردش پیگیری موضوع و طرح در جلسات متوالی:</span>
                                  </div>

                                  <div className="space-y-2 pr-1">
                                    {(!act.history || act.history.length === 0) ? (
                                      <p className="text-[var(--color-text-muted)] text-[11px]">این مصوبه تنها در جلسه اولیه مطرح شده است.</p>
                                    ) : (
                                      act.history.map((h: any, hIdx: number) => (
                                        <div key={hIdx} className="flex items-start gap-2.5 relative">
                                          <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                                          <div className="flex-1">
                                            <div className="flex items-center justify-between text-[11px]">
                                              <strong className="text-[var(--color-text-primary)]">{h.meeting}</strong>
                                              <span className="enms-badge badge-neutral text-[9px]">
                                                {h.status}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                                              {h.note}
                                            </p>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>

                                {/* ریشه‌یابی علل انحراف و تصمیمات جبرانی */}
                                <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-2.5">
                                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)] text-rose-600 dark:text-rose-400 font-bold">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>ریشه‌یابی علل تاخیر (RCA) و دستورات جبرانی:</span>
                                  </div>

                                  {(!act.delayRootCauses || act.delayRootCauses.length === 0) ? (
                                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                                      <span>هیچ انحراف یا مانع اجرایی ثبت نشده است؛ عملکرد مطابق برنامه مصوب.</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <span className="text-[11px] text-[var(--color-text-muted)] font-bold block">
                                        موانع و علل بروز تاخیر:
                                      </span>
                                      <ul className="space-y-1 list-disc pr-4 text-[var(--color-text-secondary)] text-[11px]">
                                        {act.delayRootCauses.map((rc: string, rcIdx: number) => (
                                          <li key={rcIdx}>{rc}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {act.correctiveNotes && (
                                    <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-[11px]">
                                      <span className="text-[var(--color-text-muted)] font-bold block mb-1">
                                        تصمیم جبرانی و نتیجه پایش:
                                      </span>
                                      <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                        {act.correctiveNotes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActionTrackerView;