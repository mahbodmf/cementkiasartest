import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  FileText,
  Download,
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  Printer,
  ChevronLeft,
  Building,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { FISCAL_QUARTERS } from '../../../../utils/fiscalYearUtils';
import {
  safeFetchGovernanceJson,
  DEFAULT_MEETING_MINUTES,
} from '../../utils/committeeDataService';

export const CommitteeArchiveView: React.FC = () => {
  const [archiveList, setArchiveList] = useState<any[]>(DEFAULT_MEETING_MINUTES);
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<any | null>(DEFAULT_MEETING_MINUTES[0]);

  useEffect(() => {
    safeFetchGovernanceJson('meeting-minutes.json', DEFAULT_MEETING_MINUTES)
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : DEFAULT_MEETING_MINUTES;
        setArchiveList(list);
        if (list.length > 0) setPreviewItem(list[0]);
      })
      .catch(() => {
        setArchiveList(DEFAULT_MEETING_MINUTES);
        setPreviewItem(DEFAULT_MEETING_MINUTES[0]);
      });
  }, []);

  // فیلتر داده‌ها
  const filteredList = useMemo(() => {
    return archiveList.filter((item) => {
      const matchQuarter = selectedQuarter === 'all' || item.fiscalQuarter === selectedQuarter;
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meetingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.fiscalYear.includes(searchQuery) ||
        item.agenda?.some((ag: string) => ag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchQuarter && matchSearch;
    });
  }, [archiveList, selectedQuarter, searchQuery]);

  // چاپ برگه رسمی آرشیو
  const handlePrint = (item: any) => {
    setPreviewItem(item);
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* سربرگ و فیلترهای آرشیو */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-primary)]">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۷.۵ و ۹.۳ استاندارد ISO 50001</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">کنترل اطلاعات مدون</span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                مخزن اسناد، سوابق ممیزی و آرشیو صورت‌جلسات کمیته انرژی
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* انتخاب فصل مالی کیاسر */}
            <div className="flex items-center p-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] text-xs">
              <button
                onClick={() => setSelectedQuarter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  selectedQuarter === 'all'
                    ? 'enms-button-primary text-white font-bold shadow-xs'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                کل فصول
              </button>
              {FISCAL_QUARTERS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuarter(q.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all font-mono ${
                    selectedQuarter === q.id
                      ? 'enms-button-primary text-white font-bold shadow-xs'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                  title={q.title}
                >
                  {q.id}
                </button>
              ))}
            </div>

            {/* جستجو در آرشیو */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در موضوع، شماره، سال..."
                className="enms-input text-xs pr-8 pl-3 w-52"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* شبکه کارت‌های اسناد و پیش‌نمایش */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لیست اسناد آرشیو شده (۲ ستون در دسکتاپ) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pb-1">
            <span>تعداد پرونده‌های یافت‌شده: {toPersianDigits(filteredList.length)} صورت‌جلسه</span>
            <span className="font-mono">مبنای سال مالی: ۱ دی لغایت ۳۰ آذر</span>
          </div>

          {filteredList.length === 0 ? (
            <div className="enms-card p-12 text-center text-[var(--color-text-muted)] text-xs">
              هیچ پرونده‌ای منطبق با فیلترهای انتخابی یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredList.map((doc) => {
                const isSelected = previewItem?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-[var(--color-bg-card-subtle)] border-[var(--color-primary-border)] shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-primary-border)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-[var(--color-primary)] text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {doc.meetingNumber}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-text-muted)]">
                          <span>{doc.fiscalQuarter}</span>
                          <span>•</span>
                          <span>{doc.fiscalYear}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[var(--color-text-primary)] leading-snug line-clamp-2">
                        {doc.title}
                      </h4>

                      <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-[11px] text-[var(--color-text-secondary)]">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">تاریخ ثبت:</span>
                          <span className="font-mono">{toPersianDigits(doc.date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">رئیس جلسه:</span>
                          <span>{doc.chairperson}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-muted)]">تعداد مصوبات:</span>
                          <span className="text-[var(--color-primary)] font-bold font-mono">
                            {toPersianDigits(doc.decisions?.length || 0)} مورد
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewItem(doc)}
                        className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>مشاهده پرونده</span>
                      </button>

                      <button
                        onClick={() => handlePrint(doc)}
                        className="enms-button enms-button-secondary text-[11px] py-1 px-2.5 flex items-center gap-1"
                        title="چاپ سند رسمی"
                      >
                        <Printer className="w-3 h-3 text-[var(--color-text-muted)]" />
                        <span>چاپ</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* پنل پیش‌نمایش سند رسمی (ستون راست) */}
        <div className="lg:col-span-1">
          {previewItem ? (
            <div className="enms-card p-5 sticky top-4 space-y-4">
              <div className="pb-3 border-b border-[var(--color-border)] flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>پیش‌نمایش سند معتبر ممیزی</span>
                </span>
                <span className="enms-badge badge-neutral text-[10px] font-mono">
                  {previewItem.meetingNumber}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-[var(--color-text-primary)] leading-relaxed">
                  {previewItem.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-muted)] mt-2 font-mono">
                  <span>تاریخ: {toPersianDigits(previewItem.date)}</span>
                  <span>|</span>
                  <span>فصل: {previewItem.fiscalQuarter}</span>
                </div>
              </div>

              {/* دستورات جلسه */}
              <div className="p-3 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[11px] space-y-1.5">
                <span className="text-[var(--color-text-muted)] font-bold block mb-1">دستورات جلسه:</span>
                <ul className="space-y-1 list-disc pr-4 text-[var(--color-text-secondary)]">
                  {previewItem.agenda?.map((ag: string, i: number) => (
                    <li key={i}>{ag}</li>
                  ))}
                </ul>
              </div>

              {/* مصوبات */}
              <div className="space-y-2 text-[11px]">
                <span className="text-[var(--color-text-muted)] font-bold block">فهرست مصوبات ابلاغی:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {previewItem.decisions?.map((dec: any, i: number) => (
                    <div key={i} className="p-2 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                      <div className="flex items-center justify-between text-[var(--color-primary)] font-mono font-bold text-[10px]">
                        <span>{dec.code}</span>
                        <span>{toPersianDigits(dec.deadline)}</span>
                      </div>
                      <p className="text-[var(--color-text-primary)] mt-0.5 leading-snug">{dec.title}</p>
                      <span className="text-[10px] text-[var(--color-text-muted)] block mt-1">مسئول: {dec.responsible}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center text-[10px] text-[var(--color-text-muted)]">
                <span>وضعیت امضا: کامل / تأیید مدیریت</span>
                <CheckCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              </div>
            </div>
          ) : (
            <div className="enms-card p-8 text-center text-[var(--color-text-muted)] text-xs">
              یک سند را جهت مشاهده پیش‌نمایش انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitteeArchiveView;