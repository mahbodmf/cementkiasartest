import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle,
  FileText,
  AlertTriangle,
  Printer,
  ChevronDown,
  Trash2,
  Save,
  Edit3,
  Paperclip,
  DollarSign,
  Cpu,
  Gauge,
  Upload,
  FileCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { FISCAL_QUARTERS } from '../../../../utils/fiscalYearUtils';
import {
  safeFetchGovernanceJson,
  DEFAULT_COMMITTEE_MEMBERS,
  DEFAULT_MEETING_MINUTES,
} from '../../utils/committeeDataService';

const STORAGE_MINUTES_KEY = 'enms_kiasar_meeting_minutes_data';

export const MeetingMinutesView: React.FC = () => {
  const [minutesList, setMinutesList] = useState<any[]>(DEFAULT_MEETING_MINUTES);
  const [committeeMembers, setCommitteeMembers] = useState<any[]>([
    ...DEFAULT_COMMITTEE_MEMBERS.steeringCommittee,
    ...DEFAULT_COMMITTEE_MEMBERS.technicalWorkingGroup,
  ]);
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  const [selectedMinute, setSelectedMinute] = useState<any | null>(DEFAULT_MEETING_MINUTES[0]);

  // فیلدهای فرم ثبت / ویرایش صورت‌جلسه
  const [formId, setFormId] = useState('');
  const [formMeetingNumber, setFormMeetingNumber] = useState('EC-1405/01');
  const [formFiscalYear, setFormFiscalYear] = useState('۱۴۰۴-۱۴۰۵');
  const [formFiscalQuarter, setFormFiscalQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [formDate, setFormDate] = useState('۱۴۰۵/۰۱/۲۵');
  const [formTime, setFormTime] = useState('۰۹:۳۰ الی ۱۲:۳۰');
  const [formLocation, setFormLocation] = useState('سالن کنفرانس مدیریت مجتمع پتروشیمی تخت جمشید');
  const [formChairperson, setFormChairperson] = useState('مهندس رضاپور (مدیر مجتمع)');
  const [formSecretary, setFormSecretary] = useState('مهندس فراهانی (رئیس مهندسی انرژی)');
  const [formTitle, setFormTitle] = useState('');
  const [formAgenda, setFormAgenda] = useState('');
  const [formDiscussions, setFormDiscussions] = useState('');
  const [formNextMeeting, setFormNextMeeting] = useState('یک ماه آتی');

  // منابع مالی و زیرساخت (بند ۷.۱ ایزو ۵۰۰۰۱)
  const [formBudgetAllocated, setFormBudgetAllocated] = useState('');
  const [formHardwareEquipment, setFormHardwareEquipment] = useState('');
  const [formMeteringAutomation, setFormMeteringAutomation] = useState('');

  // حاضرین جلسه
  const [formAttendees, setFormAttendees] = useState<any[]>([]);

  // مصوبات
  const [formDecisions, setFormDecisions] = useState<any[]>([
    { code: 'ACT-01', title: '', responsible: '', deadline: '', targetSeu: '', budgetApproved: 'داخلی' },
  ]);

  // مدارک پیوست
  const [formAttachments, setFormAttachments] = useState<any[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');

  // ۱. بارگذاری همزمان صورت‌جلسات و اعضای کمیته
  useEffect(() => {
    // بارگذاری لیست اعضا برای انتخاب حاضرین
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

    // بارگذاری صورت‌جلسات
    const cached = localStorage.getItem(STORAGE_MINUTES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMinutesList(parsed);
          setSelectedMinute(parsed[0]);
          return;
        }
      } catch {
        localStorage.removeItem(STORAGE_MINUTES_KEY);
      }
    }

    safeFetchGovernanceJson('meeting-minutes.json', DEFAULT_MEETING_MINUTES)
      .then((data) => {
        const list = Array.isArray(data) && data.length > 0 ? data : DEFAULT_MEETING_MINUTES;
        setMinutesList(list);
        setSelectedMinute(list[0]);
      })
      .catch(() => {
        setMinutesList(DEFAULT_MEETING_MINUTES);
        setSelectedMinute(DEFAULT_MEETING_MINUTES[0]);
      });
  }, []);

  const saveMinutesToStorage = (updated: any[]) => {
    setMinutesList(updated);
    localStorage.setItem(STORAGE_MINUTES_KEY, JSON.stringify(updated));
  };

  // باز کردن فرم برای ثبت جدید
  const handleOpenCreateForm = () => {
    setIsEditingExisting(false);
    setFormId(`MIN-${Date.now()}`);
    setFormMeetingNumber(`EC-1405/0${minutesList.length + 1}`);
    setFormFiscalYear('۱۴۰۴-۱۴۰۵');
    setFormFiscalQuarter('Q3');
    setFormDate('۱۴۰۵/۰۶/۱۵');
    setFormTime('۰۹:۳۰ الی ۱۲:۰۰');
    setFormLocation('سالن کنفرانس کارخانه سیمان کیاسر');
    setFormChairperson('مهندس قره‌داغلی (رئیس کارخانه)');
    setFormSecretary('مهندس جابر شریعت‌نژاد (مدیر انرژی)');
    setFormTitle('');
    setFormAgenda('');
    setFormDiscussions('');
    setFormBudgetAllocated('');
    setFormHardwareEquipment('');
    setFormMeteringAutomation('');
    setFormNextMeeting('جلسه فصلی آتی');
    setFormAttendees(
      committeeMembers.slice(0, 5).map((m) => ({ name: m.name, role: m.position, status: 'حاضر' }))
    );
    setFormDecisions([
      { code: `ACT-01`, title: '', responsible: '', deadline: '', targetSeu: '', budgetApproved: 'داخلی' },
    ]);
    setFormAttachments([]);
    setShowFormModal(true);
  };

  // باز کردن فرم برای ویرایش صورت‌جلسه انتخاب‌شده
  const handleOpenEditForm = (minute: any) => {
    setIsEditingExisting(true);
    setFormId(minute.id);
    setFormMeetingNumber(minute.meetingNumber);
    setFormFiscalYear(minute.fiscalYear || '۱۴۰۴-۱۴۰۵');
    setFormFiscalQuarter(minute.fiscalQuarter || 'Q3');
    setFormDate(minute.date);
    setFormTime(minute.time || '۰۹:۰۰ الی ۱۱:۳۰');
    setFormLocation(minute.location || 'سالن کنفرانس کارخانه');
    setFormChairperson(minute.chairperson || 'مهندس قره‌داغلی (رئیس کارخانه)');
    setFormSecretary(minute.secretary || 'مهندس جابر شریعت‌نژاد (مدیر انرژی)');
    setFormTitle(minute.title);
    setFormAgenda(Array.isArray(minute.agenda) ? minute.agenda.join('\n') : minute.agenda || '');
    setFormDiscussions(minute.keyDiscussions || '');
    setFormBudgetAllocated(minute.resourcesAndInfrastructure?.budgetAllocated || '');
    setFormHardwareEquipment(minute.resourcesAndInfrastructure?.hardwareEquipment || '');
    setFormMeteringAutomation(minute.resourcesAndInfrastructure?.meteringAutomation || '');
    setFormNextMeeting(minute.nextMeetingDate || 'ماه آتی');
    setFormAttendees(minute.attendees || []);
    setFormDecisions(minute.decisions || []);
    setFormAttachments(minute.attachments || []);
    setShowFormModal(true);
  };

  // حذف صورت‌جلسه
  const handleDeleteMinute = (id: string) => {
    if (!window.confirm('آیا از حذف کامل این صورت‌جلسه و مصوبات مربوط به آن اطمینان دارید؟')) return;
    const updated = minutesList.filter((m) => m.id !== id);
    saveMinutesToStorage(updated);
    if (selectedMinute?.id === id) {
      setSelectedMinute(updated.length > 0 ? updated[0] : null);
    }
  };

  // افزودن / حذف سطر مصوبه در فرم
  const handleAddDecisionRow = () => {
    const nextCode = `ACT-${String(formDecisions.length + 1).padStart(2, '0')}`;
    setFormDecisions([
      ...formDecisions,
      { code: nextCode, title: '', responsible: '', deadline: '', targetSeu: '', budgetApproved: 'داخلی' },
    ]);
  };

  const handleDecisionChange = (idx: number, field: string, val: string) => {
    const updated = [...formDecisions];
    updated[idx][field] = val;
    setFormDecisions(updated);
  };

  const handleDeleteDecisionRow = (idx: number) => {
    setFormDecisions(formDecisions.filter((_, i) => i !== idx));
  };

  // افزودن پیوست مدارک / اسکن
  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const newAtt = {
      name: newAttachmentName.trim(),
      type: newAttachmentName.endsWith('.pdf') ? 'pdf' : 'doc',
      size: 'پیوست اسکن‌شده',
      url: '#',
    };
    setFormAttachments([...formAttachments, newAtt]);
    setNewAttachmentName('');
  };

  const handleDeleteAttachment = (index: number) => {
    setFormAttachments(formAttachments.filter((_, i) => i !== index));
  };

  // ذخیره فرم (ثبت جدید یا اعمال ویرایش)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('لطفاً عنوان صورت‌جلسه را وارد کنید.');
      return;
    }

    const minuteObject: any = {
      id: formId,
      meetingNumber: formMeetingNumber,
      title: formTitle.trim(),
      committeeType: 'کمیته عالی راهبری انرژی',
      fiscalYear: formFiscalYear,
      fiscalQuarter: formFiscalQuarter,
      date: formDate,
      time: formTime,
      location: formLocation,
      chairperson: formChairperson,
      secretary: formSecretary,
      attendees: formAttendees,
      agenda: formAgenda.split('\n').filter((a) => a.trim().length > 0),
      keyDiscussions: formDiscussions,
      resourcesAndInfrastructure: {
        budgetAllocated: formBudgetAllocated,
        hardwareEquipment: formHardwareEquipment,
        meteringAutomation: formMeteringAutomation,
      },
      attachments: formAttachments,
      decisions: formDecisions.filter((d) => d.title.trim().length > 0),
      nextMeetingDate: formNextMeeting,
    };

    let updatedList: any[];
    if (isEditingExisting) {
      updatedList = minutesList.map((m) => (m.id === formId ? minuteObject : m));
    } else {
      updatedList = [minuteObject, ...minutesList];
    }

    saveMinutesToStorage(updatedList);
    setSelectedMinute(minuteObject);
    setShowFormModal(false);
    alert(isEditingExisting ? 'صورت‌جلسه با موفقیت ویرایش شد.' : 'صورت‌جلسه جدید با موفقیت ثبت شد.');
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* سربرگ و اکشن دکمه فرم جدید */}
      <div className="enms-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[var(--color-primary)]">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۵.۳، ۷.۱ و ۹.۳ استاندارد ISO 50001</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">سوابق رسمی جلسات</span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                ثبت، تنظیم، ویرایش و صدور صورت‌جلسات کمیته انرژی
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateForm}
              className="enms-button enms-button-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>تنظیم صورت‌جلسه جدید</span>
            </button>
          </div>
        </div>
      </div>

      {/* نمایش دو ستونه: لیست صورت‌جلسات در راست، پیش‌نمایش و عملیات در چپ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ستون راست: فهرست صورت‌جلسات ثبت‌شده */}
        <div className="enms-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">فهرست صورت‌جلسات ثبت‌شده</span>
            <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
              {toPersianDigits(minutesList.length)} جلسه
            </span>
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {minutesList.length === 0 ? (
              <p className="text-center py-8 text-xs text-[var(--color-text-muted)]">هیچ صورت‌جلسه‌ای ثبت نشده است.</p>
            ) : (
              minutesList.map((item) => {
                const isSelected = selectedMinute?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMinute(item)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-[var(--color-primary-border)] shadow-xs ring-1 ring-emerald-500/30'
                        : 'bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] hover:border-[var(--color-primary-border)]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-[var(--color-primary)] font-bold">
                        {item.meetingNumber}
                      </span>
                      <span className="enms-badge badge-neutral text-[10px] font-mono">
                        {item.fiscalQuarter}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-1">
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]">
                      <span>{toPersianDigits(item.date)}</span>
                      <span>{toPersianDigits(item.decisions?.length || 0)} مصوبه</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ستون چپ: برگه کامل صورت‌جلسه انتخابی با امکان ویرایش، چاپ و پیوست‌ها */}
        <div className="lg:col-span-2">
          {selectedMinute ? (
            <div className="enms-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="enms-badge badge-success text-[10px] font-mono">
                      {selectedMinute.meetingNumber}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] font-mono">
                      سال مالی {selectedMinute.fiscalYear}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                    {selectedMinute.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenEditForm(selectedMinute)}
                    className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>ویرایش صورت‌جلسه</span>
                  </button>

                  <button
                    onClick={() => handleDeleteMinute(selectedMinute.id)}
                    className="enms-button enms-button-secondary text-xs py-1.5 px-2.5 text-rose-500 hover:text-rose-600 border-rose-300 dark:border-rose-900/40"
                    title="حذف صورت‌جلسه"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="enms-button enms-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span>چاپ</span>
                  </button>
                </div>
              </div>

              {/* مشخصات کلی جلسه */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">تاریخ:</span>
                  <strong className="text-[var(--color-text-primary)] font-mono">
                    {toPersianDigits(selectedMinute.date)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">ساعت:</span>
                  <strong className="text-[var(--color-text-primary)] font-mono">
                    {toPersianDigits(selectedMinute.time)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">رئیس جلسه:</span>
                  <strong className="text-[var(--color-primary)]">{selectedMinute.chairperson}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] block text-[11px]">دبیر کمیته:</span>
                  <strong className="text-cyan-500">{selectedMinute.secretary}</strong>
                </div>
              </div>

              {/* حاضرین در جلسه */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs">
                <span className="text-[var(--color-text-secondary)] font-bold block mb-2">اعضای حاضر در جلسه:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedMinute.attendees?.map((att: any, idx: number) => (
                    <span
                      key={idx}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] shadow-xs"
                    >
                      <UserCheck className="w-3 h-3 text-[var(--color-primary)]" />
                      <span>
                        {att.name} ({att.role})
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* دستور جلسه */}
              <div className="text-xs">
                <span className="font-bold text-[var(--color-text-primary)] block mb-2">دستورات جلسه:</span>
                <ul className="space-y-1.5 pr-4 list-disc text-[var(--color-text-secondary)]">
                  {selectedMinute.agenda?.map((ag: string, idx: number) => (
                    <li key={idx}>{ag}</li>
                  ))}
                </ul>
              </div>

              {/* مشروح مذاکرات */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs leading-relaxed">
                <span className="font-bold text-[var(--color-text-primary)] block mb-1">
                  خلاصه مباحث و تصمیمات فرآیندی:
                </span>
                <p className="text-[var(--color-text-secondary)] text-justify">{selectedMinute.keyDiscussions}</p>
              </div>

              {/* تخصیص منابع مالی، زیرساخت و امکانات (بند ۷.۱ ایزو ۵۰۰۰۱) */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold">
                  <DollarSign className="w-4 h-4" />
                  <span>تأمین منابع مالی، تجهیزات و زیرساخت پایش (بند ۷.۱ استاندارد ISO 50001):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">بودجه مصوب:</span>
                    <strong className="text-[var(--color-text-primary)] mt-1 block">
                      {selectedMinute.resourcesAndInfrastructure?.budgetAllocated || 'تأمین در قالب بودجه جاری واحدها'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">تأمین قطعات و تجهیزات:</span>
                    <strong className="text-[var(--color-text-primary)] mt-1 block">
                      {selectedMinute.resourcesAndInfrastructure?.hardwareEquipment || 'تجهیزات موجود خط تولید'}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] block text-[11px]">زیرساخت ابزاردقیق و مترینگ:</span>
                    <strong className="text-[var(--color-text-primary)] mt-1 block">
                      {selectedMinute.resourcesAndInfrastructure?.meteringAutomation || 'شبکه کنتورها و اتوماسیون CCR'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* جدول مصوبات */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[var(--color-text-primary)] block">
                  مصوبات و اقدامات ابلاغی جلسه:
                </span>
                <div className="enms-table-container">
                  <table className="enms-table text-xs">
                    <thead>
                      <tr>
                        <th className="w-20">کد مصوبه</th>
                        <th>شرح مصوبه / اقدام اصلاحی</th>
                        <th>مسئول پیگیری</th>
                        <th>مهلت اقدام</th>
                        <th>تجهیز بارز (SEU)</th>
                        <th>بودجه اقدام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMinute.decisions?.map((dec: any, idx: number) => (
                        <tr key={idx}>
                          <td className="font-mono text-[var(--color-primary)] font-bold">{dec.code}</td>
                          <td className="font-medium text-[var(--color-text-primary)]">{dec.title}</td>
                          <td className="text-[var(--color-text-secondary)]">{dec.responsible}</td>
                          <td className="font-mono text-[var(--color-text-muted)]">{toPersianDigits(dec.deadline)}</td>
                          <td className="text-[var(--color-text-muted)]">{dec.targetSeu || '-'}</td>
                          <td className="font-mono text-[var(--color-text-secondary)] text-[11px]">{dec.budgetApproved || 'داخلی'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* مدارک و اسکن‌های پیوست‌شده (بند ۷.۵ - کنترل اطلاعات مدون) */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-secondary)] font-bold flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-cyan-500" />
                    <span>مدارک پیوست، فایل‌های محاسباتی و اسکن کاغذی صورت‌جلسه:</span>
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] font-mono">
                    {toPersianDigits(selectedMinute.attachments?.length || 0)} پیوست
                  </span>
                </div>

                {(!selectedMinute.attachments || selectedMinute.attachments.length === 0) ? (
                  <p className="text-[var(--color-text-muted)] text-[11px] py-1">هیچ سندی به این صورت‌جلسه پیوست نشده است.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {selectedMinute.attachments.map((att: any, aIdx: number) => (
                      <div
                        key={aIdx}
                        className="p-2.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileCheck className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                          <div className="overflow-hidden">
                            <span className="block text-[var(--color-text-primary)] font-medium truncate" title={att.name}>
                              {att.name}
                            </span>
                            <span className="text-[10px] text-[var(--color-text-muted)] font-mono block">{att.size}</span>
                          </div>
                        </div>
                        <a
                          href={att.url || '#'}
                          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
                          title="مشاهده / دریافت فایل"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="enms-card p-8 text-center text-[var(--color-text-muted)] text-xs">
              یک صورت‌جلسه را از لیست سمت راست انتخاب کنید.
            </div>
          )}
        </div>
      </div>

      {/* مودال جامع ثبت جدید و ویرایش صورت‌جلسه */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="enms-card w-full max-w-4xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                <span>{isEditingExisting ? 'ویرایش صورت‌جلسه کمیته انرژی' : 'ثبت و صدور صورت‌جلسه جدید کمیته انرژی'}</span>
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* ردیف شماره جلسه، فصل مالی، تاریخ و ساعت */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">شماره صورت‌جلسه:</label>
                  <input
                    type="text"
                    value={formMeetingNumber}
                    onChange={(e) => setFormMeetingNumber(e.target.value)}
                    className="enms-input text-xs w-full font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">فصل مالی کیاسر:</label>
                  <select
                    value={formFiscalQuarter}
                    onChange={(e: any) => setFormFiscalQuarter(e.target.value)}
                    className="enms-select text-xs w-full"
                  >
                    <option value="Q1">فصل ۱ (زمستان - ناترازی گاز)</option>
                    <option value="Q2">فصل ۲ (بهار - شرایط پایدار)</option>
                    <option value="Q3">فصل ۳ (تابستان - پیک‌سایی برق)</option>
                    <option value="Q4">فصل ۴ (پاییز - انباشت کلینکر)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">تاریخ جلسه (شمسی):</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="enms-input text-xs w-full font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">ساعت برگزاری:</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="enms-input text-xs w-full font-mono"
                  />
                </div>
              </div>

              {/* عنوان اصلی صورت‌جلسه */}
              <div>
                <label className="text-[var(--color-text-secondary)] block mb-1 font-bold">عنوان اصلی صورت‌جلسه:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: بررسی راهکارهای بهینه‌سازی دیماند ساعات اوج بار و سوئیچ گاز به مازوت"
                  className="enms-input text-xs w-full"
                  required
                />
              </div>

              {/* دستورات جلسه و مشروح مذاکرات */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">دستورات جلسه (هر بند در یک خط):</label>
                  <textarea
                    rows={3}
                    value={formAgenda}
                    onChange={(e) => setFormAgenda(e.target.value)}
                    placeholder="۱. بررسی انحراف SEC برق&#10;۲. بررسی گزارش نشت کمپرسورها"
                    className="enms-input text-xs w-full resize-none"
                  />
                </div>

                <div>
                  <label className="text-[var(--color-text-secondary)] block mb-1">خلاصه مذاکرات و نظرات اعضا:</label>
                  <textarea
                    rows={3}
                    value={formDiscussions}
                    onChange={(e) => setFormDiscussions(e.target.value)}
                    placeholder="شرح گزارش مدیر انرژی، نظرات مدیر تولید و الزامات تأمین قطعات..."
                    className="enms-input text-xs w-full resize-none"
                  />
                </div>
              </div>

              {/* بخش منابع مالی، زیرساخت و امکانات (بند ۷.۱ استاندارد ایزو ۵۰۰۰۱) */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <span className="font-bold text-[var(--color-primary)] block text-xs">
                  تأمین منابع مالی، تجهیزاتی و زیرساختی (بند ۷.۱ ISO 50001):
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[var(--color-text-secondary)] block mb-1 text-[11px]">تخصیص بودجه (CAPEX/OPEX):</label>
                    <input
                      type="text"
                      value={formBudgetAllocated}
                      onChange={(e) => setFormBudgetAllocated(e.target.value)}
                      placeholder="مثال: ۳۵۰ میلیون ریال بودجه OPEX"
                      className="enms-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--color-text-secondary)] block mb-1 text-[11px]">تأمین قطعات و تجهیزات خط:</label>
                    <input
                      type="text"
                      value={formHardwareEquipment}
                      onChange={(e) => setFormHardwareEquipment(e.target.value)}
                      placeholder="مثال: تعویض فیلترهای بگ‌هاوس و بیرینگ فن"
                      className="enms-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[var(--color-text-secondary)] block mb-1 text-[11px]">زیرساخت ابزاردقیق و مترینگ:</label>
                    <input
                      type="text"
                      value={formMeteringAutomation}
                      onChange={(e) => setFormMeteringAutomation(e.target.value)}
                      placeholder="مثال: کالیبراسیون کنتور برق و ترانسمیتر گاز"
                      className="enms-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* مصوبات جلسه */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--color-text-primary)]">مصوبات و اقدامات ابلاغی جلسه:</span>
                  <button
                    type="button"
                    onClick={handleAddDecisionRow}
                    className="text-[11px] text-[var(--color-primary)] hover:underline flex items-center gap-1 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن سطر مصوبه</span>
                  </button>
                </div>

                <div className="enms-table-container">
                  <table className="enms-table text-xs">
                    <thead>
                      <tr>
                        <th className="w-16">کد</th>
                        <th>شرح مصوبه / اقدام اصلاحی</th>
                        <th className="w-36">مسئول اجرا</th>
                        <th className="w-28 text-center">مهلت (ددلاین)</th>
                        <th className="w-32">تجهیز (SEU)</th>
                        <th className="w-24">بودجه</th>
                        <th className="w-10 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formDecisions.map((dec, dIdx) => (
                        <tr key={dIdx}>
                          <td className="font-mono text-[var(--color-primary)] font-bold">{dec.code}</td>
                          <td>
                            <input
                              type="text"
                              value={dec.title}
                              onChange={(e) => handleDecisionChange(dIdx, 'title', e.target.value)}
                              placeholder="شرح دقیق مصوبه..."
                              className="enms-input text-xs w-full"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={dec.responsible}
                              onChange={(e) => handleDecisionChange(dIdx, 'responsible', e.target.value)}
                              placeholder="مسئول پیگیری"
                              className="enms-input text-xs w-full"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={dec.deadline}
                              onChange={(e) => handleDecisionChange(dIdx, 'deadline', e.target.value)}
                              placeholder="۱۴۰۵/۰۶/۳۰"
                              className="enms-input text-xs w-full font-mono text-center"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={dec.targetSeu}
                              onChange={(e) => handleDecisionChange(dIdx, 'targetSeu', e.target.value)}
                              placeholder="کوره / آسیاب"
                              className="enms-input text-xs w-full"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={dec.budgetApproved}
                              onChange={(e) => handleDecisionChange(dIdx, 'budgetApproved', e.target.value)}
                              placeholder="داخلی / مبلغ"
                              className="enms-input text-xs w-full"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteDecisionRow(dIdx)}
                              className="text-rose-500 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* پیوست اسکن صورت‌جلسه و مدارک ضمیمه */}
              <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] space-y-2">
                <span className="font-bold text-[var(--color-text-secondary)] block text-xs">
                  پیوست مدارک، اسکن فرم کاغذی و گزارش‌ها (بند ۷.۵):
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="نام فایل یا عنوان مدرک اسکن‌شده (مثال: اسکن_امضا_شده_جلسه.pdf)"
                    className="enms-input text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>افزودن پیوست</span>
                  </button>
                </div>

                {formAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formAttachments.map((att, attIdx) => (
                      <span
                        key={attIdx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-secondary)]"
                      >
                        <FileCheck className="w-3 h-3 text-[var(--color-primary)]" />
                        <span>{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(attIdx)}
                          className="text-rose-400 hover:text-rose-500 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="enms-button enms-button-secondary text-xs py-1.5 px-3"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="enms-button enms-button-primary text-xs py-1.5 px-4 flex items-center gap-1.5 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEditingExisting ? 'ذخیره تغییرات صورت‌جلسه' : 'ثبت رسمی صورت‌جلسه'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingMinutesView;