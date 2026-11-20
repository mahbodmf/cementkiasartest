import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Eye,
  Compass,
  FileCheck,
  UserCheck,
  Edit3,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { toPersianDigits } from '../../../../utils/persianUtils';
import { safeFetchPublicJson } from '../../../../services/configService';

interface PolicyViewProps {
  isEditing?: boolean;
}

const DEFAULT_POLICY_FALLBACK = {
  title: 'خط‌مشی سیستم مدیریت انرژی (ISO 50001:2018)',
  documentCode: 'EnMS-POL-01',
  version: '1.0',
  approvalDate: '',
  vision: '',
  mission: '',
  statement: '',
  commitments: [],
  signatory: { name: '', title: '' },
};

export const PolicyView: React.FC<PolicyViewProps> = ({ isEditing: externalIsEditing = false }) => {
  const [policyData, setPolicyData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(externalIsEditing);

  useEffect(() => {
    let isMounted = true;
    safeFetchPublicJson<any>(
      '/data/02-organization-context/energy-policy.json',
      DEFAULT_POLICY_FALLBACK,
      { storageKey: 'enms_energy_policy_v1' }
    ).then((data) => {
      if (isMounted && data && typeof data === 'object') {
        setPolicyData(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!policyData) {
    return (
      <div className="enms-card p-8 text-center text-[var(--color-text-muted)]">
        در حال بارگذاری بیانیه خط‌مشی و چشم‌انداز انرژی...
      </div>
    );
  }

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ۱. سربرگ خط‌مشی */}
      <div className="enms-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success font-semibold">بند ۵.۲ استاندارد ISO 50001:2018</span>
                <span className="text-xs text-[var(--color-text-muted)] font-mono">
                  ویرایش: {policyData.approvalInfo?.version}
                </span>
              </div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
                بیانیه خط‌مشی، مأموریت و چشم‌انداز کلان انرژی
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="enms-button enms-button-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ذخیره تغییرات</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="enms-button enms-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش خط‌مشی</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ۲. کارت‌های چشم‌انداز و مأموریت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* چشم‌انداز (Vision) */}
        <div className="enms-card space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-info)] font-bold text-sm pb-2 border-b border-[var(--color-border-subtle)]">
            <Eye className="w-5 h-5" />
            <span>چشم‌انداز انرژی (Vision):</span>
          </div>
          {isEditing ? (
            <textarea
              rows={4}
              value={policyData.vision}
              onChange={(e) => setPolicyData({ ...policyData, vision: e.target.value })}
              className="enms-input text-xs w-full bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] resize-none leading-relaxed text-[var(--color-text-primary)]"
            />
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed text-justify">
              {policyData.vision}
            </p>
          )}
        </div>

        {/* مأموریت (Mission) */}
        <div className="enms-card space-y-3">
          <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm pb-2 border-b border-[var(--color-border-subtle)]">
            <Compass className="w-5 h-5" />
            <span>مأموریت سازمانی در مدیریت انرژی (Mission):</span>
          </div>
          {isEditing ? (
            <textarea
              rows={4}
              value={policyData.mission}
              onChange={(e) => setPolicyData({ ...policyData, mission: e.target.value })}
              className="enms-input text-xs w-full bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] resize-none leading-relaxed text-[var(--color-text-primary)]"
            />
          ) : (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed text-justify">
              {policyData.mission}
            </p>
          )}
        </div>
      </div>

      {/* ۳. متن منشور خط‌مشی انرژی */}
      <div className="enms-card space-y-4">
        <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold text-sm pb-2 border-b border-[var(--color-border-subtle)]">
          <FileCheck className="w-5 h-5 text-[var(--color-primary)]" />
          <span>بیانیه رسمی خط‌مشی سیستم مدیریت انرژی (EnMS Policy Statement):</span>
        </div>

        {isEditing ? (
          <textarea
            rows={3}
            value={policyData.policyStatement}
            onChange={(e) => setPolicyData({ ...policyData, policyStatement: e.target.value })}
            className="enms-input text-xs w-full bg-[var(--color-bg-card-subtle)] border-[var(--color-border)] leading-relaxed text-[var(--color-text-primary)]"
          />
        ) : (
          <p className="text-xs text-[var(--color-text-primary)] leading-loose text-justify font-medium bg-[var(--color-bg-card-subtle)] p-4 rounded-xl border border-[var(--color-border)]">
            {policyData.policyStatement}
          </p>
        )}

        {/* تعهدات ۵ گانه الزام‌آور بند ۵.۲ */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-[var(--color-text-secondary)] block">
            اصول و تعهدات الزام‌آور مدیریت ارشد (الزامات پنج‌گانه بند ۵.۲ ایزو ۵۰۰۰۱):
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {policyData.coreCommitments?.map((item: any) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <strong className="text-xs text-[var(--color-text-primary)]">{item.title}</strong>
                  </div>
                  <span className="enms-badge badge-neutral text-[10px] font-mono">
                    بند {item.clause}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed pr-6">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* کادر امضا و تاریخ تصویب مدیر ارشد */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[var(--color-primary-bg)] p-4 rounded-xl border border-[var(--color-primary-border)]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[var(--color-primary)]" />
            <div>
              <span className="text-[var(--color-text-muted)] block text-[11px]">تصویب‌کننده:</span>
              <strong className="text-[var(--color-text-primary)]">
                {policyData.approvalInfo?.approvedBy} ({policyData.approvalInfo?.position})
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[var(--color-text-secondary)] text-[11px]">
            <span>تاریخ تصویب: <strong className="font-mono text-[var(--color-text-primary)]">{toPersianDigits(policyData.approvalInfo?.approvalDate)}</strong></span>
            <span>بازنگری آتی: <strong className="font-mono text-[var(--color-text-primary)]">{toPersianDigits(policyData.approvalInfo?.nextReviewDate)}</strong></span>
            <span className="text-[var(--color-primary)] font-bold">{policyData.approvalInfo?.signatureStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyView;