import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Layers,
  DollarSign,
  ArrowRightLeft,
  CheckCircle2,
  Printer,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import {
  safeFetchGovernanceJson,
  DEFAULT_COMMITTEE_CHARTER,
  DEFAULT_COMMITTEE_MEMBERS,
} from '../../utils/committeeDataService';

const STORAGE_KEY = 'enms_kiasar_committee_charter_data';

export const CommitteeCharterView: React.FC = () => {
  const [charterData, setCharterData] = useState<any>(DEFAULT_COMMITTEE_CHARTER);
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([
    ...DEFAULT_COMMITTEE_MEMBERS.steeringCommittee,
    ...DEFAULT_COMMITTEE_MEMBERS.technicalWorkingGroup,
  ]);
  const [activeTier, setActiveTier] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // متغیرهای ورودی جدید برای لیست‌ها
  const [newResponsibility, setNewResponsibility] = useState<string>('');
  const [newAuthority, setNewAuthority] = useState<string>('');
  const [newInputItem, setNewInputItem] = useState<string>('');
  const [newOutputItem, setNewOutputItem] = useState<string>('');

  // ۱. بارگذاری همزمان داده‌های نظام‌نامه و اعضای کمیته
  useEffect(() => {
    // بارگذاری لیست اعضا جهت منوهای کشویی
    safeFetchGovernanceJson('committee-members.json', DEFAULT_COMMITTEE_MEMBERS)
      .then((data) => {
        const steering = data?.steeringCommittee || [];
        const technical = data?.technicalWorkingGroup || [];
        setCommitteeMembers([...steering, ...technical]);
      })
      .catch(() => {
        setCommitteeMembers([
          ...DEFAULT_COMMITTEE_MEMBERS.steeringCommittee,
          ...DEFAULT_COMMITTEE_MEMBERS.technicalWorkingGroup,
        ]);
      });

    // بارگذاری داده‌های نظام‌نامه (ابتدا از کش محلی، سپس از فایل JSON)
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setCharterData(JSON.parse(cached));
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    safeFetchGovernanceJson('committee-charter.json', DEFAULT_COMMITTEE_CHARTER)
      .then((data) => setCharterData(data || DEFAULT_COMMITTEE_CHARTER))
      .catch(() => setCharterData(DEFAULT_COMMITTEE_CHARTER));
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charterData));
      setIsEditing(false);
      alert('تمامی تغییرات نظام‌نامه با موفقیت ذخیره شد.');
    } catch {
      alert('خطا در ذخیره‌سازی داده‌ها.');
    }
  };

  const handleResetToDefault = () => {
    if (!window.confirm('آیا از بازنشانی نظام‌نامه به مقادیر اولیه فایل JSON اطمینان دارید؟')) return;
    localStorage.removeItem(STORAGE_KEY);
    safeFetchGovernanceJson('committee-charter.json', DEFAULT_COMMITTEE_CHARTER)
      .then((data) => {
        setCharterData(data || DEFAULT_COMMITTEE_CHARTER);
        setIsEditing(false);
      });
  };

  const handleFieldChange = (field: string, val: string) => {
    setCharterData({ ...charterData, [field]: val });
  };

  // ویرایش فیلدهای ساختار سطوح (Tier Fields)
  const handleTierFieldChange = (tierNum: number, field: string, val: string) => {
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return { ...t, [field]: val };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
  };

  // ویرایش فیلدهای آستانه مالی
  const handleFinancialFieldChange = (tierNum: number, field: string, val: string) => {
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return {
          ...t,
          financialThresholds: {
            ...t.financialThresholds,
            [field]: val,
          },
        };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
  };

  // وظایف (Responsibilities)
  const handleAddResponsibility = (tierNum: number) => {
    if (!newResponsibility.trim()) return;
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return { ...t, responsibilities: [...(t.responsibilities || []), newResponsibility.trim()] };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
    setNewResponsibility('');
  };

  const handleDeleteResponsibility = (tierNum: number, index: number) => {
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return { ...t, responsibilities: t.responsibilities.filter((_: any, i: number) => i !== index) };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
  };

  // اختیارات (Authorities)
  const handleAddAuthority = (tierNum: number) => {
    if (!newAuthority.trim()) return;
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return { ...t, authorities: [...(t.authorities || []), newAuthority.trim()] };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
    setNewAuthority('');
  };

  const handleDeleteAuthority = (tierNum: number, index: number) => {
    const updatedTiers = charterData.structureTiers.map((t: any) => {
      if (t.tier === tierNum) {
        return { ...t, authorities: t.authorities.filter((_: any, i: number) => i !== index) };
      }
      return t;
    });
    setCharterData({ ...charterData, structureTiers: updatedTiers });
  };

  // ورودی‌های کمیته (Inputs)
  const handleAddInput = () => {
    if (!newInputItem.trim()) return;
    const updated = [...(charterData.interactionMechanism?.inputsToCommittee || []), newInputItem.trim()];
    setCharterData({
      ...charterData,
      interactionMechanism: { ...charterData.interactionMechanism, inputsToCommittee: updated },
    });
    setNewInputItem('');
  };

  const handleDeleteInput = (index: number) => {
    const updated = charterData.interactionMechanism?.inputsToCommittee?.filter((_: any, i: number) => i !== index);
    setCharterData({
      ...charterData,
      interactionMechanism: { ...charterData.interactionMechanism, inputsToCommittee: updated },
    });
  };

  // خروجی‌های کمیته (Outputs)
  const handleAddOutput = () => {
    if (!newOutputItem.trim()) return;
    const updated = [...(charterData.interactionMechanism?.outputsFromCommittee || []), newOutputItem.trim()];
    setCharterData({
      ...charterData,
      interactionMechanism: { ...charterData.interactionMechanism, outputsFromCommittee: updated },
    });
    setNewOutputItem('');
  };

  const handleDeleteOutput = (index: number) => {
    const updated = charterData.interactionMechanism?.outputsFromCommittee?.filter((_: any, i: number) => i !== index);
    setCharterData({
      ...charterData,
      interactionMechanism: { ...charterData.interactionMechanism, outputsFromCommittee: updated },
    });
  };

  if (!charterData) {
    return (
      <div className="enms-card p-8 text-center text-[var(--color-text-muted)]">
        در حال بارگذاری نظام‌نامه کمیته انرژی...
      </div>
    );
  }

  const currentTierData = charterData.structureTiers?.find((t: any) => t.tier === activeTier);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ۱. سربرگ اصلی سند با قابلیت ویرایش نام مصوب، دبیر و تاریخ */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="enms-badge badge-success font-semibold">بند ۵.۳ و ۹.۳ استاندارد ISO 50001:2018</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">کد سند: {charterData.documentCode}</span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={charterData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="enms-input text-base font-bold text-[var(--color-text-primary)] mt-2 w-full"
                placeholder="عنوان نظام‌نامه"
              />
            ) : (
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                {charterData.title}
              </h2>
            )}

            {/* بخش مصوب و دبیر جلسه با اتصال کرکره‌ای به اعضا */}
            <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)] flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>مصوب:</span>
                {isEditing ? (
                  <select
                    value={charterData.approvedBy}
                    onChange={(e) => handleFieldChange('approvedBy', e.target.value)}
                    className="enms-select text-xs py-1 px-2"
                  >
                    <option value={charterData.approvedBy}>{charterData.approvedBy}</option>
                    {committeeMembers.map((m) => (
                      <option key={m.id} value={`${m.name} (${m.position})`}>
                        {m.name} ({m.position})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-[var(--color-text-primary)]">{charterData.approvedBy}</strong>
                )}
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5 text-[var(--color-primary)] font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                <span>دبیر کمیته و نماینده مدیریت (EMR):</span>
                {isEditing ? (
                  <select
                    value={charterData.secretary}
                    onChange={(e) => handleFieldChange('secretary', e.target.value)}
                    className="enms-select text-xs py-1 px-2 text-[var(--color-primary)]"
                  >
                    <option value={charterData.secretary}>{charterData.secretary}</option>
                    {committeeMembers.map((m) => (
                      <option key={m.id} value={`${m.name} (${m.position})`}>
                        {m.name} ({m.position})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-[var(--color-text-primary)]">{charterData.secretary}</strong>
                )}
              </div>

              <span>•</span>

              <div className="flex items-center gap-1.5">
                <span>تاریخ اجرا:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={charterData.effectiveDate}
                    onChange={(e) => handleFieldChange('effectiveDate', e.target.value)}
                    className="enms-input text-xs py-0.5 px-2 w-48 font-mono text-[var(--color-primary)]"
                  />
                ) : (
                  <strong className="text-[var(--color-primary)] font-mono">{toPersianDigits(charterData.effectiveDate)}</strong>
                )}
              </div>
            </div>
          </div>

          {/* اکشن‌های ذخیره، بازنشانی و پرینت */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="enms-button enms-button-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات</span>
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="enms-button enms-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-rose-500"
                  title="بازنشانی به مقادیر پیش‌فرض JSON"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی</span>
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="enms-button enms-button-secondary text-xs py-1.5 px-3"
                >
                  انصراف
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ویرایش نظام‌نامه</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="enms-button enms-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>چاپ سند</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* هدف و دامنه کاربرد */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs leading-relaxed">
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-[var(--color-primary)] font-bold block mb-1">هدف تدوین نظام‌نامه:</span>
            {isEditing ? (
              <textarea
                rows={3}
                value={charterData.purpose}
                onChange={(e) => handleFieldChange('purpose', e.target.value)}
                className="enms-input text-xs w-full resize-none text-[var(--color-text-primary)]"
              />
            ) : (
              <p className="text-[var(--color-text-secondary)] text-justify">{charterData.purpose}</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <span className="text-cyan-500 font-bold block mb-1">دامنه کاربرد در سازمان:</span>
            {isEditing ? (
              <textarea
                rows={3}
                value={charterData.scope}
                onChange={(e) => handleFieldChange('scope', e.target.value)}
                className="enms-input text-xs w-full resize-none text-[var(--color-text-primary)]"
              />
            ) : (
              <p className="text-[var(--color-text-secondary)] text-justify">{charterData.scope}</p>
            )}
          </div>
        </div>
      </div>

      {/* ۲. ساختار سطوح: ۴ کادر مشخصات با قابلیت ویرایش و انتخاب کرکره‌ای */}
      <div className="enms-card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--color-border)] gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              ارکان ساختار مدیریت انرژی: تفکیک دقیق وظایف (Responsibilities) و اختیارات (Authorities)
            </h3>
          </div>

          <div className="enms-tab-pills">
            <button
              onClick={() => setActiveTier(1)}
              className={`enms-tab-pill ${activeTier === 1 ? 'active' : ''}`}
            >
              سطح ۱: کمیته عالی راهبری
            </button>
            <button
              onClick={() => setActiveTier(2)}
              className={`enms-tab-pill ${activeTier === 2 ? 'active' : ''}`}
            >
              سطح ۲: کارگروه فنی مهندسی
            </button>
          </div>
        </div>

        {/* ۴ باکس مشخصات رکن فعال */}
        {currentTierData && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              {/* باکس ۱: عنوان ساختار */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">عنوان ساختار:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentTierData.name}
                    onChange={(e) => handleTierFieldChange(activeTier, 'name', e.target.value)}
                    className="enms-input text-xs w-full font-bold"
                  />
                ) : (
                  <strong className="text-[var(--color-text-primary)] text-xs block leading-snug">{currentTierData.name}</strong>
                )}
              </div>

              {/* باکس ۲: ریاست / سرپرست با امکان انتخاب کرکره‌ای از اعضا */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">ریاست / سرپرست:</span>
                {isEditing ? (
                  <select
                    value={currentTierData.lead}
                    onChange={(e) => handleTierFieldChange(activeTier, 'lead', e.target.value)}
                    className="enms-select text-xs w-full text-[var(--color-primary)]"
                  >
                    <option value={currentTierData.lead}>{currentTierData.lead}</option>
                    {committeeMembers.map((m) => (
                      <option key={m.id} value={`${m.name} (${m.position})`}>
                        {m.name} ({m.position})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-[var(--color-primary)] text-xs block leading-snug">{currentTierData.lead}</strong>
                )}
              </div>

              {/* باکس ۳: دبیر / گزارش‌دهنده با امکان انتخاب کرکره‌ای از اعضا */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">دبیر / گزارش‌دهنده:</span>
                {isEditing ? (
                  <select
                    value={currentTierData.secretary}
                    onChange={(e) => handleTierFieldChange(activeTier, 'secretary', e.target.value)}
                    className="enms-select text-xs w-full text-cyan-500"
                  >
                    <option value={currentTierData.secretary}>{currentTierData.secretary}</option>
                    {committeeMembers.map((m) => (
                      <option key={m.id} value={`${m.name} (${m.position})`}>
                        {m.name} ({m.position})
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong className="text-cyan-500 text-xs block leading-snug">{currentTierData.secretary}</strong>
                )}
              </div>

              {/* باکس ۴: دوره تناوب جلسات رسمی */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <span className="text-[var(--color-text-muted)] block text-[11px] mb-1">دوره تناوب جلسات رسمی:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={currentTierData.frequency}
                    onChange={(e) => handleTierFieldChange(activeTier, 'frequency', e.target.value)}
                    className="enms-input text-xs w-full text-amber-500"
                  />
                ) : (
                  <strong className="text-amber-500 text-xs block leading-snug">{currentTierData.frequency}</strong>
                )}
              </div>
            </div>

            {/* تفکیک دو ستونه: وظایف در راست / اختیارات در چپ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* ستون شرح وظایف (Responsibilities) */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
                    <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>شرح وظایف و مسئولیت‌ها (Responsibilities):</span>
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {toPersianDigits(currentTierData.responsibilities?.length || 0)} مورد
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTierData.responsibilities?.map((resp: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 shrink-0" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={resp}
                              onChange={(e) => {
                                const updated = [...currentTierData.responsibilities];
                                updated[idx] = e.target.value;
                                handleTierFieldChange(activeTier, 'responsibilities', updated as any);
                              }}
                              className="enms-input text-xs w-full"
                            />
                          ) : (
                            <span className="text-[var(--color-text-primary)] leading-relaxed">{resp}</span>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteResponsibility(activeTier, idx)}
                            className="text-rose-500 hover:text-rose-600 p-1 shrink-0"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                    <input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      placeholder="افزودن وظیفه جدید به این رکن..."
                      className="enms-input text-xs flex-1"
                    />
                    <button
                      onClick={() => handleAddResponsibility(activeTier)}
                      className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                )}
              </div>

              {/* ستون حدود اختیارات (Authorities) */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--color-border)]">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      <span>حدود اختیارات و قدرت تصمیم‌گیری (Authorities):</span>
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {toPersianDigits(currentTierData.authorities?.length || 0)} مورد
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentTierData.authorities?.map((auth: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                          {isEditing ? (
                            <input
                              type="text"
                              value={auth}
                              onChange={(e) => {
                                const updated = [...currentTierData.authorities];
                                updated[idx] = e.target.value;
                                handleTierFieldChange(activeTier, 'authorities', updated as any);
                              }}
                              className="enms-input text-xs w-full"
                            />
                          ) : (
                            <span className="text-[var(--color-text-primary)] leading-relaxed">{auth}</span>
                          )}
                        </div>
                        {isEditing && (
                          <button
                            onClick={() => handleDeleteAuthority(activeTier, idx)}
                            className="text-rose-500 hover:text-rose-600 p-1 shrink-0"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                    <input
                      type="text"
                      value={newAuthority}
                      onChange={(e) => setNewAuthority(e.target.value)}
                      placeholder="افزودن اختیار قانونی جدید..."
                      className="enms-input text-xs flex-1"
                    />
                    <button
                      onClick={() => handleAddAuthority(activeTier)}
                      className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* اختیارات مالی و بودجه تصویبی */}
            {currentTierData.financialThresholds && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)] font-bold text-xs">
                  <DollarSign className="w-4 h-4" />
                  <span>آستانه‌های تصمیم‌گیری مالی و بودجه بهینه‌سازی انرژی:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-2">
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">پروژه‌های جاری (OPEX):</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentTierData.financialThresholds.opexApprovalRials}
                        onChange={(e) => handleFinancialFieldChange(activeTier, 'opexApprovalRials', e.target.value)}
                        className="enms-input text-xs w-full mt-1 font-mono"
                      />
                    ) : (
                      <strong className="text-[var(--color-text-primary)] mt-1 block font-mono">
                        {currentTierData.financialThresholds.opexApprovalRials}
                      </strong>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">پروژه‌های سرمایه‌ای (CAPEX):</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentTierData.financialThresholds.capexApprovalRials}
                        onChange={(e) => handleFinancialFieldChange(activeTier, 'capexApprovalRials', e.target.value)}
                        className="enms-input text-xs w-full mt-1 font-mono"
                      />
                    ) : (
                      <strong className="text-[var(--color-text-primary)] mt-1 block font-mono">
                        {currentTierData.financialThresholds.capexApprovalRials}
                      </strong>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">نظام پاداش صرفه‌جویی:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentTierData.financialThresholds.savingsIncentive}
                        onChange={(e) => handleFinancialFieldChange(activeTier, 'savingsIncentive', e.target.value)}
                        className="enms-input text-xs w-full mt-1 text-[var(--color-primary)]"
                      />
                    ) : (
                      <strong className="text-[var(--color-primary)] mt-1 block">
                        {currentTierData.financialThresholds.savingsIncentive}
                      </strong>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ۳. سازوکار تعامل، ورودی‌ها و خروجی‌ها با قابلیت ویرایش کامل */}
      <div className="enms-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
          <ArrowRightLeft className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            سازوکار تعامل بین کارگروه فنی و کمیته عالی راهبری (چرخه تصمیم‌گیری)
          </h3>
        </div>

        {/* متن گردش کار */}
        {isEditing ? (
          <textarea
            rows={3}
            value={charterData.interactionMechanism?.workflow}
            onChange={(e) =>
              setCharterData({
                ...charterData,
                interactionMechanism: {
                  ...charterData.interactionMechanism,
                  workflow: e.target.value,
                },
              })
            }
            className="enms-input text-xs w-full text-[var(--color-text-primary)] resize-none leading-relaxed"
          />
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-justify">
            {charterData.interactionMechanism?.workflow}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
          {/* ستون ورودی‌ها (Inputs) */}
          <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
            <div>
              <span className="font-bold text-cyan-500 block mb-3 pb-2 border-b border-[var(--color-border)]">
                داده‌ها و گزارش‌های ورودی به جلسات کمیته (Inputs):
              </span>
              <ul className="space-y-2 text-[var(--color-text-secondary)]">
                {charterData.interactionMechanism?.inputsToCommittee?.map((inItem: string, idx: number) => (
                  <li key={idx} className="flex items-start justify-between gap-2 p-1.5 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={inItem}
                          onChange={(e) => {
                            const updated = [...charterData.interactionMechanism.inputsToCommittee];
                            updated[idx] = e.target.value;
                            setCharterData({
                              ...charterData,
                              interactionMechanism: { ...charterData.interactionMechanism, inputsToCommittee: updated },
                            });
                          }}
                          className="enms-input text-xs w-full"
                        />
                      ) : (
                        <span>{inItem}</span>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteInput(idx)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {isEditing && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                <input
                  type="text"
                  value={newInputItem}
                  onChange={(e) => setNewInputItem(e.target.value)}
                  placeholder="افزودن ورودی جدید..."
                  className="enms-input text-xs flex-1"
                />
                <button
                  onClick={handleAddInput}
                  className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن</span>
                </button>
              </div>
            )}
          </div>

          {/* ستون خروجی‌ها (Outputs) */}
          <div className="p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col justify-between">
            <div>
              <span className="font-bold text-[var(--color-primary)] block mb-3 pb-2 border-b border-[var(--color-border)]">
                خروجی‌های الزام‌آور و مصوبات کمیته (Outputs):
              </span>
              <ul className="space-y-2 text-[var(--color-text-secondary)]">
                {charterData.interactionMechanism?.outputsFromCommittee?.map((outItem: string, idx: number) => (
                  <li key={idx} className="flex items-start justify-between gap-2 p-1.5 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    <div className="flex items-start gap-2 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={outItem}
                          onChange={(e) => {
                            const updated = [...charterData.interactionMechanism.outputsFromCommittee];
                            updated[idx] = e.target.value;
                            setCharterData({
                              ...charterData,
                              interactionMechanism: { ...charterData.interactionMechanism, outputsFromCommittee: updated },
                            });
                          }}
                          className="enms-input text-xs w-full"
                        />
                      ) : (
                        <span>{outItem}</span>
                      )}
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteOutput(idx)}
                        className="text-rose-500 hover:text-rose-600 p-1"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {isEditing && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
                <input
                  type="text"
                  value={newOutputItem}
                  onChange={(e) => setNewOutputItem(e.target.value)}
                  placeholder="افزودن خروجی جدید..."
                  className="enms-input text-xs flex-1"
                />
                <button
                  onClick={handleAddOutput}
                  className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteeCharterView;