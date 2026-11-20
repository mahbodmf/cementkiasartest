import React from 'react';
import { Factory, Upload, Download, ChevronDown, FileSpreadsheet, FileText, Printer, FileCode } from 'lucide-react';
import { OrganizationProfile } from '../../../../../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

export interface ExportControls {
  exportMenuOpen: boolean;
  setExportMenuOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  exportJSON: () => void;
  exportExcelCSV: () => void;
  exportWordDoc: () => void;
  handlePrint: () => void;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface ProfileHeaderProps {
  profile: OrganizationProfile;
  isEditing: boolean;
  onFieldChange: (field: keyof OrganizationProfile, value: any) => void;
  exportControls: ExportControls;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  onFieldChange,
  exportControls,
}) => {
  const {
    exportMenuOpen,
    setExportMenuOpen,
    fileInputRef,
    exportJSON,
    exportExcelCSV,
    exportWordDoc,
    handlePrint,
    handleImportFile,
  } = exportControls;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)]">
          <Factory className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="enms-badge badge-success font-semibold">بند ۴.۳ استاندارد ISO 50001:2018</span>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">EnMS Scope & Boundaries Dossier</span>
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mt-1">
            شناسنامه سازمان، تعیین دامنه کاربرد، حدود و مرزهای سیستم مدیریت انرژی
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap relative">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="enms-button enms-button-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
          title="بارگذاری فایل شناسنامه"
        >
          <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>بارگذاری فایل (Import)</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className="enms-button enms-button-primary text-xs flex items-center gap-1.5 py-1.5 px-3.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی و چاپ اسناد</span>
            <ChevronDown className="w-3 h-3 mr-0.5" />
          </button>

          {exportMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-48 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-xl z-30 py-1.5 animate-fadeIn">
              <button
                onClick={exportExcelCSV}
                className="w-full px-3 py-2 text-right text-xs hover:bg-[var(--color-bg-hover)] flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>خروجی اکسل (Excel/CSV)</span>
              </button>
              <button
                onClick={exportWordDoc}
                className="w-full px-3 py-2 text-right text-xs hover:bg-[var(--color-bg-hover)] flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-500" />
                <span>خروجی ورد ممیزی (Word)</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full px-3 py-2 text-right text-xs hover:bg-[var(--color-bg-hover)] flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>چاپ مستقیم / ذخیره PDF</span>
              </button>
              <div className="border-t border-[var(--color-border-subtle)] my-1" />
              <button
                onClick={exportJSON}
                className="w-full px-3 py-2 text-right text-xs hover:bg-[var(--color-bg-hover)] flex items-center gap-2 text-[var(--color-text-primary)] cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-purple-500" />
                <span>پایگاه داده جیسون (JSON)</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 bg-[var(--color-bg-card-subtle)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-mono mr-2">
          <span className="text-[var(--color-text-muted)] font-sans">ظرفیت کلینکر:</span>
          {isEditing ? (
            <input
              type="number"
              className="w-20 enms-input text-center text-[var(--color-primary)] font-mono font-bold py-0.5"
              value={profile.clinkerCapacityTpd || 0}
              onChange={(e) => onFieldChange('clinkerCapacityTpd', Number(e.target.value) || 0)}
            />
          ) : (
            <strong className="text-[var(--color-primary)] font-bold">
              {toPersianDigits(profile.clinkerCapacityTpd || 0)}
            </strong>
          )}
          <span className="text-[var(--color-text-muted)] font-sans">تن/روز</span>
        </div>

        <div className="flex items-center gap-2 bg-[var(--color-bg-card-subtle)] px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-mono">
          <span className="text-[var(--color-text-muted)] font-sans">ظرفیت سیمان:</span>
          {isEditing ? (
            <input
              type="number"
              className="w-20 enms-input text-center text-blue-500 font-mono font-bold py-0.5"
              value={profile.cementCapacityTpd || 0}
              onChange={(e) => onFieldChange('cementCapacityTpd', Number(e.target.value) || 0)}
            />
          ) : (
            <strong className="text-blue-500 font-bold">
              {toPersianDigits(profile.cementCapacityTpd || 0)}
            </strong>
          )}
          <span className="text-[var(--color-text-muted)] font-sans">تن/روز</span>
        </div>
      </div>
    </div>
  );
};
