import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Phone,
  Mail,
  Award,
  CheckCircle,
  Search,
  Briefcase,
  UserCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Printer,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import {
  safeFetchGovernanceJson,
  DEFAULT_COMMITTEE_MEMBERS,
} from '../../utils/committeeDataService';

const STORAGE_MEMBERS_KEY = 'enms_kiasar_committee_members_data';

export const CommitteeMembersView: React.FC = () => {
  const [membersData, setMembersData] = useState<any>(DEFAULT_COMMITTEE_MEMBERS);
  const [selectedTierTab, setSelectedTierTab] = useState<'all' | 'steering' | 'technical'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingRaci, setIsEditingRaci] = useState<boolean>(false);

  // وضعیت‌های مدال افزودن / ویرایش عضو
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);

  // فرم موقت برای افزودن یا ویرایش
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formTier, setFormTier] = useState<1 | 2>(1);
  const [formDepartment, setFormDepartment] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSignature, setFormSignature] = useState('تأییدشده');
  const [formCompetencies, setFormCompetencies] = useState('');
  const [formFocusArea, setFormFocusArea] = useState('');

  // بارگذاری داده‌ها با اولویت کش محلی سپس فایل JSON
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_MEMBERS_KEY);
    if (cached) {
      try {
        setMembersData(JSON.parse(cached));
        return;
      } catch {
        localStorage.removeItem(STORAGE_MEMBERS_KEY);
      }
    }

    safeFetchGovernanceJson('committee-members.json', DEFAULT_COMMITTEE_MEMBERS)
      .then((data) => setMembersData(data || DEFAULT_COMMITTEE_MEMBERS))
      .catch(() => setMembersData(DEFAULT_COMMITTEE_MEMBERS));
  }, []);

  const saveToStorage = (updated: any) => {
    setMembersData(updated);
    localStorage.setItem(STORAGE_MEMBERS_KEY, JSON.stringify(updated));
  };

  const handleResetToDefault = () => {
    if (!window.confirm('آیا از بازنشانی اعضای کمیته به مقادیر اولیه فایل JSON اطمینان دارید؟')) return;
    localStorage.removeItem(STORAGE_MEMBERS_KEY);
    safeFetchGovernanceJson('committee-members.json', DEFAULT_COMMITTEE_MEMBERS)
      .then((data) => setMembersData(data || DEFAULT_COMMITTEE_MEMBERS));
  };

  const steeringList = membersData?.steeringCommittee || [];
  const technicalList = membersData?.technicalWorkingGroup || [];

  // فیلتر اعضا بر اساس جستجو و تب
  const filteredSteering = useMemo(() => {
    if (selectedTierTab === 'technical') return [];
    return steeringList.filter((m: any) =>
      !searchQuery ||
      m.name.includes(searchQuery) ||
      m.position.includes(searchQuery) ||
      m.committeeRole.includes(searchQuery) ||
      m.department.includes(searchQuery)
    );
  }, [steeringList, selectedTierTab, searchQuery]);

  const filteredTechnical = useMemo(() => {
    if (selectedTierTab === 'steering') return [];
    return technicalList.filter((m: any) =>
      !searchQuery ||
      m.name.includes(searchQuery) ||
      m.position.includes(searchQuery) ||
      m.groupRole.includes(searchQuery) ||
      m.department.includes(searchQuery)
    );
  }, [technicalList, selectedTierTab, searchQuery]);

  // باز کردن مدال برای ایجاد عضو جدید
  const handleOpenAddModal = (tier: 1 | 2 = 1) => {
    setEditingMember(null);
    setFormName('');
    setFormPosition('');
    setFormRole(tier === 1 ? 'عضو تصمیم‌گیر کمیته راهبری' : 'عضو دائم فنی');
    setFormTier(tier);
    setFormDepartment('تولید / فنی');
    setFormPhone('داخلی -');
    setFormEmail('info@kiasarcement.com');
    setFormSignature('تأییدشده');
    setFormCompetencies('الزامات عمومی ISO 50001');
    setFormFocusArea('');
    setIsModalOpen(true);
  };

  // باز کردن مدال برای ویرایش عضو موجود
  const handleOpenEditModal = (member: any, tier: 1 | 2) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormPosition(member.position);
    setFormRole(tier === 1 ? member.committeeRole : member.groupRole);
    setFormTier(tier);
    setFormDepartment(member.department);
    setFormPhone(member.phone || '');
    setFormEmail(member.email || '');
    setFormSignature(member.signatureStatus || 'تأییدشده');
    setFormCompetencies(member.competencies?.join('، ') || '');
    setFormFocusArea(member.focusArea || '');
    setIsModalOpen(true);
  };

  // ذخیره فرم مدال (ایجاد یا ویرایش)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('لطفاً نام و نام خانوادگی را وارد کنید.');
      return;
    }

    const competenciesArray = formCompetencies
      .split(/[,،]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const updatedData = { ...membersData };

    if (formTier === 1) {
      const newMemberObj: any = {
        id: editingMember?.id || `mem-${Date.now()}`,
        name: formName.trim(),
        position: formPosition.trim(),
        committeeRole: formRole.trim(),
        tier: 1,
        department: formDepartment.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        signatureStatus: formSignature,
        competencies: competenciesArray,
        raci: editingMember?.raci || {
          policyAndStrategy: 'Informed (مطلع)',
          budgetAllocation: 'Consulted (مشاور)',
          baselineApproval: 'Consulted (مشاور)',
          actionPlanExecution: 'Responsible (مجری)',
          dailyMonitoring: 'Informed (مطلع)',
        },
      };

      if (editingMember) {
        updatedData.steeringCommittee = updatedData.steeringCommittee.map((m: any) =>
          m.id === editingMember.id ? newMemberObj : m
        );
      } else {
        updatedData.steeringCommittee = [...updatedData.steeringCommittee, newMemberObj];
      }
    } else {
      const newTechObj: any = {
        id: editingMember?.id || `tech-${Date.now()}`,
        name: formName.trim(),
        position: formPosition.trim(),
        groupRole: formRole.trim(),
        department: formDepartment.trim(),
        focusArea: formFocusArea.trim() || 'پایش مصرف و تحلیل انحرافات انرژی',
      };

      if (editingMember) {
        updatedData.technicalWorkingGroup = updatedData.technicalWorkingGroup.map((t: any) =>
          t.id === editingMember.id ? newTechObj : t
        );
      } else {
        updatedData.technicalWorkingGroup = [...updatedData.technicalWorkingGroup, newTechObj];
      }
    }

    saveToStorage(updatedData);
    setIsModalOpen(false);
  };

  // حذف عضو
  const handleDeleteMember = (id: string, tier: 1 | 2) => {
    if (!window.confirm('آیا از حذف این عضو از ساختار کمیته انرژی اطمینان دارید؟')) return;
    const updatedData = { ...membersData };
    if (tier === 1) {
      updatedData.steeringCommittee = updatedData.steeringCommittee.filter((m: any) => m.id !== id);
    } else {
      updatedData.technicalWorkingGroup = updatedData.technicalWorkingGroup.filter((t: any) => t.id !== id);
    }
    saveToStorage(updatedData);
  };

  // تغییر مقادیر ماتریس RACI
  const handleRaciChange = (memberId: string, raciKey: string, newVal: string) => {
    const updatedData = { ...membersData };
    updatedData.steeringCommittee = updatedData.steeringCommittee.map((m: any) => {
      if (m.id === memberId) {
        return {
          ...m,
          raci: {
            ...m.raci,
            [raciKey]: newVal,
          },
        };
      }
      return m;
    });
    saveToStorage(updatedData);
  };

  if (!membersData) {
    return (
      <div className="enms-card p-8 text-center text-[var(--color-text-muted)]">
        در حال بارگذاری اطلاعات اعضای کمیته...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ۱. سربرگ و فیلترها */}
      <div className="enms-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-primary)] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۵.۳ ایزو ۵۰۰۰۱</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  سال مالی: {membersData.fiscalYear}
                </span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                اعضای رسمی کمیته عالی راهبری و کارگروه فنی مهندسی انرژی
              </h2>
            </div>
          </div>

          {/* نوار ابزار بالا */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* انتخاب سطح */}
            <div className="enms-tab-pills">
              <button
                onClick={() => setSelectedTierTab('all')}
                className={`enms-tab-pill ${selectedTierTab === 'all' ? 'active' : ''}`}
              >
                همه ({toPersianDigits(steeringList.length + technicalList.length)})
              </button>
              <button
                onClick={() => setSelectedTierTab('steering')}
                className={`enms-tab-pill ${selectedTierTab === 'steering' ? 'active' : ''}`}
              >
                کمیته عالی ({toPersianDigits(steeringList.length)})
              </button>
              <button
                onClick={() => setSelectedTierTab('technical')}
                className={`enms-tab-pill ${selectedTierTab === 'technical' ? 'active' : ''}`}
              >
                کارگروه فنی ({toPersianDigits(technicalList.length)})
              </button>
            </div>

            {/* جستجو */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام، سمت، واحد..."
                className="enms-input text-xs pr-8 pl-3 w-44"
              />
              <Search className="w-3.5 h-3.5 text-[var(--color-text-muted)] absolute right-2.5 top-2.5" />
            </div>

            {/* دکمه‌های اکشن */}
            <button
              onClick={() => handleOpenAddModal(selectedTierTab === 'technical' ? 2 : 1)}
              className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن عضو</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="enms-button enms-button-secondary text-xs py-1.5 px-2.5 text-rose-500 hover:text-rose-600 border-rose-300 dark:border-rose-900/50"
              title="بازنشانی اعضا به حالت اولیه"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => window.print()}
              className="enms-button enms-button-secondary text-xs py-1.5 px-2.5"
              title="چاپ فهرست اعضا"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </button>
          </div>
        </div>
      </div>

      {/* ۲. کارت‌های اعضای کمیته عالی راهبری (سطح ۱) */}
      {filteredSteering.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                اعضای کمیته عالی راهبری انرژی (Energy Steering Committee)
              </h3>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              تعداد: {toPersianDigits(filteredSteering.length)} نفر
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSteering.map((member: any) => (
              <div
                key={member.id}
                className="enms-card p-4 hover:border-[var(--color-primary-border)] transition-all flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{member.name}</h4>
                      <span className="text-xs text-[var(--color-primary)] font-medium block mt-0.5">
                        {member.position}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="enms-badge badge-neutral text-[10px] font-mono">
                        سطح ۱
                      </span>
                      <button
                        onClick={() => handleOpenEditModal(member, 1)}
                        className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                        title="ویرایش"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id, 1)}
                        className="p-1 text-[var(--color-text-muted)] hover:text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">نقش در کمیته:</span>
                      <strong className="text-[var(--color-text-primary)]">{member.committeeRole}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">واحد سازمانی:</span>
                      <span className="text-[var(--color-text-secondary)]">{member.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">وضعیت امضا:</span>
                      <span className="text-[var(--color-primary)] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>{member.signatureStatus}</span>
                      </span>
                    </div>
                  </div>

                  {/* صلاحیت‌ها */}
                  <div className="mt-3 pt-2 border-t border-[var(--color-border)]">
                    <span className="text-[11px] text-[var(--color-text-muted)] block mb-1.5">
                      صلاحیت‌ها و دوره‌ها:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {member.competencies?.map((c: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* اطلاعات تماس */}
                <div className="mt-4 pt-2.5 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span>{toPersianDigits(member.phone)}</span>
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Mail className="w-3 h-3 text-[var(--color-text-muted)]" />
                    <span>{member.email}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ۳. اعضای کارگروه فنی و مهندسی (سطح ۲) */}
      {filteredTechnical.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-500" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                اعضای کارگروه فنی و مهندسی انرژی (Technical Working Group)
              </h3>
            </div>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              تعداد: {toPersianDigits(filteredTechnical.length)} نفر
            </span>
          </div>

          <div className="enms-table-container">
            <table className="enms-table text-xs">
              <thead>
                <tr>
                  <th>نام و نام خانوادگی</th>
                  <th>سمت سازمانی</th>
                  <th>نقش در کارگروه</th>
                  <th>واحد متبوع</th>
                  <th>حوزه تمرکز تخصصی در EnMS</th>
                  <th className="text-center w-20">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTechnical.map((tech: any) => (
                  <tr key={tech.id}>
                    <td className="font-bold text-[var(--color-text-primary)]">{tech.name}</td>
                    <td className="text-[var(--color-text-secondary)]">{tech.position}</td>
                    <td className="text-cyan-500 font-bold">{tech.groupRole}</td>
                    <td className="text-[var(--color-text-muted)]">{tech.department}</td>
                    <td className="text-[var(--color-text-secondary)] leading-relaxed">{tech.focusArea}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(tech, 2)}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(tech.id, 2)}
                          className="p-1 text-[var(--color-text-muted)] hover:text-rose-500"
                          title="حذف"
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
      )}

      {/* ۴. ماتریس تفکیک اختیارات و مسئولیت‌ها (RACI Matrix) با قابلیت ویرایش آنلاین */}
      <div className="enms-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--color-border)] gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
              ماتریس تفکیک مسئولیت‌ها و اختیارات کمیته انرژی (RACI Matrix)
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
              <span><strong className="text-rose-500">A:</strong> پاسخگو</span>
              <span><strong className="text-emerald-500">R:</strong> مجری</span>
              <span><strong className="text-amber-500">C:</strong> مشاور</span>
              <span><strong className="text-sky-500">I:</strong> مطلع</span>
            </div>

            <button
              onClick={() => setIsEditingRaci(!isEditingRaci)}
              className={`enms-button text-xs py-1 px-3 flex items-center gap-1.5 ${
                isEditingRaci ? 'enms-button-primary' : 'enms-button-secondary'
              }`}
            >
              {isEditingRaci ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditingRaci ? 'تکمیل ویرایش RACI' : 'ویرایش اختیارات RACI'}</span>
            </button>
          </div>
        </div>

        <div className="enms-table-container">
          <table className="enms-table text-xs">
            <thead>
              <tr>
                <th>عضو کمیته راهبری</th>
                <th>سمت سازمانی</th>
                <th className="text-center">خط‌مشی و استراتژی</th>
                <th className="text-center">تصویب بودجه CAPEX/OPEX</th>
                <th className="text-center">تصویب خطوط مبنا (EnB)</th>
                <th className="text-center">اجرای برنامه‌های اقدام</th>
                <th className="text-center">پایش روزانه و ثبت سوابق</th>
              </tr>
            </thead>
            <tbody>
              {steeringList.map((m: any) => (
                <tr key={m.id}>
                  <td className="font-bold text-[var(--color-text-primary)]">{m.name}</td>
                  <td className="text-[var(--color-text-muted)]">{m.position}</td>

                  {['policyAndStrategy', 'budgetAllocation', 'baselineApproval', 'actionPlanExecution', 'dailyMonitoring'].map(
                    (key) => (
                      <td key={key} className="text-center">
                        {isEditingRaci ? (
                          <select
                            value={getRaciCode(m.raci?.[key])}
                            onChange={(e) => handleRaciChange(m.id, key, getFullRaciString(e.target.value))}
                            className="enms-select text-xs py-0.5 px-1.5 font-bold"
                          >
                            <option value="A">A (پاسخگو)</option>
                            <option value="R">R (مجری)</option>
                            <option value="C">C (مشاور)</option>
                            <option value="I">I (مطلع)</option>
                          </select>
                        ) : (
                          renderRaciBadge(m.raci?.[key])
                        )}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ۵. مودال افزودن / ویرایش عضو */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="enms-card w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[var(--color-primary)]" />
                <span>{editingMember ? 'ویرایش مشخصات عضو' : 'افزودن عضو جدید به ساختار انرژی'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="enms-input text-xs w-full"
                    placeholder="مثال: مهندس احمدی"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">سمت سازمانی در کارخانه:</label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="enms-input text-xs w-full"
                    placeholder="مثال: سرپرست کنترل کیفی"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">سطح عضویت در سیستم:</label>
                  <select
                    value={formTier}
                    onChange={(e: any) => setFormTier(Number(e.target.value) as 1 | 2)}
                    className="enms-select text-xs w-full"
                  >
                    <option value={1}>سطح ۱: کمیته عالی راهبری</option>
                    <option value={2}>سطح ۲: کارگروه فنی مهندسی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">نقش در کمیته / کارگروه:</label>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="enms-input text-xs w-full"
                    placeholder="مثال: عضو تصمیم‌گیر"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">واحد متبوع:</label>
                  <input
                    type="text"
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="enms-input text-xs w-full"
                    placeholder="تولید / نت / آزمایشگاه"
                  />
                </div>
              </div>

              {formTier === 1 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[var(--color-text-secondary)] mb-1">شماره تماس / داخلی:</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="enms-input text-xs w-full font-mono"
                        placeholder="داخلی ۱۰۵"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--color-text-secondary)] mb-1">ایمیل سازمانی:</label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="enms-input text-xs w-full font-mono"
                        placeholder="name@kiasarcement.com"
                      />
                    </div>

                    <div>
                      <label className="block text-[var(--color-text-secondary)] mb-1">وضعیت امضا / ابلاغیه:</label>
                      <select
                        value={formSignature}
                        onChange={(e) => setFormSignature(e.target.value)}
                        className="enms-select text-xs w-full"
                      >
                        <option value="تأییدشده / امضای معتبر">تأییدشده / امضای معتبر</option>
                        <option value="تأییدشده">تأییدشده</option>
                        <option value="در انتظار تایید مدیریت">در انتظار تایید مدیریت</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--color-text-secondary)] mb-1">
                      صلاحیت‌ها و دوره‌های گذرانده‌شده (با کاما جدا کنید):
                    </label>
                    <input
                      type="text"
                      value={formCompetencies}
                      onChange={(e) => setFormCompetencies(e.target.value)}
                      className="enms-input text-xs w-full"
                      placeholder="الزامات ISO 50001، ممیزی انرژی، کنترل فرآیند کوره"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[var(--color-text-secondary)] mb-1">حوزه تمرکز تخصصی در EnMS:</label>
                  <textarea
                    rows={2}
                    value={formFocusArea}
                    onChange={(e) => setFormFocusArea(e.target.value)}
                    className="enms-input text-xs w-full resize-none"
                    placeholder="مثال: پایش مصارف آسیاب مواد، کنترل دمای بیرینگ‌ها و کاهش اتلاف هوای فشرده"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="enms-button enms-button-secondary text-xs py-1.5 px-3"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="enms-button enms-button-primary text-xs py-1.5 px-4 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ثبت و ذخیره عضو</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// توابع کمکی تبدیل RACI
function getRaciCode(val?: string): string {
  if (!val) return 'I';
  if (val.startsWith('Accountable') || val.startsWith('A')) return 'A';
  if (val.startsWith('Responsible') || val.startsWith('R')) return 'R';
  if (val.startsWith('Consulted') || val.startsWith('C')) return 'C';
  return 'I';
}

function getFullRaciString(code: string): string {
  switch (code) {
    case 'A':
      return 'Accountable (پاسخگوی نهایی)';
    case 'R':
      return 'Responsible (مجری مستقیم)';
    case 'C':
      return 'Consulted (مشاور)';
    default:
      return 'Informed (مطلع)';
  }
}

function renderRaciBadge(val?: string) {
  if (!val) return <span className="text-[var(--color-text-muted)]">-</span>;
  if (val.startsWith('Accountable') || val.startsWith('A')) {
    return (
      <span className="enms-badge badge-danger text-[10px]">
        A (پاسخگو)
      </span>
    );
  }
  if (val.startsWith('Responsible') || val.startsWith('R')) {
    return (
      <span className="enms-badge badge-success text-[10px]">
        R (مجری)
      </span>
    );
  }
  if (val.startsWith('Consulted') || val.startsWith('C')) {
    return (
      <span className="enms-badge badge-warning text-[10px]">
        C (مشاور)
      </span>
    );
  }
  return (
    <span className="enms-badge badge-info text-[10px]">
      I (مطلع)
    </span>
  );
}

export default CommitteeMembersView;