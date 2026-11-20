import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Compass,
  AlertOctagon,
  Plus,
  Trash2,
  TrendingUp,
  Search,
  Scale,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { OrganizationSwot, SwotItem } from '../../../../types';
import { toPersianDigits } from '../../../../utils/persianUtils';

interface SwotViewProps {
  swot?: OrganizationSwot;
  onChange?: (updated: OrganizationSwot) => void;
  isEditing?: boolean;
}

// تابع نرمال‌سازی داده‌ها برای تضمین مقداردهی صحیح
const normalizeItem = (item: any, fallbackCode: string): SwotItem => {
  if (typeof item === 'object' && item !== null) {
    const weight = typeof item.weight === 'number' ? item.weight : parseFloat(item.weight) || 0;
    const score = typeof item.score === 'number' ? item.score : parseInt(item.score, 10) || 1;
    const weightedScore =
      typeof item.weightedScore === 'number'
        ? item.weightedScore
        : parseFloat(item.weightedScore) || Number((weight * score).toFixed(4));

    return {
      code: String(item.code || fallbackCode).trim(),
      description: String(item.description || item.title || '').trim(),
      weight,
      score,
      weightedScore,
    };
  }
  return {
    code: fallbackCode,
    description: String(item || '').trim(),
    weight: 0.03,
    score: 2,
    weightedScore: 0.06,
  };
};

export const SwotView: React.FC<SwotViewProps> = ({ swot, onChange, isEditing = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'ife' | 'efe'>('all');

  // تبدیل ۴ ربع ماتریس به لیست اشیاء معتبر
  const strengths = useMemo(
    () => (swot?.internalStrengths || []).map((it, idx) => normalizeItem(it, `S${idx + 1}`)),
    [swot?.internalStrengths]
  );
  const weaknesses = useMemo(
    () => (swot?.internalWeaknesses || []).map((it, idx) => normalizeItem(it, `W${idx + 1}`)),
    [swot?.internalWeaknesses]
  );
  const opportunities = useMemo(
    () => (swot?.externalOpportunities || []).map((it, idx) => normalizeItem(it, `O${idx + 1}`)),
    [swot?.externalOpportunities]
  );
  const threats = useMemo(
    () => (swot?.externalThreats || []).map((it, idx) => normalizeItem(it, `T${idx + 1}`)),
    [swot?.externalThreats]
  );

  // محاسبات مجموع امتیازات موزون و اوزان
  const sWeightSum = strengths.reduce((acc, c) => acc + c.weight, 0);
  const sWeightedSum = strengths.reduce((acc, c) => acc + c.weightedScore, 0);

  const wWeightSum = weaknesses.reduce((acc, c) => acc + c.weight, 0);
  const wWeightedSum = weaknesses.reduce((acc, c) => acc + c.weightedScore, 0);

  const totalIfeWeight = sWeightSum + wWeightSum;
  const totalIfeScore = sWeightedSum + wWeightedSum;

  const oWeightSum = opportunities.reduce((acc, c) => acc + c.weight, 0);
  const oWeightedSum = opportunities.reduce((acc, c) => acc + c.weightedScore, 0);

  const tWeightSum = threats.reduce((acc, c) => acc + c.weight, 0);
  const tWeightedSum = threats.reduce((acc, c) => acc + c.weightedScore, 0);

  const totalEfeWeight = oWeightSum + tWeightSum;
  const totalEfeScore = oWeightedSum + tWeightedSum;

  // توابع اعمال تغییرات در استیت
  const updateQuadrant = (field: keyof OrganizationSwot, updatedList: SwotItem[]) => {
    const updatedSwot: OrganizationSwot = {
      internalStrengths: swot?.internalStrengths || [],
      internalWeaknesses: swot?.internalWeaknesses || [],
      externalOpportunities: swot?.externalOpportunities || [],
      externalThreats: swot?.externalThreats || [],
      ...swot,
      [field]: updatedList,
    };
    onChange?.(updatedSwot);
  };

  const getSourceList = (field: keyof OrganizationSwot): SwotItem[] => {
    if (field === 'internalStrengths') return strengths;
    if (field === 'internalWeaknesses') return weaknesses;
    if (field === 'externalOpportunities') return opportunities;
    return threats;
  };

  const handleFieldChange = (
    field: keyof OrganizationSwot,
    itemCode: string,
    key: keyof SwotItem,
    val: any
  ) => {
    const list = getSourceList(field);
    const targetIdx = list.findIndex((x) => x.code === itemCode);
    if (targetIdx === -1) return;

    const updated = [...list];
    const item = { ...updated[targetIdx], [key]: val };

    // بازتولید لحظه‌ای امتیاز موزون در صورت تغییر ضریب یا رتبه
    if (key === 'weight' || key === 'score') {
      const w = key === 'weight' ? Number(val) : item.weight;
      const s = key === 'score' ? Number(val) : item.score;
      item.weightedScore = Number((w * s).toFixed(4));
    }

    updated[targetIdx] = item;
    updateQuadrant(field, updated);
  };

  const handleAddItem = (field: keyof OrganizationSwot) => {
    const list = getSourceList(field);
    const prefix =
      field === 'internalStrengths'
        ? 'S'
        : field === 'internalWeaknesses'
        ? 'W'
        : field === 'externalOpportunities'
        ? 'O'
        : 'T';

    const newCode = `${prefix}${list.length + 1}`;
    const newItem: SwotItem = {
      code: newCode,
      description: 'شرح عامل استراتژیک جدید را وارد کنید...',
      weight: 0.03,
      score: prefix === 'S' || prefix === 'O' ? 4 : 2,
      weightedScore: prefix === 'S' || prefix === 'O' ? 0.12 : 0.06,
    };

    updateQuadrant(field, [...list, newItem]);
  };

  const handleDeleteItem = (field: keyof OrganizationSwot, itemCode: string) => {
    const list = getSourceList(field);
    const updated = list.filter((x) => x.code !== itemCode);
    updateQuadrant(field, updated);
  };

  // رندر جدول با کادرهای کاملاً ویرایش‌پذیر
  const renderTableSection = (
    title: string,
    englishTitle: string,
    field: keyof OrganizationSwot,
    items: SwotItem[],
    icon: React.ReactNode,
    badgeVariant: string
  ) => {
    const filtered = items.filter(
      (it) =>
        !searchTerm ||
        it.description.includes(searchTerm) ||
        it.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sectionWeight = items.reduce((acc, c) => acc + c.weight, 0);
    const sectionWeighted = items.reduce((acc, c) => acc + c.weightedScore, 0);

    return (
      <div className="enms-card flex flex-col mb-6">
        <div className="enms-card-header pb-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="enms-card-title flex items-center gap-2">
                <span>{title}</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">({englishTitle})</span>
              </h3>
              <span className="text-[11px] text-[var(--color-text-muted)]">
                تعداد: {toPersianDigits(items.length)} سطر • وزن کل:{' '}
                {toPersianDigits(sectionWeight.toFixed(2))} • امتیاز موزون:{' '}
                {toPersianDigits(sectionWeighted.toFixed(2))}
              </span>
            </div>
          </div>

          {isEditing && (
            <button
              onClick={() => handleAddItem(field)}
              className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              title="افزودن سطر جدید به این جدول"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن سطر جدید</span>
            </button>
          )}
        </div>

        <div className="enms-table-container">
          <table className="enms-table">
            <thead>
              <tr className="text-xs">
                <th className="text-center w-12 py-3">ردیف</th>
                <th className="text-center w-20 py-3">کد</th>
                <th className="text-right py-3 min-w-[320px]">شرح نقطه قوت یا ضعف / فرصت یا تهدید</th>
                <th className="text-center w-28 py-3">ضریب وزنی</th>
                <th className="text-center w-24 py-3">امتیاز</th>
                <th className="text-center w-28 py-3">امتیاز موزون</th>
                {isEditing && <th className="text-center w-14 py-3">عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr
                  key={item.code}
                  className="text-xs"
                >
                  <td className="text-center font-mono text-[var(--color-text-muted)] py-3">
                    {toPersianDigits(idx + 1)}
                  </td>

                  {/* ستون کد با امکان ویرایش */}
                  <td className="text-center py-3">
                    {isEditing ? (
                      <input
                        className="enms-input text-center font-mono text-xs w-16"
                        value={item.code}
                        onChange={(e) => handleFieldChange(field, item.code, 'code', e.target.value)}
                        placeholder="کد"
                      />
                    ) : (
                      <span className={`enms-badge ${badgeVariant} font-mono font-bold text-[11px]`}>
                        {item.code}
                      </span>
                    )}
                  </td>

                  {/* ستون شرح کامل با کادر متنی در حالت ویرایش */}
                  <td className="py-3 text-[var(--color-text-secondary)] leading-relaxed">
                    {isEditing ? (
                      <textarea
                        rows={2}
                        className="enms-textarea w-full text-xs leading-relaxed resize-none"
                        value={item.description}
                        onChange={(e) =>
                          handleFieldChange(field, item.code, 'description', e.target.value)
                        }
                        placeholder="شرح عامل را بنویسید..."
                      />
                    ) : (
                      <span className="block pr-1">{item.description}</span>
                    )}
                  </td>

                  {/* ستون ضریب وزنی */}
                  <td className="text-center font-mono text-[var(--color-text-primary)] py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.005"
                        min="0"
                        max="1"
                        className="w-20 enms-input text-center font-mono text-xs"
                        value={item.weight}
                        onChange={(e) =>
                          handleFieldChange(
                            field,
                            item.code,
                            'weight',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    ) : (
                      toPersianDigits(item.weight.toFixed(2))
                    )}
                  </td>

                  {/* ستون رتبه / امتیاز (۱ تا ۴) */}
                  <td className="text-center font-mono py-3">
                    {isEditing ? (
                      <select
                        className="enms-select text-xs font-mono"
                        value={item.score}
                        onChange={(e) =>
                          handleFieldChange(
                            field,
                            item.code,
                            'score',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                      >
                        <option value={1}>۱ (بسیار ضعیف)</option>
                        <option value={2}>۲ (نقطه ضعف)</option>
                        <option value={3}>۳ (بالاتر از میانگین)</option>
                        <option value={4}>۴ (نقطه قوت / عالی)</option>
                      </select>
                    ) : (
                      <span className="font-bold text-amber-500">{toPersianDigits(item.score)}</span>
                    )}
                  </td>

                  {/* ستون امتیاز موزون با محاسبه لحظه‌ای */}
                  <td className="text-center font-mono font-bold text-[var(--color-primary)] py-3">
                    {toPersianDigits(item.weightedScore.toFixed(2))}
                  </td>

                  {/* دکمه حذف سطر */}
                  {isEditing && (
                    <td className="text-center py-3">
                      <button
                        onClick={() => handleDeleteItem(field, item.code)}
                        className="text-rose-500 hover:text-rose-600 p-1.5 rounded transition-colors"
                        title="حذف این سطر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* سربرگ معرفی و کنترل‌ها */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="enms-logo-icon">
              <Compass className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success">بند ۴.۱ استاندارد ISO 50001:2018</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">IFE & EFE Strategic Evaluation</span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                ماتریس ارزیابی عوامل درونی (IFE) و بیرونی (EFE) صنایع سیمان کیاسر
              </h2>
            </div>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-2.5" />
            <input
              type="text"
              className="enms-input text-xs w-full pr-9 pl-3 py-1.5"
              placeholder="جستجو در بین عوامل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* کارت‌های خلاصه نتایج دقیق محاسبات ریاضی */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[var(--color-border)]">
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">مجموع عوامل داخلی (IFE)</span>
              <div className="text-lg font-bold font-mono text-[var(--color-primary)] mt-0.5">
                {toPersianDigits(totalIfeScore.toFixed(2))}
                <span className="text-xs text-[var(--color-text-muted)] font-sans mr-1">از ۴.۰۰</span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                وزن کل: {toPersianDigits(totalIfeWeight.toFixed(2))} • {toPersianDigits(strengths.length + weaknesses.length)} عامل
              </span>
            </div>
            <span className="enms-badge badge-warning text-[10px]">متمایل به ضعف</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">مجموع عوامل خارجی (EFE)</span>
              <div className="text-lg font-bold font-mono text-blue-500 mt-0.5">
                {toPersianDigits(totalEfeScore.toFixed(2))}
                <span className="text-xs text-[var(--color-text-muted)] font-sans mr-1">از ۴.۰۰</span>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                وزن کل: {toPersianDigits(totalEfeWeight.toFixed(2))} • {toPersianDigits(opportunities.length + threats.length)} عامل
              </span>
            </div>
            <span className="enms-badge badge-success text-[10px]">فرصت‌های بالا</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">موقعیت در ماتریس IE</span>
              <span className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5 block">ناحیه راهبردهای WO</span>
              <span className="text-[10px] text-[var(--color-primary)] block mt-0.5">
                خانه ۵ (استراتژی‌های محافظه‌کارانه)
              </span>
            </div>
            <span className="enms-badge badge-neutral font-mono text-[10px]">WO-1 .. WO-8</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block">تمرکز بر گلوگاه‌های انرژی</span>
              <span className="text-sm font-bold text-rose-500 mt-0.5 block">W1 و W2 و W9 و T15</span>
              <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">بیشترین وزن در توقف و مصارف</span>
            </div>
            <span className="enms-badge badge-danger text-[10px]">اولویت EnMS</span>
          </div>
        </div>

        {/* فیلتر تب‌های نمایش */}
        <div className="enms-tab-pills mt-4 pt-3 border-t border-[var(--color-border)] flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`enms-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
          >
            نمایش یکپارچه همه عوامل ({toPersianDigits(strengths.length + weaknesses.length + opportunities.length + threats.length)} سطر)
          </button>
          <button
            onClick={() => setActiveTab('ife')}
            className={`enms-tab-pill ${activeTab === 'ife' ? 'active' : ''}`}
          >
            فقط ماتریس عوامل داخلی IFE ({toPersianDigits(strengths.length + weaknesses.length)} سطر)
          </button>
          <button
            onClick={() => setActiveTab('efe')}
            className={`enms-tab-pill ${activeTab === 'efe' ? 'active' : ''}`}
          >
            فقط ماتریس عوامل خارجی EFE ({toPersianDigits(opportunities.length + threats.length)} سطر)
          </button>
        </div>
      </div>

      {/* جداول تفکیکی */}
      {(activeTab === 'all' || activeTab === 'ife') && (
        <>
          {renderTableSection(
            'نقاط قوت درونی (جدول IFE)',
            'Internal Strengths',
            'internalStrengths',
            strengths,
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />,
            'badge-success'
          )}

          {renderTableSection(
            'نقاط ضعف درونی (جدول IFE)',
            'Internal Weaknesses',
            'internalWeaknesses',
            weaknesses,
            <AlertTriangle className="w-5 h-5 text-amber-500" />,
            'badge-warning'
          )}
        </>
      )}

      {(activeTab === 'all' || activeTab === 'efe') && (
        <>
          {renderTableSection(
            'فرصت‌های بیرونی (جدول EFE)',
            'External Opportunities',
            'externalOpportunities',
            opportunities,
            <TrendingUp className="w-5 h-5 text-blue-500" />,
            'badge-info'
          )}

          {renderTableSection(
            'تهدیدهای بیرونی (جدول EFE)',
            'External Threats',
            'externalThreats',
            threats,
            <AlertOctagon className="w-5 h-5 text-rose-500" />,
            'badge-danger'
          )}
        </>
      )}
    </div>
  );
};

export default SwotView;