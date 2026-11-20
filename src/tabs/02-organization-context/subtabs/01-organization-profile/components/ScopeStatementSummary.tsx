import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { OrganizationProfile, BoundaryMatrixItem } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface ScopeStatementSummaryProps {
  profile: OrganizationProfile;
  boundaries: BoundaryMatrixItem[];
  isEditing: boolean;
  onFieldChange: (field: keyof OrganizationProfile, value: any) => void;
}

export const ScopeStatementSummary: React.FC<ScopeStatementSummaryProps> = ({
  profile,
  boundaries,
  isEditing,
  onFieldChange,
}) => {
  const includedCount = boundaries.filter((b) => b.status === 'مشمول').length;
  const indirectCount = boundaries.filter((b) => b.status === 'مشمول غیرمستقیم').length;
  const excludedCount = boundaries.filter((b) => b.status === 'مستثنی').length;

  return (
    <>
      <div className="mt-5 p-4 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-primary-border)]">
        <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)] font-bold text-xs">
          <ShieldCheck className="w-4 h-4" />
          <span>بیانیه رسمی دامنه سیستم مدیریت انرژی شرکت سیمان کیاسر:</span>
        </div>
        {isEditing ? (
          <textarea
            rows={3}
            className="enms-textarea text-xs w-full resize-none leading-relaxed"
            value={profile.scopeStatement || ''}
            onChange={(e) => onFieldChange('scopeStatement', e.target.value)}
            placeholder="متن بیانیه رسمی دامنه سیستم..."
          />
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {profile.scopeStatement || 'بیانیه دامنه سیستم در فایل پیکربندی ثبت نشده است.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="p-3.5 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">فرآیندهای اصلی مشمول دامنه</span>
            <div className="text-xl font-bold font-mono text-[var(--color-primary)] mt-0.5">
              {toPersianDigits(includedCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">بخش</span>
            </div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[var(--color-primary)]" />
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-border)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">فعالیت‌های خدماتی اثرگذار (برون‌سپاری)</span>
            <div className="text-xl font-bold font-mono text-blue-500 mt-0.5">
              {toPersianDigits(indirectCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">بخش</span>
            </div>
          </div>
          <AlertCircle className="w-6 h-6 text-blue-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <div>
            <span className="text-xs text-[var(--color-text-muted)] block">بخش‌های مستثنی‌شده (خارج از مرز)</span>
            <div className="text-xl font-bold font-mono text-[var(--color-text-muted)] mt-0.5">
              {toPersianDigits(excludedCount)} <span className="text-xs text-[var(--color-text-muted)] font-sans">بخش</span>
            </div>
          </div>
          <XCircle className="w-6 h-6 text-[var(--color-text-muted)]" />
        </div>
      </div>
    </>
  );
};
